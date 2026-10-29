// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { X, Calendar, Clock, Trash2, RotateCw, Plus, Edit2, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProgressBar } from "../Common/ProgressBar";
import { ConfirmModal } from "../Common/ConfirmModal";
import { formatFriendlyDate, getLocalDateString } from "../../utils/dateUtils";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";

interface GoalDetailsModalProps {
  goalId: string | null;
  onClose: () => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({ goalId, onClose }) => {
  const {
    goals,
    tasks,
    toggleTask,
    deleteGoal,
    addTask,
    deleteTask,
    replanGoal,
    updateGoal,
    showToast,
  } = useApp();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(getLocalDateString(new Date()));
  const [newTaskDuration, setNewTaskDuration] = useState(25);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editReason, setEditReason] = useState("");

  const [retainedGoalId, setRetainedGoalId] = useState(goalId);
  useEffect(() => {
    if (goalId) setRetainedGoalId(goalId);
  }, [goalId]);
  const present = useAnimatedPresence(Boolean(goalId));
  if (!present) return null;

  const visibleGoalId = goalId || retainedGoalId;
  const goal = goals.find((g) => g.id === visibleGoalId);
  if (!goal) return null;

  const goalTasks = tasks
    .filter((t) => t.goalId === visibleGoalId)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const completedCount = goalTasks.filter((t) => t.completed).length;
  const progressPercent =
    goalTasks.length > 0 ? Math.round((completedCount / goalTasks.length) * 100) : 0;

