import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  orderBy, 
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { InsertUser, User, FriendRequest, Group, Conversation, Message } from "@shared/schema";

export const createUserProfile = async (userData: InsertUser): Promise<void> => {
  try {
    const userRef = doc(db, "users", userData.firebaseUid);
    await setDoc(userRef, {
      ...userData,
      rank: 0,
      wins: 0,
      totalGames: 0,
      points: 0,
      profilePicture: null,
      birthDate: null,
      city: null,
      gender: null,
      bio: null,
      isOnline: true,
      lastActive: new Date(),
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (firebaseUid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", firebaseUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by username:", error);
    throw error;
  }
};

export const updateUserStats = async (
  firebaseUid: string, 
  stats: Partial<Pick<User, 'wins' | 'totalGames' | 'points' | 'rank'>>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", firebaseUid);
    await setDoc(userRef, stats, { merge: true });
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  firebaseUid: string,
  profileData: Partial<Pick<User, 'fullName' | 'username' | 'email' | 'profilePicture' | 'birthDate' | 'city' | 'gender' | 'bio'>>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", firebaseUid);
    await setDoc(userRef, profileData, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const updateUserOnlineStatus = async (
  firebaseUid: string,
  isOnline: boolean
): Promise<void> => {
  try {
    const userRef = doc(db, "users", firebaseUid);
    await setDoc(userRef, {
      isOnline,
      lastActive: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user online status:", error);
    throw error;
  }
};

// Friend System Functions
export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<void> => {
  try {
    const requestRef = collection(db, "friendRequests");
    await addDoc(requestRef, {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

export const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined'): Promise<void> => {
  try {
    const requestRef = doc(db, "friendRequests", requestId);
    await updateDoc(requestRef, {
      status,
      updatedAt: serverTimestamp()
    });

    if (status === 'accepted') {
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const data = requestSnap.data();
        const friendshipRef = collection(db, "friendships");
        await addDoc(friendshipRef, {
          user1Id: data.fromUserId,
          user2Id: data.toUserId,
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error("Error responding to friend request:", error);
    throw error;
  }
};

export const getFriendRequests = (userId: string, callback: (requests: any[]) => void) => {
  const q = query(
    collection(db, "friendRequests"),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, async (snapshot) => {
    const requests = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const requestData = docSnap.data();
        // Get sender information
        const senderRef = doc(db, "users", requestData.fromUserId);
        const senderSnap = await getDoc(senderRef);
        const senderData = senderSnap.exists() ? senderSnap.data() : null;

        return {
          id: docSnap.id,
          ...requestData,
          senderInfo: senderData
        };
      })
    );
    callback(requests);
  });
};

export const getFriends = (userId: string, callback: (friends: User[]) => void) => {
  const q1 = query(
    collection(db, "friendships"),
    where("user1Id", "==", userId),
    where("status", "==", "active")
  );

  const q2 = query(
    collection(db, "friendships"),
    where("user2Id", "==", userId),
    where("status", "==", "active")
  );

  // Listen to both queries and combine results
  let friends1: User[] = [];
  let friends2: User[] = [];

  const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
    const friendIds = snapshot.docs.map(doc => doc.data().user2Id);
    if (friendIds.length > 0) {
      const friendsQuery = query(
        collection(db, "users"),
        where("firebaseUid", "in", friendIds)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      friends1 = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } else {
      friends1 = [];
    }
    callback([...friends1, ...friends2]);
  });

  const unsubscribe2 = onSnapshot(q2, async (snapshot) => {
    const friendIds = snapshot.docs.map(doc => doc.data().user1Id);
    if (friendIds.length > 0) {
      const friendsQuery = query(
        collection(db, "users"),
        where("firebaseUid", "in", friendIds)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      friends2 = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } else {
      friends2 = [];
    }
    callback([...friends1, ...friends2]);
  });

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

// Group System Functions
export const createGroup = async (name: string, description: string, createdBy: string): Promise<string> => {
  try {
    const groupRef = collection(db, "groups");
    const docRef = await addDoc(groupRef, {
      name,
      description,
      createdBy,
      memberCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Add creator as admin
    const memberRef = collection(db, "groupMembers");
    await addDoc(memberRef, {
      groupId: docRef.id,
      userId: createdBy,
      role: 'admin',
      joinedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const memberRef = collection(db, "groupMembers");
    await addDoc(memberRef, {
      groupId,
      userId,
      role: 'member',
      joinedAt: serverTimestamp()
    });

    // Update member count
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      await updateDoc(groupRef, {
        memberCount: groupSnap.data().memberCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

export const getUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const q = query(
    collection(db, "groupMembers"),
    where("userId", "==", userId)
  );

  return onSnapshot(q, async (snapshot) => {
    const groupIds = snapshot.docs.map(doc => doc.data().groupId);

    const groups = await Promise.all(
      groupIds.map(async (groupId) => {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          return { id: groupSnap.id, ...groupSnap.data() } as Group;
        }
        return null;
      })
    );

    callback(groups.filter(Boolean) as Group[]);
  });
};

// Conversation functions
export const createConversation = async (type: 'private' | 'group', participants: string[], name?: string) => {
  try {
    const conversationsRef = collection(db, "conversations");
    const conversationData = {
      type,
      participants,
      name: name || null,
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageAt: null
    };

    const docRef = await addDoc(conversationsRef, conversationData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const getUserConversations = (userId: string, callback: (conversations: any[]) => void) => {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by lastMessageAt in memory
    conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;

      const aTime = a.lastMessageAt.toDate ? a.lastMessageAt.toDate() : new Date(a.lastMessageAt);
      const bTime = b.lastMessageAt.toDate ? b.lastMessageAt.toDate() : new Date(b.lastMessageAt);

      return bTime.getTime() - aTime.getTime();
    });

    callback(conversations);
  });
};

// Message functions
export const sendMessage = async (conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
  try {
    const messagesRef = collection(db, "messages");
    const messageData = {
      conversationId,
      senderId,
      content,
      type,
      createdAt: serverTimestamp(),
      edited: false
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update conversation last message
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: content,
      lastMessageAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getMessages = (conversationId: string, callback: (messages: any[]) => void) => {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

export const editMessage = async (messageId: string, newContent: string) => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
      content: newContent,
      edited: true,
      editedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("username", ">=", searchTerm),
      where("username", "<=", searchTerm + '\uf8ff'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

export const searchGroups = async (searchTerm: string): Promise<Group[]> => {
  try {
    const groupsRef = collection(db, "groups");
    const q = query(
      groupsRef,
      where("name", ">=", searchTerm),
      where("name", "<=", searchTerm + '\uf8ff'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Group));
  } catch (error) {
    console.error("Error searching groups:", error);
    throw error;
  }
};

// Friend Request Functions
export const acceptFriendRequest = async (requestId: string) => {
  const requestRef = doc(db, 'friendRequests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Friend request not found');
  }

  const requestData = requestSnap.data();

  // Create friendship
  await addDoc(collection(db, 'friendships'), {
    user1Id: requestData.fromUserId,
    user2Id: requestData.toUserId,
    status: 'active',
    createdAt: new Date()
  });

  // Delete the friend request
  await deleteDoc(requestRef);
};

export const declineFriendRequest = async (requestId: string) => {
  const requestRef = doc(db, 'friendRequests', requestId);
  await deleteDoc(requestRef);
};

export { db };