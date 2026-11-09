// Discreet, original interface feedback. Audio is synthesized locally; no files or network required.
let audioContext: AudioContext | null = null;

export function playDeluxSound(kind: "tap" | "success" | "schedule" = "tap") {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    audioContext ||= new AudioContextCtor();
    if (audioContext.state === "suspended") void audioContext.resume();
    const now = audioContext.currentTime;
    const notes = kind === "success" ? [660, 880] : kind === "schedule" ? [520, 660] : [440];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.075);
      gain.gain.setValueAtTime(0.0001, now + index * 0.075);
      gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.018 : 0.028, now + index * 0.075 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.075 + 0.13);
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);
      oscillator.start(now + index * 0.075);
      oscillator.stop(now + index * 0.075 + 0.14);
    });
  } catch {
    // Audio is optional; never interrupt an app action.
  }
}

export function vibrateDelux(kind: "tap" | "success" = "tap") {
  try {
    if ("vibrate" in navigator) navigator.vibrate(kind === "success" ? [18, 28, 24] : 9);
  } catch {
    // Haptics are unavailable in some browsers and devices.
  }
}

export function feedbackDelux(kind: "tap" | "success" | "schedule" = "tap", soundEnabled = true) {
  vibrateDelux(kind === "success" ? "success" : "tap");
  if (soundEnabled) playDeluxSound(kind);
}
