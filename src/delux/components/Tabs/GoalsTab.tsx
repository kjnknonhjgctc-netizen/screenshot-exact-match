// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from 'react';
import { Plus, Target, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../Common/ProgressBar';
import { formatFriendlyDate } from '../../utils/dateUtils';

export const GoalsTab: React.FC = () => {
  const {
    goals,
    tasks,
    setIsCreateGoalOpen,
    setSelectedGoalId,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const goalsWithStats = goals.map((goal) => {
    const goalTasks = tasks.filter((t) => t.goalId === goal.id);
    const completed = goalTasks.filter((t) => t.completed).length;
    const progress = goalTasks.length > 0 ? Math.round((completed / goalTasks.length) * 100) : 0;
    const isCompleted = goalTasks.length > 0 && completed === goalTasks.length;
    return {
      ...goal,
      tasksCount: goalTasks.length,
      completedCount: completed,
      progress,
      isCompleted,
    };
  });

  const filteredGoals = goalsWithStats.filter((g) => {
    if (filter === 'active') return g.status !== 'paused' && !g.isCompleted;
    if (filter === 'completed') return g.isCompleted;
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5FA]">Metas & Objetivos</h1>
          <p className="text-xs text-[#A1A1B4] mt-0.5">
            Defina o destino e acompanhe a estrutura de execução de cada objetivo.
          </p>
        </div>

        <button
          onClick={() => setIsCreateGoalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Segmented Filter Control for mobile thumb reach */}
      {goals.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-[#121219] border border-[#292936] rounded-xl overflow-x-auto no-scrollbar w-full sm:w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === 'all'
                ? 'bg-[#1A1A24] text-[#F5F5FA] shadow-sm'
                : 'text-[#A1A1B4] hover:text-[#F5F5FA]'
            }`}
          >
            Todas ({goals.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === 'active'
                ? 'bg-[#1A1A24] text-[#F5F5FA] shadow-sm'
                : 'text-[#A1A1B4] hover:text-[#F5F5FA]'
            }`}
          >
            Em andamento ({goalsWithStats.filter((g) => !g.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === 'completed'
                ? 'bg-[#1A1A24] text-[#F5F5FA] shadow-sm'
                : 'text-[#A1A1B4] hover:text-[#F5F5FA]'
            }`}
          >
            Concluídas ({goalsWithStats.filter((g) => g.isCompleted).length})
          </button>
        </div>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-[#121219] border border-[#292936] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F5F5FA]">
              {goals.length === 0 ? 'Nenhuma meta criada ainda' : 'Nenhuma meta encontrada neste filtro'}
            </h3>
            <p className="text-xs text-[#A1A1B4] max-w-sm mx-auto leading-relaxed">
              {goals.length === 0
                ? 'O Delux transforma qualquer objetivo em um plano determinístico que cabe na sua rotina real.'
                : 'Alterne os filtros acima para visualizar suas outras metas.'}
            </p>
          </div>

          {goals.length === 0 && (
            <button
              onClick={() => setIsCreateGoalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Minha Primeira Meta</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoalId(goal.id)}
              className="group p-4 sm:p-5 rounded-2xl bg-[#121219] border border-[#292936] active:border-[#8B5CF6]/60 transition-all cursor-pointer shadow-sm active:scale-[0.99] flex flex-col justify-between space-y-3.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-[#A1A1B4]">
                    <span className="font-bold text-[#8B5CF6]">{goal.category}</span>
                    <span>·</span>
                    <span>{goal.method === 'auto' ? 'Automático' : 'Manual'}</span>
                  </div>
                  {goal.isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Concluída</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#F5F5FA] group-hover:text-[#A78BFA] transition-colors leading-snug">
                  {goal.title}
                </h3>

                {goal.reason && (
                  <p className="text-xs text-[#A1A1B4] line-clamp-2 italic">
                    «{goal.reason}»
                  </p>
                )}
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-2 pt-2.5 border-t border-[#292936]/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#A1A1B4]">Progresso</span>
                  <span className="font-extrabold tabular-nums text-[#F5F5FA]">
                    {goal.progress}% ({goal.completedCount}/{goal.tasksCount} etapas)
                  </span>
                </div>
                <ProgressBar
                  progress={goal.progress}
                  colorClass={goal.isCompleted ? 'bg-[#4ADE80]' : 'bg-[#8B5CF6]'}
                />

                <div className="flex items-center justify-between text-[11px] text-[#6E6E82] pt-1">
                  {goal.deadline ? (
                    <span className="flex items-center gap-1 text-[#A1A1B4]">
                      <Calendar className="w-3 h-3 text-[#A78BFA]" />
                      <span>Prazo: {formatFriendlyDate(goal.deadline)}</span>
                    </span>
                  ) : (
                    <span>Sem prazo rígido</span>
                  )}

                  <span className="flex items-center gap-1 text-[#A78BFA] font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
