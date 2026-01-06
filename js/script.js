import { initStore, subscribe } from "./modules/store.js";
import { isMobile } from "./modules/core.js";

/* --- Feature Modules --- */
import * as Todos from "./modules/features/todos.js";
import * as Finance from "./modules/features/finance.js";
import * as Pomodoro from "./modules/features/pomodoro.js";
import * as Subjects from "./modules/features/subjects.js";
import * as Notes from "./modules/features/notes.js";
import * as Notif from "./modules/features/notifications.js";
import * as Weather from "./modules/features/weather.js";
import * as UI from "./modules/ui.js";

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
let phrase = ""; let i = 0;
const startTyping = () => {
    if (!typeElement) return;
    const now = new Date(); const h = now.getHours();
    let g = "HOLA WALIPHER";
    if (h >= 5 && h < 12) g = "BUENOS DIAS WALIPHER";
    else if (h >= 12 && h < 19) g = "BUENAS TARDES WALIPHER";
    else g = "BUENAS NOCHES WALIPHER";
    phrase = g; typeElement.innerText = ""; i = 0; typeWriter();
}
const typeWriter = () => {
    if (i < phrase.length) {
        typeElement.textContent += phrase.charAt(i); i++; setTimeout(typeWriter, 100);
    }
}

// Subscribe Renders to Store
subscribe(() => {
    Todos.renderTodosUI();
    Subjects.renderScheduleUI();
    Subjects.checkCurrentClass();
    Finance.updateFinanceUI();
    Notes.renderNotesPreview();
    Notif.updateNotificationBadge();
    Notif.renderNotifications();
    Notif.checkEmergencyNotifications();
});

// Boot Sequence
window.addEventListener('load', () => {
    console.log("WalipherOS Modular Boot...");

    // 1. Init Data & Store
    initStore();

    // 2. Attach Listeners (Clean HTML Support)
    UI.initUIListeners();
    Todos.initTodoListeners();
    Finance.initFinanceListeners();
    Subjects.initSubjectListeners();
    Pomodoro.initPomodoro(); // Handles internal listeners
    Notes.initNotes();
    Notif.initNotificationListeners();
    Weather.initWeather();

    // 3. Start Loops
    startTyping();
    updateDashboard();
    setInterval(updateDashboard, 1000);
    setInterval(Subjects.checkCurrentClass, 60000);
    setInterval(Subjects.checkUpcomingClasses, 60000);

    // 4. Mobile Layout Check
    const checkMobile = () => { if (window.innerWidth <= 700) document.querySelectorAll('.col-meta-group').forEach(el => el.style.display = 'flex'); else document.querySelectorAll('.col-meta-group').forEach(el => el.style.display = 'none'); }
    window.addEventListener('resize', checkMobile);
    checkMobile();

    // 5. Global Factory Reset (Attached directly for safety)
    const resetBtn = document.getElementById('btn-factory-reset');
    if (resetBtn) {
        // Event Listener attached by ID
        resetBtn.addEventListener('click', () => {
            UI.uiConfirm("¿FACTORY RESET?", "ESTO BORRA TODO. IRREVERSIBLE.", async () => {
                localStorage.clear();
                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (let reg of regs) await reg.unregister();
                }
                window.location.reload(true);
            }, true);
        });
    }

    console.log("System Ready.");
});
