import { Button } from "@/components/ui/button";
// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
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
          <div className="flex items-center gap-1.5 text-xs text-delux-secondary font-medium">
            <Calendar className="w-3.5 h-3.5 text-delux-action" />
            <span className="capitalize">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-delux-text">
            {greeting}.
          </h1>
          <p className="text-xs sm:text-sm text-delux-secondary">
            {subtext}
          </p>
        </div>

        {/* Streak highlight on mobile (touchable) */}
        <Button variant="delux" size="delux"
          onClick={() => openDrawer('achievements')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-delux-elevated border border-delux-border active:scale-95 transition-transform"
        >
          <div className="w-7 h-7 rounded-lg bg-delux-attention/15 text-delux-attention flex items-center justify-center">
            <Flame className="w-4 h-4 fill-delux-attention" />
          </div>
          <div className="text-left pr-0.5">
            <span className="text-[9px] text-delux-secondary uppercase tracking-normal block font-semibold leading-none">
              Sequência
            </span>
            <span className="text-xs sm:text-sm font-semibold text-delux-text tabular-nums">
              {streakDays}d
            </span>
          </div>
        </Button>
      </div>

      {/* 4.2 Card Principal de Progresso (Mobile Optimized Hero) */}
      <section className="relative overflow-hidden p-5 sm:p-7 rounded-lg sm:rounded-lg bg-gradient-to-br from-delux-surface via-delux-surface to-delux-elevated border border-delux-border shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-delux-action/15 text-delux-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visão Geral do seu Avanço</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-semibold text-delux-text tracking-tight leading-snug">
              {totalTasksCount === 0
                ? 'Seu objetivo merece sair do papel.'
                : overallProgress === 100
                ? 'Todos os planos concluídos!'
                : 'Consistência não é fazer tudo. É continuar.'}
            </h2>
            <p className="text-xs sm:text-sm text-delux-secondary leading-relaxed max-w-lg">
              {totalTasksCount === 0
                ? 'Defina sua primeira meta e o Delux distribui as etapas nos dias em que você realmente tem tempo.'
                : `Você completou ${completedTasksCount} de ${totalTasksCount} etapas planejadas.`}
            </p>

            <div className="pt-2 flex justify-center sm:justify-start">
              {totalTasksCount === 0 ? (
                <Button variant="delux" size="delux"
                  onClick={() => setIsCreateGoalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-delux-action hover:bg-delux-action-hover active:scale-[0.98] text-delux-light text-xs font-semibold rounded-lg shadow-lg shadow-delux-action/30 transition-all min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Minha Primeira Meta</span>
                </Button>
              ) : (
                <Button variant="delux" size="delux"
                  onClick={() => setActiveTab('plan')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-delux-action hover:bg-delux-action-hover active:scale-[0.98] text-delux-light text-xs font-semibold rounded-lg shadow-lg shadow-delux-action/30 transition-all min-h-[48px]"
                >
                  <span>Ver Meu Plano</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ProgressRing
              progress={overallProgress}
              size={96}
              strokeWidth={8}
              color={overallProgress === 100 ? 'var(--color-delux-success)' : 'var(--color-delux-action)'}
            />
            <span className="text-[11px] text-delux-secondary font-medium mt-1.5 tabular-nums">
              {completedTasksCount} / {totalTasksCount} etapas
            </span>
          </div>
        </div>
      </section>

      {/* 4.3 A Seção “Seu Próximo Passo” */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-normal text-delux-secondary">
              Seu Próximo Passo
            </h3>
            <p className="text-[11px] text-delux-muted">Ação prioritária para avançar hoje.</p>
          </div>
          {nextPendingTask && (
            <span className="text-xs font-semibold text-delux-action">
              {formatFriendlyDate(nextPendingTask.date)}
            </span>
          )}
        </div>

        {nextPendingTask ? (
          <div className="p-4 sm:p-5 rounded-lg bg-delux-surface border border-delux-action/40 shadow-lg space-y-3.5">
            <div className="space-y-1">
              {nextPendingTask.goal && (
                <Button variant="delux" size="delux"
                  onClick={() => {
                    if (nextPendingTask.goal) setSelectedGoalId(nextPendingTask.goal.id);
                  }}
                  className="text-[11px] font-semibold text-delux-accent hover:underline block"
                >
                  Meta: {nextPendingTask.goal.title}
                </Button>
              )}
              <h4 className="text-base font-semibold text-delux-text leading-snug">
                {nextPendingTask.title}
              </h4>
              {nextPendingTask.instruction && (
                <p className="text-xs text-delux-secondary leading-relaxed">
                  {nextPendingTask.instruction}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-delux-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {nextPendingTask.time && (
                  <span className="px-2 py-0.5 rounded-md bg-delux-action/25 border border-delux-action/40 text-delux-accent font-semibold text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-delux-accent" />
                    {nextPendingTask.time}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-delux-secondary">
                  {!nextPendingTask.time && <Clock className="w-3.5 h-3.5 text-delux-action" />}
                  <span>{nextPendingTask.durationMinutes} minutos de foco</span>
                </span>
              </div>

              {/* High-touch 48px action button */}
              <Button variant="delux" size="delux"
                data-sound="complete"
                onClick={() => toggleTask(nextPendingTask.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-delux-success hover:bg-delux-success active:scale-[0.98] text-delux-ink text-xs font-semibold rounded-lg shadow-md transition-all min-h-[48px]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Concluir Passo</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-delux-surface border border-delux-border text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-delux-success mx-auto opacity-80" />
            <h4 className="text-sm font-semibold text-delux-text">Tudo concluído por enquanto</h4>
            <p className="text-xs text-delux-secondary max-w-md mx-auto">
              Você está com todas as ações em dia! Aproveite para celebrar seu foco.
            </p>
            {goals.length === 0 && (
              <Button variant="delux" size="delux"
                onClick={() => setIsCreateGoalOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-delux-action hover:underline"
              >
                Criar minha primeira meta →
              </Button>
            )}
          </div>
        )}
      </section>

      {/* 4.4 Plano de Hoje */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-normal text-delux-secondary">
              Plano de Hoje
            </h3>
            <p className="text-[11px] text-delux-muted">Tarefas agendadas para esta data.</p>
          </div>
          <span className="text-xs text-delux-secondary tabular-nums font-semibold">
            {todayTasks.filter((t) => t.completed).length} / {todayTasks.length} concluídas
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-5 sm:p-6 rounded-lg bg-delux-surface border border-delux-border text-center space-y-2">
            <p className="text-xs font-semibold text-delux-text">Hoje está livre de tarefas automáticas.</p>
            <p className="text-[11px] text-delux-secondary max-w-sm mx-auto">
              O Delux respeita sua disponibilidade semanal. Você pode descansar ou adiantar o próximo passo.
            </p>
            <Button variant="delux" size="delux"
              onClick={() => setActiveTab('calendar')}
              className="mt-1 text-xs text-delux-action hover:underline font-semibold inline-block py-1"
            >
              Conferir tarefas da semana no Calendário →
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((task) => {
              const goal = goals.find((g) => g.id === task.goalId);
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border transition-all flex items-start gap-3.5 ${
                    task.completed
                      ? 'bg-delux-surface/60 border-delux-border/50 text-delux-muted'
                      : 'bg-delux-surface border-delux-border text-delux-text hover:border-delux-border-hover'
                  }`}
                >
                  {/* Generous touch target checkbox */}
                  <Button variant="delux" size="delux"
                    type="button"
                    data-sound={task.completed ? "click" : "complete"}
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-delux-success text-delux-ink font-semibold'
                        : 'border-2 border-delux-border-hover active:border-delux-action bg-delux-elevated'
                    }`}
                    aria-label={task.completed ? 'Desmarcar etapa' : 'Concluir etapa'}
                  >
                    {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-delux-secondary mb-0.5">
                      {goal && <span className="font-semibold text-delux-action truncate">{goal.title}</span>}
                      {task.time && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-delux-accent px-1 py-0.2 rounded bg-delux-action/20">
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
                        task.completed ? 'line-through text-delux-muted' : 'text-delux-text'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.instruction && !task.completed && (
                      <p className="text-[11px] text-delux-secondary mt-1 line-clamp-2">{task.instruction}</p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md shrink-0 self-center ${
                      task.completed
                        ? 'bg-delux-success/10 text-delux-success'
                        : 'bg-delux-action/15 text-delux-accent'
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
        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <span className="text-[11px] text-delux-secondary font-semibold block">Metas Ativas</span>
          <p className="text-xl font-semibold text-delux-text tabular-nums mt-0.5">{activeGoalsCount}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <span className="text-[11px] text-delux-secondary font-semibold block">Concluídas</span>
          <p className="text-xl font-semibold text-delux-success tabular-nums mt-0.5">{completedTasksCount}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <span className="text-[11px] text-delux-secondary font-semibold block">Pendentes Hoje</span>
          <p className="text-xl font-semibold text-delux-accent tabular-nums mt-0.5">{pendingTodayTasks.length}</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <span className="text-[11px] text-delux-secondary font-semibold block">Aproveitamento</span>
          <p className="text-xl font-semibold text-delux-attention tabular-nums mt-0.5">{overallProgress}%</p>
        </div>
      </section>
    </div>
  );
};
