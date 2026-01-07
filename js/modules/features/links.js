import { state, saveData } from "../store.js";
import { showToast, closeModal, uiConfirm } from "../ui.js";

/*
    LINKS MANAGER V2
    Handles dynamic list of shortcuts (bookmarks) with Premium UI integration.
    Data structure: state.links = [ { id, title, url, icon, createdAt }, ... ]
*/

// Initial Render & Listeners
export const initLinks = () => {
    const addBtn = document.getElementById('btn-add-link');
    const saveBtn = document.getElementById('btn-save-link');
    const cancelBtn = document.getElementById('btn-cancel-link');
    const deleteBtn = document.getElementById('btn-delete-link'); // Only in edit mode

    // 1. Initial Render
    renderLinksUI();

    // 2. Open Add Form
    if (addBtn) addBtn.addEventListener('click', () => openEditForm(null));

    // 3. Save (Add or Update)
    if (saveBtn) saveBtn.addEventListener('click', saveLink);

    // 4. Cancel
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditForm);

    // 5. Delete
    if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrentLink);

    // 6. Icon Picker Selection
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.addEventListener('click', () => selectIcon(opt.dataset.icon));
    });
};

/* --- RENDER --- */
export const renderLinksUI = () => {
    const grid = document.getElementById('links-grid');
    if (!grid) return;

    const list = state.links || [];

    // Clear current (keep the 'add' button logic separate in HTML, we inject BEFORE it or clear sibling container)
    // Wait, in index.html, #links-grid IS the container for links, and btn-add-link is a SIBLING in #links-view-list? 
    // No, checking HTML structure:
    // <div id="links-view-list">
    //    <div id="links-grid" style="display: contents;"></div>
    //    <button id="btn-add-link" ... />
    // </div>
    // So we clear #links-grid only.

    grid.innerHTML = '';

    if (list.length === 0) {
        // No links? The "Add" button is always visible below, so maybe we show a small text or nothing.
        // Let's just leave it empty, the massive Add button is invitation enough.
        return;
    }

    list.forEach((link, index) => {
        const card = document.createElement('a');
        card.className = 'link-card dynamic-link';
        card.href = link.url;
        card.target = "_blank";

        // Staggered Animation Delay
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <svg class="icon-svg link-icon-svg">
                <use href="#${link.icon || 'icon-globe'}" />
            </svg>
            <div class="link-name">${link.title}</div>
            <div class="edit-hint" title="Editar">✎</div>
        `;

        // Click Logic
        card.addEventListener('click', (e) => {
            // Check if clicked the edit hint OR Right Click (handled separately)
            if (e.target.closest('.edit-hint')) {
                e.preventDefault();
                e.stopPropagation(); // Stop opening link
                openEditForm(link);
            }
            // else let standard href work
        });

        // Context Menu (Right Click) to Edit
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openEditForm(link);
        });

        grid.appendChild(card);
    });
};

/* --- FORM HANDLING --- */
let editingId = null; // Track if we are editing text

const openEditForm = (linkOrNull) => {
    const viewList = document.getElementById('links-view-list');
    const viewForm = document.getElementById('links-view-form');
    const titleInput = document.getElementById('link-title');
    const urlInput = document.getElementById('link-url');
    // We don't have a specific modal title element for sub-views, but we can change the main one if we wanted.
    // Let's keep it simple.

    const deleteBtn = document.getElementById('btn-delete-link');

    // Reset Icon Selection
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));

    if (linkOrNull) {
        // EDIT MODE
        editingId = linkOrNull.id;
        titleInput.value = linkOrNull.title;
        urlInput.value = linkOrNull.url;
        selectIcon(linkOrNull.icon, false); // Select visually
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
        // ADD MODE
        editingId = null;
        titleInput.value = "";
        urlInput.value = "";
        selectIcon('icon-globe', false); // Default
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    // Switch Views
    if (viewList) viewList.style.display = 'none';
    if (viewForm) viewForm.style.display = 'flex'; // flex col
};

const closeEditForm = () => {
    const viewList = document.getElementById('links-view-list');
    const viewForm = document.getElementById('links-view-form');

    // 1. Add closing class to trigger animation
    if (viewForm) viewForm.classList.add('closing');

    // 2. Wait for animation (300ms)
    setTimeout(() => {
        if (viewForm) {
            viewForm.classList.remove('closing');
            viewForm.style.display = 'none';
        }
        if (viewList) {
            viewList.style.display = 'grid';
            // Optional: Trigger re-entrance of list if we wanted
        }
    }, 300);
};

let selectedIcon = 'icon-globe';

const selectIcon = (iconId, updateState = true) => {
    if (updateState) selectedIcon = iconId;

    document.querySelectorAll('.icon-option').forEach(opt => {
        if (opt.dataset.icon === iconId) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
};

/* --- CRUD --- */
const saveLink = async () => {
    const title = document.getElementById('link-title').value.trim();
    let url = document.getElementById('link-url').value.trim();

    if (!title || !url) {
        showToast("Faltan datos", "Escribe un título y una URL.", "warning");
        return;
    }

    // Auto-fix URL
    if (!url.startsWith('http')) url = 'https://' + url;

    // init state
    if (!state.links) state.links = [];

    if (editingId) {
        // UPDATE
        const index = state.links.findIndex(l => l.id === editingId);
        if (index !== -1) {
            state.links[index] = {
                ...state.links[index],
                title, url, icon: selectedIcon
            };
        }
    } else {
        // CREATE
        const newLink = {
            id: Date.now().toString(), // simple ID
            title,
            url,
            icon: selectedIcon,
            createdAt: new Date().toISOString()
        };
        state.links.push(newLink);
    }

    // Persist
    await saveData(); // Autosaves 'links' category if wired in store.js

    // UI Update
    renderLinksUI();
    closeEditForm();
    showToast("Guardado", "Enlace actualizado.", "success");
};

const deleteCurrentLink = async () => {
    if (!editingId) return;

    uiConfirm("¿Borrar enlace?", "No podrás recuperarlo.", async () => {
        state.links = state.links.filter(l => l.id !== editingId);
        await saveData();
        renderLinksUI();
        closeEditForm();
        showToast("Eliminado", "Enlace borrado.", "success");
    });
};
