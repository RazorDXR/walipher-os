import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCfZGLavH9R_oeIviBjGkZ4v4MyqNk01TI",
    authDomain: "walipher-final.firebaseapp.com",
    projectId: "walipher-final",
    storageBucket: "walipher-final.firebasestorage.app",
    messagingSenderId: "518235744668",
    appId: "1:518235744668:web:40bead708f61ffa00bc059"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper para detectar móvil (usado en varios lugares)
export const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export { app, db, auth };
