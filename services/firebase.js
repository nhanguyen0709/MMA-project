// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
    apiKey: "AIzaSyBIzlLnulTQCMTjqa-s9wSjE4tzNu_S_fU",
    authDomain: "appp-92bd1.firebaseapp.com",
    projectId: "appp-92bd1",
    storageBucket: "appp-92bd1.firebasestorage.app",
    messagingSenderId: "266853425631",
    appId: "1:266853425631:web:a3704a3e75da244b5f646a",
    measurementId: "G-6C8JD2PEJZ"
  };

const app = initializeApp(firebaseConfig);

// Analytics may not be supported on native; ignore errors silently
try { getAnalytics(app); } catch {}

// Improve RN network compatibility for Firestore; ignore if already initialized (e.g., HMR)
try {
  initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false });
} catch {}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Thêm dòng này
export default app;
