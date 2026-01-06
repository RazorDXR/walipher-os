# 🧠 WalipherOS V1.3 - Developer Guidelines ("La Mente")

Este documento sirve como la **fuente de verdad** para la arquitectura, estándares y flujos de trabajo de WalipherOS.

## 1. Filosofía del Proyecto
- **Modularidad Total**: NADA vive en el global si no es estrictamente necesario.
- **Separación de Conceptos**: HTML es estructura, CSS es estilo, JS es lógica. 
  - 🚫 PROHIBIDO: `onclick="..."` en HTML.
  - 🚫 PROHIBIDO: Estilos inline `<div style="...">` (salvo excepciones dinámicas).
- **Escalabilidad**: Agregar una nueva función no debe romper las existentes.

## 2. Arquitectura Técnica

### 📂 Estructura de Directorios
```
WalipherOS/
├── index.html            # Estructura Semántica (Sin lógica)
├── css/
│   ├── style.css         # Índice de importaciones (No escribir CSS aquí)
│   ├── base/             # Variables, Reset, Tipografía
│   ├── components/       # Elementos UI reutilizables (Botones, Modales)
│   └── features/         # Estilos específicos por app (Finanzas, Clima...)
└── js/
    ├── script.js         # Entry Point. Importa y orquesta todo.
    └── modules/
        ├── core.js       # Configuración global, Firebase, Detectores.
        ├── store.js      # ESTADO GLOBAL (Pub/Sub pattern). Persistencia.
        ├── ui.js         # Manejador de DOM, Modales, Toasts.
        ├── utils.js      # Helpers puros (Formatters, Maths).
        └── features/     # Lógica de negocio específica
            ├── finance.js
            ├── todos.js
            ├── weather.js
            └── ...
```

### ⚡ Flujo de Datos (Store Pattern)
1.  **Acción**: El usuario hace click (Manejado en `feature.js`).
2.  **Estado**: Se actualiza el dato en `store.js` o Firebase.
3.  **Suscripción**: `script.js` escucha cambios y le dice a los módulos que se re-rendericen.
    *   *Ejemplo*: Guardar gasto -> Store actualiza saldo -> UI Finanzas se repinta.

## 3. Guía: Cómo Agregar una Nueva Feature
Si quieres agregar una nueva app (ej: "Diario Personal"):

1.  **HTML (`index.html`)**:
    *   Agrega el botón en el dock: `<div class="dock-item" data-open-modal="journal-modal">...</div>`.
    *   Crea el modal al final del body: `<div id="journal-modal" class="modal">...</div>`.

2.  **CSS (`css/features/_journal.css`)**:
    *   Crea el archivo y escribe tus estilos.
    *   Impórtalo en `css/style.css`.

3.  **JS (`js/modules/features/journal.js`)**:
    *   Crea el módulo. Exporta `initJournal()` y `renderJournal()`.
    *   Usa `store.js` para guardar tus datos.
    *   Usa `ui.js` para tus interacciones.

4.  **Registro (`js/script.js`)**:
    *   Importa el módulo: `import * as Journal from ...`.
    *   Agrega `Journal.initJournal()` en el `Boot Sequence`.
    *   (Opcional) Agrega `Journal.renderJournal()` en el `subscribe` si necesita actualizarse en tiempo real.

## 4. Estándares de Código (DOs & DONTs)

### ✅ HACER
*   Usar `const` y `let`. Nunca `var`.
*   Usar `formattedCurrency` de `utils.js` para dineros.
*   Usar `data-*` attributes para seleccionar elementos en JS (ej: `data-action="save"`).
*   Comentar bloques grandes de código.

### ❌ NO HACER
*   No escribir funciones globales `window.miFuncion = ...` (Salvo emergencia).
*   No manipular el DOM de *otros* módulos directamente (Usar `store` para comunicarse).
*   No dejar `console.log` de debug en producción.

## 5. Cheat Sheet Interactiva
*   **Abrir Modal**: `UI.openModal('id-modal')`
*   **Mostrar Mensaje**: `UI.showToast('Hola Mundo')`
*   **Confirmar Acción**: `UI.uiConfirm('Título', '¿Seguro?', callback)`
*   **Guardar Dato**: `state.finance.total = 100; saveState();`

---
*Documento generado por Antigravity para WalipherOS V1.3*
