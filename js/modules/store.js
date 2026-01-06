import { setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { docRef } from "./core.js";

// Estado Global
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

// Sistema de Suscripciones (Observer Pattern)
const listeners = [];

export const subscribe = (callback) => {
    listeners.push(callback);
};

const notifyListeners = () => {
    listeners.forEach(callback => callback(state));
};

// Persistencia
export const saveData = async () => {
    try {
        await setDoc(docRef, {
            todos: state.todos,
            schedule: state.schedule,
            notes: state.notes,
            financeData: state.financeData,
            notifications: state.notifications
        });

        // Cache para evitar flicker de UI
        const hasPinned = state.todos.some(t => !t.completed);
        localStorage.setItem('hasPinnedTasks', hasPinned);

    } catch (e) {
        console.error("Error guardando en Firebase:", e);
    }
};

// Inicialización de Datos
export const initStore = () => {
    console.log("Inicializando Store...");
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();

            // Actualizar Estado
            state.todos = data.todos || [];
            state.schedule = data.schedule || [];
            state.notes = data.notes || "";

            if (data.financeData) {
                state.financeData = data.financeData;
                if (!state.financeData.pendingExpenses) state.financeData.pendingExpenses = [];
            }

            if (data.notifications) {
                state.notifications = data.notifications;
            }

            // Notificar cambios a la UI
            notifyListeners();
        } else {
            // Si no existe, crear doc inicial
            saveData();
        }
    });
};
