/*
==================================================
AUDIO ENGINE (FIXED & STABLE)
==================================================
Controla todo el flujo de audio:
- contexto de audio
- micrófono
- archivos de audio
- nodes (gain, analyser, compressor)
- conexión de cadena de audio

NO renderiza nada
NO maneja UI
==================================================
*/

class AudioEngine {

    constructor() {

        // =========================
        // AUDIO CORE
        // =========================
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.compressor = null;

        // =========================
        // SOURCES (ENTRADAS DE AUDIO)
        // =========================
        this.microphoneSource = null;
        this.fileSource = null;

        // =========================
        // STREAM MIC
        // =========================
        this.stream = null;
        this.tracks = [];

        // =========================
        // DATA BUFFER FFT
        // =========================
        this.frequencyData = null;

        // estado general del engine
        this.isRunning = false;
    }

    // ==================================================
    // INICIALIZACIÓN DEL AUDIO CONTEXT
    // ==================================================

    async start() {

        // crea contexto si no existe
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // reactiva contexto si está suspendido (browser policy)
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        // crea nodes base si aún no existen
        this._setupNodes();

        this.isRunning = true;
    }

    // ==================================================
    // SETUP DE NODES (FFT / GAIN / COMPRESSOR)
    // ==================================================

    _setupNodes() {

        // analyser: encargado de generar el espectro FFT
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.75;

            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        }

        // gain node: controla volumen global
        if (!this.gainNode) {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;
        }

        // compressor: estabiliza micro y evita picos fuertes
        if (!this.compressor) {
            this.compressor = this.audioContext.createDynamicsCompressor();

            this.compressor.threshold.value = -35;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
        }
    }

    // ==================================================
    // MICROFONO
    // ==================================================

    async initializeMicrophone() {

        if (!this.isRunning) await this.start();

        // evita conflicto con audio file activo
        this.stopFile();

        // pide permisos de micrófono
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true
            }
        });

        this.tracks = this.stream.getTracks();

        // crea source desde stream del mic
        this.microphoneSource =
            this.audioContext.createMediaStreamSource(this.stream);

        // conecta cadena de audio
        this._connectChain(this.microphoneSource);
    }

    // ==================================================
    // ARCHIVOS DE AUDIO
    // ==================================================

    async loadAudioFile(audioElement) {

        if (!this.isRunning) await this.start();

        // evita conflicto con mic
        this.stopMic();

        // evita duplicación de MediaElementSource (CRÍTICO)
        if (this.fileSource) {
            this.fileSource.disconnect();
            this.fileSource = null;
        }

        // crea source desde elemento audio HTML
        this.fileSource =
            this.audioContext.createMediaElementSource(audioElement);

        // conecta cadena de audio
        this._connectChain(this.fileSource);
    }

    // ==================================================
    // CADENA DE AUDIO (ROUTING)
    // ==================================================

    _connectChain(source) {

        source
            .connect(this.compressor)
            .connect(this.analyser)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);
    }

    // ==================================================
    // STOP GENERAL
    // ==================================================

    stop() {
        this.stopMic();
        this.stopFile();
    }

    // detiene micrófono completamente
    stopMic() {

        if (this.tracks.length) {
            this.tracks.forEach(t => t.stop());
        }

        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
        }

        if (this.microphoneSource) {
            this.microphoneSource.disconnect();
            this.microphoneSource = null;
        }

        this.stream = null;
        this.tracks = [];
    }

    // detiene archivo de audio
    stopFile() {

        if (this.fileSource) {
            this.fileSource.disconnect();
            this.fileSource = null;
        }
    }

    // ==================================================
    // DATA (FFT OUTPUT)
    // ==================================================

    getAnalyser() {
        return this.analyser;
    }

    getFrequencyData() {

        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }
}

export default AudioEngine;