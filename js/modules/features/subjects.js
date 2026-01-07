import { state, saveData } from "../store.js";
import { uiAlert, showToast, uiConfirm } from "../ui.js";
import { formatTime } from "../utils.js";

// --- Smart Links Logic ---
export const openSmartLink = (e, url, appIntent) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid && appIntent) {
        // Try to open generic intent or specific app scheme
        window.location.href = appIntent;
        // Fallback strategy could be complex, but for now we trust the intent or user manually clicks regular link if logic fails.
        // Since we prevented default, we might want to also open the web URL in background or just trust the intent?
        // Let's stick to: if Android -> Intent. If fallback needed, user can long-press or we add timeout.
        // For this "OS", simple intent is usually enough.

        // Safety timeout: if intent fails (app not installed), redirect to web after 1.5s
        setTimeout(() => {
            // Check if page moved? Hard to know strict.
            // Usually we just let the user initiate web link if intent fails.
        }, 1500);
    } else {
        window.open(url, '_blank');
    }
};

/* --- Logic Schedule --- */

let editingIndex = -1;

export const toggleAmPm = (btn) => {
    if (btn.innerText === "AM") {
        btn.innerText = "PM";
        btn.classList.add('active');
    } else {
        btn.innerText = "AM";
        btn.classList.remove('active');
    }
};

