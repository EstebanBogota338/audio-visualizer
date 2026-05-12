/*
==================================================
FFT ANALYZER (CLEAN)
==================================================
Encargado de extraer datos crudos del WebAudio API.

Responsabilidad real:
- leer FFT (frecuencia)
- leer waveform (time domain)
- exponer datos sin procesamiento visual

NO hace:
- smoothing visual
- escalado estético
- colores
- lógica de render
==================================================
*/

class FFTAnalyzer {

    constructor() {

        // =========================
        // ANALYSER NODE (WEB AUDIO)
        // =========================
        this.analyser = null;

        // =========================
        // CONFIG FFT
        // =========================
        this.fftSize = 256;

        // control interno del analyser (no visual)
        this.smoothingTimeConstant = 0.2;
        this.minDecibels = -90;
        this.maxDecibels = -10;

        // =========================
        // BUFFERS DE DATOS
        // =========================
        this.frequencyData = null;
        this.timeData = null;

        // =========================
        // BANDAS (solo lectura de rango)
        // NO representan UI ni color, solo bins
        // =========================
        this.bands = {
            bass:   { start: 1,  end: 8 },
            mid:    { start: 8,  end: 32 },
            treble: { start: 32, end: 64 }
        };
    }

    // ==================================================
    // SETUP DEL ANALYSER
    // ==================================================

    setup(analyser) {

        this.analyser = analyser;

        // configuración base del FFT
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
        this.analyser.minDecibels = this.minDecibels;
        this.analyser.maxDecibels = this.maxDecibels;

        // buffers según configuración real del analyser
        this.frequencyData =
            new Uint8Array(this.analyser.frequencyBinCount);

        this.timeData =
            new Uint8Array(this.analyser.fftSize);
    }

    // ==================================================
    // DATOS CRUDOS FFT (FRECUENCIA)
    // ==================================================

    getFrequencyData() {

        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    // ==================================================
    // DATOS CRUDOS WAVEFORM (DOMINIO TIEMPO)
    // ==================================================

    getTimeData() {

        if (!this.analyser) return null;

        this.analyser.getByteTimeDomainData(this.timeData);

        return this.timeData;
    }

    // ==================================================
    // BANDAS (PROMEDIO SIMPLE, SIN ESTÉTICA)
    // ==================================================

    _bandAverage(data, band) {

        let sum = 0;
        const count = band.end - band.start;

        for (let i = band.start; i < band.end; i++) {
            sum += data[i] || 0;
        }

        // normaliza a rango 0-1
        return (sum / count) / 255;
    }

    getBands() {

        const data = this.getFrequencyData();
        if (!data) return null;

        return {
            bass: this._bandAverage(data, this.bands.bass),
            mid: this._bandAverage(data, this.bands.mid),
            treble: this._bandAverage(data, this.bands.treble),
        };
    }
}

export default FFTAnalyzer;