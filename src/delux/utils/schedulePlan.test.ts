import { describe, expect, it } from 'vitest';
import { schedulePlanTasks } from './schedulePlan';
import type { UserPreferences } from '../types';

const preferences: UserPreferences = { availableDays: [1, 3, 5], dailyMinutes: 60, preferredTime: 'afternoon', rhythm: 'balanced', reducedMotion: false, soundEnabled: true };

describe('schedulePlanTasks', () => {
  it('schedules only on available days, within the daily budget and preferred period', () => {
    const result = schedulePlanTasks({
      planTasks: [{ title: 'A', date: '2026-11-02', durationMinutes: 30 }, { title: 'B', date: '2026-11-02', durationMinutes: 30 }],
      existingTasks: [], preferences,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tasks.every((task) => [1, 3, 5].includes(new Date(`${task.date}T12:00:00`).getDay()))).toBe(true);
      expect(result.tasks[0]!.time).toBe('13:00');
      expect(result.tasks[1]!.time).toBe('13:40');
      expect(result.tasks[0]!.date).toBe(result.tasks[1]!.date);
    }
  });

  it('avoids occupied time ranges and accounts for existing daily workload', () => {
    const result = schedulePlanTasks({
      planTasks: [{ title: 'Nova', date: '2026-11-02', durationMinutes: 30 }],
      existingTasks: [{ id: 'old', goalId: 'g', title: 'Existente', date: '2026-11-02', time: '13:00', durationMinutes: 30, completed: false, stepOrder: 1, isAutomated: false }],
      preferences,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.tasks[0]!.time).toBe('13:40');
  });

  it('rejects a plan that cannot fit before its deadline', () => {
    const result = schedulePlanTasks({
      planTasks: [{ title: 'A', date: '2026-11-02', durationMinutes: 60 }, { title: 'B', date: '2026-11-02', durationMinutes: 60 }],
      existingTasks: [], preferences, deadline: '2026-11-02',
    });
    expect(result.ok).toBe(false);
  });
});
