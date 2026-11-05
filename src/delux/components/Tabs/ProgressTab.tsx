import { Button } from "@/components/ui/button";
// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from "react";
import { CheckCircle2, Clock, Flame, Trophy, ArrowUpRight, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProgressBar } from "../Common/ProgressBar";
import { getLocalDateString, getWeekDays } from "../../utils/dateUtils";

export const ProgressTab: React.FC = () => {
  const {
    goals,
    tasks,
    overallProgress,
    completedTasksCount,
    totalTasksCount,
    streakDays,
    achievements,
    openDrawer,
    setSelectedGoalId,
  } = useApp();

  const pendingCount = totalTasksCount - completedTasksCount;
  const currentWeekDays = getWeekDays(new Date());

  // Calculate tasks completed per day this week from real data
  const weeklyDistribution = currentWeekDays.map((d) => {
    const completedOnThisDay = tasks.filter(
      (t) =>
        t.completed && t.completedAt && getLocalDateString(new Date(t.completedAt)) === d.dateStr,
    ).length;
    return {
      shortName: d.shortName,
      dayNumber: d.dayNumber,
      count: completedOnThisDay,
      isToday: d.isToday,
    };
  });

  const maxDayCount = Math.max(...weeklyDistribution.map((w) => w.count), 1);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-delux-text">
          Evolução & Progresso
        </h1>
        <p className="text-xs text-delux-secondary mt-0.5">
          Métricas calculadas exclusivamente a partir das ações que você realmente concluiu.
        </p>
      </div>

      {/* Primary KPI Row - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <div className="flex items-center justify-between text-delux-secondary mb-1">
            <span className="text-[11px] font-semibold">Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-delux-success" />
          </div>
          <p className="text-2xl font-semibold text-delux-text tabular-nums">
            {completedTasksCount}
          </p>
          <span className="text-[10px] text-delux-secondary block">etapas finalizadas</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <div className="flex items-center justify-between text-delux-secondary mb-1">
            <span className="text-[11px] font-semibold">Pendentes</span>
            <Clock className="w-4 h-4 text-delux-accent" />
          </div>
          <p className="text-2xl font-semibold text-delux-text tabular-nums">{pendingCount}</p>
          <span className="text-[10px] text-delux-secondary block">etapas restantes</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <div className="flex items-center justify-between text-delux-secondary mb-1">
            <span className="text-[11px] font-semibold">Sequência</span>
            <Flame className="w-4 h-4 text-delux-attention" />
          </div>
          <p className="text-2xl font-semibold text-delux-attention tabular-nums">{streakDays}</p>
          <span className="text-[10px] text-delux-secondary block">dias ativos</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-delux-surface border border-delux-border">
          <div className="flex items-center justify-between text-delux-secondary mb-1">
            <span className="text-[11px] font-semibold">Taxa Geral</span>
            <Sparkles className="w-4 h-4 text-delux-action" />
          </div>
          <p className="text-2xl font-semibold text-delux-action tabular-nums">
            {overallProgress}%
          </p>
          <span className="text-[10px] text-delux-secondary block">aproveitamento</span>
        </div>
      </div>

      {/* Weekly Activity Distribution Chart */}
      <section className="p-5 sm:p-6 rounded-lg bg-delux-surface border border-delux-border space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-delux-text">
              Atividade Concluída nesta Semana
            </h3>
            <p className="text-xs text-delux-secondary">
              Distribuição de etapas concluídas por dia.
            </p>
          </div>
          <span className="text-xs text-delux-secondary tabular-nums font-semibold">
            {weeklyDistribution.reduce((acc, curr) => acc + curr.count, 0)} etapas
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-4 items-end h-40 border-b border-delux-border/60 pb-2">
          {weeklyDistribution.map((d, idx) => {
            const heightPercent = d.count > 0 ? Math.round((d.count / maxDayCount) * 100) : 6;
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-semibold text-delux-accent mb-1 tabular-nums">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div className="w-full max-w-[32px] sm:max-w-[40px] bg-delux-elevated rounded-lg overflow-hidden flex flex-col justify-end h-24">
                  <div
                    className={`w-full delux-bar-fill rounded-lg transition-all duration-500 ${
                      d.count > 0
                        ? d.isToday
                          ? "bg-delux-action shadow-md shadow-delux-action/40"
                          : "bg-delux-success"
                        : "bg-transparent"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] mt-2 uppercase font-semibold ${
                    d.isToday ? "text-delux-action" : "text-delux-muted"
                  }`}
                >
                  {d.shortName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Progress by Goal Breakdown */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-normal text-delux-secondary">
            Progresso por Objetivo ({goals.length})
          </h3>
        </div>

        {goals.length === 0 ? (
          <div className="p-6 rounded-lg bg-delux-surface border border-delux-border text-center text-xs text-delux-secondary">
            Nenhum objetivo cadastrado ainda para gerar métricas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {goals.map((g) => {
              const gTasks = tasks.filter((t) => t.goalId === g.id);
              const gCompleted = gTasks.filter((t) => t.completed).length;
              const gPercent =
                gTasks.length > 0 ? Math.round((gCompleted / gTasks.length) * 100) : 0;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className="p-4 rounded-lg bg-delux-surface border border-delux-border active:border-delux-action/50 transition-all cursor-pointer space-y-2 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-delux-text truncate pr-2">{g.title}</span>
                    <span className="font-semibold tabular-nums text-delux-accent shrink-0">
                      {gPercent}% ({gCompleted}/{gTasks.length})
                    </span>
                  </div>
                  <ProgressBar
                    progress={gPercent}
                    colorClass={gPercent === 100 ? "bg-delux-success" : "bg-delux-action"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Unlocked Achievements Showcase */}
      <section className="p-5 sm:p-6 rounded-lg bg-delux-surface border border-delux-border space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-delux-text">Conquistas e Marcos</h3>
            <p className="text-xs text-delux-secondary">Reconhecimento das suas vitórias reais.</p>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={() => openDrawer("achievements")}
            className="flex items-center gap-1 text-xs text-delux-action hover:underline font-semibold"
          >
            <span>Ver todas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {unlockedAchievements.length === 0 ? (
            <div className="col-span-1 sm:col-span-3 p-5 text-center text-xs text-delux-secondary bg-delux-elevated/50 rounded-lg">
              Conclua sua primeira etapa para desbloquear marcos de avanço!
            </div>
          ) : (
            unlockedAchievements.slice(0, 3).map((ach) => (
              <div
                key={ach.id}
                className="p-3.5 rounded-lg bg-delux-elevated border border-delux-attention/25 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-delux-attention/15 text-delux-attention flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-delux-text truncate">{ach.title}</p>
                  <span className="text-[10px] text-delux-success font-semibold">Desbloqueada</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
