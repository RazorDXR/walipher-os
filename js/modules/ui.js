/* --- Sistema de Modales y Diálogos --- */

export const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');

    // Ocultar botón de settings para limpieza visual
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.style.display = 'none';
};

export const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');

    // Animación especial para Notas (Legacy support)
    if (id === 'notes-modal') {
        const previewCard = document.getElementById('note-card-widget');
        if (previewCard) {
            previewCard.classList.remove('slide-in-entry');
            previewCard.classList.add('note-saved-anim');
            setTimeout(() => previewCard.classList.remove('note-saved-anim'), 600);
        }
    }

    // Verificar si quedan modales abiertos
    const openModals = document.querySelectorAll('.modal-overlay.open');
    if (openModals.length === 0) {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.style.display = 'flex';
    }
};

export const toggleSettings = () => {
    const stModal = document.getElementById('settings-modal');
    if (stModal.style.display === 'flex') {
        stModal.style.display = 'none';
        stModal.classList.remove('open');
    } else {
        stModal.style.display = 'flex';
        // Hack para animación
        requestAnimationFrame(() => stModal.classList.add('open'));
    }
};

/* --- Sistema de Diálogos Personalizados --- */

export const showDialog = (icon, title, msg, actions) => {
    document.getElementById('dialog-icon').innerHTML = icon;
    document.getElementById('dialog-title').innerText = title;
    document.getElementById('dialog-msg').innerText = msg;

    const actionContainer = document.getElementById('dialog-actions');
    actionContainer.innerHTML = '';

    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = action.class || 'pomo-btn';
        if (action.style) btn.style.cssText = action.style;
        btn.innerText = action.text;
        btn.onclick = () => {
            closeDialog();
            if (action.handler) action.handler();
        };
        actionContainer.appendChild(btn);
    });

    document.getElementById('dialog-overlay').classList.add('open');
    document.getElementById('custom-dialog').classList.add('open');
};

export const closeDialog = () => {
    document.getElementById('dialog-overlay').classList.remove('open');
    document.getElementById('custom-dialog').classList.remove('open');
};

export const uiAlert = (title, msg) => {
    showDialog('🔔', title, msg, [{ text: 'Entendido', class: 'pomo-btn btn-start', style: 'width:100%' }]);
};

export const uiConfirm = (title, msg, onConfirm, isDanger = false) => {
    showDialog(isDanger ? '⚠️' : '🤔', title, msg, [
        { text: 'Cancelar', class: 'pomo-btn btn-reset', style: 'padding:10px 20px; flex:1;' },
        {
            text: isDanger ? 'Sí, Borrar' : 'Confirmar',
            class: 'pomo-btn btn-start',
            style: `padding:10px 20px; flex:1; ${isDanger ? 'background:var(--red); color:white;' : ''}`,
            handler: onConfirm
        }
    ]);
};

export const uiPrompt = (title, msg, defaultVal, onConfirm) => {
    showDialog('📝', title, msg, [
        { text: 'Cancelar', class: 'pomo-btn btn-reset', style: 'padding:10px 20px; flex:1;' },
        {
            text: 'Guardar',
            class: 'pomo-btn btn-start',
            style: 'padding:10px 20px; flex:1;',
            handler: () => {
                const val = document.getElementById('dialog-input').value;
                onConfirm(val);
            }
        }
    ]);

    // Injección de Input Dinámico
    const msgEl = document.getElementById('dialog-msg');

    // Limpiar inputs previos si hubieran
    const oldInput = msgEl.querySelector('input');
    if (oldInput) oldInput.remove();

    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = "15px";

    const input = document.createElement('input');
    input.id = 'dialog-input';
    input.type = 'number';
    input.value = defaultVal;
    input.className = 'dialog-input';

    inputContainer.appendChild(input);
    msgEl.appendChild(inputContainer);

    setTimeout(() => { input.focus(); input.select(); }, 100);
};

// Listener global para cerrar modales con click afuera y manejo de data-attributes
export const initUIListeners = () => {
    // 1. Generic Modal Toggles
    document.addEventListener('click', (e) => {
        // Open Modal Trigger
        const openTrigger = e.target.closest('[data-open-modal]');
        if (openTrigger) {
            e.stopPropagation(); // Prevent bubbling issues
            openModal(openTrigger.dataset.openModal);
        }

        // Close Modal Trigger
        const closeTrigger = e.target.closest('[data-close-modal]');
        if (closeTrigger) {
            e.stopPropagation();
            closeModal(closeTrigger.dataset.closeModal);
        }

        // Overlay Click (Close)
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target.id);
        }

        // Mini-Modal / Dialog Overlay Click
        if (e.target.classList.contains('overlay-blur') || e.target.id === 'dialog-overlay') {
            if (e.target.id === 'dialog-overlay') closeDialog();
            else {
                e.target.classList.remove('open');
                if (e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('mini-modal')) {
                    e.target.nextElementSibling.classList.remove('open');
                }
            }
        }
    });

    // 2. Settings Toggle
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettings);

    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) toggleSettings();
        });
        const closeBtn = settingsModal.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', toggleSettings);
    }
};

/* --- TOAST SYSTEM --- */

export const showToast = (title, msg, icon = "info", target = null) => {
    // Nota: Aquí deberíamos llamar a notifications.addNotification si queremos persistencia
    // Por ahora solo manejo la UI visual.

    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cursor = 'pointer';

    let iconSvg = '';
    if (icon === 'class') {
        iconSvg = `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    } else {
        iconSvg = `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        </div>
    `;

    // Click Detection
    let clickCount = 0;
    let singleClickTimer = null;

    toast.onclick = () => {
        clickCount++;
        if (clickCount === 1) {
            singleClickTimer = setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            clearTimeout(singleClickTimer);
            clickCount = 0;
            if (window.toggleNotificationCenter) window.toggleNotificationCenter();
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }
    };

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }
    }, 5000);
};
