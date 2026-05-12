/*
==================================================
FFT RENDERER (PERCEPTUAL FIXED)

Responsabilidad:
- visualización
- smoothing visual
- escalado perceptual
- balance de energía

NO debe:
- tocar WebAudio API
- calcular FFT
==================================================
*/

class FFTRenderer {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.analyzer = null;

        this.isRunning = false;
        this.id = null;

        this.config = {

            width: 800,
            height: 300,

            barCount: 64,
            barGap: 2,
            barRadius: 3,

            smoothing: 0.55,

            colors: {
                bass: "#ff2d55",
                mid: "#00f5ff",
                treble: "#b8ff3c"
            },

            background: "#0a0a0f",
            glow: 14
        };

        this.smoothed = new Float32Array(this.config.barCount);

        this.energyHistory = [];
        this.isMic = false;

        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
    }

    start(analyzer) {

        this.analyzer = analyzer;
        this.isRunning = true;

        this.loop();
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.id);
    }

    loop() {

        if (!this.isRunning) return;

        this.draw();

        this.id = requestAnimationFrame(() => this.loop());
    }

    // =========================
    // MIC DETECTION SIMPLE
    // =========================

    detectSource(avgEnergy) {

        this.energyHistory.push(avgEnergy);

        if (this.energyHistory.length > 30) {
            this.energyHistory.shift();
        }

        const mean =
            this.energyHistory.reduce((a, b) => a + b, 0) /
            this.energyHistory.length;

        this.isMic = mean < 0.15;
    }

    // =========================
    // DRAW
    // =========================

    draw() {

        const ctx = this.ctx;
        const W = this.config.width;
        const H = this.config.height;

        ctx.fillStyle = this.config.background;
        ctx.fillRect(0, 0, W, H);

        const data = this.analyzer?.getFrequencyData();
        if (!data) return;

        const count = this.config.barCount;

        const barW =
            (W - this.config.barGap * (count - 1)) / count;

        let energySum = 0;

        for (let i = 0; i < count; i++) {

            const t = i / count;

            const index = Math.floor(
                Math.pow(t, 1.6) * (data.length - 1)
            );

            // =========================
            // RAW → perceptual shaping
            // =========================

            let value = (data[index] ?? 0) / 255;

            // 🔥 compresión log perceptual (CLAVE)
            value = Math.log10(1 + value * 9) / Math.log10(10);

            energySum += value;

            // smoothing
            this.smoothed[i] =
                this.smoothed[i] * this.config.smoothing +
                value * (1 - this.config.smoothing);

            let v = this.smoothed[i];

            // 🔥 ajuste mic
            if (this.isMic) {
                v = Math.pow(v, 0.6) * 2.2;
            }

            // 🔥 shaping final visual (importante)
            v = Math.pow(v, 1.25);

            v = Math.min(1, Math.max(0, v));

            const h = v * H * 0.45;

            const x = i * (barW + this.config.barGap);
            const y = H - h;

            const color = this.color(i, count);

            ctx.shadowBlur = this.config.glow;
            ctx.shadowColor = color;

            ctx.fillStyle = color;

            this.round(ctx, x, y, barW, h, this.config.barRadius);
        }

        ctx.shadowBlur = 0;

        this.detectSource(energySum / count);
    }

    color(i, total) {

        const p = i / total;

        if (p < 0.33) return this.config.colors.bass;
        if (p < 0.66) return this.config.colors.mid;
        return this.config.colors.treble;
    }

    round(ctx, x, y, w, h, r) {

        if (h <= 0) return;

        const radius = Math.min(r, w / 2, h / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
}

export default FFTRenderer;