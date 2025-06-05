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

export const getFriendRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  const q = query(
    collection(db, "friendRequests"),
    where("toUserId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest));
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

  // This is simplified - in practice you'd need to combine both queries
  return onSnapshot(q1, async (snapshot) => {
    const friendIds = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.user1Id === userId ? data.user2Id : data.user1Id;
    });

    // Get friend profiles
    const friends = await Promise.all(
      friendIds.map(id => getUserProfile(id))
    );
    callback(friends.filter(Boolean) as User[]);
  });
};

// Group System Functions
export const createGroup = async (groupData: Omit<Group, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const groupRef = collection(db, "groups");
    const docRef = await addDoc(groupRef, {
      ...groupData,
      memberCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Add creator as admin
    const memberRef = collection(db, "groupMembers");
    await addDoc(memberRef, {
      groupId: docRef.id,
      userId: groupData.createdBy,
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
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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