import { useEffect, useState } from "react";

// Keep only the visual surface mounted while its exit animation finishes.
export function useAnimatedPresence(open: boolean, reducedMotion = false) {
  const [retained, setRetained] = useState(open);

  useEffect(() => {
    if (open) {
      setRetained(true);
      return;
    }
    const reduce = reducedMotion || document.querySelector(".delux-app.reduce-motion") !== null || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setRetained(false), reduce ? 0 : 200);
    return () => window.clearTimeout(timeout);
  }, [open, reducedMotion]);

  return open || retained;
}