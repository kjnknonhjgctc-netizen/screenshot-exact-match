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
  ) => { goal: Goal; tasks: Task[] };
  updateGoal: (id: string, partial: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addTask: (taskData: Omit<Task, 'id' | 'completed' | 'stepOrder'>) => Task;
  updateTask: (id: string, partial: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  replanGoal: (goalId: string) => { updatedCount: number };
  executeAssistantAction: (action: AssistantAction) => void;

  updatePreferences: (partial: Partial<UserPreferences>) => void;
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
};

const STORAGE_KEYS = {
  GOALS: 'delux_goals_v2',
  TASKS: 'delux_tasks_v2',
  PREFERENCES: 'delux_preferences_v2',
  ACHIEVEMENTS: 'delux_achievements_v2',
  HISTORY: 'delux_history_v2',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State initialization with localStorage fallback
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
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
        .filter((t) => t.completed && t.date)
        .map((t) => t.date)
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
        if (ach.id === 'streak_three' && streakDays >= 3) shouldUnlock = true;
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
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.filter((t) => t.goalId !== id));

    if (selectedGoalId === id) {
      setSelectedGoalId(null);
    }

    setHistory((prev) => [
      {
        id: createUniqueId('hist_goal_deleted'),
        timestamp: new Date().toISOString(),
        type: 'goal_created',
        title: `Meta removida`,
        description: targetGoal ? `Meta "${targetGoal.title}" e suas tarefas foram excluídas.` : 'Meta excluída.',
      },
      ...prev,
    ]);

    showToast(targetGoal ? `Meta "${targetGoal.title}" excluída.` : 'Meta excluída.', 'info');
  };

  // Add standalone or manual task
  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'stepOrder'>) => {
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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
    showToast('Tarefa atualizada.', 'info');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarefa removida.', 'info');
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

    evaluateAchievements(goals, updatedTasks);
  };

  // Replan Goal: redistributes only remaining pending tasks starting from next available day
  const replanGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { updatedCount: 0 };

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

  const executeAssistantAction = (action: AssistantAction) => {
    switch (action.type) {
      case 'reschedule_task': {
        const { taskId, newDate, newTime, summary } = action.payload || {};
        if (!taskId || !newDate) return;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  date: newDate,
                  ...(newTime !== undefined ? { time: newTime || undefined } : {}),
                }
              : t
          )
        );
        const task = tasks.find((t) => t.id === taskId);
        setHistory((prev) => [
          {
            id: createUniqueId('hist_ai_reschedule'),
            timestamp: new Date().toISOString(),
            type: 'task_uncompleted',
            title: `Reagendado pelo Gemini IA: ${task?.title || 'Tarefa'}`,
            description: summary || `Nova data: ${newDate}${newTime ? ` às ${newTime}` : ''}`,
            taskId,
          },
          ...prev,
        ]);
        showToast(summary || 'Tarefa reagendada com sucesso pelo Assistente IA.', 'success');
        break;
      }

      case 'batch_reschedule_tasks': {
        const { updates, summary } = action.payload || {};
        if (!Array.isArray(updates) || updates.length === 0) return;
        const updateMap = new Map<string, { newDate: string; newTime?: string }>();
        updates.forEach((u: any) => {
          if (u.taskId && u.newDate) {
            updateMap.set(u.taskId, { newDate: u.newDate, newTime: u.newTime });
          }
        });

        setTasks((prev) =>
          prev.map((t) => {
            const upd = updateMap.get(t.id);
            if (!upd) return t;
            return {
              ...t,
              date: upd.newDate,
              ...(upd.newTime !== undefined ? { time: upd.newTime || undefined } : {}),
            };
          })
        );
        showToast(summary || `${updates.length} tarefas reagendadas pelo Gemini IA.`, 'success');
        break;
      }

      case 'create_task': {
        const { title, instruction, date, time, durationMinutes, goalId, summary } = action.payload || {};
        if (!title || !date) return;
        const targetGoalId = goalId && goals.some((g) => g.id === goalId)
          ? goalId
          : (goals[0]?.id || 'manual');

        addTask({
          goalId: targetGoalId,
          title,
          instruction: instruction || undefined,
          date,
          time: time || undefined,
          durationMinutes: durationMinutes || preferences.dailyMinutes,
          isAutomated: false,
        });
        showToast(summary || `Tarefa "${title}" criada com sucesso pelo Gemini IA.`, 'success');
        break;
      }

      case 'update_task': {
        const { taskId, title, instruction, date, time, durationMinutes, summary } = action.payload || {};
        if (!taskId) return;
        updateTask(taskId, {
          ...(title ? { title } : {}),
          ...(instruction !== undefined ? { instruction } : {}),
          ...(date ? { date } : {}),
          ...(time !== undefined ? { time: time || undefined } : {}),
          ...(durationMinutes ? { durationMinutes } : {}),
        });
        if (summary) showToast(summary, 'info');
        break;
      }

      case 'toggle_task_completion': {
        const { taskId, completed, summary } = action.payload || {};
        if (!taskId) return;
        const target = tasks.find((t) => t.id === taskId);
        if (target && target.completed !== completed) {
          toggleTask(taskId);
        }
        if (summary) showToast(summary, 'success');
        break;
      }

      case 'delete_task': {
        const { taskId, summary } = action.payload || {};
        if (!taskId) return;
        deleteTask(taskId);
        if (summary) showToast(summary, 'info');
        break;
      }

      case 'adjust_routine_days_and_time': {
        const { availableDays, dailyMinutes, rhythm, preferredTime, summary } = action.payload || {};
        const partial: Partial<UserPreferences> = {};
        if (Array.isArray(availableDays) && availableDays.length > 0) {
          partial.availableDays = availableDays;
        }
        if (dailyMinutes && typeof dailyMinutes === 'number') {
          partial.dailyMinutes = dailyMinutes;
        }
        if (rhythm) {
          partial.rhythm = rhythm;
        }
        if (preferredTime) {
          partial.preferredTime = preferredTime;
        }
        updatePreferences(partial);
        showToast(summary || 'Rotina e agendamento atualizados pelo Gemini IA.', 'success');
        break;
      }

      case 'create_goal': {
        const { title, category, reason, deadline, summary } = action.payload || {};
        if (!title) return;
        addGoal({
          title,
          category: category || 'Estudos',
          reason: reason || undefined,
          deadline: deadline || undefined,
          method: 'auto',
          dailyMinutes: preferences.dailyMinutes,
        });
        showToast(summary || `Meta "${title}" criada pelo Gemini IA com plano integrado!`, 'achievement');
        break;
      }

      case 'replan_goal': {
        const { goalId, summary } = action.payload || {};
        if (!goalId) return;
        replanGoal(goalId);
        if (summary) showToast(summary, 'success');
        break;
      }
    }
  };

  const updatePreferences = (partial: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
    showToast('Preferências atualizadas.', 'success');
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);

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
      setGoals(data.goals);
      setTasks(data.tasks);
      if (data.preferences) setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      if (Array.isArray(data.achievements)) setAchievements(data.achievements);
      if (Array.isArray(data.history)) setHistory(data.history);

      showToast('Dados importados com sucesso!', 'success');
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
