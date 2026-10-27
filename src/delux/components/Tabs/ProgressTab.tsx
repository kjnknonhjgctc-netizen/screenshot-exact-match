import React from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Trophy,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../Common/ProgressBar';
import { getLocalDateString, getWeekDays } from '../../utils/dateUtils';

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
      (t) => t.completed && t.completedAt && getLocalDateString(new Date(t.completedAt)) === d.dateStr
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
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5FA]">Evolução & Progresso</h1>
        <p className="text-xs text-[#A1A1B4] mt-0.5">
          Métricas calculadas exclusivamente a partir das ações que você realmente concluiu.
        </p>
      </div>

      {/* Primary KPI Row - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <div className="flex items-center justify-between text-[#A1A1B4] mb-1">
            <span className="text-[11px] font-semibold">Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
          </div>
          <p className="text-2xl font-extrabold text-[#F5F5FA] tabular-nums">{completedTasksCount}</p>
          <span className="text-[10px] text-[#A1A1B4] block">etapas finalizadas</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <div className="flex items-center justify-between text-[#A1A1B4] mb-1">
            <span className="text-[11px] font-semibold">Pendentes</span>
            <Clock className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-2xl font-extrabold text-[#F5F5FA] tabular-nums">{pendingCount}</p>
          <span className="text-[10px] text-[#A1A1B4] block">etapas restantes</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <div className="flex items-center justify-between text-[#A1A1B4] mb-1">
            <span className="text-[11px] font-semibold">Sequência</span>
            <Flame className="w-4 h-4 text-[#FBBF24]" />
          </div>
          <p className="text-2xl font-extrabold text-[#FBBF24] tabular-nums">{streakDays}</p>
          <span className="text-[10px] text-[#A1A1B4] block">dias ativos</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121219] border border-[#292936]">
          <div className="flex items-center justify-between text-[#A1A1B4] mb-1">
            <span className="text-[11px] font-semibold">Taxa Geral</span>
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">{overallProgress}%</p>
          <span className="text-[10px] text-[#A1A1B4] block">aproveitamento</span>
        </div>
      </div>

      {/* Weekly Activity Distribution Chart */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#121219] border border-[#292936] space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5FA]">Atividade Concluída nesta Semana</h3>
            <p className="text-xs text-[#A1A1B4]">Distribuição de etapas concluídas por dia.</p>
          </div>
          <span className="text-xs text-[#A1A1B4] tabular-nums font-semibold">
            {weeklyDistribution.reduce((acc, curr) => acc + curr.count, 0)} etapas
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-4 items-end h-40 border-b border-[#292936]/60 pb-2">
          {weeklyDistribution.map((d, idx) => {
            const heightPercent = d.count > 0 ? Math.round((d.count / maxDayCount) * 100) : 6;
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-[#A78BFA] mb-1 tabular-nums">
                  {d.count > 0 ? d.count : ''}
                </span>
                <div className="w-full max-w-[32px] sm:max-w-[40px] bg-[#1A1A24] rounded-lg overflow-hidden flex flex-col justify-end h-24">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      d.count > 0
                        ? d.isToday
                          ? 'bg-[#8B5CF6] shadow-md shadow-[#8B5CF6]/40'
                          : 'bg-[#4ADE80]'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] mt-2 uppercase font-extrabold ${
                    d.isToday ? 'text-[#8B5CF6]' : 'text-[#6E6E82]'
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
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#A1A1B4]">
            Progresso por Objetivo ({goals.length})
          </h3>
        </div>

        {goals.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#121219] border border-[#292936] text-center text-xs text-[#A1A1B4]">
            Nenhum objetivo cadastrado ainda para gerar métricas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {goals.map((g) => {
              const gTasks = tasks.filter((t) => t.goalId === g.id);
              const gCompleted = gTasks.filter((t) => t.completed).length;
              const gPercent = gTasks.length > 0 ? Math.round((gCompleted / gTasks.length) * 100) : 0;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className="p-4 rounded-2xl bg-[#121219] border border-[#292936] active:border-[#8B5CF6]/50 transition-all cursor-pointer space-y-2 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#F5F5FA] truncate pr-2">{g.title}</span>
                    <span className="font-bold tabular-nums text-[#A78BFA] shrink-0">
                      {gPercent}% ({gCompleted}/{gTasks.length})
                    </span>
                  </div>
                  <ProgressBar
                    progress={gPercent}
                    colorClass={gPercent === 100 ? 'bg-[#4ADE80]' : 'bg-[#8B5CF6]'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Unlocked Achievements Showcase */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#121219] border border-[#292936] space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5FA]">Conquistas e Marcos</h3>
            <p className="text-xs text-[#A1A1B4]">Reconhecimento das suas vitórias reais.</p>
          </div>
          <button
            onClick={() => openDrawer('achievements')}
            className="flex items-center gap-1 text-xs text-[#8B5CF6] hover:underline font-bold"
          >
            <span>Ver todas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {unlockedAchievements.length === 0 ? (
            <div className="col-span-1 sm:col-span-3 p-5 text-center text-xs text-[#A1A1B4] bg-[#1A1A24]/50 rounded-2xl">
              Conclua sua primeira etapa para desbloquear marcos de avanço!
            </div>
          ) : (
            unlockedAchievements.slice(0, 3).map((ach) => (
              <div
                key={ach.id}
                className="p-3.5 rounded-2xl bg-[#1A1A24] border border-[#FBBF24]/25 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FBBF24]/15 text-[#FBBF24] flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F5F5FA] truncate">{ach.title}</p>
                  <span className="text-[10px] text-[#4ADE80] font-semibold">Desbloqueada</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
