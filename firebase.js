// firebase.js — Firebase Auth for Sukhdev (load as type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider,
  sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ====== CONFIG (change key here later) ====== */
export const OWNER_EMAIL = "tusharkhan5672@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyAn71uS_gOgHfOGHRC8RJ8qCDiLoIe0aLg",
  authDomain: "sukhdev-c8079.firebaseapp.com",
  projectId: "sukhdev-c8079",
  storageBucket: "sukhdev-c8079.firebasestorage.app",
  messagingSenderId: "255457812211",
  appId: "1:255457812211:web:7e69d3aa5812ab65276186",
  measurementId: "G-W0D38YPPWC"
};
/* ============================================ */

const app = initializeApp(firebaseConfig);
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});
const auth = getAuth(app);

/* ---- local helpers (same 'sd_' keys the Store uses) ---- */
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem('sd_' + k)); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => localStorage.setItem('sd_' + k, JSON.stringify(v));

/* Mirror the Firebase user into the local customer list + session so Store.me() keeps working */
function syncUser(user, extra = {}) {
  if (!user) { localStorage.removeItem('sd_session'); return null; }
  const email = (user.email || '').toLowerCase();
  const users = lsGet('users', []);
  let rec = users.find(u => u.fuid === user.uid) || users.find(u => u.email === email);
  if (rec && rec.blocked) { localStorage.removeItem('sd_session'); return { blocked: true }; }

  const base = rec || { id: 'u' + Date.now(), address: '', phone: '', joined: Date.now() };
  const merged = {
    ...base,
    fuid: user.uid,
    email,
    name: extra.name || base.name || user.displayName || email.split('@')[0],
    phone: extra.phone || base.phone || ''
  };
  delete merged.pass; // passwords live in Firebase now
  lsSet('users', rec ? users.map(u => u.id === base.id ? merged : u) : [...users, merged]);
  localStorage.setItem('sd_session', merged.id);
  return merged;
}

/* ---- roles ---- */
function roleOf(user) {
  if (!user || !user.email || !user.emailVerified) return null;
  const e = user.email.toLowerCase();
  if (e === OWNER_EMAIL.toLowerCase()) return 'owner';
  const s = lsGet('staff', []).find(x => String(x.id).toLowerCase() === e && !x.off);
  return s ? s.role : null;
}

/* ---- auth state ---- */
let ready = false;
const listeners = new Set();

onAuthStateChanged(auth, user => {
  if (user) {
    const r = syncUser(user);
    if (r && r.blocked) { signOut(auth); return; }
  } else {
    syncUser(null);
  }
  ready = true;
  listeners.forEach(fn => { try { fn(user); } catch (e) { console.error(e); } });
});

const blockedError = () => Object.assign(new Error('Blocked'), { code: 'app/blocked' });

async function finishSignIn(user, extra) {
  const r = syncUser(user, extra);
  if (r && r.blocked) { await signOut(auth); throw blockedError(); }
  return user;
}

const SDAuth = {
  OWNER_EMAIL,
  get current() { return auth.currentUser; },
  roleOf,
  isOwner: u => roleOf(u) === 'owner',

  /* Calls fn(user) now (if ready) and on every future change */
  onChange(fn) {
    listeners.add(fn);
    if (ready) setTimeout(() => fn(auth.currentUser), 0);
    return () => listeners.delete(fn);
  },

  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, String(email).trim(), password);
    return finishSignIn(cred.user);
  },

  async google() {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return finishSignIn(cred.user);
  },

  async register({ name, email, phone, password }) {
    const cred = await createUserWithEmailAndPassword(auth, String(email).trim(), password);
    try { await updateProfile(cred.user, { displayName: name }); } catch (e) {}
    try { await sendEmailVerification(cred.user); } catch (e) {}
    return finishSignIn(cred.user, { name, phone });
  },

  async logout() {
    try { await signOut(auth); } finally { syncUser(null); }
  },

  resetPassword: email => sendPasswordResetEmail(auth, String(email).trim()),

  async resendVerification() {
    if (auth.currentUser && !auth.currentUser.emailVerified) await sendEmailVerification(auth.currentUser);
  },

  async changePassword(current, next) {
    const u = auth.currentUser;
    if (!u) throw Object.assign(new Error('Not signed in'), { code: 'app/no-user' });
    if (!u.providerData.some(p => p.providerId === 'password'))
      throw Object.assign(new Error('No password'), { code: 'app/no-password' });
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current));
    await updatePassword(u, next);
  },

  errorMessage(err) {
    const map = {
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/wrong-password': 'Wrong email or password.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'This email is already registered. Please sign in.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in window was closed.',
      'auth/cancelled-popup-request': 'Sign-in window was closed.',
      'auth/popup-blocked': 'Please allow pop-ups to sign in with Google.',
      'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication → Settings → Authorized domains).',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
      'auth/requires-recent-login': 'Please sign in again and retry.',
      'app/blocked': 'This account has been blocked. Please contact support.',
      'app/no-password': 'This account uses Google sign-in, so it has no password to change.'
    };
    return map[err && err.code] || ('Something went wrong. ' + ((err && err.message) || ''));
  }
};

window.SDAuth = SDAuth;
export { SDAuth };