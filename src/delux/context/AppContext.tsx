// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Achievement,
  AssistantAction,
  DrawerSection,
  Goal,
  HistoryEvent,
  MainTab,
  Task,
  UserPreferences,
} from '../types';
import { INITIAL_ACHIEVEMENTS } from '../utils/achievements';
import { addDays, getLocalDateString } from '../utils/dateUtils';
import { generateTasksForGoal } from '../utils/planGenerator';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'info' | 'achievement' | 'error';
}

interface AppContextType {
  goals: Goal[];
  tasks: Task[];
  preferences: UserPreferences;
  achievements: Achievement[];
  history: HistoryEvent[];
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  isDrawerOpen: boolean;
  activeDrawerSection: DrawerSection;
  openDrawer: (section?: DrawerSection) => void;
  closeDrawer: () => void;
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  isCreateGoalOpen: boolean;
  setIsCreateGoalOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: ToastState['type']) => void;

  // Actions
  addGoal: (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'status' | 'order'>,
    manualTasks?: Omit<Task, 'id' | 'goalId' | 'completed' | 'stepOrder' | 'isAutomated'>[]
  ) => { goal: Goal; tasks: Task[] } | null;
  updateGoal: (id: string, partial: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addTask: (taskData: Omit<Task, 'id' | 'completed' | 'stepOrder'>) => Task | null;
  updateTask: (id: string, partial: Partial<Task>) => boolean;
  deleteTask: (id: string) => boolean;
  toggleTask: (id: string) => void;
  replanGoal: (goalId: string) => { updatedCount: number };
  executeAssistantAction: (action: AssistantAction) => boolean;

  updatePreferences: (partial: Partial<UserPreferences>) => boolean;
  resetAllData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => { success: boolean; error?: string };

  // Computed metrics
  overallProgress: number; // 0 to 100
  completedTasksCount: number;
  totalTasksCount: number;
  pendingTodayTasks: Task[];
  todayTasks: Task[];
  nextPendingTask: (Task & { goal?: Goal }) | null;
  streakDays: number;
}

let uniqueCounter = 0;
export const createUniqueId = (prefix: string = 'id'): string => {
  uniqueCounter = (uniqueCounter + 1) % 100000;
  return `${prefix}_${Date.now()}_${uniqueCounter}_${Math.random().toString(36).substring(2, 7)}`;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  availableDays: [1, 2, 3, 4, 5], // Seg a Sex por padrão
  dailyMinutes: 30,
  preferredTime: 'morning',
  rhythm: 'balanced',
  reducedMotion: false,
  soundEnabled: true,
};

const STORAGE_KEYS = {
  GOALS: 'delux_goals_v2',
  TASKS: 'delux_tasks_v2',
  PREFERENCES: 'delux_preferences_v2',
  ACHIEVEMENTS: 'delux_achievements_v2',
  HISTORY: 'delux_history_v2',
};


