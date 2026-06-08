// Sound effects for chess moves
// Using Web Audio API to generate sounds without external files

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch { /* ignore audio errors */ }
}

export function playMoveSound() {
  playTone(600, 0.08, 'square', 0.12);
  setTimeout(() => playTone(800, 0.06, 'square', 0.08), 30);
}

export function playCaptureSound() {
  playTone(300, 0.1, 'sawtooth', 0.15);
  setTimeout(() => playTone(500, 0.08, 'square', 0.1), 40);
}

export function playCheckSound() {
  playTone(1000, 0.15, 'square', 0.2);
  setTimeout(() => playTone(1200, 0.1, 'square', 0.15), 80);
}

export function playCastlingSound() {
  playTone(400, 0.06, 'sine', 0.1);
  setTimeout(() => playTone(500, 0.06, 'sine', 0.1), 60);
  setTimeout(() => playTone(600, 0.08, 'sine', 0.1), 120);
}

export function playIllegalSound() {
  playTone(200, 0.15, 'sawtooth', 0.1);
}

export function playGameEndSound() {
  playTone(523, 0.15, 'sine', 0.15);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 150);
  setTimeout(() => playTone(784, 0.25, 'sine', 0.15), 300);
}

export function playPromotionSound() {
  playTone(600, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(800, 0.08, 'sine', 0.1), 80);
  setTimeout(() => playTone(1000, 0.12, 'sine', 0.12), 160);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 260);
}

export function playTickSound() {
  playTone(1200, 0.02, 'square', 0.05);
}
