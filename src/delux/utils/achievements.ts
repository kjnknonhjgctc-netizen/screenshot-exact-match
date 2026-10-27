import { Achievement, Goal, HistoryEvent, Task } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    title: 'Objetivo no Papel',
    description: 'Criou sua primeira meta estruturada no Delux.',
    iconName: 'Target',
    requirement: 'Criar 1 meta',
  },
  {
    id: 'first_task',
    title: 'Primeira Vitória',
    description: 'Concluiu a primeira etapa prática de um objetivo.',
    iconName: 'CheckCircle2',
    requirement: 'Concluir 1 tarefa',
  },
  {
    id: 'five_tasks',
    title: 'Consistência Real',
    description: 'Finalizou 5 etapas concretas da sua jornada.',
    iconName: 'Zap',
    requirement: 'Concluir 5 tarefas',
  },
  {
    id: 'streak_three',
    title: 'Chama Acesa',
    description: 'Manteve 3 dias consecutivos de avanço ativo.',
    iconName: 'Flame',
    requirement: 'Sequência de 3 dias',
  },
  {
    id: 'goal_completed',
    title: 'Missão Cumprida',
    description: 'Completou todas as etapas planejadas de uma meta.',
    iconName: 'Trophy',
    requirement: 'Finalizar 1 meta 100%',
  },
  {
    id: 'ten_tasks',
    title: 'Mestre da Execução',
    description: 'Chegou à marca expressiva de 10 etapas concluídas.',
    iconName: 'Award',
    requirement: 'Concluir 10 tarefas',
  },
];

/**
 * Checks for newly unlocked achievements based on real state.
 * Returns array of newly unlocked achievement objects.
 */
export function checkAchievements(
  goals: Goal[],
  tasks: Task[],
  currentAchievements: Achievement[],
  streakDays: number
): Achievement[] {
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const hasFinishedGoal = goals.some((g) => {
    const goalTasks = tasks.filter((t) => t.goalId === g.id);
    return goalTasks.length > 0 && goalTasks.every((t) => t.completed);
  });

  const newlyUnlocked: Achievement[] = [];
  const updatedAchievements = currentAchievements.map((ach) => {
    if (ach.unlockedAt) return ach; // Already unlocked

    let shouldUnlock = false;
    if (ach.id === 'first_goal' && goals.length >= 1) {
      shouldUnlock = true;
    } else if (ach.id === 'first_task' && completedTasksCount >= 1) {
      shouldUnlock = true;
    } else if (ach.id === 'five_tasks' && completedTasksCount >= 5) {
      shouldUnlock = true;
    } else if (ach.id === 'ten_tasks' && completedTasksCount >= 10) {
      shouldUnlock = true;
    } else if (ach.id === 'streak_three' && streakDays >= 3) {
      shouldUnlock = true;
    } else if (ach.id === 'goal_completed' && hasFinishedGoal) {
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      const unlockedAch = { ...ach, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return ach;
  });

  return newlyUnlocked;
}
