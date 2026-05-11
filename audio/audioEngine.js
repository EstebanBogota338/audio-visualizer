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

        // Contexto principal de Web Audio API (motor de audio del navegador)
        this.audioContext = null;

        // Stream del micrófono (entrada en tiempo real)
        this.stream = null;

        // Tracks activos del micrófono (para poder detenerlos)
        this.tracks = [];

        // Source del micrófono (nodo de entrada Web Audio)
        this.microphoneSource = null;

        // Source de archivo de audio (<audio> element)
        this.fileSource = null;

        // Nodo analyser (FFT -> análisis de frecuencia en tiempo real)
        this.analyser = null;

        // Nodo de ganancia (control de volumen global del sistema de audio)
        this.gainNode = null;

        // Array donde se almacenan los datos de frecuencia (FFT)
        this.frequencyData = null;

        // Estado general del engine (activo o no)
        this.isRunning = false;

        // ==================================================
        // FLAGS DE CONTROL (evitan duplicaciones del grafo de audio)
        // ==================================================

        // Evita conectar el micrófono más de una vez
        this.hasMicrophoneConnected = false;

        // Evita conectar archivo de audio más de una vez
        this.hasFileConnected = false;

        // Evita reconectar el analyser a la salida múltiples veces
        this.hasAnalyserConnectedToOutput = false;
    }

    // ==================================================
    // CONFIGURACIÓN DE NODOS (SETUP DEL GRAFO DE AUDIO)
    // ==================================================

    setupAudioNodes() {

        // Crear AudioContext si aún no existe
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        // Crear analyser si aún no existe
        if (!this.analyser) {

            this.analyser = this.audioContext.createAnalyser();

            // ==================================================
            // CONFIGURACIÓN FFT (SENSIBILIDAD DEL ANÁLISIS)
            // ==================================================

            // Tamaño de FFT (más bajo = más sensible en micrófono)
            this.analyser.fftSize = 256;

            // Suavizado de la señal (evita saltos bruscos)
            this.analyser.smoothingTimeConstant = 0.2;

            // Rango de decibeles para capturar señal útil
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -20;

            // Buffer donde se guardan los valores de frecuencia
            this.frequencyData = new Uint8Array(
                this.analyser.frequencyBinCount
            );

            console.log("Analyser configurado.");
        }

        // Crear gain node si no existe
        if (!this.gainNode) {

            this.gainNode = this.audioContext.createGain();

            // Volumen inicial del sistema
            this.gainNode.gain.value = 1;

            console.log("GainNode configurado.");
        }

        // ==================================================
        // CADENA PRINCIPAL DE AUDIO
        // analyser -> gain -> output (speakers)
        // ==================================================

        if (!this.hasAnalyserConnectedToOutput) {

            this.analyser.connect(this.gainNode);

            // NOTA:
            // conectar esto al output solo si quieres escuchar audio directo
            // útil para debugging, no necesario para visualizador
            // this.gainNode.connect(this.audioContext.destination);

            this.hasAnalyserConnectedToOutput = true;
        }
    }

    // ==================================================
    // START DEL ENGINE
    // ==================================================

    async start() {

        // Evita reinicio innecesario del engine
        if (this.isRunning) return;

        // Inicializa nodos base del audio graph
        this.setupAudioNodes();

        // Reanuda contexto si el navegador lo pausó
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        this.isRunning = true;

        console.log("AudioEngine iniciado:", this.audioContext.state);
    }

    // ==================================================
    // MICRÓFONO (INPUT EN TIEMPO REAL)
    // ==================================================

    async initializeMicrophone() {

        // Asegura que el engine esté activo antes de usar audio
        if (!this.isRunning) {
            await this.start();
        }

        // Evita múltiples conexiones del mismo micrófono
        if (this.hasMicrophoneConnected) {
            console.log("Micrófono ya conectado.");
            return;
        }

        try {

            // Solicita acceso al micrófono del sistema
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Guarda tracks activos para poder detenerlos luego
            this.tracks = this.stream.getTracks();

            // Convierte stream en nodo de audio Web Audio API
            this.microphoneSource =
                this.audioContext.createMediaStreamSource(this.stream);

            // Conecta micrófono al analyser (entrada del FFT)
            this.microphoneSource.connect(this.analyser);

            this.hasMicrophoneConnected = true;

            console.log("Micrófono inicializado.");

        } catch (error) {

            console.error("Error al acceder al micrófono:", error);
        }
    }

    // ==================================================
    // CARGA DE ARCHIVOS DE AUDIO
    // ==================================================

    async loadAudioFile(audioElement) {

        if (!this.isRunning) {
            await this.start();
        }

        if (this.hasFileConnected) return;

        try {

            // Convierte <audio> HTML en source de Web Audio API
            this.fileSource =
                this.audioContext.createMediaElementSource(audioElement);

            // Conecta archivo al analyser para análisis FFT
            this.fileSource.connect(this.analyser);

            this.hasFileConnected = true;

            console.log("Archivo de audio conectado.");

        } catch (error) {

            console.error("Error cargando archivo:", error);
        }
    }

    // ==================================================
    // OBTENER DATOS FFT (FRECUENCIAS EN TIEMPO REAL)
    // ==================================================

    getFrequencyData() {

        if (!this.analyser) return null;

        // Llena el buffer con datos de frecuencia actual
        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    // ==================================================
    // STOP DEL ENGINE
    // ==================================================

    stop() {

        // Si ya está detenido, no hacer nada
        if (!this.isRunning) return;

        // Detiene tracks del micrófono
        this.tracks.forEach(track => track.stop());

        // Limpia referencias del stream
        this.stream = null;
        this.tracks = [];

        this.microphoneSource = null;
        this.fileSource = null;

        // Reset de flags de conexión
        this.hasMicrophoneConnected = false;
        this.hasFileConnected = false;

        this.isRunning = false;

        console.log("AudioEngine detenido.");
    }

    // ==================================================
    // DESTRUCCIÓN COMPLETA DEL ENGINE
    // ==================================================

    async destroy() {

        // Detiene todo antes de destruir
        this.stop();

        // Cierra contexto de audio completamente
        if (this.audioContext) {
            await this.audioContext.close();
        }

        // Limpieza total de memoria
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