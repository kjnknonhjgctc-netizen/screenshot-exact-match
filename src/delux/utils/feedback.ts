// Lightweight DELUX feedback. Audio is unlocked on the first user gesture.
let audioContext: AudioContext | null = null;

export function unlockDeluxAudio() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioContext ||= new Ctx();
    if (audioContext.state === "suspended") void audioContext.resume();
  } catch { /* Audio is optional on unsupported browsers. */ }
}

export function playDeluxSound(kind: "tap" | "success" | "schedule" = "tap") {
  if (typeof window === "undefined") return;
  try {
    unlockDeluxAudio();
    if (!audioContext || audioContext.state !== "running") return;
    const ctx = audioContext;
    const now = ctx.currentTime;
    const notes = kind === "success" ? [659, 880, 1047] : kind === "schedule" ? [523, 659] : [440];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.09;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.06 : 0.075, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === "tap" ? 0.09 : 0.2));
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    });
  } catch { /* Sound must never block an app action. */ }
}

export function vibrateDelux(kind: "tap" | "success" = "tap") {
  if (typeof navigator === "undefined") return;
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(kind === "success" ? [35, 35, 55] : 18);
  } catch { /* Haptics are optional. */ }
}

export function feedbackDelux(kind: "tap" | "success" | "schedule" = "tap", soundEnabled = true) {
  vibrateDelux(kind === "success" ? "success" : "tap");
  if (soundEnabled) playDeluxSound(kind);
}
