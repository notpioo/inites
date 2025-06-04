// Temporary fallback for Firebase when configuration issues occur
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate no user logged in
    setTimeout(() => callback(null), 100);
    return () => {}; // unsubscribe function
  }
};

export const db = null;

// Mock Firebase functions for development
export const signInWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  throw new Error("Firebase not configured. Please check your API keys.");
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  throw new Error("Firebase not configured. Please check your API keys.");
};

export const signOut = async (auth: any) => {
  console.log("Sign out called");
};