import { useCallback, useEffect, useState } from "react";

export type Appearance = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// Global key (not per account) so the choice survives logout/login and
// applies to the sign-in screen too.
export const APPEARANCE_STORAGE_KEY = "delux_appearance";
const EVENT = "delux-appearance-change";

export function readAppearance(): Appearance {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(appearance: Appearance, systemPrefersDark: boolean): ResolvedTheme {
  if (appearance === "system") return systemPrefersDark ? "dark" : "light";
  return appearance;
}

function systemDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

export function applyTheme(appearance: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const theme = resolveTheme(appearance, systemDark());
  root.dataset["theme"] = theme;
  // Keep Tailwind/shadcn dark: variants in sync with the semantic theme tokens.
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#F7F8FA" : "#050607");
}

export function setAppearance(next: Appearance) {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, next);
  } catch {
    /* storage unavailable: still apply for this session */
  }
  applyTheme(next);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

/** Applies the saved appearance and follows OS changes while in "system". */
export function useAppearance() {
  const [appearance, setState] = useState<Appearance>("dark");

  useEffect(() => {
    const current = readAppearance();
    setState(current);
    applyTheme(current);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (readAppearance() === "system") applyTheme("system");
    };
    const onChange = (e: Event) => setState((e as CustomEvent<Appearance>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== APPEARANCE_STORAGE_KEY) return;
      const v = readAppearance();
      setState(v);
      applyTheme(v);
    };
    mq?.addEventListener?.("change", onSystem);
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      mq?.removeEventListener?.("change", onSystem);
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((next: Appearance) => setAppearance(next), []);
  return { appearance, setAppearance: update };
}
