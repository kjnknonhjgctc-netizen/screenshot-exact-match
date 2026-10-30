import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProvider, useApp } from "@/delux/context/AppContext";

const PREFERENCES_KEY = "delux_preferences_v2";
const TUESDAY = "2026-10-27";
const MONDAY = "2026-10-26";
const WEDNESDAY = "2026-10-28";

function SchedulingHarness() {
  const { tasks, addTask, updateGoal, updatePreferences, executeAssistantAction } = useApp();
  const [lastResult, setLastResult] = useState("not-run");

  const addTuesdayTask = () => {
    const created = addTask({
      goalId: "manual",
      title: "Estudar violão",
      date: TUESDAY,
      durationMinutes: 25,
      isAutomated: false,
    });
    setLastResult(created ? "created" : "rejected");
  };

  const changeRoutine = () => {
    setLastResult(updatePreferences({ availableDays: [1, 3] }) ? "updated" : "rejected");
  };

  const rejectPartialBatchReschedule = () => {
    const task = addTask({
      goalId: "manual",
      title: "Tarefa que não deve ser movida parcialmente",
      date: MONDAY,
      durationMinutes: 25,
      isAutomated: false,
    });
    if (!task) {
      setLastResult("setup-failed");
      return;
    }
    const applied = executeAssistantAction({
      id: "assistant-batch-test",
      type: "batch_reschedule_tasks",
      summary: "Reagendar em lote",
      payload: {
        updates: [
          { taskId: task.id, newDate: WEDNESDAY },
          { taskId: "missing-task", newDate: TUESDAY },
        ],
      },
    });
    setLastResult(applied ? "applied" : "rejected");
  };

  const createBlockedAssistantTask = () => {
    const applied = executeAssistantAction({
      id: "assistant-test",
      type: "create_task",
      summary: "Criar tarefa",
      payload: {
        title: "Tarefa em dia bloqueado",
        date: TUESDAY,
        durationMinutes: 25,
      },
    });
    setLastResult(applied ? "applied" : "rejected");
  };

  return (
    <>
      <button onClick={addTuesdayTask}>Adicionar tarefa de terça</button>
      <button onClick={changeRoutine}>Alterar dias disponíveis</button>
      <button onClick={createBlockedAssistantTask}>Criar tarefa pela IA em terça</button>
      <button onClick={rejectPartialBatchReschedule}>Rejeitar lote parcial do assistente</button>
      <button onClick={() => setLastResult(updateGoal("missing-goal", { title: "Meta alterada" }) ? "updated" : "rejected")}>Atualizar meta inexistente</button>
      <output data-testid="last-result">{lastResult}</output>
      <output data-testid="task-list">{JSON.stringify(tasks)}</output>
    </>
  );
}

function renderSchedulingHarness(availableDays: number[]) {
  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify({
      availableDays,
      dailyMinutes: 30,
      preferredTime: "morning",
      rhythm: "balanced",
      reducedMotion: false,
      soundEnabled: false,
    }),
  );
  return render(
    <AppProvider>
      <SchedulingHarness />
    </AppProvider>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("AppContext scheduling guardrails", () => {
  it("rejects a new task scheduled on an unavailable weekday", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Adicionar tarefa de terça"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("rejected");
    expect(screen.getByTestId("task-list")).toHaveTextContent("[]");
  });

  it("moves pending tasks when a weekday becomes unavailable", () => {
    renderSchedulingHarness([1, 2, 3]);

    fireEvent.click(screen.getByText("Adicionar tarefa de terça"));
    expect(screen.getByTestId("last-result")).toHaveTextContent("created");
    expect(screen.getByTestId("task-list")).toHaveTextContent(TUESDAY);

    fireEvent.click(screen.getByText("Alterar dias disponíveis"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("updated");
    expect(screen.getByTestId("task-list")).toHaveTextContent("2026-10-28");
    expect(screen.getByTestId("task-list")).not.toHaveTextContent(TUESDAY);
  });

  it("rejects an assistant action that creates a task on an unavailable weekday", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Criar tarefa pela IA em terça"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("rejected");
    expect(screen.getByTestId("task-list")).toHaveTextContent("[]");
  });

  it("rejects an entire assistant batch when one reschedule entry is invalid", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Rejeitar lote parcial do assistente"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("rejected");
    expect(screen.getByTestId("task-list")).toHaveTextContent(MONDAY);
    expect(screen.getByTestId("task-list")).not.toHaveTextContent(WEDNESDAY);
  });

  it("does not report success when asked to update a missing goal", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Atualizar meta inexistente"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("rejected");
  });
});
