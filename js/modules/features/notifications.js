import { state, saveData } from "../store.js";
import { showToast } from "../ui.js";

export const addNotification = (title, msg, type = 'system', target = null) => {
    const notif = {
        id: Date.now(),
        title,
        msg,
        type,
        target,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
    };

    state.notifications.unshift(notif);
    if (state.notifications.length > 50) state.notifications.pop();

    saveData();
    updateNotificationBadge();
    renderNotifications();
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

export const checkEmergencyNotifications = () => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Check Todos
    if (state.todos) {
        state.todos.forEach(todo => {
            if (todo.deadline && !todo.completed) {
                const deadlineDate = new Date(todo.deadline);
                if (deadlineDate.getTime() < now) {
                    const lastNotified = todo.lastNotified || 0;
                    if ((now - lastNotified) > DAY_MS) {
                        if (state.notifications.length < 15) {
                            addNotification("🚨 Vencida", `Tarea "${todo.text}" vencida.`, "system");
                            todo.lastNotified = now;
                        }
                    }
                }
            }
        });
    }
};

export const initNotificationListeners = () => {
    const btn = document.querySelector('.notification-btn');
    if (btn) btn.addEventListener('click', toggleNotificationCenter);

    const overlay = document.getElementById('notif-overlay');
    if (overlay) overlay.addEventListener('click', toggleNotificationCenter);

    const clearBtn = document.querySelector('.clear-notif');
    if (clearBtn) clearBtn.addEventListener('click', clearNotifications);
};
