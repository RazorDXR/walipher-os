import { onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./core.js";
import { guardarDatoUsuario } from "./data_service.js"; // Use the service for saves

// Global State
export const state = {
    todos: [],
    schedule: [],
    financeData: {
        cash: 0,
        debit: 0,
        creditLimit: 0,
        creditDebt: 0,
        history: [],
        pendingExpenses: []
    },
    notes: "",
    notifications: []
};

// Subscription System (Observer Pattern)
const listeners = [];
export const subscribe = (callback) => { listeners.push(callback); };
const notifyListeners = () => { listeners.forEach(callback => callback(state)); };

let activeUid = null;

// Persistence (Saves to user's 'datos_personales' subcollection)
export const saveData = async () => {
    if (!activeUid) return;

    // Save each category separately as requested by the "Cube" architecture
    // users/[uid]/datos_personales/[category]

    await guardarDatoUsuario('todos', { list: state.todos });
    await guardarDatoUsuario('schedule', { list: state.schedule });
    await guardarDatoUsuario('notes', { content: state.notes });
    await guardarDatoUsuario('finanzas', state.financeData); // SPANISH KEY
    await guardarDatoUsuario('notifications', { list: state.notifications });
    if (state.links) await guardarDatoUsuario('links', { list: state.links });
    if (state.preferences) await guardarDatoUsuario('preferences', state.preferences);

    // Cache UI bits
    const hasPinned = state.todos.some(t => !t.completed);
    localStorage.setItem('hasPinnedTasks', hasPinned);
};

// Initialize Store for specific UID
export const initStore = (uid) => {
    if (!uid) return;
    activeUid = uid;
    console.log("📦 Inicializando Cubo de Datos para:", uid);

    // Listen to the entire 'datos_personales' collection for this user
    // This allows real-time updates when any document changes
    const colRef = collection(db, "users", uid, "datos_personales");

    onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
            console.log("⚠️ Nuevo usuario detectado. Creando estructura inicial...");
            saveData(); // Save default state to create docs
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const category = doc.id;

                // Merge data back into state based on category ID
                if (category === 'todos') state.todos = data.list || [];
                if (category === 'schedule') state.schedule = data.list || [];
                if (category === 'notes') state.notes = data.content || "";
                if (category === 'notifications') state.notifications = data.list || [];
                if (category === 'preferences') {
                    state.preferences = data;
                    // Auto-apply theme if loaded
                    if (state.preferences.theme) {
                        import("./features/personalization.js").then(m => m.applyTheme(state.preferences.theme));
                    }
                }

                if (category === 'finanzas') {
                    state.financeData = data || state.financeData;
                    // Ensure defaults
                    if (!state.financeData.pendingExpenses) state.financeData.pendingExpenses = [];
                }

                if (category === 'profile') {
                    if (!state.user) state.user = {};
                    state.user.name = data.name;
                }

                if (category === 'links') {
                    state.links = data.list || [];
                    // Trigger render if module loaded
                    import("./features/links.js").then(m => m.renderLinksUI());
                }
            });
            notifyListeners();
        }
    }, (error) => {
        console.error("❌ Error en suscripción de datos:", error);
    });
};
