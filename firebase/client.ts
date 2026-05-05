import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

// This is your PUBLIC config (Safe to use here)
const firebaseConfig = {
  apiKey: "AIzaSyCl06sORuWzIJaM4-0_h6CH0Lc5s1_itBQ",
  authDomain: "prepwise-885b9.firebaseapp.com",
  projectId: "prepwise-885b9",
  storageBucket: "prepwise-885b9.firebasestorage.app",
  messagingSenderId: "120178122984",
  appId: "1:120178122984:web:5f5d0fec1aa6149bafa95d",
  measurementId: "G-ZMZ1FTPF3W"
};

// Initialize Firebase
// We use !getApps().length to prevent "Firebase App named '[DEFAULT]' already exists" errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };