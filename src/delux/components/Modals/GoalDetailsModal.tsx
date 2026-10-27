// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  RotateCw,
  Plus,
  Edit2,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../Common/ProgressBar';
import { ConfirmModal } from '../Common/ConfirmModal';
import { formatFriendlyDate, getLocalDateString } from '../../utils/dateUtils';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getLocalDateString(new Date()));
  const [newTaskDuration, setNewTaskDuration] = useState(25);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editReason, setEditReason] = useState('');

  if (!goalId) return null;

  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return null;

  const goalTasks = tasks
    .filter((t) => t.goalId === goalId)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const completedCount = goalTasks.filter((t) => t.completed).length;
  const progressPercent = goalTasks.length > 0 ? Math.round((completedCount / goalTasks.length) * 100) : 0;

  const handleStartEdit = () => {
    setEditTitle(goal.title);
    setEditReason(goal.reason || '');
    setIsEditingGoal(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      showToast('O título não pode ser vazio.', 'error');
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
      instruction: '',
      date: newTaskDate,
      durationMinutes: newTaskDuration,
      isAutomated: false,
    });

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-details-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Background dismiss */}
      <div
        className="fixed inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-2xl bg-[#121219] border-t sm:border border-[#292936] shadow-2xl text-[#F5F5FA] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-[#3E3E52] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-8 py-3.5 sm:py-4 border-b border-[#292936] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                {goal.category}
              </span>
              <span className="text-xs text-[#6E6E82]">·</span>
              <span className="text-[11px] text-[#A1A1B4]">
                {goal.method === 'auto' ? 'Plano Automático' : 'Plano Manual'}
              </span>
            </div>

            {isEditingGoal ? (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-sm text-[#F5F5FA] font-bold"
                />
                <input
                  type="text"
                  placeholder="Motivo pessoal..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#A1A1B4]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 bg-[#8B5CF6] text-white text-xs font-semibold rounded-xl"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3.5 py-1.5 bg-[#1A1A24] text-[#A1A1B4] text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 id="goal-details-title" className="text-lg sm:text-xl font-bold text-[#F5F5FA] tracking-tight">
                  {goal.title}
                </h3>
                {goal.reason && (
                  <p className="text-xs text-[#A1A1B4] mt-1 italic line-clamp-2">
                    «{goal.reason}»
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isEditingGoal && (
              <button
                onClick={handleStartEdit}
                title="Editar meta"
                className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F5F5FA] hover:bg-[#1A1A24] transition-colors flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              title="Excluir meta"
              className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F87171] hover:bg-red-500/10 transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F5F5FA] hover:bg-[#1A1A24] transition-colors flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-2xl bg-[#1A1A24] border border-[#292936] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#A1A1B4]">Progresso do objetivo</span>
              <span className="font-bold tabular-nums text-[#F5F5FA]">
                {progressPercent}% ({completedCount}/{goalTasks.length} etapas)
              </span>
            </div>
            <ProgressBar
              progress={progressPercent}
              colorClass={progressPercent === 100 ? 'bg-[#4ADE80]' : 'bg-[#8B5CF6]'}
            />
            {goal.deadline && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1B4] pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Prazo planejado: {formatFriendlyDate(goal.deadline)}</span>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B4]">
                Etapas do Plano ({goalTasks.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => replanGoal(goal.id)}
                  title="Ajustar tarefas pendentes aos dias disponíveis atuais"
                  className="flex items-center gap-1 text-[11px] text-[#A78BFA] hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#1A1A24] transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Replanejar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="flex items-center gap-1 text-[11px] text-[#8B5CF6] hover:text-[#A78BFA] font-bold px-2.5 py-1.5 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova etapa</span>
                </button>
              </div>
            </div>

            {/* Add Task Form Inline */}
            {isAddingTask && (
              <form onSubmit={handleAddNewTask} className="p-3.5 rounded-2xl bg-[#14141E] border border-[#8B5CF6]/50 space-y-2.5">
                <span className="text-xs font-semibold text-[#F5F5FA]">Nova etapa para este objetivo:</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Título da etapa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:outline-none focus:border-[#8B5CF6] min-h-[42px]"
                />
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] min-h-[40px]"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(parseInt(e.target.value, 10) || 15)}
                      className="w-16 px-2.5 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] min-h-[40px]"
                    />
                    <span className="text-xs text-[#A1A1B4]">min</span>
                  </div>
                  <div className="w-full sm:w-auto flex items-center justify-end gap-2 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-2 text-xs text-[#A1A1B4] hover:text-[#F5F5FA]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#8B5CF6] text-white text-xs font-bold rounded-xl"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Task rows */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {goalTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A1A1B4] bg-[#14141E] rounded-2xl border border-[#292936]">
                  Nenhuma etapa cadastrada ainda.
                </div>
              ) : (
                goalTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      task.completed
                        ? 'bg-[#14141E]/70 border-[#292936]/60 text-[#6E6E82]'
                        : 'bg-[#1A1A24] border-[#292936] text-[#F5F5FA] hover:border-[#3E3E52]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        task.completed
                          ? 'bg-[#4ADE80] text-black font-bold'
                          : 'border border-[#3E3E52] hover:border-[#8B5CF6] bg-[#121219]'
                      }`}
                      aria-label={task.completed ? 'Desmarcar etapa' : 'Concluir etapa'}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          task.completed ? 'line-through text-[#6E6E82]' : 'text-[#F5F5FA]'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.instruction && !task.completed && (
                        <p className="text-[11px] text-[#A1A1B4] mt-0.5 line-clamp-2">
                          {task.instruction}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-[#A1A1B4] mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#A78BFA]" />
                          {formatFriendlyDate(task.date)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="w-8 h-8 rounded-lg text-[#6E6E82] hover:text-[#F87171] hover:bg-red-500/10 flex items-center justify-center transition-colors"
                      title="Excluir etapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
