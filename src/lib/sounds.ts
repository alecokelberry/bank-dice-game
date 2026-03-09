// Web Audio API sound effects — no external files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  ramp = true
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playNoise(duration: number, volume = 0.08) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Audio not available
  }
}

export function playRollSound() {
  // Rapid tapping noise to simulate dice clatter
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      playNoise(0.04, 0.06);
      playTone(200 + Math.random() * 400, 0.03, "square", 0.03);
    }, i * 60);
  }
}

export function playBankSound() {
  // Ascending "ka-ching" — two bright tones
  playTone(880, 0.15, "sine", 0.12);
  setTimeout(() => playTone(1320, 0.2, "sine", 0.12), 80);
  setTimeout(() => playTone(1760, 0.3, "sine", 0.08), 160);
}

export function playBustSound() {
  // Descending crash
  playTone(400, 0.3, "sawtooth", 0.15);
  setTimeout(() => playTone(200, 0.3, "sawtooth", 0.12), 100);
  setTimeout(() => playTone(100, 0.5, "sawtooth", 0.1), 200);
  playNoise(0.4, 0.12);
}

export function playDoubleSound() {
  // Exciting ascending triple
  playTone(660, 0.12, "sine", 0.1);
  setTimeout(() => playTone(880, 0.12, "sine", 0.1), 100);
  setTimeout(() => playTone(1100, 0.12, "sine", 0.1), 200);
  setTimeout(() => playTone(1320, 0.2, "sine", 0.12), 300);
}

export function playLucky7Sound() {
  // Slot machine win
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(800 + i * 200, 0.1, "sine", 0.08), i * 80);
  }
}

export function playWinSound() {
  // Fanfare
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.1), i * 150);
  });
}

export function playClickSound() {
  playTone(600, 0.05, "sine", 0.06);
}

export function triggerHaptic(pattern: "light" | "medium" | "heavy" = "light") {
  try {
    if (navigator.vibrate) {
      const patterns = { light: [10], medium: [30], heavy: [50, 30, 50] };
      navigator.vibrate(patterns[pattern]);
    }
  } catch {
    // Vibration not available
  }
}
