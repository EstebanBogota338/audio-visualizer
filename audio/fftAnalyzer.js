/*
==================================================
FFT ANALYZER

Responsable de:
- configurar AnalyserNode
- obtener datos de frecuencias (FFT raw)
- convertir FFT en bandas útiles (bass / mid / treble)
- lógica matemática del espectro

Este módulo NO maneja audio directo,
solo procesa datos provenientes del AudioEngine.
==================================================
*/ 
    class FFTAnalyzer{

        constructor(){

            // ==================================================
            // CONFIGURACIÓN FFT
            // ==================================================

            // Nodo analyser (lo crea Audio engine y se pasa aquí)
            this.analyser = null;

            // Resolución del FFT (define cantidad de bins)
            this.fftSize = 256;

            // Suavizado de la señal (evita saltos bruscos)
            this.smoothingTimeConstant = 0.2;

            // Rango de captura de decibeles
            this.minDecibels = -100;
            this.maxDecibels = -20;

            // ==================================================
            // BUFFERS DE DATOS
            // ==================================================

            // Espectro de frecuencia (FFT raw)
            this.frequencyData = null;

            // Forma de onda (time domain)
            this.timeData = null;

            // ==================================================
            // BANDAS DE FRECUENCIA (simplificadas)
            // ==================================================

            this.bands = {
            bass:   { start: 1,  end: 6  },
            mid:    { start: 6,  end: 30 },
            treble: { start: 30, end: 90 },
            };
        }

        // ==================================================
        // SETUP DEL ANALYSER
        // ==================================================

        setup(analyser){

            // Recibe el analyser creado en AudioEngine
            this.analyser = analyser;

            // Aplica configuración FFT
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
            this.analyser.minDecibels = this.minDecibels;
            this.analyser.maxDecibels = this.maxDecibels;

            // Buffer de frecuencias (FFT real)
            this.frequencyData = new Uint8Array(
                this.analyser.frequencyBinCount
            );

            // Buffer de forma de onda (debe usar fftSize completo)
            this.timeData = new Uint8Array(
                this.analyser.fftSize
            );
             console.log("FFTAnalyzer configurado.");
        }

        // ==================================================
        // FFT RAW DATA
        // ==================================================

        getFrequencyData() {

        if (!this.analyser) return null;

        // Llena el buffer con el espectro actual
        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
        }

        // ==================================================
        // TIME DOMAIN DATA (waveform)
        // ==================================================

        getTimeData() {

        if (!this.analyser) return null;

        this.analyser.getByteTimeDomainData(this.timeData);

        return this.timeData;
        }

        // ==================================================
        // BANDAS DE FRECUENCIA 
        // ==================================================

        getBands() {

        const data = this.getFrequencyData();

        if (!data) return null;

        return {
            bass:   this._bandAverage(data, this.bands.bass),
            mid:    this._bandAverage(data, this.bands.mid),
            treble: this._bandAverage(data, this.bands.treble),
        };
        }

        // ==================================================
        // PROMEDIO DE UNA BANDA
        // Convierte bins FFT → valor normalizado 0 a 1
        // ==================================================

        _bandAverage(data, band) {

        let sum = 0;
        const count = band.end - band.start;

        // Suma todos los bins de la banda
        for (let i = band.start; i < band.end; i++) {
            sum += data[i] ?? 0;
        }

        // Promedio y normalización
        return (sum / count) / 255;
        }

        // ==================================================
        // UTILIDADES
        // ==================================================

        getBinCount() {
            return this.analyser ? this.analyser.frequencyBinCount : 0;
        }

         // Convierte un bin FFT a frecuencia real en Hz
        binToFrequency(binIndex) {

            const sampleRate = this.analyser?.context?.sampleRate;

            if (!sampleRate) return null;

            return binIndex * (sampleRate / this.fftSize);
        }

        // Retorna el analyser (solo lectura)
        getNode() {
            return this.analyser;
        }

        
        // ==================================================
        // LIMPIEZA
        // ==================================================

        destroy() {

            this.analyser = null;
            this.frequencyData = null;
            this.timeData = null;

            console.log("FFTAnalyzer destruido.");
        }
    }

    export default FFTAnalyzer;
