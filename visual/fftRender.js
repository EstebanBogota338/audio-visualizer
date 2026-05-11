/*
==================================================
FFT RENDERER

Responsable de:
- dibujar en Canvas
- renderizar barras FFT (~60 FPS)
- animación con requestAnimationFrame
- consumir datos del FFTAnalyzer

Este módulo NO procesa audio ni FFT.
Este módulo NO maneja AudioContext ni nodos.
==================================================
*/

class FFTRenderer {

    constructor(canvas) {

        // ==================================================
        // CANVAS
        // ==================================================

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        // ==================================================
        // ESTADO DEL RENDER
        // ==================================================

        this.isRunning = false;
        this.animationId = null;

        // Referencia al analyzer (se inyecta desde afuera)
        this.analyzer = null;

        // ==================================================
        // CONFIG VISUAL
        // ==================================================

        this.config = {

            // cantidad de barras en pantalla
            barCount: 64,

            // separación entre barras
            barGap: 2,

            // borde redondeado
            barRadius: 3,

            // suavizado visual (0 = nada, 1 = congelado)
            smoothing: 0.75,

            // colores por zonas del espectro
            colors: {
                bass: "#ff2d55",
                mid: "#00f5ff",
                treble: "#b8ff3c",
            },

            // glow visual
            glowBlur: 18,

            // fondo del canvas
            background: "#0a0a0f",
        };

        // ==================================================
        // BUFFER DE SMOOTHING
        // ==================================================

        // guarda valores del frame anterior para suavizar movimiento
        this.smoothedBars = new Float32Array(this.config.barCount);
    }

    // ==================================================
    // START RENDER
    // ==================================================

    start(analyzer) {

        if (this.isRunning) return;

        // inyectamos el analyzer desde afuera (AudioEngine/App)
        this.analyzer = analyzer;

        this.isRunning = true;

        this._loop();

        console.log("FFTRenderer iniciado.");
    }

    // ==================================================
    // STOP RENDER
    // ==================================================

    stop() {

        if (!this.isRunning) return;

        this.isRunning = false;

        cancelAnimationFrame(this.animationId);

        this.animationId = null;

        console.log("FFTRenderer detenido.");
    }

    // ==================================================
    // LOOP PRINCIPAL (~60 FPS)
    // ==================================================

    _loop() {

        if (!this.isRunning) return;

        this._draw();

        this.animationId = requestAnimationFrame(() => this._loop());
    }

    // ==================================================
    // DRAW FRAME
    // ==================================================

    _draw() {

        const { canvas, ctx, config, smoothedBars } = this;

        // ajusta tamaño del canvas al contenedor
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const W = canvas.width;
        const H = canvas.height;

        // ==================================================
        // BACKGROUND
        // ==================================================

        ctx.fillStyle = config.background;
        ctx.fillRect(0, 0, W, H);

        // ==================================================
        // OBTENER FFT
        // ==================================================

        const rawData = this.analyzer?.getFrequencyData();

        if (!rawData) return;

        // ==================================================
        // CALCULO DE BARRAS
        // ==================================================

        const barCount = config.barCount;
        const totalGap = config.barGap * (barCount - 1);
        const barWidth = (W - totalGap) / barCount;
        const binStep = Math.floor(rawData.length / barCount);

        for (let i = 0; i < barCount; i++) {

            // valor del bin (normalizado 0-1)
            const raw = (rawData[i * binStep] ?? 0) / 255;

            // suavizado frame a frame
            smoothedBars[i] =
                smoothedBars[i] * config.smoothing +
                raw * (1 - config.smoothing);

            const barHeight = smoothedBars[i] * H;

            const x = i * (barWidth + config.barGap);
            const y = H - barHeight;

            // color por zona del espectro
            const color = this._barColor(i, barCount);

            // glow
            ctx.shadowBlur = config.glowBlur;
            ctx.shadowColor = color;

            ctx.fillStyle = color;

            this._roundRect(ctx, x, y, barWidth, barHeight, config.barRadius);
        }

        // reset glow (importante para no contaminar otros dibujos)
        ctx.shadowBlur = 0;
    }

    // ==================================================
    // COLOR POR BANDA (visual, no físico)
    // ==================================================

    _barColor(i, total) {

        const pos = i / total;

        if (pos < 0.33) return this.config.colors.bass;
        if (pos < 0.66) return this.config.colors.mid;
        return this.config.colors.treble;
    }

    // ==================================================
    // RECT REDONDEADO
    // ==================================================

    _roundRect(ctx, x, y, w, h, r) {

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

    // ==================================================
    // CONFIG DINÁMICA
    // ==================================================

    setSmoothing(value) {
        this.config.smoothing = Math.min(0.99, Math.max(0, value));
    }

    setBarCount(count) {

        this.config.barCount = count;

        this.smoothedBars = new Float32Array(count);
    }

    // ==================================================
    // DESTROY
    // ==================================================

    destroy() {

        this.stop();

        this.canvas = null;
        this.ctx = null;
        this.analyzer = null;

        console.log("FFTRenderer destruido.");
    }
}

export default FFTRenderer;