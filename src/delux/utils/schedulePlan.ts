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
  const hasDeadline = !!deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline);
  const deadlineDays = hasDeadline ? Math.round((dateAtNoon(deadline!).getTime() - cursor.getTime()) / 86400000) + 1 : 365;
  const targetDays = Math.max(1, Math.min(365, Number.isInteger(durationDays) ? Number(durationDays) : deadlineDays));
  const computedDeadline = deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : dateString(addDate(cursor, targetDays - 1));
  const limitDate = dateAtNoon(computedDeadline);
  const start0 = new Date(cursor);
  let lastPlaced = null as Date | null;
  const scheduled: PlanTask[] = [];
  const used = new Map<string, number>();
  const occupied = new Map<string, Array<[number, number]>>();
  // Only pending tasks consume today's available time or block a time slot.
  // Completed work must remain visible in the calendar, but must not prevent
  // future plan steps from being scheduled on that date.
  for (const task of existingTasks) {
    if (task.completed) continue;
    const duration = Math.max(0, Number(task.durationMinutes) || 0);
    used.set(task.date, (used.get(task.date) || 0) + duration);
    const start = toMinutes(task.time);
    if (start !== null) {
      const ranges = occupied.get(task.date) || [];
      ranges.push([start, start + duration]);
      occupied.set(task.date, ranges);
    }
  }

  const place = (task: PlanTask, from: Date): boolean => {
    const duration = Math.max(5, Math.min(dailyLimit, Number(task.durationMinutes) || dailyLimit));
    let day = new Date(from);
    while (day <= limitDate) {
      const date = dateString(day);
      const dailyUsed = used.get(date) || 0;
      const ranges = occupied.get(date) || [];
      if (days.includes(day.getDay()) && dailyUsed + duration <= dailyLimit) {
        let start = period[0];
        let overlap = ranges.find(([a, b]) => start < b && a < start + duration);
        while (overlap && start + duration <= period[1]) {
          start = overlap[1] + 10;
          overlap = ranges.find(([a, b]) => start < b && a < start + duration);
        }
        if (start + duration <= period[1]) {
          scheduled.push({ ...task, date, time: toTime(start), durationMinutes: duration, stepOrder: scheduled.length + 1 });
          used.set(date, dailyUsed + duration);
          ranges.push([start, start + duration]);
          occupied.set(date, ranges);
          lastPlaced = day;
          return true;
        }
      }
      day = addDate(day, 1);
    }
    return false;
  };

  // Build the real sequence of available weekdays first. Spreading tasks by
  // raw calendar days can repeatedly land on weekends and push sessions into
  // unexpected dates. Distribute across the selected weekdays instead.
  const eligibleDates: Date[] = [];
  for (let day = new Date(start0); day <= limitDate; day = addDate(day, 1)) {
    if (days.includes(day.getDay())) eligibleDates.push(new Date(day));
  }
  if (eligibleDates.length === 0) {
    return { ok: false, error: 'Não há dias selecionados dentro do período deste plano. Ajuste a data de início ou os dias disponíveis.' };
  }

  // Reserve one weekly recovery day when the user selected at least two
  // weekdays. Use the last selected weekday consistently (e.g. Friday for
  // a Monday-Friday routine); never turn a one-day routine into zero sessions.
  const weeklyRestDay = days.length > 1 ? Math.max(...days) : null;
  const trainingDates = eligibleDates.filter((day) => day.getDay() !== weeklyRestDay);
  const datesToUse = trainingDates.length > 0 ? trainingDates : eligibleDates;

  // Distribute the supplied plan steps across the entire selected period,
  // rather than filling only the first few available days. This keeps the
  // progression spaced throughout 30/45/60+ day plans while preserving order.
  for (const [index, task] of sorted.entries()) {
    const targetIndex = sorted.length <= 1
      ? 0
      : Math.round((index * (datesToUse.length - 1)) / (sorted.length - 1));
    const target = datesToUse[Math.min(targetIndex, datesToUse.length - 1)] || start0;
    const from = lastPlaced && lastPlaced.getTime() >= target.getTime()
      ? addDate(lastPlaced, 1)
      : target;
    const placed = place(task, from);
    if (!placed) {
      return { ok: false, error: `Não há espaço na sua rotina para concluir todas as tarefas até ${computedDeadline}. Reduza o plano, aumente o tempo disponível ou ajuste o prazo antes de confirmar.` };
    }
  }
  return { ok: true, tasks: scheduled };
}
