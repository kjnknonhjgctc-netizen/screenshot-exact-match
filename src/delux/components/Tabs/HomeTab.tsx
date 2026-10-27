import React from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Calendar,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressRing } from '../Common/ProgressRing';
import { formatFriendlyDate, getGreeting, getLocalDateString } from '../../utils/dateUtils';

export const HomeTab: React.FC = () => {
  const {
    goals,
    tasks,
    overallProgress,
    completedTasksCount,
    totalTasksCount,
    todayTasks,
    pendingTodayTasks,
    nextPendingTask,
    streakDays,
    toggleTask,
    setActiveTab,
    setIsCreateGoalOpen,
    setSelectedGoalId,
    openDrawer,
  } = useApp();

  const { greeting, subtext } = getGreeting();
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 4.1 Cabeçalho Personalizado */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1B4] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="capitalize">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5FA]">
            {greeting}.
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1B4]">
            {subtext}
          </p>
        </div>

        {/* Streak highlight on mobile (touchable) */}
        <button
          onClick={() => openDrawer('achievements')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#1A1A24] border border-[#292936] active:scale-95 transition-transform"
        >
          <div className="w-7 h-7 rounded-xl bg-[#FBBF24]/15 text-[#FBBF24] flex items-center justify-center">
            <Flame className="w-4 h-4 fill-[#FBBF24]" />
          </div>
          <div className="text-left pr-0.5">
            <span className="text-[9px] text-[#A1A1B4] uppercase tracking-wider block font-bold leading-none">
              Sequência
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#F5F5FA] tabular-nums">
              {streakDays}d
            </span>
          </div>
        </button>
      </div>

      {/* 4.2 Card Principal de Progresso (Mobile Optimized Hero) */}
      <section className="relative overflow-hidden p-5 sm:p-7 rounded-[28px] sm:rounded-3xl bg-gradient-to-br from-[#121219] via-[#14141E] to-[#1A1A24] border border-[#292936] shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visão Geral do seu Avanço</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-[#F5F5FA] tracking-tight leading-snug">
              {totalTasksCount === 0
                ? 'Seu objetivo merece sair do papel.'
                : overallProgress === 100
                ? 'Todos os planos concluídos!'
                : 'Consistência não é fazer tudo. É continuar.'}
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1B4] leading-relaxed max-w-lg">
              {totalTasksCount === 0
                ? 'Defina sua primeira meta e o Delux distribui as etapas nos dias em que você realmente tem tempo.'
                : `Você completou ${completedTasksCount} de ${totalTasksCount} etapas planejadas.`}
            </p>

            <div className="pt-2 flex justify-center sm:justify-start">
              {totalTasksCount === 0 ? (
                <button
                  onClick={() => setIsCreateGoalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Minha Primeira Meta</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('plan')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
                >
                  <span>Ver Meu Plano</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ProgressRing
              progress={overallProgress}
              size={96}
              strokeWidth={8}
              color={overallProgress === 100 ? '#4ADE80' : '#8B5CF6'}
            />
            <span className="text-[11px] text-[#A1A1B4] font-medium mt-1.5 tabular-nums">
              {completedTasksCount} / {totalTasksCount} etapas
            </span>
          </div>
        </div>
      </section>

      {/* 4.3 A Seção “Seu Próximo Passo” */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A1A1B4]">
              Seu Próximo Passo
            </h3>
            <p className="text-[11px] text-[#6E6E82]">Ação prioritária para avançar hoje.</p>
          </div>
          {nextPendingTask && (
            <span className="text-xs font-bold text-[#8B5CF6]">
              {formatFriendlyDate(nextPendingTask.date)}
            </span>
          )}
        </div>

        {nextPendingTask ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121219] border border-[#8B5CF6]/40 shadow-lg space-y-3.5">
            <div className="space-y-1">
              {nextPendingTask.goal && (
                <button
                  onClick={() => setSelectedGoalId(nextPendingTask.goal!.id)}
                  className="text-[11px] font-bold text-[#A78BFA] hover:underline block"
                >
                  Meta: {nextPendingTask.goal.title}
                </button>
              )}
              <h4 className="text-base font-bold text-[#F5F5FA] leading-snug">
                {nextPendingTask.title}
              </h4>
              {nextPendingTask.instruction && (
                <p className="text-xs text-[#A1A1B4] leading-relaxed">
                  {nextPendingTask.instruction}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#292936]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {nextPendingTask.time && (
                  <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 text-[#A78BFA] font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A78BFA]" />
                    {nextPendingTask.time}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-[#A1A1B4]">
                  {!nextPendingTask.time && <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  <span>{nextPendingTask.durationMinutes} minutos de foco</span>
                </span>
              </div>

              {/* High-touch 48px action button */}
              <button
                onClick={() => toggleTask(nextPendingTask.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#4ADE80] hover:bg-emerald-500 active:scale-[0.98] text-black text-xs font-bold rounded-xl shadow-md transition-all min-h-[48px]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Concluir Passo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#121219] border border-[#292936] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#4ADE80] mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-[#F5F5FA]">Tudo concluído por enquanto</h4>
            <p className="text-xs text-[#A1A1B4] max-w-md mx-auto">
              Você está com todas as ações em dia! Aproveite para celebrar seu foco.
            </p>
            {goals.length === 0 && (
              <button
                onClick={() => setIsCreateGoalOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] hover:underline"
              >
                Criar minha primeira meta →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4.4 Plano de Hoje */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A1A1B4]">
              Plano de Hoje
            </h3>
            <p className="text-[11px] text-[#6E6E82]">Tarefas agendadas para esta data.</p>
          </div>
          <span className="text-xs text-[#A1A1B4] tabular-nums font-semibold">
            {todayTasks.filter((t) => t.completed).length} / {todayTasks.length} concluídas
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121219] border border-[#292936] text-center space-y-2">
            <p className="text-xs font-semibold text-[#F5F5FA]">Hoje está livre de tarefas automáticas.</p>
            <p className="text-[11px] text-[#A1A1B4] max-w-sm mx-auto">
              O Delux respeita sua disponibilidade semanal. Você pode descansar ou adiantar o próximo passo.
            </p>
            <button
              onClick={() => setActiveTab('calendar')}
              className="mt-1 text-xs text-[#8B5CF6] hover:underline font-bold inline-block py-1"
            >
              Conferir tarefas da semana no Calendário →
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((task) => {
              const goal = goals.find((g) => g.id === task.goalId);
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    task.completed
                      ? 'bg-[#121219]/60 border-[#292936]/50 text-[#6E6E82]'
                      : 'bg-[#121219] border-[#292936] text-[#F5F5FA] hover:border-[#3E3E52]'
                  }`}
                >
                  {/* Generous touch target checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-[#4ADE80] text-black font-bold'
                        : 'border-2 border-[#3E3E52] active:border-[#8B5CF6] bg-[#1A1A24]'
                    }`}
                    aria-label={task.completed ? 'Desmarcar etapa' : 'Concluir etapa'}
                  >
                    {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1B4] mb-0.5">
                      {goal && <span className="font-bold text-[#8B5CF6] truncate">{goal.title}</span>}
                      {task.time && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-[#A78BFA] px-1 py-0.2 rounded bg-[#8B5CF6]/20">
                            {task.time}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {task.durationMinutes}m
                      </span>
                    </div>
                    <p
                      className={`text-xs font-semibold leading-snug ${
                        task.completed ? 'line-through text-[#6E6E82]' : 'text-[#F5F5FA]'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.instruction && !task.completed && (
                      <p className="text-[11px] text-[#A1A1B4] mt-1 line-clamp-2">{task.instruction}</p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 self-center ${
                      task.completed
                        ? 'bg-[#4ADE80]/10 text-[#4ADE80]'
                        : 'bg-[#8B5CF6]/15 text-[#A78BFA]'
                    }`}
                  >
                    {task.completed ? 'Feito' : 'Fazer'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4.5 Resumo Rápido */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <span className="text-[11px] text-[#A1A1B4] font-semibold block">Metas Ativas</span>
          <p className="text-xl font-extrabold text-[#F5F5FA] tabular-nums mt-0.5">{activeGoalsCount}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <span className="text-[11px] text-[#A1A1B4] font-semibold block">Concluídas</span>
          <p className="text-xl font-extrabold text-[#4ADE80] tabular-nums mt-0.5">{completedTasksCount}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <span className="text-[11px] text-[#A1A1B4] font-semibold block">Pendentes Hoje</span>
          <p className="text-xl font-extrabold text-[#A78BFA] tabular-nums mt-0.5">{pendingTodayTasks.length}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <span className="text-[11px] text-[#A1A1B4] font-semibold block">Aproveitamento</span>
          <p className="text-xl font-extrabold text-[#FBBF24] tabular-nums mt-0.5">{overallProgress}%</p>
        </div>
      </section>
    </div>
  );
};
