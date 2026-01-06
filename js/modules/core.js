import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const docRef = doc(db, "usuario", "walipher_data");

// Helper para detectar móvil (usado en varios lugares)
export const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export { db, docRef };
