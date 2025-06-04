import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBlHomdlq0ziskwGtE9CRyjA84r85vRD9A",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "nomercy-ea37a"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nomercy-ea37a",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "nomercy-ea37a"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "636693283731",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:636693283731:web:9b167a38514517c17a1e66",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GRKR34WSFW"
};

let app;
let auth;
let db;
let analytics;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Initialize analytics only in production
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create mock objects to prevent app crashes
  auth = null;
  db = null;
}

export { auth, db, analytics };
export default app;
