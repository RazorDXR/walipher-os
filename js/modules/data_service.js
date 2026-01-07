import { doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./core.js";

/**
 * Guarda un dato en la sub-colección 'datos_personales' del usuario activo.
 * Ruta: users/{uid}/datos_personales/{categoria}
 * @param {string} categoria - El ID del documento (ej: 'finanzas', 'notas').
 * @param {object} objetoDatos - El objeto JSON a guardar.
 */
export const guardarDatoUsuario = async (categoria, objetoDatos) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("⛔ Guardado bloqueado: Usuario no autenticado.");
            return;
        }

        const uid = user.uid;
        // Referencia: users / [uid] / datos_personales / [categoria]
        const docRef = doc(db, "users", uid, "datos_personales", categoria);

        await setDoc(docRef, objetoDatos, { merge: true });
        console.log(`✅ Dato guardado en: users/${uid}/datos_personales/${categoria}`);

    } catch (error) {
        console.error("❌ Error guardando datos:", error);
        throw error;
    }
};

/**
 * Obtiene TODOS los documentos de la sub-colección 'datos_personales' del usuario activo.
 * @returns {Promise<object>} Objeto con todas las categorías como propiedades.
 */
export const obtenerDatosUsuario = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("⚠️ Lectura bloqueada: Usuario no autenticado.");
            return null;
        }

        const uid = user.uid;
        // Referencia a la colección: users / [uid] / datos_personales
        const colRef = collection(db, "users", uid, "datos_personales");
        const querySnapshot = await getDocs(colRef);

        let dataCompleta = {};

        querySnapshot.forEach((doc) => {
            // Asigna cada documento al objeto retorno usando su ID como clave
            // Ej: dataCompleta.finanzas = { ... }
            dataCompleta[doc.id] = doc.data();
        });

        console.log(`📥 Datos descargados para ${uid}:`, dataCompleta);
        return dataCompleta;

    } catch (error) {
        console.error("❌ Error obteniendo datos:", error);
        return null;
    }
};
/**
 * BORRA todos los documentos del usuario en la subcolección 'datos_personales'.
 * Acción Destructiva para Factory Reset.
 */
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const borrarDatosUsuario = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        const colRef = collection(db, "users", user.uid, "datos_personales");
        const snapshot = await getDocs(colRef);

        const deletePromises = [];
        snapshot.forEach((docSnap) => {
            deletePromises.push(deleteDoc(docSnap.ref));
        });

        await Promise.all(deletePromises);
        console.log("🔥 Datos en nube eliminados.");
    } catch (e) {
        console.error("Error borrando nube:", e);
    }
};
