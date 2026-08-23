# Task 03: Synthesized Web Audio API Engine

## 🎯 Task Objective
Create a zero-dependency procedural sound effects generator using HTML5 Web Audio API oscillators, eliminating the need for external MP3/WAV audio assets and ensuring zero network lag.

---

## 💻 Implemented Code Snippet

```javascript
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, type = "square", duration = 0.08, vol = 0.15, delay = 0) {
  if (!audioCtx) return;
  const t   = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain= audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

const SFX = {
  jump()   { playTone(300, "square", 0.1, 0.18); playTone(420, "square", 0.07, 0.1, 0.04); },
  land()   { playTone(120, "sawtooth", 0.06, 0.12); },
  die()    { for (let i=0; i<5; i++) playTone(400 - i*60, "sawtooth", 0.12, 0.18, i*0.07); },
  win()    { [523, 659, 784, 1047].forEach((f, i) => playTone(f, "square", 0.15, 0.2, i*0.1)); },
  trap()   { playTone(200, "sawtooth", 0.15, 0.2); playTone(150, "sawtooth", 0.1, 0.15, 0.08); },
  portal() { for (let i=0; i<6; i++) playTone(300 + i*80, "sine", 0.08, 0.15, i*0.05); },
  collect(){ playTone(880, "square", 0.06, 0.14); playTone(1100, "square", 0.05, 0.12, 0.06); },
};
```

---

## ⚙️ Process & Architecture Breakdown
1. **Dynamic Tone Synthesis:** Uses `square`, `sawtooth`, and `sine` waveforms.
2. **Gain Exponential Envelope:** Prevents audio clicks/pops with smooth decay.
3. **No External Asset Dependency:** Loads instantly, offline-ready, 0 KB file size.
