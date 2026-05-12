/*
==================================================
UI CONTROLS

Maneja:
- botones (play / stop)
- sliders (volumen)
- selector de color
- upload de archivo
- utilidades de estado del DOM

NO debe contener lógica FFT o render complejo.
==================================================
*/

// ===== REFERENCIAS DEL DOM =====

const btnPlay         = document.getElementById('btn-play');
const btnStop         = document.getElementById('btn-stop');
const gainSlider      = document.getElementById('gain-slider');
const colorPicker     = document.getElementById('color-picker');
const audioUpload     = document.getElementById('audio-upload');
const trackName       = document.getElementById('track-name');
const freqDisplay     = document.getElementById('freq-display');
const statusIndicator = document.querySelector('.status-indicator');

// ===== ESTADO LOCAL =====

let isPlaying = false;

// ===== BOTONES START / STOP =====

function onPlayClick(callback) {
    btnPlay.addEventListener('click', () => {
        if (isPlaying) return;
        isPlaying = true;
        btnPlay.classList.add('active');
        btnStop.classList.remove('active');
        if (typeof callback === 'function') callback();
    });
}

function onStopClick(callback) {
    btnStop.addEventListener('click', () => {
        if (!isPlaying) return;
        isPlaying = false;
        btnStop.classList.add('active');
        btnPlay.classList.remove('active');
        if (typeof callback === 'function') callback();
    });
}

// ===== SLIDERS =====

function onGainChange(callback) {
    gainSlider.addEventListener('input', () => {
        const value = parseFloat(gainSlider.value);
        if (typeof callback === 'function') callback(value);
    });
}

/**
 * Retorna el valor inicial del slider de gain.
 * app.js lo usa para inicializar el GainNode con el valor correcto.
 * @returns {number}
 */
export function getInitialGain() {
    return parseFloat(gainSlider.value);
}

// ===== SELECTOR DE COLOR =====

function onColorChange(callback) {
    colorPicker.addEventListener('input', () => {
        if (typeof callback === 'function') callback(colorPicker.value);
    });
}

/**
 * Retorna el color inicial del picker.
 * app.js lo usa para inicializar los colores del FFTRenderer.
 * @returns {string} hex — ej: "#ff00ff"
 */
export function getInitialColor() {
    return colorPicker.value;
}

// ===== UPLOAD DE ARCHIVO =====

function onAudioUpload(callback) {
    audioUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        trackName.textContent = file.name;
        if (typeof callback === 'function') callback(file);
    });
}

// ===== UTILIDADES DE UI =====

/**
 * Actualiza el indicador de estado del header.
 * @param {string} text — ej: 'READY' | 'PLAYING' | 'ERROR'
 */
export function setStatus(text) {
    if (statusIndicator) statusIndicator.textContent = text;
}

/**
 * Actualiza el display de frecuencia dominante sobre el canvas.
 * app.js lo llama en cada frame del loop de render.
 * @param {number} hz
 */
export function updateFreqDisplay(hz) {
    if (freqDisplay) freqDisplay.textContent = `${hz.toFixed(1)} Hz`;
}

// ===== INIT =====

/**
 * Inicializa todos los controles de una vez.
 * Llamado desde app.js con los callbacks de cada módulo.
 *
 * @param {Object} options
 * @param {Function} options.onPlay
 * @param {Function} options.onStop
 * @param {Function} options.onGain
 * @param {Function} options.onColor
 * @param {Function} options.onUpload
 */
export function initControls({ onPlay, onStop, onGain, onColor, onUpload } = {}) {
    onPlayClick(onPlay);
    onStopClick(onStop);
    onGainChange(onGain);
    onColorChange(onColor);
    onAudioUpload(onUpload);
}
