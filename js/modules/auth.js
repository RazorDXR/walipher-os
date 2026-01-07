import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from "./core.js";
import { initStore, state } from "./store.js";
import { showToast } from "./ui.js";

// DOM Elements
const LOGIN_SCREEN = document.getElementById('login-screen');
const APP_DASHBOARD = document.getElementById('app-dashboard');

/**
 * Initialize Authentication Observer
 */
export const initAuth = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("🔓 Usuario Autenticado:", user.uid);

            // 1. Fetch User Profile (Name)
            await loadUserProfile(user.uid);

            // 2. Transition UI
            if (LOGIN_SCREEN) LOGIN_SCREEN.style.display = 'none';
            if (APP_DASHBOARD) {
                APP_DASHBOARD.style.display = 'block';
                APP_DASHBOARD.style.animation = 'fadeIn 0.5s ease-out';
            }

            // 3. Init Store
            initStore(user.uid);

        } else {
            console.log("🔒 No hay sesión activa. Mostrando Login.");
            if (LOGIN_SCREEN) LOGIN_SCREEN.style.display = 'flex';
            if (APP_DASHBOARD) APP_DASHBOARD.style.display = 'none';
        }
    });

    initLoginListeners();
};

const initLoginListeners = () => {
    // Views
    const viewLogin = document.getElementById('view-login');
    const viewSignup = document.getElementById('view-signup');
    const btnGotoSignup = document.getElementById('btn-goto-signup');
    const btnGotoLogin = document.getElementById('btn-goto-login');

    // Inputs
    const loginEmail = document.getElementById('login-email');
    const loginPass = document.getElementById('login-pass');
    const signupName = document.getElementById('signup-name');
    const signupEmail = document.getElementById('signup-email');
    const signupPass = document.getElementById('signup-pass');

    // Actions
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');

    // --- TOGGLE VIEWS ---
    if (btnGotoSignup) {
        btnGotoSignup.addEventListener('click', () => {
            viewLogin.style.display = 'none';
            viewSignup.style.display = 'block';
            viewSignup.classList.add('active-view');
        });
    }

    if (btnGotoLogin) {
        btnGotoLogin.addEventListener('click', () => {
            viewSignup.style.display = 'none';
            viewLogin.style.display = 'block';
            viewLogin.classList.add('active-view');
        });
    }

    // --- LOGIN ---
    const triggerLogin = () => {
        const email = loginEmail.value.trim();
        const pass = loginPass.value.trim();
        if (email && pass) handleLogin(email, pass);
        else showToast("Faltan datos", "Ingresa correo y contraseña", "warning");
    };

    if (btnLogin) btnLogin.addEventListener('click', triggerLogin);

    // Enter Key Support (Login)
    [loginEmail, loginPass].forEach(input => {
        if (input) input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') triggerLogin();
        });
    });


    // --- SIGNUP ---
    const triggerSignup = () => {
        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const pass = signupPass.value.trim();

        if (!name) return showToast("Nombre requerido", "Dinos cómo te llamas.", "warning");
        if (!email || !pass) return showToast("Faltan datos", "Completa el formulario.", "warning");

        handleSignup(email, pass, name);
    };

    if (btnSignup) btnSignup.addEventListener('click', triggerSignup);

    // Enter Key Support (Signup)
    [signupName, signupEmail, signupPass].forEach(input => {
        if (input) input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') triggerSignup();
        });
    });
};

/**
 * Handle Login Action
 */
export const handleLogin = async (email, password) => {
    const btn = document.getElementById('btn-login');
    if (btn) btn.innerHTML = '<span class="loading-spinner-auth"></span>';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Bienvenido", "Iniciando sistema...", "success");
    } catch (error) {
        console.error("Login Error:", error);
        let msg = "Error desconocido.";
        if (error.code === 'auth/invalid-credential') msg = "Credenciales incorrectas.";
        showToast("Error de Acceso", msg, "error");
        if (btn) btn.innerText = "Iniciar Sesión";
    }
};

/**
 * Handle Signup Action
 */
export const handleSignup = async (email, password, name) => {
    const btn = document.getElementById('btn-signup');
    if (btn) btn.innerHTML = '<span class="loading-spinner-auth"></span>';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Save User Profile to Firestore
        await setDoc(doc(db, "users", uid, "datos_personales", "profile"), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        // Set local state immediately for greeting
        if (!state.user) state.user = {};
        state.user.name = name;

        showToast("Cuenta Creada", `Bienvenido, ${name}!`, "success");
    } catch (error) {
        console.error("Signup Error:", error);
        let msg = "No se pudo crear la cuenta.";
        if (error.code === 'auth/email-already-in-use') msg = "El correo ya está en uso.";
        if (error.code === 'auth/weak-password') msg = "Contraseña débil (mín. 6 caracteres).";

        showToast("Error de Registro", msg, "error");
        if (btn) btn.innerText = "Registrarse";
    }
};

/**
 * Load User Profile (Name)
 */
const loadUserProfile = async (uid) => {
    try {
        const docRef = doc(db, "users", uid, "datos_personales", "profile");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (!state.user) state.user = {};
            state.user.name = data.name;
            console.log("👤 Perfil cargado:", data.name);
        } else {
            // Legacy user or no profile doc
            if (!state.user) state.user = {};
            state.user.name = "Walipher"; // Default
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Logout Error:", error);
        showToast("Error", "No se pudo cerrar sesión.", "error");
    }
};
