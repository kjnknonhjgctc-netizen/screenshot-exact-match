import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProvider, useApp } from "@/delux/context/AppContext";

const PREFERENCES_KEY = "delux_preferences_v2";
const TUESDAY = "2026-10-27";
const MONDAY = "2026-10-26";
const WEDNESDAY = "2026-10-28";

function SchedulingHarness() {
  const { goals, tasks, addGoal, addTask, updateGoal, updatePreferences, executeAssistantAction } = useApp();
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
      <button onClick={() => {
        const created = addGoal(
          { title: "Aprender violão", category: "Estudos", method: "auto", dailyMinutes: 30 },
          undefined,
          [
            { title: "Sessão 1", instruction: "Prática inicial", date: MONDAY, durationMinutes: 45 },
            { title: "Sessão 2", instruction: "Revisão", date: WEDNESDAY, durationMinutes: 20 },
          ],
        );
        setLastResult(created ? "created" : "rejected");
      }}>Criar plano gerado válido</button>
      <button onClick={() => {
        const created = addGoal(
          { title: "Aprender violão", category: "Estudos", method: "auto", dailyMinutes: 30 },
          undefined,
          [{ title: "Sessão em dia bloqueado", date: TUESDAY, durationMinutes: 20 }],
        );
        setLastResult(created ? "created" : "rejected");
      }}>Criar plano gerado em dia bloqueado</button>
      <button onClick={addTuesdayTask}>Adicionar tarefa de terça</button>
      <button onClick={changeRoutine}>Alterar dias disponíveis</button>
      <button onClick={createBlockedAssistantTask}>Criar tarefa pela IA em terça</button>
      <button onClick={rejectPartialBatchReschedule}>Rejeitar lote parcial do assistente</button>
      <button onClick={() => setLastResult(updateGoal("missing-goal", { title: "Meta alterada" }) ? "updated" : "rejected")}>Atualizar meta inexistente</button>
      <button onClick={() => setLastResult(executeAssistantAction({
        id: "assistant-create-task", type: "create_task", summary: "Criar tarefa",
        payload: { title: "Tarefa criada pela IA", date: MONDAY, durationMinutes: 20 },
      }) ? "created" : "rejected")}>Criar tarefa válida pelo assistente</button>
      <button onClick={() => {
        const first = executeAssistantAction({
          id: "assistant-create-first", type: "create_task", summary: "Primeira tarefa",
          payload: { title: "Primeira ação da IA", date: MONDAY, durationMinutes: 15 },
        });
        const second = executeAssistantAction({
          id: "assistant-create-second", type: "create_task", summary: "Segunda tarefa",
          payload: { title: "Segunda ação da IA", date: WEDNESDAY, durationMinutes: 15 },
        });
        setLastResult(first && second ? "both-created" : "rejected");
      }}>Executar duas ações do assistente juntas</button>
      <button onClick={() => setLastResult(executeAssistantAction({
        id: "assistant-update-task", type: "update_task", summary: "Atualizar tarefa",
        payload: { taskId: tasks[0]?.id, title: "Tarefa atualizada pela IA" },
      }) ? "updated" : "rejected")}>Atualizar tarefa pelo assistente</button>
      <button onClick={() => setLastResult(executeAssistantAction({
        id: "assistant-complete-task", type: "toggle_task_completion", summary: "Concluir tarefa",
        payload: { taskId: tasks[0]?.id, completed: true },
      }) ? "completed" : "rejected")}>Concluir tarefa pelo assistente</button>
      <button onClick={() => setLastResult(executeAssistantAction({
        id: "assistant-delete-task", type: "delete_task", summary: "Excluir tarefa",
        payload: { taskId: tasks[0]?.id },
      }) ? "deleted" : "rejected")}>Excluir tarefa pelo assistente</button>
      <button onClick={() => setLastResult(executeAssistantAction({
        id: "assistant-create-goal", type: "create_goal", summary: "Criar meta",
        payload: { title: "Aprender violão", category: "Estudos" },
      }) ? "goal-created" : "rejected")}>Criar meta pelo assistente</button>
      <output data-testid="last-result">{lastResult}</output>
      <output data-testid="task-list">{JSON.stringify(tasks)}</output>\n      <output data-testid="goal-list">{JSON.stringify(goals)}</output>
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

  it("creates, updates, completes and deletes tasks through assistant actions", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Criar tarefa válida pelo assistente"));
    expect(screen.getByTestId("last-result")).toHaveTextContent("created");
    expect(screen.getByTestId("task-list")).toHaveTextContent("Tarefa criada pela IA");

    fireEvent.click(screen.getByText("Atualizar tarefa pelo assistente"));
    expect(screen.getByTestId("last-result")).toHaveTextContent("updated");
    expect(screen.getByTestId("task-list")).toHaveTextContent("Tarefa atualizada pela IA");

    fireEvent.click(screen.getByText("Concluir tarefa pelo assistente"));
    expect(screen.getByTestId("last-result")).toHaveTextContent("completed");
    expect(screen.getByTestId("task-list")).toHaveTextContent('"completed":true');

    fireEvent.click(screen.getByText("Excluir tarefa pelo assistente"));
    expect(screen.getByTestId("last-result")).toHaveTextContent("deleted");
    expect(screen.getByTestId("task-list")).toHaveTextContent("[]");
  });

  it("creates a goal and a fallback plan through an assistant action", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Criar meta pelo assistente"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("goal-created");
    expect(JSON.parse(screen.getByTestId("goal-list").textContent || "[]")).toHaveLength(1);
    const savedTasks = JSON.parse(screen.getByTestId("task-list").textContent || "[]");
    expect(savedTasks.length).toBeGreaterThan(0);
    expect(savedTasks.every((task: any) => task.durationMinutes <= 30)).toBe(true);
    expect(savedTasks.every((task: any) => [1, 3].includes(new Date(`${task.date}T12:00:00`).getDay()))).toBe(true);
  });

  it("keeps every task when multiple assistant actions execute in the same response", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Executar duas ações do assistente juntas"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("both-created");
    const savedTasks = JSON.parse(screen.getByTestId("task-list").textContent || "[]");
    expect(savedTasks.map((task: any) => task.title)).toEqual([
      "Primeira ação da IA",
      "Segunda ação da IA",
    ]);
  });
});


describe("generated AI plan persistence", () => {
  it("persists generated sessions in order and caps each session to the daily time budget", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Criar plano gerado válido"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("created");
    const savedTasks = JSON.parse(screen.getByTestId("task-list").textContent || "[]");
    expect(savedTasks).toHaveLength(2);
    expect(savedTasks.map((task: any) => task.title)).toEqual(["Sessão 1", "Sessão 2"]);
    expect(savedTasks.map((task: any) => task.stepOrder)).toEqual([1, 2]);
    expect(savedTasks.map((task: any) => task.durationMinutes)).toEqual([30, 20]);
    expect(savedTasks.every((task: any) => task.isAutomated)).toBe(true);
    expect(savedTasks.map((task: any) => task.date)).toEqual([MONDAY, WEDNESDAY]);
    expect(JSON.parse(screen.getByTestId("goal-list").textContent || "[]")).toHaveLength(1);
  });

  it("rejects a generated plan containing a session on an unavailable weekday without creating the goal", () => {
    renderSchedulingHarness([1, 3]);

    fireEvent.click(screen.getByText("Criar plano gerado em dia bloqueado"));

    expect(screen.getByTestId("last-result")).toHaveTextContent("rejected");
    expect(screen.getByTestId("task-list")).toHaveTextContent("[]");
    expect(screen.getByTestId("goal-list")).toHaveTextContent("[]");
  });
});
