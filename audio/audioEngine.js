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

        // Contexto principal de Web Audio API
        this.audioContext = null;

        // Stream del micrófono (MediaStream)
        this.stream = null;

        // Tracks activos del micrófono
        this.tracks = [];

        // Source del micrófono (MediaStreamSourceNode)
        this.microphoneSource = null;

        // Source del archivo de audio (MediaElementSourceNode)
        this.fileSource = null;

        // Nodo analyser (FFT / análisis de frecuencia)
        this.analyser = null;

        // Nodo de ganancia (control de volumen global)
        this.gainNode = null;

        // Array donde se almacenan los datos de frecuencia
        this.frequencyData = null;

        // Estado del sistema (activo o no)
        this.isRunning = false;

        // ==================================================
        // FLAGS DE CONTROL
        // ==================================================

        // Evita múltiples conexiones del micrófono
        this.hasMicrophoneConnected = false;

        // Evita múltiples conexiones del archivo de audio
        this.hasFileConnected = false;

        // Evita reconectar analyser a la salida más de una vez
        this.hasAnalyserConnectedToOutput = false;
    }

    // ==================================================
    // CONFIGURACIÓN DE NODOS (BASE DEL SISTEMA AUDIO)
    // ==================================================

    setupAudioNodes() {

        // Crear AudioContext si no existe
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        // Crear analyser si no existe
        if (!this.analyser) {

            this.analyser = this.audioContext.createAnalyser();

            // Resolución de FFT (más alto = más detalle)
            this.analyser.fftSize = 2048;

            // Buffer donde se guardan los datos de frecuencia
            this.frequencyData = new Uint8Array(
                this.analyser.frequencyBinCount
            );

            console.log("Analyser configurado.");
        }

        // Crear gainNode si no existe
        if (!this.gainNode) {

            this.gainNode = this.audioContext.createGain();

            // Volumen inicial
            this.gainNode.gain.value = 1;

            console.log("GainNode configurado.");
        }

        // ==================================================
        // CONEXIÓN PRINCIPAL DEL AUDIO
        // analyser -> gain -> speakers
        // ==================================================

        if (!this.hasAnalyserConnectedToOutput) {

            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.hasAnalyserConnectedToOutput = true;
        }
    }

    // ==================================================
    // START GENERAL DEL MOTOR DE AUDIO
    // ==================================================

    async start() {

        // Evitar doble inicio
        if (this.isRunning) {
            console.log("AudioEngine ya está activo.");
            return;
        }

        // Inicializar nodos base
        this.setupAudioNodes();

        // Reanudar contexto si está suspendido (política del navegador)
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        this.isRunning = true;

        console.log("AudioEngine iniciado.");
    }

    // ==================================================
    // MICRÓFONO (INPUT EN TIEMPO REAL)
    // ==================================================

    async initializeMicrophone() {

        // Asegurar que el engine esté activo
        if (!this.isRunning) {
            await this.start();
        }

        // Evitar doble conexión del mic
        if (this.hasMicrophoneConnected) {
            console.log("Micrófono ya conectado.");
            return;
        }

        try {

            // Pedir acceso al micrófono
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // Obtener tracks del stream
            this.tracks = this.stream.getTracks();

            // Crear source desde el stream del micrófono
            this.microphoneSource =
                this.audioContext.createMediaStreamSource(this.stream);

            // Conectar micrófono al analyser
            this.microphoneSource.connect(this.analyser);

            this.hasMicrophoneConnected = true;

            console.log("Micrófono inicializado.");

        } catch (error) {

            console.error("Error al acceder al micrófono:", error);
        }
    }

    // ==================================================
    // CARGA DE ARCHIVOS DE AUDIO (<audio>)
    // ==================================================

    async loadAudioFile(audioElement) {

        // Asegurar que el engine esté activo
        if (!this.isRunning) {
            await this.start();
        }

        // Evitar doble conexión del archivo
        if (this.hasFileConnected) {
            console.log("Archivo ya conectado.");
            return;
        }

        try {

            // Crear source desde elemento HTMLAudioElement
            this.fileSource =
                this.audioContext.createMediaElementSource(audioElement);

            // Conectar archivo al analyser
            this.fileSource.connect(this.analyser);

            this.hasFileConnected = true;

            console.log("Archivo de audio conectado.");

        } catch (error) {

            console.error("Error cargando archivo:", error);
        }
    }

    // ==================================================
    // DATOS DE FRECUENCIA (FFT)
    // ==================================================

    getFrequencyData() {

        // Si no existe analyser, no hay datos
        if (!this.analyser) return null;

        // Llenar array con datos de frecuencia actuales
        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    // ==================================================
    // STOP DEL MOTOR DE AUDIO
    // ==================================================

    stop() {

        // Si no está activo, no hacer nada
        if (!this.isRunning) return;

        // Detener tracks del micrófono
        this.tracks.forEach(track => track.stop());

        // Limpiar referencias del mic
        this.stream = null;
        this.tracks = [];

        this.microphoneSource = null;
        this.fileSource = null;

        // Reset de flags
        this.hasMicrophoneConnected = false;
        this.hasFileConnected = false;

        this.isRunning = false;

        console.log("AudioEngine detenido.");
    }

    // ==================================================
    // DESTRUCCIÓN COMPLETA DEL ENGINE
    // ==================================================

    async destroy() {

        // Detener todo primero
        this.stop();

        // Cerrar AudioContext completamente
        if (this.audioContext) {
            await this.audioContext.close();
        }

        // Limpiar todo
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.frequencyData = null;

        this.hasAnalyserConnectedToOutput = false;

        console.log("AudioEngine destruido completamente.");
    }

    // ==================================================
    // GETTERS (ACCESO CONTROLADO)
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