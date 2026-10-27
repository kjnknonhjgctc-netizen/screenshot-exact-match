import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { parseLocalDateString } from '../../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  initialDate?: string;
  taskToEdit?: Task | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  initialDate,
  taskToEdit,
  onClose,
}) => {
  const { goals, preferences, addTask, updateTask, showToast } = useApp();

  const [title, setTitle] = useState(taskToEdit ? taskToEdit.title : '');
  const [instruction, setInstruction] = useState(taskToEdit ? taskToEdit.instruction || '' : '');
  const [date, setDate] = useState(taskToEdit ? taskToEdit.date : initialDate || '');
  const [time, setTime] = useState(taskToEdit ? taskToEdit.time || '' : '');
  const [durationMinutes, setDurationMinutes] = useState(taskToEdit ? taskToEdit.durationMinutes : preferences.dailyMinutes);
  const [goalId, setGoalId] = useState(taskToEdit ? taskToEdit.goalId : goals[0]?.id || '');

  if (!isOpen) return null;

  // Check if selected date is an unavailable day
  const targetDateObj = date ? parseLocalDateString(date) : null;
  const isDateUnavailable = targetDateObj ? !preferences.availableDays.includes(targetDateObj.getDay()) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return;
    }
    if (!date) {
      showToast('A data é obrigatória.', 'error');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        instruction: instruction.trim() || undefined,
        date,
        time: time.trim() || undefined,
        durationMinutes,
        goalId: goalId || taskToEdit.goalId,
      });
    } else {
      addTask({
        goalId: goalId || (goals[0] ? goals[0].id : 'manual'),
        title: title.trim(),
        instruction: instruction.trim() || undefined,
        date,
        time: time.trim() || undefined,
        durationMinutes,
        isAutomated: false,
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-md max-h-[90vh] rounded-t-[32px] sm:rounded-2xl bg-[#121219] border-t sm:border border-[#292936] shadow-2xl text-[#F5F5FA] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-[#3E3E52] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#292936] shrink-0">
          <h3 id="task-modal-title" className="text-base font-bold">
            {taskToEdit ? 'Editar Tarefa' : 'Adicionar Tarefa'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F5F5FA] hover:bg-[#1A1A24] transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F5F5FA] mb-1">
              Título da ação *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Praticar exercícios de violão..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1B4] mb-1">
              Instrução ou anotação (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Focar na troca de acordes sem olhar para as mãos..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#F5F5FA] mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F5FA] mb-1">
                Horário <span className="text-[10px] text-[#A1A1B4]">(opcional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F5FA] mb-1">
                Duração (min)
              </label>
              <input
                type="number"
                min="5"
                max="240"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Warning if day is unavailable */}
          {isDateUnavailable && (
            <div className="p-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Aviso: este dia não está marcado como disponível nas suas preferências semanais.
              </span>
            </div>
          )}

          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#A1A1B4] mb-1">
                Vincular a uma Meta
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[44px]"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292936]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#A1A1B4] hover:text-[#F5F5FA] min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md min-h-[44px]"
            >
              Salvar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
