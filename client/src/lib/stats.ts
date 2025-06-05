
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface AppStats {
  totalMembers: number;
  activeTournaments: number;
  onlineMembers: number;
}

export const getAppStats = (callback: (stats: AppStats) => void): (() => void) => {
  if (!db) return () => {};

  // Get total members
  const usersRef = collection(db, "users");
  const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
    const totalMembers = snapshot.size;
    
    // Get online members
    const onlineQuery = query(usersRef, where("isOnline", "==", true));
    const unsubscribeOnline = onSnapshot(onlineQuery, (onlineSnapshot) => {
      const onlineMembers = onlineSnapshot.size;
      
      // Get active tournaments (placeholder)
      const activeTournaments = 12; // This should come from tournaments collection
      
      callback({
        totalMembers,
        activeTournaments,
        onlineMembers
      });
    });

    return unsubscribeOnline;
  });

  return unsubscribeUsers;
};
