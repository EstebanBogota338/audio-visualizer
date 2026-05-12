/*
==================================================
AUDIO VISUALIZER - MAIN APP

Punto central de la aplicación.

Responsabilidades:
- inicializar módulos
- conectar audio + FFT + render
- iniciar/detener visualización
- coordinar UI

Evitar:
- lógica visual pesada
- lógica FFT directamente aquí
==================================================
*/

/*
    Arreglar mini bug stop y play no reanuda
*/

// ===== IMPORTS =====

import AudioEngine from "./audio/audioEngine.js";
import FFTAnalyzer from "./audio/fftAnalyzer.js";
import FFTRenderer from "./visual/fftRender.js";

// ===== INICIALIZACIÓN GENERAL =====

const canvas      = document.getElementById("fft-canvas");
const btnPlay     = document.getElementById("btn-play");
const btnStop     = document.getElementById("btn-stop");
const gainSlider  = document.getElementById("gain-slider");
const colorPicker = document.getElementById("color-picker");
const audioUpload = document.getElementById("audio-upload");
const trackName   = document.getElementById("track-name");
const statusEl    = document.getElementById("freq-display");

const audio    = new AudioEngine();
const fft      = new FFTAnalyzer();
const renderer = new FFTRenderer(canvas);

let engineReady = false;
let audioElement = null;

// ===== INICIALIZACIÓN DEL ENGINE =====

async function initEngine() {

    if (engineReady) return;

    await audio.start();

    fft.setup(audio.getAnalyser());

    renderer.start(fft);

    engineReady = true;

    console.log("Sistema iniciado.");
}

// ===== EVENTOS PRINCIPALES =====

// ----- PLAY (mic) -----

btnPlay.onclick = async () => {

    await initEngine();

    if (!audio.hasMicrophoneConnected) {
        await audio.initializeMicrophone();
    }

    updateStatus("MIC ON");
};

// ----- STOP -----

btnStop.onclick = () => {

    audio.stop();
    renderer.stop();

    // detener audio file si hay uno activo
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }

    engineReady = false;
    updateStatus("STOPPED");
};

// ----- UPLOAD ARCHIVO -----

audioUpload.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    await initEngine();

    // Si hay un elemento previo lo limpiamos
    if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
    }

    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);

    await audio.loadAudioFile(audioElement);

    audioElement.play();

    trackName.textContent = file.name;

    updateStatus("PLAYING");

    console.log("Archivo cargado:", file.name);
};

// ----- GAIN SLIDER -----

gainSlider.oninput = () => {

    const value = parseFloat(gainSlider.value);

    if (audio.gainNode) {
        audio.gainNode.gain.value = value;
    }
};

// ----- COLOR PICKER -----

colorPicker.oninput = () => {

    const color = colorPicker.value;

    // Aplica el color a las 3 bandas
    renderer.config.colors.bass   = color;
    renderer.config.colors.mid    = color;
    renderer.config.colors.treble = color;
};

// ===== UTILIDADES UI =====

function updateStatus(text) {
    if (statusEl) statusEl.textContent = text;
}