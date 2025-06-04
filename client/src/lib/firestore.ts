import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "./firebase";
import { InsertUser, User } from "@shared/schema";

export const createUserProfile = async (userData: InsertUser): Promise<void> => {
  try {
    const userRef = doc(db, "users", userData.firebaseUid);
    await setDoc(userRef, {
      ...userData,
      rank: 0,
      wins: 0,
      totalGames: 0,
      points: 0,
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
