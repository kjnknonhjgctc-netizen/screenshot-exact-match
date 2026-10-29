import { useEffect, useRef, type MouseEvent } from "react";

// A single context is created on a user gesture, never during SSR or page load.
export function useButtonSound(enabled: boolean) {
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) void audio.close().catch(() => {});
  }, []);

  return (event: MouseEvent<HTMLElement>) => {
    if (!enabled || !(event.target instanceof Element)) return;
    const button = event.target.closest('button, [role="button"]');
    if (!button || button.closest('[disabled], [aria-disabled="true"], [inert], [data-sound="off"]')) return;

    try {
      const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume().catch(() => {});
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const now = audio.currentTime;
      tone.type = "sine";
      tone.frequency.setValueAtTime(720, now);
      tone.frequency.exponentialRampToValueAtTime(460, now + 0.045);
      volume.gain.setValueAtTime(0, now);
      volume.gain.linearRampToValueAtTime(0.045, now + 0.004);
      volume.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      tone.connect(volume);
      volume.connect(audio.destination);
      tone.onended = () => { tone.disconnect(); volume.disconnect(); };
      tone.start(now);
      tone.stop(now + 0.06);
    } catch {
      // Unsupported or blocked audio must never interrupt the button's action.
    }
  };
}