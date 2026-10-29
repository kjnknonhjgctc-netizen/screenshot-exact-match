import { useEffect, useRef, type MouseEvent } from "react";

type SoundableButton = Element & { getAttribute(name: string): string | null };

// Audio is created lazily on a real user gesture; no audio plays on page load.
export function useButtonSound(enabled: boolean) {
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) void audio.close().catch(() => {});
  }, []);

  return (event: MouseEvent<HTMLElement>) => {
    if (!enabled || !(event.target instanceof Element)) return;
    const button = event.target.closest('button, [role="button"]') as SoundableButton | null;
    if (!button || button.closest('[disabled], [aria-disabled="true"], [inert], [data-sound="off"]')) return;

    try {
      const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume().catch(() => {});

      const now = audio.currentTime;
      const playTone = (frequency: number, startAt: number, duration: number, peak: number) => {
        const tone = audio.createOscillator();
        const volume = audio.createGain();
        tone.type = "sine";
        tone.frequency.setValueAtTime(frequency, startAt);
        volume.gain.setValueAtTime(0.0001, startAt);
        volume.gain.exponentialRampToValueAtTime(peak, startAt + 0.008);
        volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        tone.connect(volume);
        volume.connect(audio.destination);
        tone.onended = () => {
          tone.disconnect();
          volume.disconnect();
        };
        tone.start(startAt);
        tone.stop(startAt + duration + 0.005);
      };

      if (button.getAttribute("data-sound") === "complete") {
        // A restrained two-note chime: warm, short, and noticeably softer than a game reward.
        playTone(587.33, now, 0.095, 0.018);
        playTone(783.99, now + 0.065, 0.13, 0.014);
      } else {
        // A tiny, soft tactile-like tick for ordinary interface actions.
        playTone(520, now, 0.028, 0.009);
      }
    } catch {
      // Unsupported or blocked audio must never interrupt the button's action.
    }
  };
}
