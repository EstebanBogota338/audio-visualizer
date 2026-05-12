/*
==================================================
UI CONTROLS

Responsabilidad:
- manejar interacción del DOM
- escuchar botones/sliders
- actualizar pequeños elementos visuales
- comunicar eventos hacia app.js

NO debe contener:
- lógica FFT
- lógica de audio
- render complejo
==================================================
*/

// =========================
// REFERENCIAS DEL DOM
// =========================

const btnPlay = document.getElementById("btn-play");
const btnStop = document.getElementById("btn-stop");

const gainSlider = document.getElementById("gain-slider");
const colorPicker = document.getElementById("color-picker");

const audioUpload = document.getElementById("audio-upload");

const trackName = document.getElementById("track-name");

const freqDisplay = document.getElementById("freq-display");

const statusIndicator =
    document.querySelector(".status-indicator");

// =========================
// ESTADO LOCAL
// =========================

// evita múltiples inicios simultáneos
let isPlaying = false;

// =========================
// STATUS UI
// =========================

/*
==================================================
ACTUALIZA EL TEXTO DE ESTADO

Ejemplos:
- READY
- PLAYING
- MIC ON
- STOPPED
==================================================
*/

export function setStatus(text) {

    if (statusIndicator) {
        statusIndicator.textContent = text;
    }
}

/*
==================================================
ACTUALIZA EL DISPLAY DE FRECUENCIA

Se usa desde app.js o renderer
para mostrar la frecuencia dominante.
==================================================
*/

export function updateFreqDisplay(hz) {

    if (!freqDisplay) return;

    freqDisplay.textContent =
        `${hz.toFixed(1)} Hz`;
}

// =========================
// INIT GENERAL
// =========================

/*
==================================================
INICIALIZA TODOS LOS CONTROLES

Conecta:
- play
- stop
- gain
- color
- upload

Cada callback viene desde app.js
==================================================
*/

export function initControls({

    onPlay,
    onStop,
    onGain,
    onColor,
    onUpload

}) {

    // =========================
    // PLAY
    // =========================

    btnPlay?.addEventListener("click", () => {

        // evita doble ejecución
        if (isPlaying) return;

        isPlaying = true;

        if (typeof onPlay === "function") {
            onPlay();
        }
    });

    // =========================
    // STOP
    // =========================

    btnStop?.addEventListener("click", () => {

        // evita stop innecesario
        if (!isPlaying) return;

        isPlaying = false;

        if (typeof onStop === "function") {
            onStop();
        }
    });

    // =========================
    // GAIN SLIDER
    // =========================

    gainSlider?.addEventListener("input", () => {

        const value =
            parseFloat(gainSlider.value);

        if (typeof onGain === "function") {
            onGain(value);
        }
    });

    // =========================
    // COLOR PICKER
    // =========================

    colorPicker?.addEventListener("input", () => {

        const color = colorPicker.value;

        if (typeof onColor === "function") {
            onColor(color);
        }
    });

    // =========================
// UPLOAD
// =========================

audioUpload?.addEventListener("change", (e) => {

    const file =
        e.target.files?.[0];

    if (!file) return;

    // FIX:
    // marcar estado como reproduciendo
    isPlaying = true;

    // actualiza nombre visible
    if (trackName) {
        trackName.textContent = file.name;
    }

    if (typeof onUpload === "function") {
        onUpload(file);
    }
});

}