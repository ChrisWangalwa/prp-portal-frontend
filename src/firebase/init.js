// src/firebase/init.js

import { initializeApp, getApps, getApp } from "firebase/app"; // Import getApps and getApp
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// If you plan to re-add storage later, ensure getStorage and storage are here
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// These values are read from NEXT_PUBLIC_FIREBASE_ environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Only if using Analytics
};

// Initialize Firebase
let app;
// Check if a Firebase app instance already exists to prevent re-initialization errors
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If app already initialized, get the existing instance
}


// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // Uncomment when re-adding storage

export { app, auth, db }; // Export auth and db
// export { app, auth, db, storage }; // Uncomment when re-adding storage
