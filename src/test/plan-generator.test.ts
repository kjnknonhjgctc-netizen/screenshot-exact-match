import { describe, expect, it } from "vitest";
import { generateTasksForGoal } from "@/delux/utils/planGenerator";
import type { UserPreferences } from "@/delux/types";

const makePreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  availableDays: [1, 3, 5],
  dailyMinutes: 15,
  preferredTime: "morning",
  rhythm: "balanced",
  reducedMotion: false,
  soundEnabled: false,
  ...overrides,
});

describe("generateTasksForGoal", () => {
  it("distributes every generated task only across available weekdays", () => {
    const { tasks, warning } = generateTasksForGoal(
      "goal-guitar",
      "Aprender violão",
      "Estudos",
      makePreferences({ availableDays: [1, 3] }),
      "2026-10-26",
    );

    expect(warning).toBeUndefined();
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      const weekday = new Date(`${task.date}T12:00:00`).getDay();
      expect([1, 3]).toContain(weekday);
    }
  });

  it("never creates a session longer than the user's daily time budget", () => {
    const { tasks } = generateTasksForGoal(
      "goal-guitar",
      "Aprender violão",
      "Estudos",
      makePreferences({ availableDays: [1, 2, 3, 4, 5], dailyMinutes: 15 }),
      "2026-10-26",
    );

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((task) => task.durationMinutes <= 15)).toBe(true);
    expect(tasks.every((task) => task.durationMinutes >= 5)).toBe(true);
  });

  it("returns a warning instead of generating a plan without available days", () => {
    const result = generateTasksForGoal(
      "goal-empty",
      "Aprender violão",
      "Estudos",
      makePreferences({ availableDays: [] }),
      "2026-10-26",
    );

    expect(result.tasks).toEqual([]);
    expect(result.warning).toMatch(/dia disponível/i);
  });

  it("falls back to a valid available date when the requested start date is malformed", () => {
    const { tasks, warning } = generateTasksForGoal(
      "goal-invalid-date",
      "Aprender violão",
      "Estudos",
      makePreferences({ availableDays: [2, 4] }),
      "not-a-date",
    );

    expect(warning).toBeUndefined();
    expect(tasks.length).toBeGreaterThan(0);
    expect([2, 4]).toContain(new Date(`${tasks[0].date}T12:00:00`).getDay());
  });
});
