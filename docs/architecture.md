# 🎵 Audio Visualizer — Architecture

## 📌 Project Goal

Build a real-time audio visualizer using modern web technologies and a modular architecture.

Main features:

- Real-time microphone input
- FFT frequency analysis
- Audio waveform rendering
- Interactive UI controls
- Scalable visual system
- Modern dark UI with glow effects

---

# 🧠 General Flow

```text
Microphone / Audio Source
          ↓
    audioEngine.js
          ↓
    fftAnalyzer.js
          ↓
    fftRenderer.js
          ↓
      HTML Canvas