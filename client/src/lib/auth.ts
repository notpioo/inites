import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getUserProfile } from "./firestore";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export const signIn = async (credentials: LoginCredentials) => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured. Please check your API keys.");
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );
    return userCredential.user;
  } catch (error: any) {
    if (error.code === "auth/invalid-api-key") {
      throw new Error("Invalid Firebase API key. Please check your configuration.");
    }
    throw new Error(error.message || "Failed to sign in");
  }
};

export const signUp = async (data: RegisterData) => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured. Please check your API keys.");
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    // Create user profile in Firestore
    await createUserProfile({
      firebaseUid: userCredential.user.uid,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      role: "member"
    });
    
    return userCredential.user;
  } catch (error: any) {
    if (error.code === "auth/invalid-api-key") {
      throw new Error("Invalid Firebase API key. Please check your configuration.");
    }
    throw new Error(error.message || "Failed to create account");
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out");
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
