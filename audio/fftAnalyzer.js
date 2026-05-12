/*
==================================================
FFT ANALYZER (CLEAN)

Responsabilidad:
- Obtener datos crudos del WebAudio API
- Proveer FFT + waveform
- Calcular bandas básicas (opcional, sin estética)

NO debe contener:
- smoothing visual
- gain visual
- escalado perceptual
==================================================
*/

class FFTAnalyzer {

    constructor() {

        this.analyser = null;

        this.fftSize = 256;

        this.smoothingTimeConstant = 0.2;
        this.minDecibels = -90;
        this.maxDecibels = -10;

        this.frequencyData = null;
        this.timeData = null;

        // bandas en bins (NO visuales, solo lectura)
        this.bands = {
            bass:   { start: 1,  end: 8 },
            mid:    { start: 8,  end: 32 },
            treble: { start: 32, end: 64 }
        };
    }

    setup(analyser) {

        this.analyser = analyser;

        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
        this.analyser.minDecibels = this.minDecibels;
        this.analyser.maxDecibels = this.maxDecibels;

        this.frequencyData =
            new Uint8Array(this.analyser.frequencyBinCount);

        this.timeData =
            new Uint8Array(this.analyser.fftSize);
    }

    // =========================
    // RAW FFT
    // =========================

    getFrequencyData() {

        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    getTimeData() {

        if (!this.analyser) return null;

        this.analyser.getByteTimeDomainData(this.timeData);

        return this.timeData;
    }

    // =========================
    // BANDS (solo promedio crudo)
    // =========================

    _bandAverage(data, band) {

        let sum = 0;
        const count = band.end - band.start;

        for (let i = band.start; i < band.end; i++) {
            sum += data[i] || 0;
        }

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