import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAdwgEpZXcmoMizEPAbHntAdKb7LYDNCCM",
  authDomain: "musicflow-86abf.firebaseapp.com",
  projectId: "musicflow-86abf",
  storageBucket: "musicflow-86abf.firebasestorage.app",
  messagingSenderId: "961126954575",
  appId: "1:961126954575:web:e55ec6e3cc98a96ebc5c3a",
  measurementId: "G-Q5YRJJQXJF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Force account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
