
// firebase.js — Firebase Authentication for Sukhdev
// Load using: <script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAnalytics,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================
   SUKHDEV AYURVED — OWNER CONFIGURATION
========================================= */

// Primary owner
export const OWNER_EMAIL = "tusharkhan5672@gmail.com";

// All authorized owners
export const OWNER_EMAILS = [
  "tusharkhan5672@gmail.com",
  "Khushaggarwal111@gmail.com"
];


/* =========================================
   FIREBASE CONFIGURATION
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAn71uS_gOgHfOGHRC8RJ8qCDiLoIe0aLg",
  authDomain: "sukhdev-c8079.firebaseapp.com",
  projectId: "sukhdev-c8079",
  storageBucket: "sukhdev-c8079.firebasestorage.app",
  messagingSenderId: "255457812211",
  appId: "1:255457812211:web:7e69d3aa5812ab65276186",
  measurementId: "G-W0D38YPPWC"
};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

isSupported()
  .then(ok => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {});

const auth = getAuth(app);


/* =========================================
   LOCAL STORAGE HELPERS
========================================= */

const lsGet = (key, defaultValue) => {
  try {
    const value = JSON.parse(
      localStorage.getItem("sd_" + key)
    );

    return value == null ? defaultValue : value;

  } catch (error) {
    return defaultValue;
  }
};

const lsSet = (key, value) => {
  localStorage.setItem(
    "sd_" + key,
    JSON.stringify(value)
  );
};


/* =========================================
   USER SESSION SYNCHRONIZATION
========================================= */

function syncUser(user, extra = {}) {

  if (!user) {
    localStorage.removeItem("sd_session");
    return null;
  }

  const email = (user.email || "").toLowerCase();

  const users = lsGet("users", []);

  let rec =
    users.find(u => u.fuid === user.uid) ||
    users.find(u => u.email === email);

  if (rec && rec.blocked) {
    localStorage.removeItem("sd_session");
    return { blocked: true };
  }

  const base = rec || {
    id: "u" + Date.now(),
    address: "",
    phone: "",
    joined: Date.now()
  };

  const merged = {
    ...base,
    fuid: user.uid,
    email,
    name:
      extra.name ||
      base.name ||
      user.displayName ||
      email.split("@")[0],
    phone: extra.phone || base.phone || ""
  };

  delete merged.pass;

  lsSet(
    "users",
    rec
      ? users.map(u =>
          u.id === base.id ? merged : u
        )
      : [...users, merged]
  );

  localStorage.setItem("sd_session", merged.id);

  return merged;
}


/* =========================================
   USER ROLE MANAGEMENT
========================================= */

function roleOf(user) {

  if (!user || !user.email || !user.emailVerified) {
    return null;
  }

  const email = user.email.toLowerCase();

  // Check whether the user is one of the owners
  if (
    OWNER_EMAILS.some(
      ownerEmail => ownerEmail.toLowerCase() === email
    )
  ) {
    return "owner";
  }

  // Check staff members
  const staff = lsGet("staff", []).find(
    member =>
      String(member.id).toLowerCase() === email &&
      !member.off
  );

  return staff ? staff.role : null;
}


/* =========================================
   AUTHENTICATION STATE
========================================= */

let ready = false;

const listeners = new Set();

onAuthStateChanged(auth, user => {

  if (user) {

    const result = syncUser(user);

    if (result && result.blocked) {
      signOut(auth);
      return;
    }

  } else {

    syncUser(null);

  }

  ready = true;

  listeners.forEach(fn => {
    try {
      fn(user);
    } catch (error) {
      console.error(error);
    }
  });

});


/* =========================================
   ERROR HANDLING
========================================= */

const blockedError = () =>
  Object.assign(
    new Error("Blocked"),
    { code: "app/blocked" }
  );


/* =========================================
   COMPLETE SIGN-IN
========================================= */

async function finishSignIn(user, extra) {

  const result = syncUser(user, extra);

  if (result && result.blocked) {
    await signOut(auth);
    throw blockedError();
  }

  return user;
}


