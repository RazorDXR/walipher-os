import { state, saveData } from "../store.js";
import { uiConfirm } from "../ui.js";

const notesArea = document.getElementById('notes-area');
const notesPreviewSection = document.getElementById('pinned-notes-section');
const notesPreviewText = document.getElementById('note-preview-text');
const notesCard = document.getElementById('note-card-widget');

export const renderNotesPreview = (textSource) => {
    let content = "";

    if (textSource !== undefined) {
        content = textSource;
    } else {
        // Init/State update: Use state source
        content = state.notes || "";
        // Sync Textarea if not user typing
        if (notesArea && document.activeElement !== notesArea) {
            notesArea.value = content;
        }
    }

    content = content.trim();

    if (!notesPreviewSection || !notesPreviewText) return;

    if (content.length > 0) {
        if (notesPreviewSection.style.display === 'none' || notesPreviewSection.style.display === '') {
            notesPreviewSection.style.display = 'flex';
            if (notesCard) {
                notesCard.classList.remove('slide-in-entry');
                void notesCard.offsetWidth;
                notesCard.classList.add('slide-in-entry');
            }
        }
        notesPreviewText.innerText = content;
    } else {
        notesPreviewSection.style.display = 'none';
    }
};

export const deleteNote = (e) => {
    if (e) e.stopPropagation();
    uiConfirm("¿Borrar Nota?", "Se eliminará el contenido de la nota de forma permanente.", () => {
        const txt = document.getElementById('note-preview-text');

        if (txt) {
            txt.classList.add('fade-text-out');
            setTimeout(() => {
                if (notesArea) notesArea.value = "";
                state.notes = ""; // Update state
                renderNotesPreview("");
                saveData();
                txt.classList.remove('fade-text-out');
            }, 300);
        } else {
            if (notesArea) notesArea.value = "";
            state.notes = "";
            renderNotesPreview("");
            saveData();
        }
    }, true);
};

let timeout;
export const initNotes = () => {
    if (notesArea) {
        notesArea.addEventListener('input', () => {
            state.notes = notesArea.value;
            renderNotesPreview(notesArea.value);
            clearTimeout(timeout);
            timeout = setTimeout(() => { saveData(); }, 1000);
        });
    }

    // Controls
    const btnEdit = document.querySelector('.btn-note-action.btn-edit');
    if (btnEdit) {
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            // Opening modal handled by generic UI listener data-open-modal
        });
    }

    const btnDelete = document.querySelector('.btn-note-action.btn-delete');
    if (btnDelete) btnDelete.addEventListener('click', deleteNote);

    // Card Click to Open handled by data-open-modal on HTML
};
