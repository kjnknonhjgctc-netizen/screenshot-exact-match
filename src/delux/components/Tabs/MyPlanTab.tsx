// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from 'react';
import {
  Compass,
  Clock,
  Calendar,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { ProgressBar } from '../Common/ProgressBar';

export const MyPlanTab: React.FC = () => {
  const {
    goals,
    tasks,
    toggleTask,
    setIsCreateGoalOpen,
    setSelectedGoalId,
  } = useApp();

  const [selectedPlanGoalId, setSelectedPlanGoalId] = useState<string>('all');
  const activeGoals = goals.filter((g) => g.status !== 'paused');

  // Filter tasks based on selected goal
  const displayedTasks = tasks
    .filter((t) => (selectedPlanGoalId === 'all' ? true : t.goalId === selectedPlanGoalId))
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.stepOrder - b.stepOrder;
    });

  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const progressPercent = displayedTasks.length > 0 ? Math.round((completedCount / displayedTasks.length) * 100) : 0;
  const currentStepId = displayedTasks.find((t) => !t.completed)?.id;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5FA]">Meu Plano</h1>
          <p className="text-xs text-[#A1A1B4] mt-0.5">
            Trilha de execução: onde você está, o que já conquistou e o próximo passo.
          </p>
        </div>

        {/* Mobile Horizontal Goal Selector Pills */}
        {activeGoals.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#121219] border border-[#292936] rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setSelectedPlanGoalId('all')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[38px] ${
                selectedPlanGoalId === 'all'
                  ? 'bg-[#1A1A24] text-[#F5F5FA] shadow-sm'
                  : 'text-[#A1A1B4] hover:text-[#F5F5FA]'
              }`}
            >
              Todos os Planos
            </button>
            {activeGoals.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedPlanGoalId(g.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors max-w-[130px] truncate min-h-[38px] ${
                  selectedPlanGoalId === g.id
                    ? 'bg-[#1A1A24] text-[#8B5CF6] shadow-sm'
                    : 'text-[#A1A1B4] hover:text-[#F5F5FA]'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overview Tracker Banner */}
      {displayedTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121219] border border-[#292936] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-xs font-bold text-[#A1A1B4] uppercase tracking-wider">
                Progresso da Trilha
              </span>
              <span className="text-xs font-extrabold text-[#F5F5FA] tabular-nums">
                {completedCount} / {displayedTasks.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full sm:w-64">
              <ProgressBar
                progress={progressPercent}
                colorClass={progressPercent === 100 ? 'bg-[#4ADE80]' : 'bg-[#8B5CF6]'}
              />
            </div>
          </div>

          <p className="text-xs text-[#A1A1B4] text-center sm:text-right w-full sm:w-auto">
            {progressPercent === 100
              ? 'Trilha totalmente finalizada! Parabéns pelo foco.'
              : `${displayedTasks.length - completedCount} etapas restantes para o objetivo.`}
          </p>
        </div>
      )}

      {/* Visual Learning Path (Duolingo-inspired vertical progression nodes) */}
      {displayedTasks.length === 0 ? (
        <div className="p-10 sm:p-12 rounded-3xl bg-[#121219] border border-[#292936] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F5F5FA]">Nenhuma etapa na trilha</h3>
            <p className="text-xs text-[#A1A1B4] max-w-sm mx-auto leading-relaxed">
              Crie uma meta com plano automático para visualizar o caminho estruturado com suas etapas conectadas.
            </p>
          </div>
          <button
            onClick={() => setIsCreateGoalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
          >
            <span>Iniciar Trilha com uma Meta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative pl-7 sm:pl-8 space-y-4 sm:space-y-6 before:content-[''] before:absolute before:left-[21px] sm:before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[#292936]">
          {displayedTasks.map((task, index) => {
            const isCompleted = task.completed;
            const isCurrent = task.id === currentStepId;
            const goal = goals.find((g) => g.id === task.goalId);

            return (
              <div key={task.id} className="relative flex items-start gap-3 sm:gap-5 group">
                {/* Node Milestone Circle - 44px minimum hit area */}
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  title={isCompleted ? 'Desmarcar etapa' : 'Concluir esta etapa'}
                  className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs sm:text-sm transition-all shrink-0 active:scale-90 ${
                    isCompleted
                      ? 'bg-[#4ADE80] text-black shadow-lg shadow-[#4ADE80]/20'
                      : isCurrent
                      ? 'bg-[#8B5CF6] text-white ring-4 ring-[#8B5CF6]/30 shadow-xl shadow-[#8B5CF6]/40 scale-105'
                      : 'bg-[#1A1A24] text-[#6E6E82] border border-[#292936]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Card */}
                <div
                  className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-[#14141E] border-[#8B5CF6]/60 shadow-lg shadow-black/40 ring-1 ring-[#8B5CF6]/20'
                      : isCompleted
                      ? 'bg-[#121219]/60 border-[#292936]/60 text-[#6E6E82]'
                      : 'bg-[#121219] border-[#292936]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      {goal && (
                        <button
                          onClick={() => setSelectedGoalId(goal.id)}
                          className="font-bold text-[#8B5CF6] hover:underline truncate max-w-[150px]"
                        >
                          {goal.title}
                        </button>
                      )}
                      <span>·</span>
                      <span className="text-[#A1A1B4] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A78BFA]" />
                        {formatFriendlyDate(task.date)}
                        {task.time && (
                          <span className="ml-1 px-1.5 py-0.2 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-[10px]">
                            {task.time}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-[#A1A1B4]">
                        <Clock className="w-3 h-3" />
                        {task.durationMinutes} min
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] text-[10px] font-extrabold">
                          Próxima Ação
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-bold leading-snug ${
                      isCompleted ? 'line-through text-[#6E6E82]' : 'text-[#F5F5FA]'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.instruction && (
                    <p className="text-xs text-[#A1A1B4] mt-1 leading-relaxed">
                      {task.instruction}
                    </p>
                  )}

                  {/* Immediate Action inside card with thumb touch target */}
                  <div className="mt-3 pt-3 border-t border-[#292936]/50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#6E6E82]">
                      {isCompleted ? 'Concluída' : isCurrent ? 'Pronto para executar' : 'Programada'}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all min-h-[40px] active:scale-95 ${
                        isCompleted
                          ? 'bg-[#1A1A24] text-[#A1A1B4]'
                          : isCurrent
                          ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md'
                          : 'bg-[#1A1A24] active:bg-[#232332] text-[#A1A1B4]'
                      }`}
                    >
                      {isCompleted ? 'Reabrir etapa' : 'Concluir etapa'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