  const handleStartEdit = () => {
    setEditTitle(goal.title);
    setEditReason(goal.reason || "");
    setIsEditingGoal(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      showToast("O título não pode ser vazio.", "error");
      return;
    }
    updateGoal(goal.id, {
      title: editTitle.trim(),
      reason: editReason.trim() || undefined,
    });
    setIsEditingGoal(false);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      goalId: goal.id,
      title: newTaskTitle.trim(),
      instruction: "",
      date: newTaskDate,
      durationMinutes: newTaskDuration,
      isAutomated: false,
    });

    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  return (
    <div
      role="dialog"
      data-motion-state={goalId ? "open" : "closed"}
      inert={!goalId}
      aria-modal="true"
      aria-labelledby="goal-details-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 delux-glass-overlay animate-in fade-in duration-200"
    >
      {/* Background dismiss */}
      <div className="fixed inset-0 z-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-2xl delux-glass-panel border-t sm:border text-delux-text flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-delux-border-hover rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-8 py-3.5 sm:py-4 border-b border-delux-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-delux-purple uppercase tracking-wider">
                {goal.category}
              </span>
              <span className="text-xs text-delux-muted">·</span>
              <span className="text-[11px] text-delux-secondary">
                {goal.method === "auto" ? "Plano Automático" : "Plano Manual"}
              </span>
            </div>

            {isEditingGoal ? (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-delux-elevated border border-delux-border text-sm text-delux-text font-bold"
                />
                <input
                  type="text"
                  placeholder="Motivo pessoal..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-secondary"
                />
                <div className="flex gap-2">
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 bg-delux-purple text-delux-light text-xs font-semibold rounded-xl"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3.5 py-1.5 bg-delux-elevated text-delux-secondary text-xs rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3
                  id="goal-details-title"
                  className="text-lg sm:text-xl font-bold text-delux-text tracking-tight"
                >
                  {goal.title}
                </h3>
                {goal.reason && (
                  <p className="text-xs text-delux-secondary mt-1 italic line-clamp-2">
                    «{goal.reason}»
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isEditingGoal && (
              <Button
                variant="delux"
                size="delux"
                onClick={handleStartEdit}
                title="Editar meta"
                className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-text hover:bg-delux-elevated transition-colors flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="delux"
              size="delux"
              onClick={() => setIsDeleteConfirmOpen(true)}
              title="Excluir meta"
              className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-red hover:bg-delux-danger/10 transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="delux"
              size="delux"
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-text hover:bg-delux-elevated transition-colors flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-2xl bg-delux-elevated border border-delux-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-delux-secondary">Progresso do objetivo</span>
              <span className="font-bold tabular-nums text-delux-text">
                {progressPercent}% ({completedCount}/{goalTasks.length} etapas)
              </span>
            </div>
            <ProgressBar
              progress={progressPercent}
              colorClass={progressPercent === 100 ? "bg-delux-green" : "bg-delux-purple"}
            />
            {goal.deadline && (
              <div className="flex items-center gap-1.5 text-[11px] text-delux-secondary pt-1">
                <Calendar className="w-3.5 h-3.5 text-delux-purple-light" />
                <span>Prazo planejado: {formatFriendlyDate(goal.deadline)}</span>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-delux-secondary">
                Etapas do Plano ({goalTasks.length})
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => replanGoal(goal.id)}
                  title="Ajustar tarefas pendentes aos dias disponíveis atuais"
                  className="flex items-center gap-1 text-[11px] text-delux-purple-light hover:text-delux-light px-2 py-1.5 rounded-lg hover:bg-delux-elevated transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Replanejar</span>
                </Button>
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="flex items-center gap-1 text-[11px] text-delux-purple hover:text-delux-purple-light font-bold px-2.5 py-1.5 rounded-lg bg-delux-purple/15 hover:bg-delux-purple/25 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova etapa</span>
                </Button>
              </div>
            </div>

            {/* Add Task Form Inline */}
            {isAddingTask && (
              <form
                onSubmit={handleAddNewTask}
                className="p-3.5 rounded-2xl bg-delux-card border border-delux-purple/50 space-y-2.5"
              >
                <span className="text-xs font-semibold text-delux-text">
                  Nova etapa para este objetivo:
                </span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Título da etapa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-text focus:outline-none focus:border-delux-purple min-h-[42px]"
                />
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-text min-h-[40px]"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(parseInt(e.target.value, 10) || 15)}
                      className="w-16 px-2.5 py-2 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-text min-h-[40px]"
                    />
                    <span className="text-xs text-delux-secondary">min</span>
                  </div>
                  <div className="w-full sm:w-auto flex items-center justify-end gap-2 pt-1 sm:pt-0">
                    <Button
                      variant="delux"
                      size="delux"
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-2 text-xs text-delux-secondary hover:text-delux-text"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="delux"
                      size="delux"
                      type="submit"
                      className="px-4 py-2 bg-delux-purple text-delux-light text-xs font-bold rounded-xl"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Task rows */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {goalTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-delux-secondary bg-delux-card rounded-2xl border border-delux-border">
                  Nenhuma etapa cadastrada ainda.
                </div>
              ) : (
                goalTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      task.completed
                        ? "bg-delux-card/70 border-delux-border/60 text-delux-muted"
                        : "bg-delux-elevated border-delux-border text-delux-text hover:border-delux-border-hover"
                    }`}
                  >
                    <Button
                      variant="delux"
                      size="delux"
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        task.completed
                          ? "bg-delux-green text-delux-ink font-bold"
                          : "border border-delux-border-hover hover:border-delux-purple bg-delux-surface"
                      }`}
                      aria-label={task.completed ? "Desmarcar etapa" : "Concluir etapa"}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </Button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          task.completed ? "line-through text-delux-muted" : "text-delux-text"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.instruction && !task.completed && (
                        <p className="text-[11px] text-delux-secondary mt-0.5 line-clamp-2">
                          {task.instruction}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-delux-secondary mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-delux-purple-light" />
                          {formatFriendlyDate(task.date)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="delux"
                      size="delux"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="w-8 h-8 rounded-lg text-delux-muted hover:text-delux-red hover:bg-delux-danger/10 flex items-center justify-center transition-colors"
                      title="Excluir etapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Excluir meta e todas as suas etapas?"
        description={`Tem certeza de que deseja excluir a meta "${goal.title}"? Todas as ${goalTasks.length} etapas associadas também serão apagadas permanentemente.`}
        confirmLabel="Sim, excluir meta"
        isDestructive
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          deleteGoal(goal.id);
          onClose();
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};
