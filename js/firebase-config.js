// firebase-config.js — Init Firebase + helper auth per TUSK Protocol
// Riusa il progetto Firebase "schedinone-2026" con prefisso tusk_* sulle collezioni.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzE1xw_37A-eo8tKUHFwMjWhaYsLztSYs",
  authDomain: "schedinone-2026.firebaseapp.com",
  projectId: "schedinone-2026",
  storageBucket: "schedinone-2026.firebasestorage.app",
  messagingSenderId: "694862608647",
  appId: "1:694862608647:web:91af020725068199a82da2"
};

// Email admin TUSK (hardcoded). UX: i giudici inseriscono solo la password.
export const ADMIN_EMAIL = "admin@tusk-badboars.com";

// Prefisso collezioni TUSK (per non interferire con Schedinone nello stesso DB)
export const COL = {
  categorie: "tusk_categorie",
  eventi: "tusk_eventi",
  atleti: "tusk_atleti",
  iscrizioni: "tusk_iscrizioni_pending",
  risultati: "tusk_risultati"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Login admin con la sola password (email hardcoded).
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function loginAdmin(password) {
  return signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
}

/** Logout admin. */
export async function logoutAdmin() {
  return signOut(auth);
}

/**
 * Sottoscrivi i cambiamenti di stato auth.
 * @param {(user: import("firebase/auth").User|null) => void} callback
 * @returns {() => void} unsubscriber
 */
export function onAdminAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/** True se l'utente corrente è l'admin TUSK. */
export function isAdminLoggedIn() {
  return auth.currentUser !== null && auth.currentUser.email === ADMIN_EMAIL;
}
