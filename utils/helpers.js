/*
==================================================
HELPERS / UTILIDADES

Responsabilidad:
- Funciones reutilizables
- Matemáticas simples
- Validaciones
- Formatos de UI
- Conversión básica de color

NO debe contener:
- lógica FFT
- render
- acceso directo al DOM
==================================================
*/

// =========================
// MATEMÁTICAS
// =========================

/*
    Restringe un valor dentro de un rango.
*/
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/*
    Interpolación lineal.

    t = 0  -> devuelve a
    t = 1  -> devuelve b
*/
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/*
    Convierte un valor de un rango a otro.

    Ejemplo:
    mapRange(0.5, 0, 1, 0, 100) -> 50
*/
export function mapRange(value, inMin, inMax, outMin, outMax) {

    return outMin +
        ((value - inMin) / (inMax - inMin)) *
        (outMax - outMin);
}

/*
    Normaliza un valor al rango 0 -> 1.
*/
export function normalize(value, min, max) {
    return clamp((value - min) / (max - min), 0, 1);
}

// =========================
// VALIDACIÓN AUDIO
// =========================

/*
    Verifica si un archivo es un formato de audio válido.
*/
export function isValidAudioFile(file) {

    if (!file) return false;

    const valid = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
        "audio/webm",
        "audio/x-wav"
    ];

    return valid.includes(file.type);
}

/*
    Verifica que un valor sea un número válido.
*/
export function isNumber(value) {
    return typeof value === "number" &&
        Number.isFinite(value);
}

// =========================
// FORMATO UI
// =========================

/*
    Formatea frecuencias para el display.

    Ejemplos:
    440     -> 440.0 Hz
    1500    -> 1.5 kHz
*/
export function formatHz(hz) {

    if (!isNumber(hz)) {
        return "-- Hz";
    }

    if (hz >= 1000) {
        return `${(hz / 1000).toFixed(1)} kHz`;
    }

    return `${hz.toFixed(1)} Hz`;
}

// =========================
// COLOR
// =========================

/*
    Convierte un color HEX a RGB.

    Ejemplo:
    "#ff00ff" ->
    { r:255, g:0, b:255 }
*/
export function hexToRgb(hex) {

    const match =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    // fallback si el color es inválido
    if (!match) {
        return {
            r: 255,
            g: 0,
            b: 255
        };
    }

    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16)
    };
}