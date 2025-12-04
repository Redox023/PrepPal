// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);