
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAn71uS_gOgHfOGHRC8RJ8qCDiLoIe0aLg",
  authDomain: "sukhdev-c8079.firebaseapp.com",
  projectId: "sukhdev-c8079",
  storageBucket: "sukhdev-c8079.firebasestorage.app",
  messagingSenderId: "255457812211",
  appId: "1:255457812211:web:7e69d3aa5812ab65276186",
  measurementId: "G-W0D38YPPWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Owner account
const OWNER_EMAIL = "tusharkhan5672@gmail.com";

// Export Firebase services and authentication functions
export {
  app,
  auth,
  db,
  googleProvider,
  OWNER_EMAIL,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
