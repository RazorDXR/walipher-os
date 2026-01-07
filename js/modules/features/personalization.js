import { db, auth } from "../core.js";
import { state, saveData } from "../store.js";
import { showToast, closeModal, openModal } from "../ui.js";

/* 
   THEME MANAGER
   Handles changing the wallpaper/theme class on the body 
   and persisting it to the user's preferences.
*/

const THEMES = [
    { id: 'theme-clear-day', name: 'Día Soleado', previewClass: 'preview-clear-day' },
    { id: 'theme-clear-night', name: 'Noche Clara', previewClass: 'preview-clear-night' },
    { id: 'theme-rain', name: 'Lluvia', previewClass: 'preview-rain' },
    { id: 'theme-storm', name: 'Tormenta', previewClass: 'preview-storm' },
    { id: 'theme-sunset', name: 'Atardecer', previewClass: 'preview-sunset' },
    { id: 'theme-sunrise', name: 'Amanecer', previewClass: 'preview-sunrise' },
    { id: 'theme-cloudy', name: 'Nublado', previewClass: 'preview-cloudy' }
];

// Local state for preview
let previewTheme = null;

// Helper to get current theme from state or default
const getCurrentTheme = () => {
    // Return saved preference or default
    return state.preferences?.theme || 'theme-clear-night';
};

// Render the Grid in the Modal
export const renderThemes = () => {
    const grid = document.querySelector('.theme-grid');
    if (!grid) return;

    // When opening modal, start preview with current saved theme
    previewTheme = getCurrentTheme();

    // Initial Render
    updateGridUI();
};

const updateGridUI = () => {
    const grid = document.querySelector('.theme-grid');
    if (!grid) return;

    // Use previewTheme to show what's currently selected in the UI
    const activeId = previewTheme;

    grid.innerHTML = THEMES.map(theme => `
        <div class="theme-card ${theme.id === activeId ? 'active' : ''}" data-theme="${theme.id}">
            <div class="theme-preview ${theme.previewClass}"></div>
            <div class="theme-name">${theme.name}</div>
        </div>
    `).join('');

    // Re-attach listeners
    grid.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            selectTheme(card.dataset.theme);
        });
    });
};

// Handle Selection (PREVIEW MODE)
const selectTheme = (themeId) => {
    // 1. Update Preview State
    previewTheme = themeId;

    // 2. Visual Feedback in Grid
    updateGridUI();

    // 3. Apply Visuals Immediately (Preview)
    // Note: We do NOT update state.preferences.theme yet!
    applyThemeVisuals(themeId);
};

// Apply to Body (Visual Only)
export const applyThemeVisuals = (themeId) => {
    // Remove all known theme classes
    THEMES.forEach(t => document.body.classList.remove(t.id));
    // Add new one
    document.body.classList.add(themeId);

    // Update Meta Color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        let color = '#0f172a';
        if (themeId.includes('night')) color = '#020617';
        if (themeId.includes('sunset')) color = '#4c1d95';
        if (themeId.includes('storm')) color = '#334155';
        metaTheme.setAttribute('content', color);
    }
};

// Exported alias for compatibility if needed elsewhere
export const applyTheme = applyThemeVisuals;

// Cancel/Restore Logic (When closing modal without saving)
export const cancelThemePreview = () => {
    const savedTheme = getCurrentTheme();
    // Revert visual change if we didn't save
    if (previewTheme !== savedTheme) {
        applyThemeVisuals(savedTheme);
    }
    previewTheme = null; // Reset
};

// Save to Firebase (COMMIT)
export const saveThemePreference = async () => {
    const btn = document.getElementById('btn-save-theme');

    // Nothing to save if no preview change (optional check)
    // if (previewTheme === getCurrentTheme()) ...

    if (btn) btn.innerHTML = '<span class="loading-spinner-auth"></span> Guardando...';

    try {
        // 1. Commit Preview to State
        if (!state.preferences) state.preferences = {};
        state.preferences.theme = previewTheme;

        // 2. Persist
        await saveData();

        showToast("Personalización", "Tema guardado correctamente.", "success");
        closeModal('modal-personalization');
    } catch (error) {
        console.error(error);
        showToast("Error", "No se pudo guardar el tema.", "error");
    } finally {
        if (btn) btn.innerHTML = '<svg class="icon-svg icon-sm"><use href="#icon-check"/></svg> Guardar Preferencia';
    }
};

// Init Module
export const initPersonalization = () => {
    // 1. Apply Saved Theme on Startup
    const savedTheme = getCurrentTheme();
    applyThemeVisuals(savedTheme);

    // 2. Listen for Modal Open to Render Grid
    const dockItem = document.querySelector('[data-open-modal="modal-personalization"]');
    if (dockItem) {
        dockItem.addEventListener('click', renderThemes);
    }

    // 3. Listen for Save
    const saveBtn = document.getElementById('btn-save-theme');
    if (saveBtn) saveBtn.addEventListener('click', saveThemePreference);

    // 4. Listen for Cancel/Close to Revert
    const closeBtn = document.querySelector('[data-close-modal="modal-personalization"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', cancelThemePreview);
    }

    // 5. Handle Overlay Click (Cancel/Close)
    const overlay = document.getElementById('modal-personalization');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            // If clicking the transparent overlay, close it
            if (e.target === overlay) {
                cancelThemePreview();
                // ui.js handles closing, but we ensure logic runs first
                // closeModal('modal-personalization');
            }
        });
    }
};
