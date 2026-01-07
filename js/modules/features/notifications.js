import { state, saveData } from "../store.js";
import { showToast } from "../ui.js";

/* 
   NOTIFICATION SERVICE
   Centralized hub for all system alerts (Finance, Academics, Tasks).
*/

// Track sent notifications to avoid spamming every minute
const sentNotifications = new Set();
let serviceInterval = null;

export const addNotification = (title, msg, type = 'system', target = null, dedupeId = null) => {
    const notif = {
        id: Date.now(),
        title,
        msg,
        type,
        target,
        dedupeId, // Store for duplicate checking
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        read: false
    };

    if (!state.notifications) state.notifications = [];
    state.notifications.unshift(notif);

    // Cap at 50
    if (state.notifications.length > 50) state.notifications.pop();

    saveData();
    updateNotificationBadge();
    renderNotifications();

    // Also show a toast for immediate feedback
    showToast(title, msg, type);
};

export const updateNotificationBadge = () => {
    const badge = document.getElementById('notif-badge');
    if (!state.notifications) return;
    const unreadCount = state.notifications.filter(n => !n.read).length;

    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'flex';
            badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }
};

export const toggleNotificationCenter = () => {
    const panel = document.getElementById('notification-panel');
    const overlay = document.getElementById('notif-overlay');
    const btn = document.querySelector('.notification-btn');

    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        overlay.classList.remove('open');
        if (btn) btn.classList.remove('hidden');
    } else {
        panel.classList.add('open');
        overlay.classList.add('open');
        if (btn) btn.classList.add('hidden');
        renderNotifications();
    }
};

