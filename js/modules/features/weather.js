import { showToast, toggleSettings } from "../ui.js";

const DEFAULT_API_KEY = '8855775570f6d5a8fb4c72cbc0e8585b';
const DEFAULT_CITY = 'San Francisco de Macoris';

let WEATHER_API_KEY = localStorage.getItem('custom_weather_api_key') || DEFAULT_API_KEY;

/* --- Geolocation Helper --- */
const getPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
        } else {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        }
    });
};

/* --- Settings Logic --- */
export const saveApiKey = () => {
    const input = document.getElementById('api-key-input');
    const newKey = input.value.trim();

    if (newKey) {
        localStorage.setItem('custom_weather_api_key', newKey);
        WEATHER_API_KEY = newKey;
        showToast("Configuración Guardada", "Nueva API Key activa.", "success");
    } else {
        localStorage.removeItem('custom_weather_api_key');
        WEATHER_API_KEY = DEFAULT_API_KEY;
        showToast("Restablecido", "Usando API Key por defecto.", "info");
    }
    updateWeather(true);
    // Auto-close settings if open
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && settingsModal.style.display === 'flex') toggleSettings();
};

/* --- Theme & Weather Logic --- */
const updateThemeColor = (theme) => {
    let color = '#0f172a'; // Default
    if (theme.includes('clear-night')) color = '#020617';
    else if (theme.includes('rain')) color = '#0f172a';
    else if (theme.includes('storm')) color = '#334155';
    else if (theme.includes('sunset')) color = '#4c1d95';
    else if (theme.includes('sunrise')) color = '#1e1b4b';
    else if (theme.includes('cloudy')) color = '#1e293b';

    // Update Meta Tag for Browser Chrome
    document.querySelector('meta[name="theme-color"]').setAttribute('content', color);
};


export const updateWeather = async (isManual = false) => {
    if (isManual) {
        showToast("Actualizando...", "Contactando satélite...", "info");
    }

    const widget = document.getElementById('weather-widget');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const iconEl = document.getElementById('weather-icon');

    if (!widget) return;

    try {
        let url = "";

        // Strategy: Try Saved Coords -> Try GPS -> Fallback to City
        let lat = localStorage.getItem('weather_lat');
        let lon = localStorage.getItem('weather_lon');

        if (!lat || !lon || isManual) {
            try {
                // If manual or no cached coords, try to get fresh GPS
                const pos = await getPosition();
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                localStorage.setItem('weather_lat', lat);
                localStorage.setItem('weather_lon', lon);
                console.log("Got GPS:", lat, lon);
            } catch (e) {
                console.log("GPS unavailable, checking cache...");
            }
        }

        if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${WEATHER_API_KEY}`;
        } else {
            console.log("Using Default City Fallback");
            url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(DEFAULT_CITY)}&units=metric&lang=es&appid=${WEATHER_API_KEY}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        const temp = Math.round(data.main.temp);
        const weatherId = data.weather[0].id;
        const desc = data.weather[0].description;
        const sys = data.sys;
        const now = Math.floor(Date.now() / 1000);

        tempEl.innerText = `${temp}°C`;
        descEl.innerText = desc; // Real Data

        // Notify user of the city being used (helpful for debugging location)
        // Only if cache was just updated or it's the first load
        if (data.name) {
            console.log(`Weather updated for: ${data.name}`);
            if (!localStorage.getItem('weather_city_notified')) {
                showToast("Ubicación Detectada", `Clima de: ${data.name}`, "info");
                localStorage.setItem('weather_city_notified', 'true');
            }
        }

        /* --- THEME ENGINE --- */
        let themeClass = 'theme-clear-day';
        let emoji = '🌤️';

        const sunrise = sys.sunrise;
        const sunset = sys.sunset;
        const isNight = now < sunrise || now > sunset;
        const isDawn = Math.abs(now - sunrise) < 2700; // 45 mins window
        const isDusk = Math.abs(now - sunset) < 2700;

        if (isNight) themeClass = 'theme-clear-night';
        if (isDawn) themeClass = 'theme-sunrise';
        if (isDusk) themeClass = 'theme-sunset';

        // Override by Weather Condition (Priority High -> Low)
        if (weatherId >= 200 && weatherId <= 232) { themeClass = 'theme-storm'; emoji = '⚡'; }
        else if (weatherId >= 500 && weatherId <= 531) { themeClass = 'theme-rain'; emoji = '🌧️'; } // Only Real Rain
        else if (weatherId >= 300 && weatherId <= 321) { themeClass = 'theme-cloudy'; emoji = '🌦️'; } // Drizzle -> Cloudy Theme
        else if (weatherId >= 801 && weatherId <= 804) { themeClass = 'theme-cloudy'; emoji = '☁️'; }
        else if (weatherId === 800) {
            if (isNight) { themeClass = 'theme-clear-night'; emoji = '🌙'; }
            else { themeClass = 'theme-clear-day'; emoji = '☀️'; }
        } else if (weatherId >= 600 && weatherId <= 622) { emoji = '❄️'; } // Snow (Keep current theme but show snow icon)

        // Apply Real Data
        // DISABLED BY USER REQUEST: Dynamic Theme Backgrounds
        // document.body.className = '';
        // document.body.classList.add(themeClass);
        // updateThemeColor(themeClass);

        // Force Default Theme (Clear Night / Day based on time only if desired, or just static)
        // For "Default Theme", we usually just leave body clean or use a specific base class.
        // Assuming 'theme-clear-day' or 'theme-clear-night' is the base.
        // Let's stick to the base CSS variables without override.
        // [MODIFIED] Do NOT reset body class here. 
        // We want to respect the user's manual theme preference.
        // document.body.className = ''; 
        // updateThemeColor('theme-default'); 

        iconEl.innerText = emoji;
        widget.style.display = 'flex';
        widget.style.cursor = 'default';
        widget.onclick = null; // Disable Demo Click if real data works

        if (isManual) showToast("Actualizado", `Clima de: ${data.name}`, "success");

    } catch (err) {
        console.error("Weather failed:", err);
        renderDemoWeather(widget, tempEl, descEl, iconEl);
        if (isManual) showToast("Error", "No se pudo actualizar el clima.", "error");
    }
};

const renderDemoWeather = (widget, tempEl, descEl, iconEl) => {
    widget.style.display = 'flex';
    widget.style.cursor = 'pointer';
    widget.onclick = showDemoExplanation;
    // Don't override body class here to avoid jarring shift if it was cached
    // But ensure data placeholders
    if (tempEl.innerText === '--°') {
        document.body.className = 'theme-clear-day';
        tempEl.innerText = "26°C";
        descEl.innerHTML = "Demo Mode <span class='demo-badge'>OFFLINE</span>";
        iconEl.innerText = "⚠️";
    }
};

const showDemoExplanation = () => {
    showToast("Sin Conexión", "Verifica tu internet o API Key.", "info");
};

export const initWeather = () => {
    // Initial Load delayed to allow DOM paint
    setTimeout(() => updateWeather(false), 2000);

    // Refresh every 20 mins
    setInterval(() => updateWeather(false), 20 * 60 * 1000);

    // Settings Listeners
    const saveBtn = document.querySelector('.btn-icon-glass'); // Save key
    if (saveBtn) saveBtn.addEventListener('click', saveApiKey);

};
