/*
==================================================
AUDIO VISUALIZER - MAIN APP (FIXED)

Punto central de la aplicación.

Responsabilidades:
- inicializar módulos
- conectar audio + FFT + renderer
- coordinar UI
- manejar reproducción y stop

NO debe contener:
- lógica FFT compleja
- render visual pesado
- manipulación profunda de audio
==================================================
*/

import AudioEngine from "./audio/audioEngine.js";
import FFTAnalyzer from "./audio/fftAnalyzer.js";
import FFTRenderer from "./visual/fftRender.js";

import {
    initControls,
    setStatus,
    updateFreqDisplay
} from "./ui/controls.js";

import {
    isValidAudioFile
} from "./utils/helpers.js";

// =========================
// CORE
// =========================

// canvas principal del visualizador
const canvas =
    document.getElementById("fft-canvas");

// módulos principales
const audio = new AudioEngine();
const fft = new FFTAnalyzer();
const renderer = new FFTRenderer(canvas);

// =========================
// ESTADO GLOBAL
// =========================

// evita inicializaciones repetidas
let engineReady = false;

// elemento HTMLAudio usado para archivos
let audioElement = null;

// flag simple para controlar stream activo
let currentStream = null;

// =========================
// ENGINE INIT
// =========================

/*
==================================================
INICIALIZA EL SISTEMA COMPLETO

- inicia AudioContext
- conecta analyser
- inicia renderer
==================================================
*/

async function initEngine() {

    // evita reinicialización innecesaria
    if (engineReady) return;

    // inicia engine de audio
    await audio.start();

    // conecta analyser al FFT wrapper
    fft.setup(audio.getAnalyser());

    // inicia render loop
    renderer.start(fft);

    engineReady = true;

    setStatus("READY");
}

// =========================
// MICROPHONE
// =========================

/*
==================================================
INICIA MICRÓFONO

- evita múltiples streams
- conecta mic al audio graph
==================================================
*/

async function startMic() {

    await initEngine();

    // evita duplicación de streams
    if (currentStream) {
        audio.stop();
    }

    // inicializa micrófono
    await audio.initializeMicrophone();

    currentStream = true;

    setStatus("MIC ON");
}

// =========================
// STOP TOTAL
// =========================

/*
==================================================
DETENER TODO EL SISTEMA

- micrófono
- archivo
- renderer
- limpieza general
==================================================
*/

function stopAll() {

    // detiene audio graph
    audio.stop();

    // detiene render loop
    renderer.stop();

    // cleanup del archivo actual
    if (audioElement) {

        audioElement.pause();

        audioElement.src = "";

        audioElement.load();

        audioElement = null;
    }

    // reinicia flag de stream
    currentStream = null;

    engineReady = false;

    setStatus("STOPPED");
}

// =========================
// LOAD AUDIO FILE
// =========================

/*
==================================================
CARGA Y REPRODUCE UN ARCHIVO

- valida formato
- limpia audio anterior
- conecta nuevo source
==================================================
*/

async function loadFile(file) {

    // validación básica
    if (!isValidAudioFile(file)) {

        setStatus("INVALID FILE");

        return;
    }

    await initEngine();

    // cleanup del archivo anterior
    if (audioElement) {

        audioElement.pause();

        audioElement.src = "";

        audioElement.load();
    }

    // crea nuevo elemento audio
    audioElement = new Audio();

    audioElement.src =
        URL.createObjectURL(file);

    // conecta al audio engine
    await audio.loadAudioFile(audioElement);

    // inicia reproducción
    await audioElement.play();

    setStatus("PLAYING");
}

// =========================
// UI BINDING
// =========================

/*
==================================================
CONECTA UI CON LA APP

Cada callback conecta:
- botones
- sliders
- upload
- color picker
==================================================
*/

initControls({

    // PLAY
    onPlay: startMic,

    // STOP
    onStop: stopAll,

    // VOLUMEN
    onGain: (value) => {

        if (audio.gainNode) {

            audio.gainNode.gain.value = value;
        }
    },

    // COLOR DEL VISUALIZADOR
    onColor: (color) => {

        renderer.config.colors.bass =
        renderer.config.colors.mid =
        renderer.config.colors.treble = color;
    },

    // AUDIO FILE
    onUpload: loadFile
});