const get24hTime = (prefix) => {
    let h = parseInt(document.getElementById(`${prefix}-h`).value) || 0;
    const m = parseInt(document.getElementById(`${prefix}-m`).value) || 0;
    const ampm = document.getElementById(`${prefix}-ampm`).innerText;

    if (h < 1 || h > 12) return null;
    if (m < 0 || m > 59) return null;

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const setTimeInputs = (prefix, timeStr) => {
    const [h24, m] = timeStr.split(':').map(Number);
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const ampm = h24 >= 12 ? 'PM' : 'AM';

    document.getElementById(`${prefix}-h`).value = h12;
    document.getElementById(`${prefix}-m`).value = m.toString().padStart(2, '0');

    const btn = document.getElementById(`${prefix}-ampm`);
    btn.innerText = ampm;
    if (ampm === 'PM') btn.classList.add('active');
    else btn.classList.remove('active');
};

export const addSubject = () => {
    const name = document.getElementById('subj-name').value;
    const code = document.getElementById('subj-code').value;
    const room = document.getElementById('subj-room').value;
    const day = parseInt(document.getElementById('subj-day').value);
    const start = get24hTime('start');
    const end = get24hTime('end');
    const reminder = parseInt(document.getElementById('subj-reminder').value) || 10;

    if (!name || !start || !end) { uiAlert("Faltan Datos", "Verifica el Nombre y el Formato de Hora (1-12)."); return; }

    const newSubj = { name, code, room, day, start, end, notifyBefore: reminder };

    if (editingIndex >= 0) {
        state.schedule[editingIndex] = newSubj;
        editingIndex = -1;
        document.getElementById('btn-save-subj').innerHTML = `<svg class="icon-svg icon-sm"><use href="#icon-save"/></svg> Guardar Materia`;
        document.getElementById('btn-cancel-edit').style.display = 'none';
        uiAlert("Actualizado", "Materia modificada correctamente.");
    } else {
        state.schedule.push(newSubj);
        uiAlert("Guardado", "Materia agregada correctamente.");
    }

    saveData();
    renderScheduleUI();
    cancelEdit();
};

export const editSubject = (index) => {
    editingIndex = index;
    const subj = state.schedule[index];
    document.getElementById('subj-name').value = subj.name;
    document.getElementById('subj-code').value = subj.code;
    document.getElementById('subj-room').value = subj.room;
    document.getElementById('subj-day').value = subj.day;
    document.getElementById('subj-reminder').value = subj.notifyBefore || 10;

    setTimeInputs('start', subj.start);
    setTimeInputs('end', subj.end);

    document.getElementById('btn-save-subj').innerHTML = `<svg class="icon-svg icon-sm"><use href="#icon-edit"/></svg> Actualizar Materia`;
    document.getElementById('btn-cancel-edit').style.display = 'flex';

    const modalWindow = document.querySelector('#subjects-modal .modal-window');
    if (modalWindow) modalWindow.scrollTop = 0;
};

export const cancelEdit = () => {
    editingIndex = -1;
    document.getElementById('subj-name').value = "";
    document.getElementById('subj-code').value = "";
    document.getElementById('subj-room').value = "";
    document.getElementById('start-h').value = "";
    document.getElementById('start-m').value = "";
    document.getElementById('end-h').value = "";
    document.getElementById('end-m').value = "";
    document.getElementById('subj-reminder').value = "10";

    // Reset AM/PM logic defaults if needed, but simplified:
    const startBtn = document.getElementById('start-ampm');
    if (startBtn) { startBtn.innerText = "AM"; startBtn.classList.remove('active'); }
    const endBtn = document.getElementById('end-ampm');
    if (endBtn) { endBtn.innerText = "PM"; endBtn.classList.add('active'); }

    document.getElementById('btn-save-subj').innerHTML = `<svg class="icon-svg icon-sm"><use href="#icon-plus"/></svg> Guardar Materia`;
    document.getElementById('btn-cancel-edit').style.display = 'none';
};

export const deleteSubject = (index) => {
    uiConfirm("¿Borrar Materia?", "Esta acción no se puede deshacer.", () => {
        state.schedule.splice(index, 1);
        if (editingIndex === index) cancelEdit();
        saveData();
        renderScheduleUI();
    }, true);
};

export const clearSchedule = () => {
    uiConfirm("¿Borrar Todo?", "Se eliminarán TODAS las materias.", () => {
        state.schedule.length = 0; // Clear array in place
        saveData();
        renderScheduleUI();
        uiAlert("Eliminado", "Horario vaciado correctamente.");
    }, true);
};

export const renderScheduleUI = () => {
    const container = document.getElementById('schedule-list');
    const adminList = document.getElementById('subjects-list-admin');

    if (!container) return; // Guard logic

    container.innerHTML = "";
    adminList.innerHTML = "";

    if (!state.schedule) state.schedule = []; // Auto-init if missing

    if (state.schedule.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b;">No hay materias registradas.<br>Toca "Editar Materias" para comenzar.</div>`;
        adminList.innerHTML = `<div style="text-align: center; padding: 20px; color: #64748b;">Lista vacía</div>`;
        return;
    }

    // Sort
    state.schedule.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
    });

    // Admin List
    const daysName = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    state.schedule.forEach((subj, idx) => {
        const item = document.createElement('div');
        item.className = 'subj-item';
        // Clean HTML: Data actions
        item.innerHTML = `
            <div>
                <div class="subj-info">${subj.name}</div>
                <div class="subj-details">${daysName[subj.day]} • ${formatTime(subj.start)} - ${formatTime(subj.end)}</div>
            </div>
    <div style="display:flex; gap:10px;">
        <div class="btn-delete-subj btn-edit-subj" data-action="edit" data-index="${idx}" style="color:var(--cyan); border-color:var(--cyan);">
            <svg class="icon-svg icon-sm" style="pointer-events:none"><use href="#icon-edit" /></svg>
        </div>
        <div class="btn-delete-subj" data-action="delete" data-index="${idx}">
            <svg class="icon-svg icon-sm" style="pointer-events:none"><use href="#icon-delete" /></svg>
        </div>
    </div>
`;
        adminList.appendChild(item);
    });

    // Main UI - Group by Day
    const daysMap = { 1: "LUNES", 2: "MARTES", 3: "MIÉRCOLES", 4: "JUEVES", 5: "VIERNES", 6: "SÁBADO" };
    const grouped = {};
    state.schedule.forEach(subj => {
        if (!grouped[subj.day]) grouped[subj.day] = [];
        grouped[subj.day].push(subj);
    });

    Object.keys(grouped).sort().forEach(dayNum => {
        const daySubjects = grouped[dayNum];
        const first = daySubjects[0];
        const others = daySubjects.slice(1);
        const hasOthers = others.length > 0;
        const rowId = `day-row-${dayNum}`;

        const div = document.createElement('div');
        div.className = `card-row ${hasOthers ? 'expandable' : ''}`;
        div.dataset.day = dayNum;
        if (hasOthers) {
            div.id = rowId;
            // Clean: Listener replaces onclick
            div.dataset.expandTarget = rowId;
            div.style.cursor = "pointer";
        }

        // Header HTML
        const roomClass = first.room.toLowerCase().includes('virtual') ? 'virtual' : '';
        let html = `
            <div class="card-header">
                <div class="col-day">${daysMap[dayNum]}</div>
                <div class="col-time">
                    <svg class="icon-svg icon-sm"><use href="#icon-pomodoro"/></svg> 
                    ${formatTime(first.start)} - ${formatTime(first.end)}
                </div>
                <div class="col-subject">
                    <span class="subject-name">${first.name}</span>
                    <span class="subject-code">${first.code || ''}</span>
                </div>
                <div class="col-loc">
                    <svg class="icon-svg icon-sm"><use href="#icon-links"/></svg> 
                    <span class="loc-badge ${roomClass}">${first.room}</span>
                </div>
                <div class="col-cred">
                    ${first.credits || ''} 
                    ${hasOthers ? '<svg class="icon-svg icon-sm arrow-icon"><use href="#icon-plus"/></svg>' : ''}
                </div>
            </div>
    `;

        if (hasOthers) {
            html += `<div class="card-body">`;
            let prevRoom = first.room;
            others.forEach(sub => {
                let locBadge = `
    <svg class="icon-svg icon-sm"><use href="#icon-links"/></svg>
        <span class="loc-badge ${sub.room.toLowerCase().includes('virtual') ? 'virtual' : ''}">${sub.room}</span>
`;
                if (sub.room === prevRoom) {
                    locBadge = `
    <span style="opacity:0.5; font-style:italic; font-size:0.8rem; display:flex; align-items:center; gap:5px;">
        Misma Aula
    </span>`;
                }
                prevRoom = sub.room;

                html += `
    <div class="sub-row">
                        <div class="col-day"></div>
                        <div class="col-time">
                            <svg class="icon-svg icon-sm"><use href="#icon-pomodoro"/></svg> 
                            ${formatTime(sub.start)} - ${formatTime(sub.end)}
                        </div>
                        <div class="col-subject">
                            <span class="subject-name">${sub.name}</span>
                            <span class="subject-code">${sub.code || ''}</span>
                        </div>
                        <div class="col-loc">${locBadge}</div>
                         <div class="col-cred">${sub.credits || ''}</div>
                    </div>
    `;
            });
            html += `</div>`;
        }
        div.innerHTML = html;
        container.appendChild(div);
    });
};

