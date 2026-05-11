/*
==================================================
AUDIO ENGINE

Maneja:
- AudioContext
- micrófono
- archivos de audio
- conexiones entre nodos

Este archivo NO debe renderizar nada visual.
==================================================
*/

class AudioEngine {

    constructor() {

        // ==================================================
        // VARIABLES DE AUDIO PRINCIPALES
        // ==================================================

        this.audioContext = null;
        this.stream = null;
        this.tracks = [];

        this.microphoneSource = null;
        this.fileSource = null;

        this.analyser = null;
        this.gainNode = null;

        this.frequencyData = null;

        this.isRunning = false;

        // ==================================================
        // FLAGS DE CONTROL
        // ==================================================

        this.hasMicrophoneConnected = false;
        this.hasFileConnected = false;
        this.hasAnalyserConnectedToOutput = false;
    }

    // ==================================================
    // CONFIGURACIÓN DE NODOS
    // ==================================================

    setupAudioNodes() {

        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        if (!this.analyser) {

            this.analyser = this.audioContext.createAnalyser();

            // 🔥 FIX IMPORTANTE: sensibilidad para micrófono real
            // 2048 es muy “insensible” para mic en muchos casos
            this.analyser.fftSize = 256;

            this.analyser.smoothingTimeConstant = 0.2;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -20;

            this.frequencyData = new Uint8Array(
                this.analyser.frequencyBinCount
            );

            console.log("Analyser configurado.");
        }

        if (!this.gainNode) {

            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1;

            console.log("GainNode configurado.");
        }

        // ==================================================
        // CADENA DE AUDIO PRINCIPAL
        // analyser -> gain -> speakers
        // ==================================================

        if (!this.hasAnalyserConnectedToOutput) {

            this.analyser.connect(this.gainNode);

            // 🔥 IMPORTANTE:
            // Descomentar SOLO si quieres escuchar el audio del mic
            // (sirve para debug, no obligatorio para visualizador)
            // this.gainNode.connect(this.audioContext.destination);

            this.hasAnalyserConnectedToOutput = true;
        }
    }

    // ==================================================
    // START ENGINE
    // ==================================================

    async start() {

        if (this.isRunning) return;

        this.setupAudioNodes();

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        this.isRunning = true;

        console.log("AudioEngine iniciado:", this.audioContext.state);
    }

    // ==================================================
    // MICRÓFONO
    // ==================================================

    async initializeMicrophone() {

        if (!this.isRunning) {
            await this.start();
        }

        if (this.hasMicrophoneConnected) {
            console.log("Micrófono ya conectado.");
            return;
        }

        try {

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            this.tracks = this.stream.getTracks();

            this.microphoneSource =
                this.audioContext.createMediaStreamSource(this.stream);

            this.microphoneSource.connect(this.analyser);

            this.hasMicrophoneConnected = true;

            console.log("Micrófono inicializado.");

        } catch (error) {

            console.error("Error al acceder al micrófono:", error);
        }
    }

    // ==================================================
    // ARCHIVO DE AUDIO
    // ==================================================

    async loadAudioFile(audioElement) {

        if (!this.isRunning) {
            await this.start();
        }

        if (this.hasFileConnected) return;

        try {

            this.fileSource =
                this.audioContext.createMediaElementSource(audioElement);

            this.fileSource.connect(this.analyser);

            this.hasFileConnected = true;

            console.log("Archivo de audio conectado.");

        } catch (error) {

            console.error("Error cargando archivo:", error);
        }
    }

    // ==================================================
    // FFT DATA
    // ==================================================

    getFrequencyData() {

        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    // ==================================================
    // STOP
    // ==================================================

    stop() {

        if (!this.isRunning) return;

        this.tracks.forEach(track => track.stop());

        this.stream = null;
        this.tracks = [];

        this.microphoneSource = null;
        this.fileSource = null;

        this.hasMicrophoneConnected = false;
        this.hasFileConnected = false;

        this.isRunning = false;

        console.log("AudioEngine detenido.");
    }

    // ==================================================
    // DESTROY
    // ==================================================

    async destroy() {

        this.stop();

        if (this.audioContext) {
            await this.audioContext.close();
        }

        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.frequencyData = null;

        this.hasAnalyserConnectedToOutput = false;

        console.log("AudioEngine destruido completamente.");
    }

    // ==================================================
    // GETTERS
    // ==================================================

    getAnalyser() {
        return this.analyser;
    }

    getAudioContext() {
        return this.audioContext;
    }

    getGain() {
        return this.gainNode;
    }

    isActive() {
        return this.isRunning;
    }
}

export default AudioEngine;