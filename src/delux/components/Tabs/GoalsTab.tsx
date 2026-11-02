import { Button } from "@/components/ui/button";
// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from "react";
import { Plus, Target, CheckCircle2, Calendar, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProgressBar } from "../Common/ProgressBar";
import { formatFriendlyDate } from "../../utils/dateUtils";

export const GoalsTab: React.FC = () => {
  const { goals, tasks, setIsCreateGoalOpen, setSelectedGoalId } = useApp();

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

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
    if (filter === "active") return g.status !== "paused" && !g.isCompleted;
    if (filter === "completed") return g.isCompleted;
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-delux-text">
            Metas & Objetivos
          </h1>
          <p className="text-xs text-delux-secondary mt-0.5">
            Defina o destino e acompanhe a estrutura de execução de cada objetivo.
          </p>
        </div>

        <Button
          variant="delux"
          size="delux"
          onClick={() => setIsCreateGoalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-delux-action hover:bg-delux-action-hover active:scale-95 text-delux-light text-xs font-semibold rounded-lg shadow-lg shadow-delux-action/30 transition-all min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </Button>
      </div>

      {/* Segmented Filter Control for mobile thumb reach */}
      {goals.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-delux-surface border border-delux-border rounded-lg overflow-x-auto no-scrollbar w-full sm:w-fit">
          <Button
            variant="delux"
            size="delux"
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === "all"
                ? "bg-delux-elevated text-delux-text shadow-sm"
                : "text-delux-secondary hover:text-delux-text"
            }`}
          >
            Todas ({goals.length})
          </Button>
          <Button
            variant="delux"
            size="delux"
            onClick={() => setFilter("active")}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === "active"
                ? "bg-delux-elevated text-delux-text shadow-sm"
                : "text-delux-secondary hover:text-delux-text"
            }`}
          >
            Em andamento ({goalsWithStats.filter((g) => !g.isCompleted).length})
          </Button>
          <Button
            variant="delux"
            size="delux"
            onClick={() => setFilter("completed")}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
              filter === "completed"
                ? "bg-delux-elevated text-delux-text shadow-sm"
                : "text-delux-secondary hover:text-delux-text"
            }`}
          >
            Concluídas ({goalsWithStats.filter((g) => g.isCompleted).length})
          </Button>
        </div>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-lg bg-delux-surface border border-delux-border text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-delux-action/15 text-delux-action flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-delux-text">
              {goals.length === 0
                ? "Nenhuma meta criada ainda"
                : "Nenhuma meta encontrada neste filtro"}
            </h3>
            <p className="text-xs text-delux-secondary max-w-sm mx-auto leading-relaxed">
              {goals.length === 0
                ? "O Delux transforma qualquer objetivo em um plano determinístico que cabe na sua rotina real."
                : "Alterne os filtros acima para visualizar suas outras metas."}
            </p>
          </div>

          {goals.length === 0 && (
            <Button
              variant="delux"
              size="delux"
              onClick={() => setIsCreateGoalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-delux-action hover:bg-delux-action-hover active:scale-95 text-delux-light text-xs font-semibold rounded-lg shadow-lg shadow-delux-action/30 transition-all min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Minha Primeira Meta</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoalId(goal.id)}
              className="group p-4 sm:p-5 rounded-lg bg-delux-surface border border-delux-border active:border-delux-action/60 transition-all cursor-pointer shadow-sm active:scale-[0.99] flex flex-col justify-between space-y-3.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-delux-secondary">
                    <span className="font-semibold text-delux-action">{goal.category}</span>
                    <span>·</span>
                    <span>{goal.method === "auto" ? "Automático" : "Manual"}</span>
                  </div>
                  {goal.isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-delux-success bg-delux-success/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Concluída</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-delux-text group-hover:text-delux-accent transition-colors leading-snug">
                  {goal.title}
                </h3>

                {goal.reason && (
                  <p className="text-xs text-delux-secondary line-clamp-2 italic">
                    «{goal.reason}»
                  </p>
                )}
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-2 pt-2.5 border-t border-delux-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-delux-secondary">Progresso</span>
                  <span className="font-semibold tabular-nums text-delux-text">
                    {goal.progress}% ({goal.completedCount}/{goal.tasksCount} etapas)
                  </span>
                </div>
                <ProgressBar
                  progress={goal.progress}
                  colorClass={goal.isCompleted ? "bg-delux-success" : "bg-delux-action"}
                />

                <div className="flex items-center justify-between text-[11px] text-delux-muted pt-1">
                  {goal.deadline ? (
                    <span className="flex items-center gap-1 text-delux-secondary">
                      <Calendar className="w-3 h-3 text-delux-accent" />
                      <span>Prazo: {formatFriendlyDate(goal.deadline)}</span>
                    </span>
                  ) : (
                    <span>Sem prazo rígido</span>
                  )}

                  <span className="flex items-center gap-1 text-delux-accent font-semibold group-hover:translate-x-0.5 transition-transform">
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
