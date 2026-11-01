import type { Task, UserPreferences } from '../types';

type PlanTask = Pick<Task, 'title' | 'date' | 'durationMinutes'> & Partial<Pick<Task, 'id' | 'instruction' | 'time' | 'stepOrder' | 'isAutomated' | 'goalId'>>;

type ScheduleInput = {
  planTasks: PlanTask[];
  existingTasks: Task[];
  preferences: UserPreferences;
  deadline?: string;
  durationDays?: number;
};

type ScheduleResult = { ok: true; tasks: PlanTask[] } | { ok: false; error: string };

const toMinutes = (time?: string) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h = -1, m = -1] = time.split(':').map(Number);
  return h <= 23 && m <= 59 ? h * 60 + m : null;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const dateAtNoon = (value: string) => new Date(`${value}T12:00:00`);
const dateString = (value: Date) => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
const addDate = (value: Date, days: number) => { const next = new Date(value); next.setDate(next.getDate()+days); return next; };

export function schedulePlanTasks({ planTasks, existingTasks, preferences, deadline, durationDays }: ScheduleInput): ScheduleResult {
  const days = [...new Set((preferences.availableDays || []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  if (!days.length) return { ok: false, error: 'Selecione ao menos um dia disponível antes de confirmar o plano.' };
  const dailyLimit = Math.max(5, Math.min(1440, Number(preferences.dailyMinutes) || 30));
  const period: [number, number] = preferences.preferredTime === 'evening' ? [18 * 60, 22 * 60]
    : preferences.preferredTime === 'afternoon' ? [13 * 60, 17 * 60] : [8 * 60, 12 * 60];
  const sorted = [...planTasks].sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));
  const startCandidate = sorted.map((task) => task.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date || '')).sort()[0] || dateString(new Date());
  let cursor = dateAtNoon(startCandidate);
  const deadlineDays = deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? Math.round((dateAtNoon(deadline).getTime() - cursor.getTime()) / 86400000) + 1 : 1;
  const targetDays = Math.max(1, Math.min(365, Number.isInteger(durationDays) ? Number(durationDays) : deadlineDays));
  const computedDeadline = deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : dateString(addDate(cursor, targetDays - 1));
  const limitDate = dateAtNoon(computedDeadline);
  const spacingDays = Math.max(1, Math.floor((targetDays - 1) / Math.max(1, sorted.length - 1)));
  const scheduled: PlanTask[] = [];
  const used = new Map<string, number>();
  const occupied = new Map<string, Array<[number, number]>>();
  for (const task of existingTasks) {
    const duration = Math.max(0, Number(task.durationMinutes) || 0);
    used.set(task.date, (used.get(task.date) || 0) + duration);
    const start = toMinutes(task.time);
    if (start !== null) {
      const ranges = occupied.get(task.date) || [];
      ranges.push([start, start + duration]);
      occupied.set(task.date, ranges);
    }
  }

  for (const task of sorted) {
    const duration = Math.max(5, Math.min(dailyLimit, Number(task.durationMinutes) || dailyLimit));
    let placed = false;
    while (cursor <= limitDate && !placed) {
      const date = dateString(cursor);
      if (!days.includes(cursor.getDay())) { cursor = addDate(cursor, 1); continue; }
      const dailyUsed = used.get(date) || 0;
      if (dailyUsed + duration > dailyLimit) { cursor = addDate(cursor, 1); continue; }
      const ranges = occupied.get(date) || [];
      let start = period[0];
      while (start + duration <= period[1] && ranges.some(([from, to]) => start < to && from < start + duration)) {
        const overlap = ranges.find(([from, to]) => start < to && from < start + duration);
        start = overlap ? overlap[1] + 10 : start + 10;
      }
      if (start + duration > period[1]) { cursor = addDate(cursor, 1); continue; }
      scheduled.push({ ...task, date, time: toTime(start), durationMinutes: duration, stepOrder: scheduled.length + 1 });
      used.set(date, dailyUsed + duration);
      ranges.push([start, start + duration]);
      occupied.set(date, ranges);
      placed = true;
    }
    if (!placed) return { ok: false, error: `Não há espaço na sua rotina para concluir todas as tarefas até ${computedDeadline}. Reduza o plano, aumente o tempo disponível ou ajuste o prazo antes de confirmar.` };
    if (scheduled.length < sorted.length) cursor = addDate(cursor, spacingDays);
  }
  return { ok: true, tasks: scheduled };
}