const isValidTaskTime = (time: unknown) => {
  if (time === undefined || time === null || time === '') return true;
  if (typeof time !== 'string' || !/^[0-9]{2}:[0-9]{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(':').map(Number);
  return hours <= 23 && minutes <= 59;
};

const isAllowedScheduleDate = (date: unknown, availableDays: number[]) => {
  if (!Array.isArray(availableDays) || availableDays.length === 0) return false;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) &&
    getLocalDateString(parsed) === date &&
    availableDays.includes(parsed.getDay());
};

const nextAllowedScheduleDate = (date: string, availableDays: number[]) => {
  if (!Array.isArray(availableDays) || availableDays.length === 0) return null;
  const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`)
    : new Date();
  let candidate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  for (let i = 0; i < 7; i++) {
    if (availableDays.includes(candidate.getDay())) return getLocalDateString(candidate);
    candidate = addDays(candidate, 1);
  }
  return null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State initialization with localStorage fallback
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((goal) => goal && typeof goal.id === 'string' && typeof goal.title === 'string') : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed.filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.date === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!saved) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(saved);
      const availableDays = Array.isArray(parsed?.availableDays)
        ? [...new Set(parsed.availableDays.filter((day: number) => Number.isInteger(day) && day >= 0 && day <= 6))]
        : DEFAULT_PREFERENCES.availableDays;
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        availableDays: availableDays.length > 0 ? availableDays : DEFAULT_PREFERENCES.availableDays,
        dailyMinutes: Number.isInteger(parsed?.dailyMinutes) && parsed.dailyMinutes >= 5 && parsed.dailyMinutes <= 1440
          ? parsed.dailyMinutes
          : DEFAULT_PREFERENCES.dailyMinutes,
        preferredTime: ['morning', 'afternoon', 'evening'].includes(parsed?.preferredTime)
          ? parsed.preferredTime
          : DEFAULT_PREFERENCES.preferredTime,
        rhythm: ['light', 'balanced', 'intense'].includes(parsed?.rhythm)
          ? parsed.rhythm
          : DEFAULT_PREFERENCES.rhythm,
        reducedMotion: typeof parsed?.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
        soundEnabled: typeof parsed?.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_PREFERENCES.soundEnabled,
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (saved) {
        const loaded: Achievement[] = JSON.parse(saved);
        // Merge with initial in case new achievements were added
        return INITIAL_ACHIEVEMENTS.map((init) => {
          const found = loaded.find((l) => l.id === init.id);
          return found || init;
        });
      }
      return INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });

  const [history, setHistory] = useState<HistoryEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!saved) return [];
      const parsed: HistoryEvent[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Clean up and ensure all historical events have unique IDs
      const seenIds = new Set<string>();
      return parsed.map((item, idx) => {
        let id = item.id;
        if (!id || seenIds.has(id)) {
          id = createUniqueId(`hist_dedup_${idx}`);
        }
        seenIds.add(id);
        return { ...item, id };
      });
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerSection, setActiveDrawerSection] = useState<DrawerSection>('preferences');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Repair legacy pending tasks that were previously stored on unavailable days.
  useEffect(() => {
    const repairedTasks = tasks.map((task) => {
      if (task.completed || isAllowedScheduleDate(task.date, preferences.availableDays)) return task;
      const nextDate = nextAllowedScheduleDate(task.date, preferences.availableDays);
      return nextDate ? { ...task, date: nextDate } : task;
    });
    if (repairedTasks.some((task, index) => task !== tasks[index])) setTasks(repairedTasks);
  }, []);

  // Sync state to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (e) {
      console.error('Failed to save achievements', e);
    }
  }, [achievements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  // Toast notification helper
  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3500);
  };

  const openDrawer = (section: DrawerSection = 'preferences') => {
    setActiveDrawerSection(section);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Compute Streak: real consecutive days with completed tasks
  const streakDays = useMemo(() => {
    const completedDates = new Set(
      tasks
        .filter((t) => t.completed && (t.completedAt || t.date))
        .map((t) => t.completedAt ? getLocalDateString(new Date(t.completedAt)) : t.date)
    );

    if (completedDates.size === 0) return 0;

    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = getLocalDateString(addDays(new Date(), -1));

    let checkDate: Date;
    let count = 0;

    if (completedDates.has(todayStr)) {
      checkDate = new Date();
    } else if (completedDates.has(yesterdayStr)) {
      checkDate = addDays(new Date(), -1);
    } else {
      return 0; // streak broken
    }

    while (completedDates.has(getLocalDateString(checkDate))) {
      count++;
      checkDate = addDays(checkDate, -1);
    }

    return count;
  }, [tasks]);

  // Check achievements after updates
  const evaluateAchievements = (updatedGoals: Goal[], updatedTasks: Task[]) => {
    const completedTasksCount = updatedTasks.filter((t) => t.completed).length;
    const completedDates = new Set(
      updatedTasks
        .filter((task) => task.completed && (task.completedAt || task.date))
        .map((task) => task.completedAt ? getLocalDateString(new Date(task.completedAt)) : task.date),
    );
    const today = new Date();
    let streakCursor = completedDates.has(getLocalDateString(today))
      ? today
      : completedDates.has(getLocalDateString(addDays(today, -1)))
        ? addDays(today, -1)
        : null;
    let currentStreak = 0;
    while (streakCursor && completedDates.has(getLocalDateString(streakCursor))) {
      currentStreak += 1;
      streakCursor = addDays(streakCursor, -1);
    }
    const hasFinishedGoal = updatedGoals.some((g) => {
      const gTasks = updatedTasks.filter((t) => t.goalId === g.id);
      return gTasks.length > 0 && gTasks.every((t) => t.completed);
    });

    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.unlockedAt) return ach;
        let shouldUnlock = false;

        if (ach.id === 'first_goal' && updatedGoals.length >= 1) shouldUnlock = true;
        if (ach.id === 'first_task' && completedTasksCount >= 1) shouldUnlock = true;
        if (ach.id === 'five_tasks' && completedTasksCount >= 5) shouldUnlock = true;
        if (ach.id === 'ten_tasks' && completedTasksCount >= 10) shouldUnlock = true;
        if (ach.id === 'streak_three' && currentStreak >= 3) shouldUnlock = true;
        if (ach.id === 'goal_completed' && hasFinishedGoal) shouldUnlock = true;

        if (shouldUnlock) {
          const unlocked = { ...ach, unlockedAt: new Date().toISOString() };
          showToast(`Conquista desbloqueada: ${ach.title}!`, 'achievement');
          setHistory((h) => [
            {
              id: createUniqueId(`hist_ach_${ach.id}`),
              timestamp: new Date().toISOString(),
              type: 'achievement_unlocked',
              title: `Conquista desbloqueada: ${ach.title}`,
              description: ach.description,
            },
            ...h,
          ]);
          return unlocked;
        }
        return ach;
      })
    );
  };

  // Add Goal action
  const addGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'status' | 'order'>,
    manualTasks?: Omit<Task, 'id' | 'goalId' | 'completed' | 'stepOrder' | 'isAutomated'>[]
  ) => {
    if (!goalData.title?.trim()) {
      showToast('O título da meta é obrigatório.', 'error');
      return null;
    }
    if (!Array.isArray(preferences.availableDays) || preferences.availableDays.length === 0) {
      showToast('Escolha ao menos um dia disponível antes de criar um plano.', 'error');
      return null;
    }
    if (goalData.method === 'manual') {
      const invalidTask = (manualTasks || []).find((task) =>
        !task.title?.trim() ||
        !isAllowedScheduleDate(task.date, preferences.availableDays) ||
        !Number.isInteger(task.durationMinutes) || task.durationMinutes < 5 || task.durationMinutes > 1440 ||
        !isValidTaskTime(task.time),
      );
      if (invalidTask) {
        showToast('Revise as etapas manuais: cada uma precisa de título e uma data em dia disponível.', 'error');
        return null;
      }
    }
    const newGoalId = createUniqueId('goal');
    const newGoal: Goal = {
      ...goalData,
      id: newGoalId,
      createdAt: new Date().toISOString(),
      status: 'active',
      order: goals.length + 1,
    };

    let generatedTasks: Task[] = [];

    if (goalData.method === 'auto') {
      const res = generateTasksForGoal(newGoalId, goalData.title, goalData.category, preferences);
      generatedTasks = res.tasks;
    } else if (manualTasks && manualTasks.length > 0) {
      generatedTasks = manualTasks.map((mt, idx) => ({
        id: createUniqueId(`task_${newGoalId}_${idx + 1}`),
        goalId: newGoalId,
        title: mt.title,
        instruction: mt.instruction || '',
        date: mt.date || getLocalDateString(new Date()),
        durationMinutes: mt.durationMinutes || preferences.dailyMinutes,
        completed: false,
        stepOrder: idx + 1,
        isAutomated: false,
      }));
    }

    const updatedGoals = [...goals, newGoal];
    const updatedTasks = [...tasks, ...generatedTasks];

    setGoals(updatedGoals);
    setTasks(updatedTasks);

    setHistory((prev) => [
      {
        id: createUniqueId('hist_goal_created'),
        timestamp: new Date().toISOString(),
        type: 'goal_created',
        title: `Meta criada: ${newGoal.title}`,
        description: `Plano gerado com ${generatedTasks.length} etapas concretas.`,
        goalId: newGoalId,
      },
      ...prev,
    ]);

    showToast(`Meta "${newGoal.title}" criada com sucesso!`, 'success');
    evaluateAchievements(updatedGoals, updatedTasks);

    return { goal: newGoal, tasks: generatedTasks };
  };

  // Update Goal action
  const updateGoal = (id: string, partial: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...partial } : g)));
    showToast('Meta atualizada.', 'info');
  };

  // Delete Goal action: cascades to all associated tasks safely
  const deleteGoal = (id: string) => {
    const targetGoal = goals.find((g) => g.id === id);
    if (!targetGoal) {
      showToast('Não encontrei essa meta para excluir.', 'error');
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.filter((t) => t.goalId !== id));

    if (selectedGoalId === id) {
      setSelectedGoalId(null);
    }

    setHistory((prev) => [
      {
        id: createUniqueId('hist_goal_deleted'),
        timestamp: new Date().toISOString(),
        type: 'goal_deleted',
        title: `Meta removida`,
        description: targetGoal ? `Meta "${targetGoal.title}" e suas tarefas foram excluídas.` : 'Meta excluída.',
      },
      ...prev,
    ]);

    showToast(targetGoal ? `Meta "${targetGoal.title}" excluída.` : 'Meta excluída.', 'info');
  };

  // Add standalone or manual task
  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'stepOrder'>) => {
    if (!taskData?.title?.trim()) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return null;
    }
    if (!isAllowedScheduleDate(taskData.date, preferences.availableDays)) {
      showToast('Não foi possível salvar: escolha um dia disponível na sua rotina.', 'error');
      return null;
    }
    const duration = Number(taskData.durationMinutes);
    if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
      showToast('A duração deve estar entre 5 minutos e 24 horas.', 'error');
      return null;
    }
    if (!isValidTaskTime(taskData.time)) {
      showToast('Informe um horário válido no formato HH:MM.', 'error');
      return null;
    }
    const existingForGoal = tasks.filter((t) => t.goalId === taskData.goalId);
    const newTask: Task = {
      ...taskData,
      id: createUniqueId(`task_${taskData.goalId}`),
      completed: false,
      stepOrder: existingForGoal.length + 1,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    showToast('Tarefa adicionada com sucesso.', 'success');
    return newTask;
  };

  const updateTask = (id: string, partial: Partial<Task>) => {
    const target = tasks.find((task) => task.id === id);
    if (!target) {
      showToast('Não encontrei essa tarefa para atualizar.', 'error');
      return false;
    }
    if (partial.date !== undefined && partial.date !== target.date && !isAllowedScheduleDate(partial.date, preferences.availableDays)) {
      showToast('Não foi possível salvar: escolha um dia disponível na sua rotina.', 'error');
      return false;
    }
    if (partial.durationMinutes !== undefined &&
      (!Number.isInteger(partial.durationMinutes) || partial.durationMinutes < 5 || partial.durationMinutes > 1440)) {
      showToast('A duração deve estar entre 5 minutos e 24 horas.', 'error');
      return false;
    }
    if (partial.time !== undefined && !isValidTaskTime(partial.time)) {
      showToast('Informe um horário válido no formato HH:MM.', 'error');
      return false;
    }
    if (partial.title !== undefined && !partial.title.trim()) {
      showToast('O título da tarefa não pode ficar vazio.', 'error');
      return false;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
    showToast('Tarefa atualizada.', 'info');
    return true;
  };

  const deleteTask = (id: string) => {
    if (!tasks.some((task) => task.id === id)) {
      showToast('Não encontrei essa tarefa para excluir.', 'error');
      return false;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarefa removida.', 'info');
    return true;
  };

  // Toggle Task Completion: the heartbeat of the app
  const toggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const willBeCompleted = !target.completed;
    const nowIso = new Date().toISOString();

    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? nowIso : undefined,
          }
        : t
    );

    setTasks(updatedTasks);

    const goal = goals.find((g) => g.id === target.goalId);

    // Add to history
    setHistory((prev) => [
      {
        id: createUniqueId('hist_task_toggle'),
        timestamp: nowIso,
        type: willBeCompleted ? 'task_completed' : 'task_uncompleted',
        title: willBeCompleted ? `Etapa concluída: ${target.title}` : `Etapa reaberta: ${target.title}`,
        description: goal ? `Meta: ${goal.title}` : 'Tarefa avulsa',
        goalId: target.goalId,
        taskId: target.id,
      },
      ...prev,
    ]);

    if (willBeCompleted) {
      showToast('Etapa concluída! +1 no seu progresso.', 'success');
    } else {
      showToast('Etapa reaberta.', 'info');
    }

    const updatedGoals = goals.map((goal) => {
      if (goal.id !== target.goalId || goal.status === 'paused') return goal;
      const goalTasks = updatedTasks.filter((task) => task.goalId === goal.id);
      const isComplete = goalTasks.length > 0 && goalTasks.every((task) => task.completed);
      return { ...goal, status: isComplete ? 'completed' : 'active' };
    });
    if (updatedGoals.some((goal, index) => goal !== goals[index])) setGoals(updatedGoals);
    evaluateAchievements(updatedGoals, updatedTasks);
  };

  // Replan Goal: redistributes only remaining pending tasks starting from next available day
  const replanGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !preferences.availableDays.length) return { updatedCount: 0 };

    const goalTasks = tasks.filter((t) => t.goalId === goalId);
    const pending = goalTasks.filter((t) => !t.completed).sort((a, b) => a.stepOrder - b.stepOrder);

    if (pending.length === 0) return { updatedCount: 0 };

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Skip to first allowed day
    while (!preferences.availableDays.includes(currentDate.getDay())) {
      currentDate = addDays(currentDate, 1);
    }

    const updatedMap = new Map<string, string>();
    pending.forEach((task) => {
      updatedMap.set(task.id, getLocalDateString(currentDate));
      currentDate = addDays(currentDate, 1);
      while (!preferences.availableDays.includes(currentDate.getDay())) {
        currentDate = addDays(currentDate, 1);
      }
    });

    setTasks((prev) =>
      prev.map((t) => (updatedMap.has(t.id) ? { ...t, date: updatedMap.get(t.id)! } : t))
    );

    showToast(`Plano replanejado para os seus dias disponíveis.`, 'success');
    return { updatedCount: pending.length };
  };

  const executeAssistantAction = (action: AssistantAction): boolean => {
    switch (action.type) {
      case 'reschedule_task': {
        const { taskId, newDate, newTime, summary } = action.payload || {};
        if (!taskId || !isAllowedScheduleDate(newDate, preferences.availableDays) || !isValidTaskTime(newTime)) {
          showToast('Não foi possível reagendar: confira a tarefa e escolha um dia disponível.', 'error');
          return false;
        }
        const task = tasks.find((item) => item.id === taskId);
        if (!task) {
          showToast('Não encontrei essa tarefa para reagendar.', 'error');
          return false;
        }
        setTasks((prev) => prev.map((item) => item.id === taskId
          ? { ...item, date: newDate, ...(newTime !== undefined ? { time: newTime || undefined } : {}) }
          : item));
        setHistory((prev) => [{
          id: createUniqueId('hist_ai_reschedule'),
          timestamp: new Date().toISOString(),
          type: 'task_uncompleted',
          title: `Reagendado pelo Delux IA: ${task.title}`,
          description: summary || `Nova data: ${newDate}${newTime ? ` às ${newTime}` : ''}`,
          taskId,
        }, ...prev]);
        showToast(summary || 'Tarefa reagendada com sucesso pelo Assistente IA.', 'success');
        return true;
      }

      case 'batch_reschedule_tasks': {
        const { updates, summary } = action.payload || {};
        if (!Array.isArray(updates) || updates.length === 0) {
          showToast('Nenhuma alteração de data foi recebida.', 'error');
          return false;
        }
        const validUpdates = new Map<string, { newDate: string; newTime?: string }>();
        updates.forEach((update: any) => {
          if (update?.taskId &&
            tasks.some((task) => task.id === update.taskId) &&
            isAllowedScheduleDate(update.newDate, preferences.availableDays) && isValidTaskTime(update.newTime)) {
            validUpdates.set(update.taskId, { newDate: update.newDate, newTime: update.newTime });
          }
        });
        if (validUpdates.size === 0) {
          showToast('Nenhuma tarefa foi reagendada: confira os IDs e os dias disponíveis.', 'error');
          return false;
        }
        setTasks((prev) => prev.map((task) => {
          const update = validUpdates.get(task.id);
          return update
            ? { ...task, date: update.newDate, ...(update.newTime !== undefined ? { time: update.newTime || undefined } : {}) }
            : task;
        }));
        const skipped = updates.length - validUpdates.size;
        showToast(
          skipped > 0
            ? `${validUpdates.size} tarefa(s) reagendada(s). ${skipped} alteração(ões) inválida(s) foram ignoradas.`
            : (summary || `${validUpdates.size} tarefas reagendadas pelo Delux IA.`),
          skipped > 0 ? 'info' : 'success',
        );
        return true;
      }

      case 'create_task': {
        const { title, instruction, date, time, durationMinutes, goalId, summary } = action.payload || {};
        if (!title || !isAllowedScheduleDate(date, preferences.availableDays)) {
          showToast('Não criei a tarefa: informe um título e escolha um dia disponível.', 'error');
          return false;
        }
        const targetGoalId = goalId && goals.some((goal) => goal.id === goalId)
          ? goalId
          : (goals[0]?.id || 'manual');
        const created = addTask({
          goalId: targetGoalId,
          title: String(title).trim(),
          instruction: instruction || undefined,
          date,
          time: time || undefined,
          durationMinutes: Number.isInteger(durationMinutes) ? durationMinutes : preferences.dailyMinutes,
          isAutomated: false,
        });
        if (!created) return false;
        if (summary) showToast(summary, 'success');
        return true;
      }

      case 'update_task': {
        const { taskId, title, instruction, date, time, durationMinutes, summary } = action.payload || {};
        if (!taskId) return false;
        const applied = updateTask(taskId, {
          ...(title !== undefined ? { title: String(title).trim() } : {}),
          ...(instruction !== undefined ? { instruction } : {}),
          ...(date !== undefined ? { date } : {}),
          ...(time !== undefined ? { time: time || undefined } : {}),
          ...(durationMinutes !== undefined ? { durationMinutes } : {}),
        });
        if (applied && summary) showToast(summary, 'success');
        return applied;
      }

      case 'toggle_task_completion': {
        const { taskId, completed, summary } = action.payload || {};
        const target = tasks.find((task) => task.id === taskId);
        if (!target || typeof completed !== 'boolean') {
          showToast('Não consegui identificar a tarefa para atualizar o status.', 'error');
          return false;
        }
        if (target.completed !== completed) toggleTask(taskId);
        if (summary) showToast(summary, 'success');
        return true;
      }

      case 'delete_task': {
        const { taskId, summary } = action.payload || {};
        const deleted = taskId ? deleteTask(taskId) : false;
        if (deleted && summary) showToast(summary, 'info');
        return deleted;
      }

      case 'adjust_routine_days_and_time': {
        const { availableDays, dailyMinutes, rhythm, preferredTime, summary } = action.payload || {};
        const partial: Partial<UserPreferences> = {};
        if (availableDays !== undefined) {
          if (!Array.isArray(availableDays) || availableDays.length === 0 ||
            !availableDays.every((day: number) => Number.isInteger(day) && day >= 0 && day <= 6)) {
            showToast('A rotina precisa ter pelo menos um dia válido entre domingo e sábado.', 'error');
            return false;
          }
          partial.availableDays = [...new Set(availableDays)].sort((a: number, b: number) => a - b);
        }
        if (dailyMinutes !== undefined) partial.dailyMinutes = dailyMinutes;
        if (rhythm !== undefined) partial.rhythm = rhythm;
        if (preferredTime !== undefined) partial.preferredTime = preferredTime;
        const updated = updatePreferences(partial);
        if (updated && summary) showToast(summary, 'success');
        return updated;
      }

      case 'create_goal': {
        const { title, category, reason, deadline, summary } = action.payload || {};
        if (typeof title !== 'string' || !title.trim()) {
          showToast('Informe um título válido para criar a meta.', 'error');
          return false;
        }
        const created = addGoal({
          title: title.trim(),
          category: category || 'Estudos',
          reason: reason || undefined,
          deadline: deadline || undefined,
          method: 'auto',
          dailyMinutes: preferences.dailyMinutes,
        });
        if (!created) return false;
        if (summary) showToast(summary, 'achievement');
        return true;
      }

      case 'replan_goal': {
        const { goalId, summary } = action.payload || {};
        const result = goalId ? replanGoal(goalId) : { updatedCount: 0 };
        if (result.updatedCount === 0) {
          showToast('Não foi possível replanejar: confira a meta e se ainda existem etapas pendentes.', 'error');
          return false;
        }
        if (summary) showToast(summary, 'success');
        return true;
      }

      default:
        showToast('A ação solicitada não é reconhecida pelo Delux.', 'error');
        return false;
    }
  };

  const updatePreferences = (partial: Partial<UserPreferences>): boolean => {
    const nextPreferences = { ...preferences, ...partial };
    const validDays = Array.isArray(nextPreferences.availableDays) &&
      nextPreferences.availableDays.length > 0 &&
      nextPreferences.availableDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (!validDays) {
      showToast('Mantenha ao menos um dia disponível válido na semana.', 'error');
      return false;
    }
    if (!Number.isInteger(nextPreferences.dailyMinutes) ||
      nextPreferences.dailyMinutes < 5 || nextPreferences.dailyMinutes > 1440) {
      showToast('O tempo diário deve ficar entre 5 minutos e 24 horas.', 'error');
      return false;
    }
    if (!['morning', 'afternoon', 'evening'].includes(nextPreferences.preferredTime)) {
      showToast('Selecione um período válido para sua rotina.', 'error');
      return false;
    }
    if (!['light', 'balanced', 'intense'].includes(nextPreferences.rhythm)) {
      showToast('Selecione um ritmo válido para sua rotina.', 'error');
      return false;
    }

    nextPreferences.availableDays = [...new Set(nextPreferences.availableDays)].sort((a, b) => a - b);
    setPreferences(nextPreferences);

    if (partial.availableDays) {
      const movedTasks = new Map<string, string>();
      tasks.filter((task) => !task.completed && !isAllowedScheduleDate(task.date, nextPreferences.availableDays))
        .forEach((task) => {
          const nextDate = nextAllowedScheduleDate(task.date, nextPreferences.availableDays);
          if (nextDate) movedTasks.set(task.id, nextDate);
        });
      if (movedTasks.size) {
        setTasks((prev) => prev.map((task) => movedTasks.has(task.id)
          ? { ...task, date: movedTasks.get(task.id)! }
          : task));
        showToast(`Rotina atualizada. ${movedTasks.size} tarefa(s) pendente(s) foram movidas para dias disponíveis.`, 'success');
        return true;
      }
    }
    showToast('Preferências atualizadas.', 'success');
    return true;
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem('delux_assistant_chat');

    setGoals([]);
    setTasks([]);
    setPreferences(DEFAULT_PREFERENCES);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setHistory([]);
    setSelectedGoalId(null);
    showToast('Todos os dados foram redefinidos.', 'info');
  };

  const exportData = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      goals,
      tasks,
      preferences,
      achievements,
      history,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.goals) || !Array.isArray(data.tasks)) {
        return { success: false, error: 'Arquivo inválido: formato de dados incompatível.' };
      }
      if (data.goals.some((goal: any) => !goal || typeof goal.id !== 'string' || typeof goal.title !== 'string') ||
        data.tasks.some((task: any) => !task || typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.date !== 'string')) {
        return { success: false, error: 'Arquivo inválido: existem metas ou tarefas sem os campos obrigatórios.' };
      }

      const importedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(data.preferences && typeof data.preferences === 'object' ? data.preferences : {}),
      };
      const importedDays = Array.isArray(importedPreferences.availableDays)
        ? [...new Set(importedPreferences.availableDays.filter((day: number) => Number.isInteger(day) && day >= 0 && day <= 6))]
        : [];
      importedPreferences.availableDays = importedDays.length > 0 ? importedDays : DEFAULT_PREFERENCES.availableDays;
      if (!Number.isInteger(importedPreferences.dailyMinutes) ||
        importedPreferences.dailyMinutes < 5 || importedPreferences.dailyMinutes > 1440) {
        importedPreferences.dailyMinutes = DEFAULT_PREFERENCES.dailyMinutes;
      }
      if (!['morning', 'afternoon', 'evening'].includes(importedPreferences.preferredTime)) {
        importedPreferences.preferredTime = DEFAULT_PREFERENCES.preferredTime;
      }
      if (!['light', 'balanced', 'intense'].includes(importedPreferences.rhythm)) {
        importedPreferences.rhythm = DEFAULT_PREFERENCES.rhythm;
      }

      const importedTasks = data.tasks.map((task: Task) => {
        if (task.completed || isAllowedScheduleDate(task.date, importedPreferences.availableDays)) return task;
        const nextDate = nextAllowedScheduleDate(task.date, importedPreferences.availableDays);
        return nextDate ? { ...task, date: nextDate } : task;
      });

      setGoals(data.goals);
      setTasks(importedTasks);
      setPreferences(importedPreferences);
      if (Array.isArray(data.achievements)) setAchievements(data.achievements);
      if (Array.isArray(data.history)) setHistory(data.history);

      showToast('Dados importados com sucesso! Tarefas pendentes foram ajustadas aos dias disponíveis.', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Falha ao processar arquivo JSON.' };
    }
  };

  // Computed metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const overallProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const todayStr = getLocalDateString(new Date());
  const todayTasks = useMemo(() => tasks.filter((t) => t.date === todayStr), [tasks, todayStr]);
  const pendingTodayTasks = useMemo(() => todayTasks.filter((t) => !t.completed), [todayTasks]);

  // Next Pending Task: today's earliest pending, or nearest upcoming pending
  const nextPendingTask = useMemo(() => {
    const pendingTasks = tasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) return null;

    // Sort by date ascending, then stepOrder ascending
    const sorted = [...pendingTasks].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.stepOrder - b.stepOrder;
    });

    const candidate = sorted[0];
    const goal = goals.find((g) => g.id === candidate.goalId);
    return { ...candidate, goal };
  }, [tasks, goals]);

  return (
    <AppContext.Provider
      value={{
        goals,
        tasks,
        preferences,
        achievements,
        history,
        activeTab,
        setActiveTab,
        isDrawerOpen,
        activeDrawerSection,
        openDrawer,
        closeDrawer,
        selectedGoalId,
        setSelectedGoalId,
        isCreateGoalOpen,
        setIsCreateGoalOpen,
        isAssistantOpen,
        setIsAssistantOpen,
        toast,
        showToast,
        addGoal,
        updateGoal,
        deleteGoal,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        replanGoal,
        executeAssistantAction,
        updatePreferences,
        resetAllData,
        exportData,
        importData,
        overallProgress,
        completedTasksCount,
        totalTasksCount,
        pendingTodayTasks,
        todayTasks,
        nextPendingTask,
        streakDays,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
