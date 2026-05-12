/*
==================================================
HELPERS / UTILIDADES

Funciones reutilizables para:
- matemáticas simples
- validaciones
- formatos
- helpers generales

Mantener funciones pequeñas y reutilizables.
==================================================
*/

// ===== FUNCIONES MATEMÁTICAS =====

/**
 * Restringe un valor dentro de un rango [min, max].
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Interpolación lineal entre dos valores.
 * t=0 → a | t=1 → b
 */
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Mapea un valor de un rango a otro.
 * @example mapRange(0.5, 0, 1, 0, 100) → 50
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Normaliza un valor del rango [min, max] a [0, 1].
 */
export function normalize(value, min, max) {
    return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Redondea a N decimales.
 */
export function roundTo(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

// ===== HELPERS VISUALES =====

/**
 * Convierte un color hex a objeto { r, g, b }.
 * Usada internamente por shiftHue e interpolateColor.
 * @param {string} hex — ej: "#ff00ff"
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return { r: 255, g: 0, b: 255 };
    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
    };
}

/**
 * Convierte { r, g, b } a string hex.
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(c => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Rota el matiz (hue) de un color hex en N grados.
 * app.js la usa para derivar los colores de bass/mid/treble
 * a partir del color elegido en el color picker.
 * @param {string} hex
 * @param {number} degrees — positivo o negativo
 * @returns {string}
 */
export function shiftHue(hex, degrees) {

    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;

    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l   = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        if (max === gn) h = ((bn - rn) / d + 2) / 6;
        if (max === bn) h = ((rn - gn) / d + 4) / 6;
    }

    h = ((h * 360 + degrees) % 360 + 360) % 360 / 360;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q  = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p  = 2 * l - q;
    const nr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const ng = Math.round(hue2rgb(p, q, h) * 255);
    const nb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

    return rgbToHex(nr, ng, nb);
}

/**
 * Interpola entre dos colores hex.
 * @param {string} hexA
 * @param {string} hexB
 * @param {number} t — 0=hexA, 1=hexB
 * @returns {string}
 */
export function interpolateColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(
        lerp(a.r, b.r, t),
        lerp(a.g, b.g, t),
        lerp(a.b, b.b, t),
    );
}

// ===== VALIDACIONES =====

/**
 * Verifica que un File sea de audio válido.
 * app.js la usa al recibir un archivo del input de upload.
 * @param {File} file
 * @returns {boolean}
 */
export function isValidAudioFile(file) {
    if (!file) return false;
    const valid = [
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'audio/flac', 'audio/aac', 'audio/mp4',
        'audio/x-wav', 'audio/webm',
    ];
    return valid.includes(file.type);
}

/**
 * Verifica que un valor sea número finito y no NaN.
 * @param {*} value
 * @returns {boolean}
 */
export function isNumber(value) {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * Verifica que un valor esté dentro de un rango [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
    return isNumber(value) && value >= min && value <= max;
}

// ===== UTILIDADES GENERALES =====

/**
 * Formatea Hz para el display en pantalla.
 * @example formatHz(1500) → "1.5 kHz" | formatHz(440) → "440.0 Hz"
 * @param {number} hz
 * @returns {string}
 */
export function formatHz(hz) {
    if (!isNumber(hz) || hz < 0) return '-- Hz';
    if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
    return `${hz.toFixed(1)} Hz`;
}

/**
 * Convierte dB a amplitud lineal.
 */
export function dbToLinear(db) {
    return Math.pow(10, db / 20);
}

/**
 * Convierte amplitud lineal a dB.
 */
export function linearToDb(linear) {
    return 20 * Math.log10(Math.max(linear, 0.00001));
}

/**
 * Retrasa la ejecución de una función hasta que se deje
 * de llamar por N ms. Útil para eventos de resize o inputs.
 * @param {Function} fn
 * @param {number} delay — ms
 * @returns {Function}
 */
export function debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
