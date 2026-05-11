/*
==================================================
AUDIO ENGINE (FIXED)
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
    }

    async initContext() {

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    setupNodes() {

        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512; // 🔥 mejor resolución
            this.analyser.smoothingTimeConstant = 0.75;

            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        }

        if (!this.gainNode) {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.2; // 🔥 leve boost global
        }

        // 🔥 COMPRESOR (CLAVE PARA MICRO)
        if (!this.compressor) {
            this.compressor = this.audioContext.createDynamicsCompressor();

            this.compressor.threshold.value = -35;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
        }
    }

    async start() {

        if (this.isRunning) return;

        await this.initContext();
        this.setupNodes();

        this.isRunning = true;
    }

    async initializeMicrophone() {

        if (!this.isRunning) await this.start();

        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true
            }
        });

        this.tracks = this.stream.getTracks();

        this.microphoneSource =
            this.audioContext.createMediaStreamSource(this.stream);

        // 🔥 CADENA CORRECTA
        this.microphoneSource
            .connect(this.compressor)
            .connect(this.analyser)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);
    }

    async loadAudioFile(audioElement) {

        if (!this.isRunning) await this.start();

        this.fileSource =
            this.audioContext.createMediaElementSource(audioElement);

        this.fileSource
            .connect(this.analyser)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);
    }

    getAnalyser() {
        return this.analyser;
    }

    getFrequencyData() {

        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    stop() {

        this.tracks.forEach(t => t.stop?.());

        this.stream = null;
        this.tracks = [];

        this.microphoneSource = null;
        this.fileSource = null;

        this.isRunning = false;
    }
}

export default AudioEngine;