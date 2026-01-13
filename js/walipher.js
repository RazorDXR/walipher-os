import { initStore, subscribe, state } from "./modules/store.js";
import { isMobile } from "./modules/core.js";

/* --- Feature Modules --- */
import * as Todos from "./modules/features/todos.js";
import * as Finance from "./modules/features/finance.js";
import * as Pomodoro from "./modules/features/pomodoro.js";
import * as Subjects from "./modules/features/subjects.js";
import * as Notes from "./modules/features/notes.js";
import * as Notif from "./modules/features/notifications.js";
import * as Weather from "./modules/features/weather.js";
import * as Personalization from "./modules/features/personalization.js";
import * as UI from "./modules/ui.js";
import * as Links from "./modules/features/links.js";

import { initAuth, logout } from "./modules/auth.js";

/* --- Initialize System --- */
const updateDashboard = () => {
    const now = new Date();
    const day = now.getDay();
    document.getElementById('clock').innerText = now.toLocaleTimeString('en-US', { hour12: true });

    // Dynamic Badge based on Schedule
    const badgeEl = document.getElementById('status-text');
    if (badgeEl) badgeEl.innerText = Subjects.getDayStatus(day);

    document.querySelectorAll('.card-row').forEach(row => {
        row.classList.remove('today-card');
        if (day >= 1 && day <= 5) {
            if (parseInt(row.dataset.day) !== day) row.style.opacity = "0.7";
            else { row.style.opacity = "1"; row.classList.add('today-card'); }
        } else row.style.opacity = "1";
    });
};

// Typewriter
const typeElement = document.getElementById('typewriter');
let phrase = ""; let i = 0; let typeTimeout = null;

const startTyping = () => {
    if (!typeElement) return;
    // CRITICAL: Stop any existing loop to prevent "Buenas sss Noches" glitch
    if (typeTimeout) clearTimeout(typeTimeout);

    const now = new Date(); const h = now.getHours();

    // Get Name (Upper Case)
    let userName = "WALIPHER";
    if (state.user && state.user.name) userName = state.user.name.toUpperCase();

    let g = `HOLA ${userName}`;
    if (h >= 5 && h < 12) g = `BUENOS DIAS ${userName}`;
    else if (h >= 12 && h < 19) g = `BUENAS TARDES ${userName}`;
    else g = `BUENAS NOCHES ${userName}`;

    phrase = g;
    typeElement.innerText = ""; // Reset clean
    i = 0;
    typeWriter();
}

const typeWriter = () => {
    if (i < phrase.length) {
        typeElement.textContent += phrase.charAt(i);
        i++;
        typeTimeout = setTimeout(typeWriter, 100);
    }
}

// Subscribe Renders to Store
// Subscribe Renders to Store
let currentGreetingName = null;
subscribe(() => {
    Todos.renderTodosUI();
    Subjects.renderScheduleUI();
    Subjects.checkCurrentClass();
    Finance.updateFinanceUI();
    Notes.renderNotesPreview();
    Links.renderLinksUI();
    Notif.updateNotificationBadge();
    Notif.renderNotifications();

    // Reactive Greeting
    const newName = state.user?.name || "WALIPHER";
    if (newName !== currentGreetingName) {
        currentGreetingName = newName;
        startTyping();
    }
});

// Boot Sequence
window.addEventListener('load', () => {
    console.log("WalipherOS Modular Boot...");

    // 1. Init Data & Store
    // 1. Init Auth (Which will init Store)
    initAuth();

    // 2. Attach Listeners (Clean HTML Support)
    UI.initUIListeners();
    Todos.initTodoListeners();
    Finance.initFinanceListeners();
    Subjects.initSubjectListeners();
    Pomodoro.initPomodoro(); // Handles internal listeners
    Notes.initNotes();
    Notif.initNotificationListeners();
    Weather.initWeather();
    Personalization.initPersonalization();
    Links.initLinks();


    // 3. Start Loops
    updateDashboard();
    setInterval(updateDashboard, 1000);
    setInterval(Subjects.checkCurrentClass, 60000);
    // Notifications managed by Notif module now
    // setInterval(Subjects.checkUpcomingClasses, 60000); 

    // 4. Mobile Layout Check
    const checkMobile = () => { if (window.innerWidth <= 700) document.querySelectorAll('.col-meta-group').forEach(el => el.style.display = 'flex'); else document.querySelectorAll('.col-meta-group').forEach(el => el.style.display = 'none'); }
    window.addEventListener('resize', checkMobile);
    checkMobile();

    // 5. Logout Listener
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            UI.uiConfirm("¿Cerrar Sesión?", "Tendrás que ingresar de nuevo.", () => {
                logout();
            });
        });
    }

    // 6. Global Factory Reset (Attached directly for safety)
    const resetBtn = document.getElementById('btn-factory-reset');
    if (resetBtn) {
        // Event Listener attached by ID
        resetBtn.addEventListener('click', () => {
            UI.uiConfirm("¿FACTORY RESET?", "ESTO BORRA TODO. IRREVERSIBLE.", async () => {
                // 1. Force Clear State in RAM & Save Empty (Double Tap)
                const { state, saveData } = await import("./modules/store.js");
                state.todos = [];
                state.schedule = [];
                state.financeData = { cash: 0, debit: 0, creditLimit: 0, creditDebt: 0, history: [], pendingExpenses: [] };
                state.notes = "";
                state.notifications = [];
                state.links = []; // Explicitly clear widgets
                state.preferences = {};

                await saveData(); // Overwrite cloud with Zeros first

                // 2. Delete Cloud Documents (Nuclear option)
                const { borrarDatosUsuario } = await import("./modules/data_service.js");
                await borrarDatosUsuario();

                // 3. Clear Local Storage
                localStorage.clear();

                // 4. Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (let reg of regs) await reg.unregister();
                }

                // 5. Reload (No Logout)
                // Small delay to ensure Firestore propagation
                setTimeout(() => window.location.reload(true), 1000);
            }, true);
        });
    }

    // 7. Force Update / Cache Clear
    const updateBtn = document.getElementById('btn-force-update');
    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) await reg.unregister();
            }
            // Force reload by appending timestamp to URL (bypasses browser cache for index.html)
            const url = new URL(window.location.href);
            url.searchParams.set('force_update', Date.now());
            window.location.href = url.toString();
        });
    }

    console.log("🚀 WalipherOS Systems Online");
});
