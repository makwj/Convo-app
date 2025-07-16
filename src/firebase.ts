"use client";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCacE1S9epJhNROfKg9nP7xENhS3Thx848",
  authDomain: "convo-a0d67.firebaseapp.com",
  projectId: "convo-a0d67",
  storageBucket: "convo-a0d67.firebasestorage.app",
  messagingSenderId: "317358040371",
  appId: "1:317358040371:web:bc8656aff2d7beed574a46",
  measurementId: "G-4EKK313J8P",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ This is what was missing

export { auth, db, storage };