export const renderNotifications = () => {
    const list = document.getElementById('notif-list');
    if (!list) return;

    list.innerHTML = "";

    if (!state.notifications || state.notifications.length === 0) {
        list.innerHTML = `<div class="empty-notif">No tienes notificaciones nuevas</div>`;
        return;
    }

    state.notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notif-item ${n.read ? '' : 'unread'}`;
        item.onclick = (e) => handleNotificationClick(e, n);

        let icon = `<svg class="icon-svg"><use href="#icon-notification"/></svg>`;
        if (n.type === 'class') icon = `<svg class="icon-svg"><use href="#icon-subjects"/></svg>`;
        if (n.type === 'finance') icon = `<svg class="icon-svg"><use href="#icon-finance"/></svg>`;
        if (n.type === 'task') icon = `<svg class="icon-svg"><use href="#icon-task"/></svg>`;

        item.innerHTML = `
            <div class="notif-icon">${icon}</div>
            <div class="notif-content">
                <div class="notif-title">${n.title}</div>
                <div class="notif-msg">${n.msg}</div>
            </div>
            <div class="notif-time">${n.timestamp}</div>
        `;
        list.appendChild(item);
    });
};

const handleNotificationClick = (e, notif) => {
    notif.read = true;
    const itemEl = e.currentTarget;
    if (itemEl) {
        itemEl.classList.add('slide-out-right');
        setTimeout(() => {
            const idx = state.notifications.indexOf(notif);
            if (idx > -1) state.notifications.splice(idx, 1);
            saveData();
            updateNotificationBadge();
            renderNotifications();
        }, 400);
    }
};

export const clearNotifications = () => {
    state.notifications.length = 0; // Clear
    saveData();
    updateNotificationBadge();
    renderNotifications();
};

/* --- INTELLIGENT CHECKS --- */

// Helper to check if already sent (in memory OR in history)
const isNotificationSent = (id) => {
    if (sentNotifications.has(id)) return true;
    if (state.notifications && state.notifications.some(n => n.dedupeId === id)) {
        // If found in history, sync to memory set for faster future checks
        sentNotifications.add(id);
        return true;
    }
    return false;
};

const checkFinance = () => {
    if (!state.financeData || !state.financeData.pendingExpenses) return;

    const today = new Date().getDate();
    // Logic: Bills are recurring monthly on a specific day number (1-31)

    state.financeData.pendingExpenses.forEach(bill => {
        if (bill.paid) return; // Ignore paid

        const billDay = parseInt(bill.day);
        const uniqueId = `fin-bill-${bill.name}-${today}`;

        // Due Today
        if (billDay === today) {
            if (!isNotificationSent(uniqueId)) {
                addNotification("Pago Pendiente", `Hoy vence pago de: ${bill.name}`, "finance", null, uniqueId);
                sentNotifications.add(uniqueId);
            }
        }

        // Due Tomorrow (Warning)
        const tomorrow = today + 1;
        const uniqueIdTom = `fin-warn-${bill.name}-${today}`;
        if (billDay === tomorrow) {
            if (!isNotificationSent(uniqueIdTom)) {
                addNotification("Aviso de Pago", `Mañana vence: ${bill.name}`, "finance", null, uniqueIdTom);
                sentNotifications.add(uniqueIdTom);
            }
        }
    });
};

const checkClasses = () => {
    if (!state.schedule) return;

    const now = new Date();
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    state.schedule.forEach(subj => {
        if (parseInt(subj.day) !== day) return;

        const [sh, sm] = subj.start.split(':').map(Number);
        const [eh, em] = subj.end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        const diffStart = startMin - currentMinutes;
        const diffEnd = endMin - currentMinutes;
        const notifyTime = subj.notifyBefore || 10;

        // Custom Reminder Window (1 to notifyTime mins)
        if (diffStart > 0 && diffStart <= notifyTime) {
            const id = `class-soon-${subj.code}-${day}`;
            if (!sentNotifications.has(id)) {
                addNotification("Próxima Clase", `${subj.name} comienza en ${diffStart} min. Aula: ${subj.room}`, "class");
                sentNotifications.add(id);
            }
        }

        // Starting Now (0 to 2 mins wiggle room)
        if (diffStart <= 0 && diffStart > -2) {
            const id = `class-now-${subj.code}-${day}`;
            if (!sentNotifications.has(id)) {
                addNotification("Clase Iniciando", `${subj.name} está comenzando ahora.`, "class");
                sentNotifications.add(id);
            }
        }

        // Class Ended (0 to 2 mins wiggle of 'just finished')
        // Logic: if current time is exactly end time or just passed it
        if (diffEnd <= 0 && diffEnd > -2) {
            const id = `class-done-${subj.code}-${day}`;
            if (!sentNotifications.has(id)) {
                addNotification("Clase Finalizada", `${subj.name} ha terminado.`, "class");
                sentNotifications.add(id);
            }
        }
    });
};

const checkTasks = () => {
    if (!state.todos) return;
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;

    state.todos.forEach(todo => {
        if (todo.completed || !todo.deadline) return;

        const deadline = new Date(todo.deadline).getTime();
        const diff = deadline - now;
        const uniqueId = `task-${todo.id}-${deadline}`;
        const HOUR = 60 * 60 * 1000;
        const DAY = 24 * HOUR;

        // 1 Day Warning (approx 24h)
        if (diff > 0 && diff < DAY && diff > (DAY - HOUR)) { // Trigger roughly at 24h mark
            const sentId = 'warn-1d-' + uniqueId;
            if (!isNotificationSent(sentId)) {
                addNotification("Aviso de Tarea", `"${todo.text}" vence mañana (24h).`, "task", null, sentId);
                sentNotifications.add(sentId);
            }
        }

        // 1 Hour Warning
        if (diff > 0 && diff < HOUR) {
            const sentId = 'warn-1h-' + uniqueId;
            if (!isNotificationSent(sentId)) {
                addNotification("Tarea Próxima", `"${todo.text}" vence en menos de 1 hora.`, "task", null, sentId);
                sentNotifications.add(sentId);
            }
        }

        // Overdue
        if (diff < 0) {
            const sentId = 'late-' + uniqueId;
            if (!isNotificationSent(sentId)) {
                addNotification("Tarea Vencida", `"${todo.text}" ha vencido.`, "task", null, sentId);
                sentNotifications.add(sentId);
            }
        }
    });
};

export const startNotificationService = () => {
    // Clear existing to prevent double loops
    if (serviceInterval) clearInterval(serviceInterval);

    // Run immediately
    checkFinance();
    checkClasses();
    checkTasks();

    // Loop every 60 seconds
    serviceInterval = setInterval(() => {
        checkFinance();
        checkClasses();
        checkTasks();
    }, 60000);
};

export const initNotificationListeners = () => {
    const btn = document.querySelector('.notification-btn');
    if (btn) btn.addEventListener('click', toggleNotificationCenter);

    const overlay = document.getElementById('notif-overlay');
    if (overlay) overlay.addEventListener('click', toggleNotificationCenter);

    const clearBtn = document.querySelector('.clear-notif');
    if (clearBtn) clearBtn.addEventListener('click', clearNotifications);

    // Start the brain
    startNotificationService();

    // Expose for testing
    window._notifInternals = { sentNotifications, checkClasses, checkFinance, checkTasks };
};

/* --- TEST SUITE --- */
const runNotificationTests = () => {
    console.warn("🧪 STARTING WALIPHER NOTIFICATION TESTS...");

    // Check State
    if (typeof state === 'undefined') {
        console.error("❌ CRITICAL: 'state' is undefined. Module import failed.");
        alert("Error: State not loaded.");
        return;
    }

    const report = [];
    const log = (msg, pass) => {
        const icon = pass ? "✅" : "❌";
        console.warn(`${icon} ${msg}`); // Use warn to ensure visibility
        report.push(`${icon} ${msg}`);
    };

    // Backup
    const backupSchedule = JSON.parse(JSON.stringify(state.schedule || []));
    const backupFinance = JSON.parse(JSON.stringify(state.financeData?.pendingExpenses || []));
    const backupTodos = JSON.parse(JSON.stringify(state.todos || []));
    const backupNotifs = JSON.parse(JSON.stringify(state.notifications || []));

    // Clear history for clean test
    sentNotifications.clear();
    state.notifications = [];

    try {
        // --- TEST 1: CLASS STARTING SOON ---
        const now = new Date();
        const startH = now.getHours();
        const startM = now.getMinutes() + 5; // Starts in 5 mins
        const startTime = `${startH}:${startM.toString().padStart(2, '0')}`;
        const endTime = `${startH + 1}:${startM.toString().padStart(2, '0')}`;

        state.schedule = [{
            name: "TEST_CLASS_SOON",
            code: "T101",
            room: "A1",
            day: now.getDay(),
            start: startTime,
            end: endTime,
            notifyBefore: 10
        }];

        checkClasses();
        const t1 = state.notifications.find(n => n.title === "Próxima Clase" && n.msg.includes("TEST_CLASS_SOON"));
        log("Detects class starting soon (Custom Reminder)", !!t1);

        // --- TEST 2: DEDUPLICATION ---
        checkClasses(); // Run again
        const t2_count = state.notifications.filter(n => n.title === "Próxima Clase" && n.msg.includes("TEST_CLASS_SOON")).length;
        log("Prevents duplicate start notifications", t2_count === 1);

        // --- TEST 3: CLASS ENDED ---
        const endH_past = now.getHours();
        const endM_past = now.getMinutes(); // Ended right now
        // Adjusted to "just ended" logic (diffEnd <= 0 && diffEnd > -2)
        // Set end time to exactly NOW
        const endTimePast = `${endH_past}:${endM_past.toString().padStart(2, '0')}`;
        const startTimePast = `${endH_past - 1}:${endM_past.toString().padStart(2, '0')}`;

        state.schedule.push({
            name: "TEST_CLASS_ENDED",
            code: "T102",
            room: "B2",
            day: now.getDay(),
            start: startTimePast,
            end: endTimePast,
            notifyBefore: 10
        });

        checkClasses();
        const t3 = state.notifications.find(n => n.title === "Clase Finalizada" && n.msg.includes("TEST_CLASS_ENDED"));
        log("Detects class just ended", !!t3);

        // --- TEST 4: CLASS ENDED DEDUPE ---
        checkClasses();
        const t4_count = state.notifications.filter(n => n.title === "Clase Finalizada" && n.msg.includes("TEST_CLASS_ENDED")).length;
        log("Prevents duplicate end notifications", t4_count === 1);

        // --- TEST 5: FINANCE DUE TODAY ---
        const today = now.getDate();
        if (!state.financeData) state.financeData = {};
        state.financeData.pendingExpenses = [{
            name: "TEST_BILL",
            amount: 100,
            dueDate: "2024-01-01", // Legacy/irrelevant if we check day
            day: today, // Important part
            paid: false
        }];

        checkFinance();
        const t5 = state.notifications.find(n => n.title === "Pago Pendiente" && n.msg.includes("TEST_BILL"));
        log("Detects bill due today", !!t5);

        // --- TEST 6: TASK DEADLINE (24H) ---
        // Tomorrow exactly same time
        const tomorrowTime = new Date(now.getTime() + (24 * 60 * 60 * 1000) - (30 * 60 * 1000)); // 23.5 hours from now
        state.todos = [{
            id: 999123,
            text: "TEST_TASK_24H",
            deadline: tomorrowTime.toISOString(),
            completed: false
        }];

        checkTasks();
        const t6 = state.notifications.find(n => n.title === "Aviso de Tarea" && n.msg.includes("TEST_TASK_24H"));
        log("Detects task due tomorrow (approx 24h)", !!t6);


    } catch (e) {
        console.error("Test failed", e);
        log("CRITICAL ERROR IN TEST SUITE: " + e.message, false);
    } finally {
        // Restore
        state.schedule = backupSchedule;
        state.financeData.pendingExpenses = backupFinance;
        state.todos = backupTodos;
        state.notifications = backupNotifs; // Restore old notifs

        const successCount = report.filter(r => r.includes("✅")).length;
        const total = report.length;

        console.warn(`🏁 DONE. Passed: ${successCount}/${total}`);
        showToast("Test Finalizado", `${successCount}/${total} pruebas pasaron.`, successCount === total ? "success" : "error");
    }
};

// Expose Test Suite Globally
window.runNotificationTests = runNotificationTests;
console.log("✅ Custom Notification Tests Loaded. Run 'runNotificationTests()' in console.");
