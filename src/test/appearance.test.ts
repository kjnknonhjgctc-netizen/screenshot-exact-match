import { describe, expect, it, beforeEach } from "vitest";
import { applyTheme, readAppearance, resolveTheme, setAppearance, APPEARANCE_STORAGE_KEY } from "@/delux/theme/appearance";

describe("appearance", () => {
  beforeEach(() => localStorage.clear());
  it("defaults to dark", () => expect(readAppearance()).toBe("dark"));
  it("auto follows system preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("persists choice and applies it to the page", () => {
    setAppearance("light");
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
    expect(readAppearance()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
