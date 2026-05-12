/*
==================================================
AUDIO ENGINE (FINAL FIXED)
==================================================
*/

class AudioEngine {

    constructor() {

        this.audioContext = null;

        this.analyser = null;
        this.gainNode = null;
        this.compressor = null;

        this.microphoneSource = null;
        this.fileSource = null;

        this.stream = null;
        this.tracks = [];

        this.frequencyData = null;

        this.isRunning = false;

        // 🔥 estado simple
        this.hasMicrophoneConnected = false;
    }

    // ==================================================
    // CONTEXT
    // ==================================================

    async initContext() {

        if (!this.audioContext) {

            this.audioContext =
                new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    // ==================================================
    // NODES
    // ==================================================

    setupNodes() {

        // ANALYSER
        if (!this.analyser) {

            this.analyser =
                this.audioContext.createAnalyser();

            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.75;

            this.frequencyData =
                new Uint8Array(this.analyser.frequencyBinCount);
        }

        // GAIN
        if (!this.gainNode) {

            this.gainNode =
                this.audioContext.createGain();

            this.gainNode.gain.value = 1.2;
        }

        // COMPRESSOR
        if (!this.compressor) {

            this.compressor =
                this.audioContext.createDynamicsCompressor();

            this.compressor.threshold.value = -35;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
        }
    }

    // ==================================================
    // START
    // ==================================================

    async start() {

        if (this.isRunning) return;

        await this.initContext();

        this.setupNodes();

        this.isRunning = true;
    }

    // ==================================================
    // MICROPHONE
    // ==================================================

    async initializeMicrophone() {

        if (!this.isRunning) {
            await this.start();
        }

        // 🔥 limpia conexiones previas
        this.fileSource?.disconnect?.();

        this.stream =
            await navigator.mediaDevices.getUserMedia({

                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: true
                }
            });

        this.tracks = this.stream.getTracks();

        this.microphoneSource =
            this.audioContext.createMediaStreamSource(this.stream);

        // 🔥 routing limpio
        this.microphoneSource
            .connect(this.compressor)
            .connect(this.analyser)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);

        this.hasMicrophoneConnected = true;
    }

    // ==================================================
    // AUDIO FILE
    // ==================================================

    async loadAudioFile(audioElement) {

        if (!this.isRunning) {
            await this.start();
        }

        // 🔥 desconecta source previa
        this.fileSource?.disconnect?.();

        this.fileSource =
            this.audioContext.createMediaElementSource(audioElement);

        this.fileSource
            .connect(this.analyser)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);

        this.hasMicrophoneConnected = false;
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
    // GETTERS
    // ==================================================

    getAnalyser() {
        return this.analyser;
    }

    // ==================================================
    // STOP
    // ==================================================

    stop() {

        // 🔥 detener tracks del mic
        this.tracks.forEach(track => track.stop?.());

        // 🔥 desconectar nodos
        this.microphoneSource?.disconnect?.();
        this.fileSource?.disconnect?.();
        this.analyser?.disconnect?.();
        this.gainNode?.disconnect?.();
        this.compressor?.disconnect?.();

        // 🔥 limpiar referencias
        this.microphoneSource = null;
        this.fileSource = null;

        this.stream = null;
        this.tracks = [];

        this.hasMicrophoneConnected = false;

        this.isRunning = false;
    }
}

export default AudioEngine;