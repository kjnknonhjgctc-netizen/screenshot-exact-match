// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Task } from "../../types";
import {
  addDays,
  getLocalDateString,
  parseLocalDateString,
  getWeekDays,
  MONTH_NAMES,
  SHORT_MONTH_NAMES,
} from "../../utils/dateUtils";
import { TaskModal } from "../Modals/TaskModal";

export const CalendarTab: React.FC = () => {
  const { tasks, goals, preferences, toggleTask } = useApp();

  const [currentWeekReference, setCurrentWeekReference] = useState<Date>(new Date());
  const [selectedMobileDayStr, setSelectedMobileDayStr] = useState<string>(
    getLocalDateString(new Date()),
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitialDate, setTaskModalInitialDate] = useState<string>(
    getLocalDateString(new Date()),
  );
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Keep each day's agenda in actual clock order. Tasks without a time appear last;
  // stepOrder keeps generated plan steps stable when times are equal or unspecified.
  const getTasksForDay = (dateStr: string) =>
    tasks
      .filter((task) => task.date === dateStr)
      .sort((a, b) => {
        const timeA = a.time || "99:99";
        const timeB = b.time || "99:99";
        const timeOrder = timeA.localeCompare(timeB);
        if (timeOrder !== 0) return timeOrder;
        return (a.stepOrder ?? Number.MAX_SAFE_INTEGER) - (b.stepOrder ?? Number.MAX_SAFE_INTEGER);
      });

  const weekDays = getWeekDays(currentWeekReference);
  const firstDay = weekDays[0].date;
  const lastDay = weekDays[6].date;

  const weekRangeTitle =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${MONTH_NAMES[firstDay.getMonth()]} ${firstDay.getFullYear()}`
      : `${SHORT_MONTH_NAMES[firstDay.getMonth()]} - ${SHORT_MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  const handlePrevWeek = () => {
    setCurrentWeekReference((curr) => addDays(curr, -7));
    setSelectedMobileDayStr((curr) => getLocalDateString(addDays(parseLocalDateString(curr), -7)));
  };

  const handleNextWeek = () => {
    setCurrentWeekReference((curr) => addDays(curr, 7));
    setSelectedMobileDayStr((curr) => getLocalDateString(addDays(parseLocalDateString(curr), 7)));
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
          <h1 className="text-2xl font-bold tracking-tight text-delux-text">Calendário Semanal</h1>
          <p className="text-xs text-delux-secondary mt-0.5">
            Organização temporal das suas etapas nos dias disponíveis da sua rotina.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="delux-glass flex items-center border rounded-xl p-1">
            <Button
              variant="delux"
              size="delux"
              onClick={handlePrevWeek}
              className="w-9 h-9 rounded-lg text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2.5 text-xs font-bold text-delux-text whitespace-nowrap tabular-nums">
              {weekRangeTitle}
            </span>
            <Button
              variant="delux"
              size="delux"
              onClick={handleNextWeek}
              className="w-9 h-9 rounded-lg text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
              aria-label="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="delux"
            size="delux"
            onClick={handleToday}
            className="px-3.5 py-2 bg-delux-elevated active:bg-delux-border border border-delux-border text-xs font-bold text-delux-purple-light rounded-xl transition-colors min-h-[38px]"
          >
            Hoje
          </Button>

          <Button
            variant="delux"
            size="delux"
            onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-delux-purple hover:bg-delux-purple-hover text-delux-light text-xs font-bold rounded-xl transition-all shadow-md active:opacity-85 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>
      </div>

      {/* MOBILE VIEW: Horizontal Touch Strip + Selected Day Agenda */}
      <div className="block lg:hidden space-y-4">
        {/* Horizontal Days Selector */}
        <div className="grid grid-cols-7 gap-1 p-1.5 delux-glass border rounded-2xl">
          {weekDays.map((d) => {
            const isSelected = selectedMobileDayStr === d.dateStr;
            const isAvailable = preferences.availableDays.includes(d.dayOfWeek);
            const dayTasks = getTasksForDay(d.dateStr);
            const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);

            return (
              <Button
                variant="delux"
                size="delux"
                key={d.dateStr}
                onClick={() => setSelectedMobileDayStr(d.dateStr)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all min-h-[58px] relative active:opacity-85 ${
                  isSelected
                    ? "delux-selected text-delux-text font-extrabold"
                    : d.isToday
                      ? "bg-delux-elevated text-delux-purple-light border border-delux-purple/40"
                      : "text-delux-secondary hover:bg-delux-elevated"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight">
                  {d.shortName}
                </span>
                <span className="text-sm font-extrabold tabular-nums mt-0.5">{d.dayNumber}</span>

                {/* Day status indicators */}
                <div className="flex items-center gap-0.5 mt-1 h-2">
                  {dayTasks.length > 0 && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-delux-light"
                          : allDone
                            ? "bg-delux-green"
                            : "bg-delux-purple"
                      }`}
                    />
                  )}
                  {!isAvailable && (
                    <div
                      title="Dia indisponível"
                      className={`w-1 h-1 rounded-full ${isSelected ? "bg-delux-light/60" : "bg-delux-muted"}`}
                    />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Selected Day Agenda */}
        {(() => {
          const selectedDayObj =
            weekDays.find((d) => d.dateStr === selectedMobileDayStr) || weekDays[0];
          const isAvailable = preferences.availableDays.includes(selectedDayObj.dayOfWeek);
          const dayTasks = getTasksForDay(selectedMobileDayStr);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-delux-surface border border-delux-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-delux-text">
                    {selectedDayObj.fullName}, {selectedDayObj.dayNumber} de{" "}
                    {MONTH_NAMES[selectedDayObj.date.getMonth()]}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-medium">
                    {selectedDayObj.isToday && (
                      <span className="text-delux-purple font-bold">Hoje</span>
                    )}
                    <span className={isAvailable ? "text-delux-green" : "text-delux-muted"}>
                      {isAvailable ? "· Dia disponível" : "· Dia indisponível"}
                    </span>
                    <span>
                      · {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="delux"
                  size="delux"
                  onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
                  className="w-10 h-10 rounded-xl bg-delux-purple/15 hover:bg-delux-purple/25 text-delux-purple transition-colors flex items-center justify-center"
                  title="Adicionar tarefa neste dia"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {dayTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-delux-secondary space-y-3">
                  <p>Nenhuma tarefa agendada para este dia.</p>
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={() => openCreateTaskOnDate(selectedMobileDayStr)}
                    className="px-4 py-2 bg-delux-elevated border border-delux-border text-xs text-delux-purple font-bold rounded-xl inline-block"
                  >
                    + Agendar tarefa neste dia
                  </Button>
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
                            ? "bg-delux-card border-delux-border/60 text-delux-muted"
                            : "bg-delux-elevated border-delux-border text-delux-text"
                        }`}
                      >
                        <Button
                          variant="delux"
                          size="delux"
                          type="button"
                          data-sound={task.completed ? "click" : "complete"}
                          onClick={() => toggleTask(task.id)}
                          className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            task.completed
                              ? "bg-delux-green text-delux-ink font-bold"
                              : "border-2 border-delux-border-hover active:border-delux-purple bg-delux-surface"
                          }`}
                        >
                          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                        </Button>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => openEditTask(task)}
                        >
                          {goal && (
                            <span className="text-[10px] font-bold text-delux-purple block truncate mb-0.5">
                              {goal.title}
                            </span>
                          )}
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              task.completed ? "line-through text-delux-muted" : "text-delux-text"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-delux-secondary mt-1.5">
                            {task.time && (
                              <span className="px-1.5 py-0.5 rounded-md bg-delux-purple/20 text-delux-purple-light font-bold text-[10px]">
                                {task.time}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.durationMinutes} min
                            </span>
                            <span>·</span>
                            <span className="text-delux-purple-light font-medium">
                              Toque para editar
                            </span>
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
          const dayTasks = getTasksForDay(d.dateStr);

          return (
            <div
              key={d.dateStr}
              className={`rounded-2xl border flex flex-col min-h-[460px] p-3 transition-colors ${
                d.isToday
                  ? "bg-delux-card border-delux-purple/50 shadow-md ring-1 ring-delux-purple/20"
                  : "bg-delux-surface border-delux-border"
              }`}
            >
              {/* Column Day Header */}
              <div className="pb-2.5 mb-2.5 border-b border-delux-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-delux-secondary uppercase block">
                    {d.shortName}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        d.isToday ? "text-delux-purple" : "text-delux-text"
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {d.isToday && (
                      <span className="text-[9px] font-bold text-delux-purple uppercase">Hoje</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isAvailable && (
                    <span
                      title="Dia indisponível nas preferências"
                      className="w-2 h-2 rounded-full bg-delux-muted"
                    />
                  )}
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={() => openCreateTaskOnDate(d.dateStr)}
                    className="p-1 rounded-lg text-delux-muted hover:text-delux-text hover:bg-delux-elevated transition-colors"
                    title="Adicionar tarefa neste dia"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tasks list inside day column */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-2 text-center text-[11px] text-delux-muted">
                    {isAvailable ? "Livre" : "Indisponível"}
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const goal = goals.find((g) => g.id === task.goalId);
                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          task.completed
                            ? "bg-delux-card border-delux-border/60 opacity-60 text-delux-muted"
                            : "bg-delux-elevated border-delux-border hover:border-delux-purple/50 text-delux-text shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Button
                            variant="delux"
                            size="delux"
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                              task.completed
                                ? "bg-delux-green text-delux-ink font-bold"
                                : "border border-delux-border-hover bg-delux-surface"
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </Button>

                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => openEditTask(task)}
                          >
                            {goal && (
                              <span className="text-[10px] font-semibold text-delux-purple block truncate">
                                {goal.title}
                              </span>
                            )}
                            <p
                              className={`font-semibold line-clamp-2 leading-tight ${
                                task.completed ? "line-through text-delux-muted" : "text-delux-text"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-delux-secondary">
                              {task.time && (
                                <span className="px-1 py-0.2 rounded bg-delux-purple/20 text-delux-purple-light font-bold text-[9px]">
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
