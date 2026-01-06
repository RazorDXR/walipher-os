/* --- Pomodoro Logic --- */

let pomoInterval;
let pomoTime = 25 * 60;
let isRunning = false;

const updatePomoDisplay = () => {
    const el = document.getElementById('pomo-time');
    if (el) {
        const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
        const s = (pomoTime % 60).toString().padStart(2, '0');
        el.innerText = `${m}:${s}`;
    }
};

export const togglePomo = () => {
    if (isRunning) {
        clearInterval(pomoInterval);
        isRunning = false;
        document.getElementById('pomo-btn').innerHTML = `<svg class="icon-svg icon-sm" fill="currentColor"><use href="#icon-play"/></svg> Iniciar`;
    } else {
        isRunning = true;
        document.getElementById('pomo-btn').innerHTML = `<svg class="icon-svg icon-sm"><use href="#icon-pause"/></svg> Pausar`;
        pomoInterval = setInterval(() => {
            if (pomoTime > 0) {
                pomoTime--;
                updatePomoDisplay();
            } else {
                togglePomo();
                alert("¡Tiempo terminado!"); // Using native alert for simplicity
                resetPomo();
            }
        }, 1000);
    }
};

export const resetPomo = () => {
    clearInterval(pomoInterval);
    isRunning = false;
    pomoTime = 25 * 60;
    updatePomoDisplay();
    document.getElementById('pomo-btn').innerHTML = `<svg class="icon-svg icon-sm" fill="currentColor"><use href="#icon-play"/></svg> Iniciar`;
};

// Initializer
export const initPomodoro = () => {
    updatePomoDisplay();
    const startBtn = document.getElementById('pomo-btn');
    if (startBtn) startBtn.addEventListener('click', togglePomo);

    // Reset button is next sibling usually, but best to select via ID if feasible. 
    // HTML clean will add ID="pomo-reset"
    const resetBtn = document.getElementById('pomo-reset');
    // Fallback if ID not yet added
    if (!resetBtn) {
        const btns = document.querySelectorAll('.timer-controls .pomo-btn');
        if (btns[1]) btns[1].addEventListener('click', resetPomo);
    } else {
        resetBtn.addEventListener('click', resetPomo);
    }
};
