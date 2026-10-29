/**
 * Zero-dependency Web Audio API Classroom Sound Synthesizer
 * Generates synthetic sounds directly in the browser without any external MP3/WAV files.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ptsc_quiz_sound_muted");
    if (saved !== null) return saved === "true";
  }
  return isMuted;
}

export function setSoundMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_quiz_sound_muted", String(muted));
  }
}

export function toggleSound(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

/**
 * 1. Cheerful bubble pop sound when a student joins or a Word Cloud pill appears.
 */
export function playJoinPop(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = "sine";
    // Quick pitch glide up: 320Hz -> 680Hz
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {}
}

/**
 * 2. Crisp 3-2-1-GO synthesizer tones.
 * @param step '3', '2', '1', or 'GO' / number
 */
export function playCountdownBeep(step: number | string): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isGo = String(step).toUpperCase() === "GO" || step === 0;
    const freq = isGo ? 880 : 440; // A5 for GO, A4 for 3-2-1
    const duration = isGo ? 0.35 : 0.14;

    osc.type = isGo ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(isGo ? 0.4 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}

/**
 * 3. Subtle clock tick during the final 5 seconds of a question.
 */
export function playTimerTick(urgent = false): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(urgent ? 1200 : 800, now);

    gain.gain.setValueAtTime(urgent ? 0.25 : 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {}
}

/**
 * 4. Celebratory major chord arpeggio when results are revealed!
 */
export function playRevealChord(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Major chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = now + idx * 0.06;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch {}
}

/**
 * 5. Grand Finale celebratory fanfare for Top 3 Podium!
 */
export function playPodiumFanfare(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Triumphant Fanfare Arpeggio
    const fanfareNotes = [
      { freq: 523.25, time: 0, dur: 0.12 },
      { freq: 659.25, time: 0.12, dur: 0.12 },
      { freq: 783.99, time: 0.24, dur: 0.15 },
      { freq: 1046.5, time: 0.40, dur: 0.60 },
    ];

    fanfareNotes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const start = now + time;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch {}
}