/* =========================================
   SUKHDEV AUTH API
========================================= */

const SDAuth = {

  OWNER_EMAIL,
  OWNER_EMAILS,

  get current() {
    return auth.currentUser;
  },

  // Get user role
  roleOf,

  // Check owner status
  isOwner: user => roleOf(user) === "owner",

  // Check authentication changes
  onChange(fn) {

    listeners.add(fn);

    if (ready) {
      setTimeout(() => {
        fn(auth.currentUser);
      }, 0);
    }

    return () => listeners.delete(fn);
  },


  /* =====================================
     EMAIL LOGIN
  ===================================== */

  async login(email, password) {

    const credential =
      await signInWithEmailAndPassword(
        auth,
        String(email).trim(),
        password
      );

    return finishSignIn(credential.user);
  },


  /* =====================================
     GOOGLE LOGIN
  ===================================== */

  async google() {

    const provider = new GoogleAuthProvider();

    const credential =
      await signInWithPopup(auth, provider);

    return finishSignIn(credential.user);
  },


  /* =====================================
     USER REGISTRATION
  ===================================== */

  async register({ name, email, phone, password }) {

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        String(email).trim(),
        password
      );

    try {
      await updateProfile(credential.user, {
        displayName: name
      });
    } catch (error) {}

    try {
      await sendEmailVerification(credential.user);
    } catch (error) {}

    return finishSignIn(
      credential.user,
      { name, phone }
    );
  },


  /* =====================================
     LOGOUT
  ===================================== */

  async logout() {

    try {
      await signOut(auth);
    } finally {
      syncUser(null);
    }
  },


  /* =====================================
     PASSWORD RESET
  ===================================== */

  resetPassword: email =>
    sendPasswordResetEmail(
      auth,
      String(email).trim()
    ),


  /* =====================================
     RESEND EMAIL VERIFICATION
  ===================================== */

  async resendVerification() {

    if (
      auth.currentUser &&
      !auth.currentUser.emailVerified
    ) {
      await sendEmailVerification(auth.currentUser);
    }
  },


  /* =====================================
     CHANGE PASSWORD
  ===================================== */

  async changePassword(current, next) {

    const user = auth.currentUser;

    if (!user) {
      throw Object.assign(
        new Error("Not signed in"),
        { code: "app/no-user" }
      );
    }

    if (
      !user.providerData.some(
        provider => provider.providerId === "password"
      )
    ) {
      throw Object.assign(
        new Error("No password"),
        { code: "app/no-password" }
      );
    }

    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(
        user.email,
        current
      )
    );

    await updatePassword(user, next);
  },


  /* =====================================
     ERROR MESSAGES
  ===================================== */

  errorMessage(error) {

    const messages = {

      "auth/invalid-credential":
        "Wrong email or password.",

      "auth/wrong-password":
        "Wrong email or password.",

      "auth/user-not-found":
        "No account found with this email.",

      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/email-already-in-use":
        "This email is already registered. Please sign in.",

      "auth/weak-password":
        "Password must be at least 6 characters.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/network-request-failed":
        "Network error. Check your connection.",

      "auth/popup-closed-by-user":
        "Sign-in window was closed.",

      "auth/cancelled-popup-request":
        "Sign-in window was closed.",

      "auth/popup-blocked":
        "Please allow pop-ups to sign in with Google.",

      "auth/unauthorized-domain":
        "This domain is not authorized in Firebase.",

      "auth/operation-not-allowed":
        "This sign-in method is not enabled in Firebase.",

      "auth/requires-recent-login":
        "Please sign in again and retry.",

      "app/blocked":
        "This account has been blocked. Please contact support.",

      "app/no-password":
        "This account uses Google sign-in, so it has no password to change."

    };

    return (
      messages[error && error.code] ||
      (
        "Something went wrong. " +
        ((error && error.message) || "")
      )
    );
  }

};


/* =========================================
   GLOBAL ACCESS
========================================= */

window.SDAuth = SDAuth;

export { SDAuth };
