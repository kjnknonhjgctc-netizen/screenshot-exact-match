// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
export type GoalCategory =
  | 'Estudos'
  | 'Carreira'
  | 'Saúde e condicionamento'
  | 'Criatividade'
  | 'Finanças pessoais'
  | 'Hábitos'
  | 'Projetos pessoais'
  | 'Outros';

export type PlanningMethod = 'auto' | 'manual';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type PreferredTime = 'morning' | 'afternoon' | 'evening';
export type ExecutionRhythm = 'light' | 'balanced' | 'intense';

export interface Goal {
  id: string;
  title: string;
  reason?: string;
  category: GoalCategory;
  method: PlanningMethod;
  createdAt: string; // ISO
  deadline?: string; // YYYY-MM-DD
  status: GoalStatus;
  dailyMinutes: number;
  order: number;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  instruction?: string;
  date: string; // YYYY-MM-DD in local time
  time?: string; // HH:mm format, e.g. "09:00", "14:30"
  durationMinutes: number;
  completed: boolean;
  completedAt?: string; // ISO
  stepOrder: number;
  isAutomated: boolean;
}

export interface UserPreferences {
  availableDays: number[]; // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  dailyMinutes: number; // 15, 30, 45, 60, etc.
  preferredTime: PreferredTime;
  rhythm: ExecutionRhythm;
  reducedMotion: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string; // ISO
  requirement: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string; // ISO
  type: 'task_completed' | 'task_uncompleted' | 'goal_created' | 'goal_completed' | 'achievement_unlocked';
  title: string;
  description: string;
  goalId?: string;
  taskId?: string;
}

export type MainTab = 'home' | 'goals' | 'plan' | 'calendar' | 'progress';
export type DrawerSection = 'preferences' | 'achievements' | 'history' | 'settings' | 'help';

export interface AssistantAction {
  id: string;
  type:
    | 'reschedule_task'
    | 'batch_reschedule_tasks'
    | 'create_task'
    | 'update_task'
    | 'delete_task'
    | 'toggle_task_completion'
    | 'adjust_routine_days_and_time'
    | 'create_goal'
    | 'replan_goal';
  summary: string;
  payload: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: AssistantAction[];
  suggestedPlan?: {
    goalTitle: string;
    category: GoalCategory;
    steps: { title: string; instruction: string; durationMinutes: number }[];
  };
}

