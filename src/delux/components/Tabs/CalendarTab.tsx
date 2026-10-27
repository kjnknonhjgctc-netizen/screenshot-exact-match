// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import {
  addDays,
  getLocalDateString,
  getWeekDays,
  MONTH_NAMES,
  SHORT_MONTH_NAMES,
} from '../../utils/dateUtils';
import { TaskModal } from '../Modals/TaskModal';

export const CalendarTab: React.FC = () => {
  const {
    tasks,
    goals,
    preferences,
    toggleTask,
  } = useApp();

  const [currentWeekReference, setCurrentWeekReference] = useState<Date>(new Date());
  const [selectedMobileDayStr, setSelectedMobileDayStr] = useState<string>(getLocalDateString(new Date()));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitialDate, setTaskModalInitialDate] = useState<string>(getLocalDateString(new Date()));
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const weekDays = getWeekDays(currentWeekReference);
  const firstDay = weekDays[0].date;
  const lastDay = weekDays[6].date;

  const weekRangeTitle =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${MONTH_NAMES[firstDay.getMonth()]} ${firstDay.getFullYear()}`
      : `${SHORT_MONTH_NAMES[firstDay.getMonth()]} - ${SHORT_MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  const handlePrevWeek = () => {
    setCurrentWeekReference((curr) => addDays(curr, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekReference((curr) => addDays(curr, 7));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentWeekReference(today);
    setSelectedMobileDayStr(getLocalDateString(today));
  };

  const openCreateTaskOnDate = (dateStr: string) => {
    setTaskToEdit(null);
    setTaskModalInitialDate(dateStr);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header with navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5FA]">Calendário Semanal</h1>
          <p className="text-xs text-[#A1A1B4] mt-0.5">
            Organização temporal das suas etapas nos dias disponíveis da sua rotina.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center bg-[#121219] border border-[#292936] rounded-xl p-1">
            <button
              onClick={handlePrevWeek}
              className="w-9 h-9 rounded-lg text-[#A1A1B4] hover:text-[#F5F5FA] active:bg-[#1A1A24] transition-colors flex items-center justify-center"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-bold text-[#F5F5FA] whitespace-nowrap tabular-nums">
              {weekRangeTitle}
            </span>
            <button
              onClick={handleNextWeek}
              className="w-9 h-9 rounded-lg text-[#A1A1B4] hover:text-[#F5F5FA] active:bg-[#1A1A24] transition-colors flex items-center justify-center"
              aria-label="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3.5 py-2 bg-[#1A1A24] active:bg-[#232332] border border-[#292936] text-xs font-bold text-[#A78BFA] rounded-xl transition-colors min-h-[38px]"
          >
            Hoje
          </button>

          <button
            onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
            <span className="sm:hidden">Criar</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW: Horizontal Touch Strip + Selected Day Agenda */}
      <div className="block lg:hidden space-y-4">
        {/* Horizontal Days Selector */}
        <div className="grid grid-cols-7 gap-1 p-1.5 bg-[#121219] border border-[#292936] rounded-2xl">
          {weekDays.map((d) => {
            const isSelected = selectedMobileDayStr === d.dateStr;
            const isAvailable = preferences.availableDays.includes(d.dayOfWeek);
            const dayTasks = tasks.filter((t) => t.date === d.dateStr);
            const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);

            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedMobileDayStr(d.dateStr)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all min-h-[58px] relative active:scale-95 ${
                  isSelected
                    ? 'bg-[#8B5CF6] text-white font-extrabold shadow-md shadow-[#8B5CF6]/30'
                    : d.isToday
                    ? 'bg-[#1A1A24] text-[#A78BFA] border border-[#8B5CF6]/40'
                    : 'text-[#A1A1B4] hover:bg-[#1A1A24]'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight">{d.shortName}</span>
                <span className="text-sm font-extrabold tabular-nums mt-0.5">{d.dayNumber}</span>

                {/* Day status indicators */}
                <div className="flex items-center gap-0.5 mt-1 h-2">
                  {dayTasks.length > 0 && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : allDone
                          ? 'bg-[#4ADE80]'
                          : 'bg-[#8B5CF6]'
                      }`}
                    />
                  )}
                  {!isAvailable && (
                    <div
                      title="Dia indisponível"
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-[#6E6E82]'}`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Agenda */}
        {(() => {
          const selectedDayObj = weekDays.find((d) => d.dateStr === selectedMobileDayStr) || weekDays[0];
          const isAvailable = preferences.availableDays.includes(selectedDayObj.dayOfWeek);
          const dayTasks = tasks.filter((t) => t.date === selectedMobileDayStr);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121219] border border-[#292936] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F5FA]">
                    {selectedDayObj.fullName}, {selectedDayObj.dayNumber} de {MONTH_NAMES[selectedDayObj.date.getMonth()]}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-medium">
                    {selectedDayObj.isToday && (
                      <span className="text-[#8B5CF6] font-bold">Hoje</span>
                    )}
                    <span className={isAvailable ? 'text-[#4ADE80]' : 'text-[#6E6E82]'}>
                      {isAvailable ? '· Dia disponível' : '· Dia indisponível'}
                    </span>
                    <span>· {dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                  </div>
                </div>

                <button
                  onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
                  className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] transition-colors flex items-center justify-center"
                  title="Adicionar tarefa neste dia"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {dayTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A1A1B4] space-y-3">
                  <p>Nenhuma tarefa agendada para este dia.</p>
                  <button
                    onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
                    className="px-4 py-2 bg-[#1A1A24] border border-[#292936] text-xs text-[#8B5CF6] font-bold rounded-xl inline-block"
                  >
                    + Agendar tarefa neste dia
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayTasks.map((task) => {
                    const goal = goals.find((g) => g.id === task.goalId);
                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                          task.completed
                            ? 'bg-[#14141E] border-[#292936]/60 text-[#6E6E82]'
                            : 'bg-[#1A1A24] border-[#292936] text-[#F5F5FA]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            task.completed
                              ? 'bg-[#4ADE80] text-black font-bold'
                              : 'border-2 border-[#3E3E52] active:border-[#8B5CF6] bg-[#121219]'
                          }`}
                        >
                          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => openEditTask(task)}
                        >
                          {goal && (
                            <span className="text-[10px] font-bold text-[#8B5CF6] block truncate mb-0.5">
                              {goal.title}
                            </span>
                          )}
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              task.completed ? 'line-through text-[#6E6E82]' : 'text-[#F5F5FA]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#A1A1B4] mt-1.5">
                            {task.time && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-[10px]">
                                {task.time}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.durationMinutes} min
                            </span>
                            <span>·</span>
                            <span className="text-[#A78BFA] font-medium">Toque para editar</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* DESKTOP VIEW: 7 Day Columns */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
        {weekDays.map((d) => {
          const isAvailable = preferences.availableDays.includes(d.dayOfWeek);
          const dayTasks = tasks.filter((t) => t.date === d.dateStr);

          return (
            <div
              key={d.dateStr}
              className={`rounded-2xl border flex flex-col min-h-[460px] p-3 transition-colors ${
                d.isToday
                  ? 'bg-[#14141E] border-[#8B5CF6]/50 shadow-md ring-1 ring-[#8B5CF6]/20'
                  : 'bg-[#121219] border-[#292936]'
              }`}
            >
              {/* Column Day Header */}
              <div className="pb-2.5 mb-2.5 border-b border-[#292936]/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#A1A1B4] uppercase block">
                    {d.shortName}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        d.isToday ? 'text-[#8B5CF6]' : 'text-[#F5F5FA]'
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {d.isToday && (
                      <span className="text-[9px] font-bold text-[#8B5CF6] uppercase">Hoje</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isAvailable && (
                    <span
                      title="Dia indisponível nas preferências"
                      className="w-2 h-2 rounded-full bg-[#6E6E82]"
                    />
                  )}
                  <button
                    onClick={() => openCreateTaskOnDate(d.dateStr)}
                    className="p-1 rounded-lg text-[#6E6E82] hover:text-[#F5F5FA] hover:bg-[#1A1A24] transition-colors"
                    title="Adicionar tarefa neste dia"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tasks list inside day column */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-2 text-center text-[11px] text-[#6E6E82]">
                    {isAvailable ? 'Livre' : 'Indisponível'}
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const goal = goals.find((g) => g.id === task.goalId);
                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          task.completed
                            ? 'bg-[#14141E] border-[#292936]/60 opacity-60 text-[#6E6E82]'
                            : 'bg-[#1A1A24] border-[#292936] hover:border-[#8B5CF6]/50 text-[#F5F5FA] shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                              task.completed
                                ? 'bg-[#4ADE80] text-black font-bold'
                                : 'border border-[#3E3E52] bg-[#121219]'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => openEditTask(task)}
                          >
                            {goal && (
                              <span className="text-[10px] font-semibold text-[#8B5CF6] block truncate">
                                {goal.title}
                              </span>
                            )}
                            <p
                              className={`font-semibold line-clamp-2 leading-tight ${
                                task.completed ? 'line-through text-[#6E6E82]' : 'text-[#F5F5FA]'
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#A1A1B4]">
                              {task.time && (
                                <span className="px-1 py-0.2 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-[9px]">
                                  {task.time}
                                </span>
                              )}
                              <span>{task.durationMinutes}m</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        initialDate={taskModalInitialDate}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
      />
    </div>
  );
};
