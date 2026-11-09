let audioContext: AudioContext | null = null;

export function playDeluxSound(kind: "tap" | "complete" | "schedule" | "success" = "tap") {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    const ctx = audioContext;
    const now = ctx.currentTime;
    const notes = kind === "complete" ? [660, 880] : kind === "schedule" ? [523, 659] : kind === "success" ? [587, 740, 880] : [420];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * 0.075;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.012 : 0.025, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === "tap" ? 0.045 : 0.13));
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });
  } catch { /* sound must never block app actions */ }
}
