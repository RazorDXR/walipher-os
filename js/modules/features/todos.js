import { state, saveData } from "../store.js";

/* --- Lógica de Tareas --- */

let isLongTerm = false;

export const toggleDeadlineMode = () => {
    isLongTerm = !isLongTerm;
    const btn = document.getElementById('deadline-btn');
    const span = btn.querySelector('span');

    if (isLongTerm) {
        btn.classList.add('active');
        span.innerText = "7d";
    } else {
        btn.classList.remove('active');
        span.innerText = "2d";
    }
};

export const addTodo = () => {
    const todoInput = document.getElementById('todo-input');
    const text = todoInput.value;
    if (text.trim() === "") return;

    const now = Date.now();
    const daysToAdd = isLongTerm ? 7 : 2;
    const deadline = now + (daysToAdd * 24 * 60 * 60 * 1000);

    state.todos.push({
        text,
        completed: false,
        timestamp: now,
        deadline: deadline,
        durationTag: isLongTerm ? '7d' : '2d'
    });

    saveData();
    todoInput.value = "";

    if (isLongTerm) toggleDeadlineMode();
};

export const toggleTodo = (index) => {
    const isCompleted = state.todos[index].completed;
    if (!isCompleted) {
        // Animación Fade Out si se completa desde Pinned
        // Nota: Esto asume que el indice coincide, lo cual es arriesgado si hay filtros.
        // Pero mantenemos la lógica original por ahora.
        const btn = document.querySelector(`.pinned-check[onclick="window.toggleTodo(${index})"]`);
        if (btn) {
            const card = btn.closest('.pinned-task-card');
            if (card) {
                card.classList.add('fade-out-remove');
                setTimeout(() => {
                    state.todos[index].completed = true;
                    saveData();
                }, 300);
                return;
            }
        }
    }
    state.todos[index].completed = !state.todos[index].completed;
    saveData();
};

export const deleteTodo = (index) => {
    state.todos.splice(index, 1);
    saveData();
};

/* --- Renderizado --- */

export const renderTodosUI = () => {
    const todoList = document.getElementById('todo-list');
    const pinnedSection = document.getElementById('pinned-tasks-section');
    const pinnedList = document.getElementById('pinned-list');

    if (!todoList || !pinnedList) return;

    todoList.innerHTML = "";
    pinnedList.innerHTML = "";
    let activeTasksCount = 0;

    state.todos.forEach((todo, idx) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        // Clean HTML: Data attributes for delegation
        li.innerHTML = `
            <input type="checkbox" class="custom-checkbox" ${todo.completed ? 'checked' : ''} data-action="toggle" data-index="${idx}">
            <span class="todo-text">
                ${todo.text} 
                ${todo.durationTag ? `<span style="font-size:0.7em; background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; margin-left:5px; color:#94a3b8;">${todo.durationTag.toUpperCase()}</span>` : ''}
            </span>
            <span class="delete-todo" data-action="delete" data-index="${idx}">
                <svg class="icon-svg icon-sm" style="pointer-events:none"><use href="#icon-delete"/></svg>
            </span>`;
        todoList.appendChild(li);

        if (!todo.completed) {
            activeTasksCount++;
            const card = document.createElement('div'); card.className = 'pinned-task-card';
            card.innerHTML = `
                <div class="pinned-check" data-action="toggle" data-index="${idx}">✓</div>
                <div class="pinned-text">
                    ${todo.text}
                    ${todo.durationTag ? `<span style="font-size:0.7em; background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; margin-left:5px; color:#94a3b8;">${todo.durationTag.toUpperCase()}</span>` : ''}
                </div>`;
            pinnedList.appendChild(card);
        }
    });

    // Empty State Handling
    if (state.todos.length === 0) {
        todoList.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b; font-style:italic;">No tienes tareas pendientes.<br>¡Buen trabajo! 🎉</div>`;
    }

    if (activeTasksCount > 0) {
        const computedStyle = window.getComputedStyle(pinnedSection);
        const isHidden = computedStyle.display === 'none';
        pinnedSection.style.display = 'flex';
        if (isHidden) pinnedSection.classList.add('slide-in-entry');
    } else {
        pinnedSection.style.display = 'none';
    }
};

export const initTodoListeners = () => {
    // Input Actions
    const input = document.getElementById('todo-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });
    }

    const deadlineBtn = document.getElementById('deadline-btn');
    if (deadlineBtn) deadlineBtn.addEventListener('click', toggleDeadlineMode);

    // List Delegation (Main List)
    const todoList = document.getElementById('todo-list');
    if (todoList) {
        todoList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const index = parseInt(target.dataset.index);

            if (action === 'toggle') toggleTodo(index);
            if (action === 'delete') deleteTodo(index);
        });
    }

    // List Delegation (Pinned List)
    const pinnedList = document.getElementById('pinned-list');
    if (pinnedList) {
        pinnedList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action="toggle"]');
            if (target) {
                const index = parseInt(target.dataset.index);
                toggleTodo(index);
            }
        });
    }
};
