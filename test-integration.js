import AudioEngine from "./audio/audioEngine.js";
import FFTAnalyzer from "./audio/fftAnalyzer.js";
import FFTRenderer from "./visual/fftRender.js";

// =========================
// DOM
// =========================

const canvas      = document.getElementById("visualizer");
const startBtn    = document.getElementById("startBtn");
const audioFile   = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");

// =========================
// SYSTEM
// =========================

const audio    = new AudioEngine();
const fft      = new FFTAnalyzer();
const renderer = new FFTRenderer(canvas);

let ready = false;

// =========================
// INIT
// =========================

async function initEngine() {

    if (ready) return;

    console.log("Iniciando engine...");

    await audio.start();
    console.log("ENGINE STARTED");

    const analyser = audio.getAnalyser();

    if (!analyser) {
        console.error("Analyser no disponible");
        return;
    }

    fft.setup(analyser);
    console.log("FFT READY");

    renderer.start(fft);
    console.log("RENDERER STARTED");

    ready = true;
}

// =========================
// MIC
// =========================

startBtn.onclick = async () => {

    await initEngine();

    await audio.initializeMicrophone();

    startBtn.disabled = true;
    startBtn.innerText = "MIC RUNNING";

    console.log("MIC READY");
};

// =========================
// FILE
// =========================

audioFile.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    await initEngine();

    const url = URL.createObjectURL(file);
    audioPlayer.src = url;

    await audio.loadAudioFile(audioPlayer);

    audioPlayer.play();

    console.log("FILE PLAYING");
};