// openSmartLink is defined locally, no import needed.

export const initSubjectListeners = () => {
    // Buttons
    const btnSave = document.getElementById('btn-save-subj');
    if (btnSave) btnSave.addEventListener('click', addSubject);

    const btnCancel = document.getElementById('btn-cancel-edit');
    if (btnCancel) btnCancel.addEventListener('click', cancelEdit);

    const btnClearS = document.querySelector('button[onclick="clearSchedule()"]'); // Temporarily select by onclick attribute or traverse
    // Better: Select the one inside #subjects-list-admin parent's sibling
    // We will clean HTML to add ID "btn-clear-schedule"
    const clearBtn = document.getElementById('btn-clear-schedule'); // Anticipating clean HTML
    if (clearBtn) clearBtn.addEventListener('click', clearSchedule);

    // Delegation for Admin List
    const adminList = document.getElementById('subjects-list-admin');
    if (adminList) {
        adminList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                const idx = parseInt(btn.dataset.index);
                if (btn.dataset.action === 'edit') editSubject(idx);
                if (btn.dataset.action === 'delete') deleteSubject(idx);
            }
        });
    }

    // Toggle Card (Expandable)
    const schedList = document.getElementById('schedule-list');
    if (schedList) {
        schedList.addEventListener('click', (e) => {
            const row = e.target.closest('[data-expand-target]');
            if (row) {
                row.classList.toggle('active');
            }
        });
    }

    // Smart Links Delegation (Modal)
    const linksModal = document.querySelector('.links-grid');
    if (linksModal) {
        linksModal.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.dataset.smartUrl) {
                e.preventDefault();
                openSmartLink(e, link.href, link.dataset.smartApp);
            }
        });
    }

    // AM/PM Toggles
    const ampmBtns = document.querySelectorAll('.ampm-toggle');
    ampmBtns.forEach(btn => {
        btn.addEventListener('click', () => toggleAmPm(btn));
    });
};

export const checkCurrentClass = () => {
    const widget = document.getElementById('current-class-widget-area');
    if (!widget) return;

    const now = new Date();
    const day = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const currentClass = state.schedule.find(s => {
        if (parseInt(s.day) !== day) return false;
        if (!s.start || !s.end) return false;
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        return currentTime >= startMin && currentTime < endMin;
    });

    if (currentClass) {
        widget.style.display = 'block';
        const [sh, sm] = currentClass.start.split(':').map(Number);
        const [eh, em] = currentClass.end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        const total = endMin - startMin;
        const elapsed = currentTime - startMin;
        const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
        const remaining = total - elapsed;

        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; }
        setText('cc-name', currentClass.name);
        setText('cc-loc', currentClass.room);
        setText('cc-code', currentClass.code);
        setText('cc-time-range', `${formatTime(currentClass.start)} - ${formatTime(currentClass.end)} `);

        const progEl = document.getElementById('cc-progress');
        if (progEl) progEl.style.width = `${percent}% `;
        setText('cc-percent', `${Math.floor(percent)}% `);
        setText('cc-time-left', `${remaining} min restantes`);
    } else {
        widget.style.display = 'none';
    }
};

// Notification logic moved to notifications.js
// export const checkUpcomingClasses = () => { ... }
/* --- Dynamic Greeting Logic --- */
export const getDayStatus = (dayIndex) => {
    const daysName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = daysName[dayIndex];

    // Filter subjects for this day
    const todaysClasses = state.schedule.filter(s => parseInt(s.day) === dayIndex);
    const count = todaysClasses.length;

    if (count === 0) {
        return `${dayName}: Día Libre 🏖️`;
    }

    // Count Virtuals (GV, Virtual, Zoom, Online) - Case Insensitive
    const virtualCount = todaysClasses.filter(s => {
        const r = s.room.toLowerCase();
        return r.includes('gv') || r.includes('virtual') || r.includes('zoom') || r.includes('meet') || r.includes('online');
    }).length;

    let status = `${dayName}: ${count} Materia${count > 1 ? 's' : ''}`;

    if (virtualCount > 0) {
        status += ` (${virtualCount} GV)`;
    }

    return status;
};
