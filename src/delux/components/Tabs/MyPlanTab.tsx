// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Compass, Clock, Calendar, Check, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatFriendlyDate } from "../../utils/dateUtils";
import { ProgressBar } from "../Common/ProgressBar";

export const MyPlanTab: React.FC = () => {
  const { goals, tasks, toggleTask, setIsCreateGoalOpen, setSelectedGoalId } = useApp();

  const [selectedPlanGoalId, setSelectedPlanGoalId] = useState<string>("all");
  const activeGoals = goals.filter((g) => g.status !== "paused");

  // Filter tasks based on selected goal
  const displayedTasks = tasks
    .filter((t) => (selectedPlanGoalId === "all" ? true : t.goalId === selectedPlanGoalId))
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.stepOrder - b.stepOrder;
    });

  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const progressPercent =
    displayedTasks.length > 0 ? Math.round((completedCount / displayedTasks.length) * 100) : 0;
  const currentStepId = displayedTasks.find((t) => !t.completed)?.id;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-delux-text">Meu Plano</h1>
          <p className="text-xs text-delux-secondary mt-0.5">
            Trilha de execução: onde você está, o que já conquistou e o próximo passo.
          </p>
        </div>

        {/* Mobile Horizontal Goal Selector Pills */}
        {activeGoals.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 delux-glass border rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto">
            <Button
              variant="delux"
              size="delux"
              onClick={() => setSelectedPlanGoalId("all")}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[38px] ${
                selectedPlanGoalId === "all"
                  ? "delux-selected text-delux-text"
                  : "text-delux-secondary hover:text-delux-text"
              }`}
            >
              Todos os Planos
            </Button>
            {activeGoals.map((g) => (
              <Button
                variant="delux"
                size="delux"
                key={g.id}
                onClick={() => setSelectedPlanGoalId(g.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors max-w-[130px] truncate min-h-[38px] ${
                  selectedPlanGoalId === g.id
                    ? "delux-selected text-delux-purple-light"
                    : "text-delux-secondary hover:text-delux-text"
                }`}
              >
                {g.title}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Overview Tracker Banner */}
      {displayedTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-delux-surface border border-delux-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-xs font-bold text-delux-secondary uppercase tracking-wider">
                Progresso da Trilha
              </span>
              <span className="text-xs font-extrabold text-delux-text tabular-nums">
                {completedCount} / {displayedTasks.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full sm:w-64">
              <ProgressBar
                progress={progressPercent}
                colorClass={progressPercent === 100 ? "bg-delux-green" : "bg-delux-purple"}
              />
            </div>
          </div>

          <p className="text-xs text-delux-secondary text-center sm:text-right w-full sm:w-auto">
            {progressPercent === 100
              ? "Trilha totalmente finalizada! Parabéns pelo foco."
              : `${displayedTasks.length - completedCount} etapas restantes para o objetivo.`}
          </p>
        </div>
      )}

      {/* Visual Learning Path (Duolingo-inspired vertical progression nodes) */}
      {displayedTasks.length === 0 ? (
        <div className="p-10 sm:p-12 rounded-3xl bg-delux-surface border border-delux-border text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-delux-purple/15 text-delux-purple flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-delux-text">Nenhuma etapa na trilha</h3>
            <p className="text-xs text-delux-secondary max-w-sm mx-auto leading-relaxed">
              Crie uma meta com plano automático para visualizar o caminho estruturado com suas
              etapas conectadas.
            </p>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={() => setIsCreateGoalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-delux-purple hover:bg-delux-purple-hover active:opacity-85 text-delux-light text-xs font-bold rounded-xl shadow-lg shadow-delux-purple/30 transition-all min-h-[48px]"
          >
            <span>Iniciar Trilha com uma Meta</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative pl-7 sm:pl-8 space-y-4 sm:space-y-6 before:content-[''] before:absolute before:left-[21px] sm:before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-delux-border">
          {displayedTasks.map((task, index) => {
            const isCompleted = task.completed;
            const isCurrent = task.id === currentStepId;
            const goal = goals.find((g) => g.id === task.goalId);

            return (
              <div key={task.id} className="relative flex items-start gap-3 sm:gap-5 group">
                {/* Node Milestone Circle - 44px minimum hit area */}
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  data-sound={isCompleted ? "click" : "complete"}
                  onClick={() => toggleTask(task.id)}
                  title={isCompleted ? "Desmarcar etapa" : "Concluir esta etapa"}
                  className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs sm:text-sm transition-all shrink-0 active:opacity-85 ${
                    isCompleted
                      ? "bg-delux-green text-delux-ink shadow-lg shadow-delux-green/20"
                      : isCurrent
                        ? "bg-delux-purple text-delux-light ring-4 ring-delux-purple/30 shadow-xl shadow-delux-purple/40 scale-105"
                        : "bg-delux-elevated text-delux-muted border border-delux-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </Button>

                {/* Step Card */}
                <div
                  className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-delux-card border-delux-purple/60 shadow-lg shadow-delux-ink/40 ring-1 ring-delux-purple/20"
                      : isCompleted
                        ? "bg-delux-surface/60 border-delux-border/60 text-delux-muted"
                        : "bg-delux-surface border-delux-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      {goal && (
                        <Button
                          variant="delux"
                          size="delux"
                          onClick={() => setSelectedGoalId(goal.id)}
                          className="font-bold text-delux-purple hover:underline truncate max-w-[150px]"
                        >
                          {goal.title}
                        </Button>
                      )}
                      <span>·</span>
                      <span className="text-delux-secondary flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-delux-purple-light" />
                        {formatFriendlyDate(task.date)}
                        {task.time && (
                          <span className="ml-1 px-1.5 py-0.2 rounded bg-delux-purple/20 text-delux-purple-light font-bold text-[10px]">
                            {task.time}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-delux-secondary">
                        <Clock className="w-3 h-3" />
                        {task.durationMinutes} min
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-delux-purple/15 text-delux-purple-light text-[10px] font-extrabold">
                          Próxima Ação
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-bold leading-snug ${
                      isCompleted ? "line-through text-delux-muted" : "text-delux-text"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.instruction && (
                    <p className="text-xs text-delux-secondary mt-1 leading-relaxed">
                      {task.instruction}
                    </p>
                  )}

                  {/* Immediate Action inside card with thumb touch target */}
                  <div className="mt-3 pt-3 border-t border-delux-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-delux-muted">
                      {isCompleted
                        ? "Concluída"
                        : isCurrent
                          ? "Pronto para executar"
                          : "Programada"}
                    </span>

                    <Button
                      variant="delux"
                      size="delux"
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all min-h-[40px] active:opacity-85 ${
                        isCompleted
                          ? "bg-delux-elevated text-delux-secondary"
                          : isCurrent
                            ? "bg-delux-purple hover:bg-delux-purple-hover text-delux-light shadow-md"
                            : "bg-delux-elevated active:bg-delux-border text-delux-secondary"
                      }`}
                    >
                      {isCompleted ? "Reabrir etapa" : "Concluir etapa"}
                    </Button>
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
