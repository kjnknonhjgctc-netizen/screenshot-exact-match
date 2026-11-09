// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, ArrowUp, RotateCcw, Check, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ChatMessage } from "../../types";
import { DAY_NAMES, getLocalDateString } from "../../utils/dateUtils";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";

export const AssistantModal: React.FC = () => {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    goals,
    tasks,
    streakDays,
    preferences,
    nextPendingTask,
    overallProgress,
    executeAssistantAction,
    showToast,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("delux_assistant_chat");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed
            .filter(
              (message) =>
                message &&
                typeof message.id === "string" &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string",
            )
            .map((message) => ({
              ...message,
              actions: Array.isArray(message.actions)
                ? message.actions.filter((action) => action && typeof action === "object")
                : [],
            }))
        : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [routineDays, setRoutineDays] = useState<number[]>([]);
  const [routineStartDate, setRoutineStartDate] = useState("");
  const [routineDuration, setRoutineDuration] = useState("30");
  const [routineTime, setRoutineTime] = useState("");
  const [routineMinutes, setRoutineMinutes] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const followLatestRef = useRef(true);

  // Sync chat to local storage
  useEffect(() => {
    try {
      localStorage.setItem("delux_assistant_chat", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save assistant chat", e);
    }
  }, [messages]);

  // Follow new messages only when the reader is already near the latest one.
  useEffect(() => {
    if (isAssistantOpen && followLatestRef.current) {
      const reduce = preferences.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      messagesEndRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
    }
  }, [messages, isAssistantOpen, isLoading, preferences.reducedMotion]);

  useEffect(() => {
    if (!isAssistantOpen) return;
    followLatestRef.current = true;
    const viewport = window.visualViewport;
    const resize = () => {
      const screen = screenRef.current;
      if (!screen) return;
      screen.style.height = `${viewport?.height ?? window.innerHeight}px`;
      screen.style.top = `${viewport?.offsetTop ?? 0}px`;
      if (followLatestRef.current && feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
    };
  }, [isAssistantOpen]);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  }, [input, isAssistantOpen]);

  const present = useAnimatedPresence(isAssistantOpen, preferences.reducedMotion);
  if (!present) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    followLatestRef.current = true;
    setError(null);
    setLastFailedText(null);
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Build real-time full app context
    const context = {
      currentDate: getLocalDateString(new Date()),
      currentDayOfWeekName: DAY_NAMES[new Date().getDay()],
      streakDays,
      availableDays: preferences.availableDays,
      dailyMinutes: preferences.dailyMinutes,
      preferredTime: preferences.preferredTime,
      rhythm: preferences.rhythm,
      goalsCount: goals.length,
      overallProgress,
      nextTaskTitle: nextPendingTask?.title,
      nextTaskGoal: nextPendingTask?.goal?.title,
      nextTaskDuration: nextPendingTask?.durationMinutes,
      goals: goals.map((g) => {
        const gTasks = tasks.filter((t) => t.goalId === g.id);
        const done = gTasks.filter((t) => t.completed).length;
        const progress = gTasks.length > 0 ? Math.round((done / gTasks.length) * 100) : 0;
        return { id: g.id, title: g.title, progress, category: g.category };
      }),
      tasks: tasks.map((t) => {
        const g = goals.find((goal) => goal.id === t.goalId);
        return {
          id: t.id,
          title: t.title,
          instruction: t.instruction,
          date: t.date,
          time: t.time || null,
          durationMinutes: t.durationMinutes,
          completed: t.completed,
          goalId: t.goalId,
          goalTitle: g?.title || "Geral",
        };
      }),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      // Send only recent messages (up to 8 turns) to maintain lightning-fast response times
      const trimmedPayloadMessages = newMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: trimmedPayloadMessages,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na comunicação com o assistente de IA.");
      }

      // Assistant actions are proposals only. Nothing mutates the app until the user approves.
      const assistantActions = Array.isArray(data.actions)
        ? data.actions
            .filter((action: any) => action && typeof action === "object")
            .map((action: any) => ({ ...action, applied: false }))
        : [];

      const assistantMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant",
        content:
          assistantActions.length > 0
            ? `${data.reply}\n\nRevise as alterações sugeridas abaixo. Nada será alterado até você aprovar.`
            : data.reply,
        timestamp: new Date().toISOString(),
        actions: assistantActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Failed to get Gemini response:", err);
      setLastFailedText(text);
      if (err.name === "AbortError") {
        setError("A resposta demorou um pouco além do esperado. Clique em Tentar novamente.");
      } else {
        setError(err.message || "Falha ao conectar com a IA.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const toggleRoutineDay = (day: number) => {
    setRoutineDays((current) => current.includes(day)
      ? current.filter((item) => item !== day)
      : [...current, day].sort((a, b) => a - b));
  };

  const handleConfirmRoutine = () => {
    if (routineDays.length === 0 || !routineStartDate || !routineTime) {
      showToast("Escolha os dias, a data de início e o horário.", "error");
      return;
    }
    const dayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const selectedDays = routineDays.map((day) => dayNames[day]).join(", ");
    const timeNames = { morning: "manhã", afternoon: "tarde", evening: "noite" };
    const message = [
      "Quero usar estas preferências para montar meu plano:",
      `Dias disponíveis: ${selectedDays}.`,
      `Data de início: ${routineStartDate}.`,
      `Duração: ${routineDuration} dias.`,
      `Horário preferido: ${timeNames[routineTime]}.`,
      `Tempo disponível por dia: ${routineMinutes} minutos.`,
      "Considere essas escolhas confirmadas e continue o planejamento."
    ].join("\\n");
    handleSendMessage(message);
  };

  const handleApproveAction = (messageId: string, actionId: string) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    const targetAction = targetMessage?.actions?.find((action) => action.id === actionId);
    if (!targetAction || targetAction.applied !== false) return;
    let applied = false;
    try {
      applied = executeAssistantAction(targetAction);
    } catch (actionError) {
      console.error("Failed to apply approved assistant action:", actionError);
    }
    setMessages((prev) =>
      prev.map((message) =>
        message.id !== messageId
          ? message
          : {
              ...message,
              actions: message.actions?.map((action) =>
                action.id === actionId ? { ...action, applied } : action,
              ),
            },
      ),
    );
    if (!applied)
      showToast("A alteração não foi aplicada. Revise os dados e tente novamente.", "error");
  };

  const handleDiscardAction = (messageId: string, actionId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id !== messageId
          ? message
          : {
              ...message,
              actions: message.actions?.map((action) =>
                action.id === actionId ? { ...action, applied: undefined } : action,
              ),
            },
      ),
    );
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem("delux_assistant_chat");
    showToast("Conversa limpa.", "info");
  };

  return (
    <div
      ref={screenRef}
      role="dialog"
      data-motion-state={isAssistantOpen ? "open" : "closed"}
      inert={!isAssistantOpen}
      aria-modal="true"
      aria-labelledby="assistant-title"
      className="delux-chat-screen fixed inset-0 z-50 flex flex-col"
    >
      <header className="delux-chat-top flex items-center justify-between gap-3 shrink-0 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles aria-hidden="true" className="w-4 h-4 text-delux-accent shrink-0" />
          <span id="assistant-title" className="text-sm font-semibold">Assistente</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="delux" size="delux" onClick={handleClearChat}
            disabled={isLoading || messages.length === 0}
            title="Limpar conversa" aria-label="Limpar conversa" className="delux-chat-control">
            <RotateCcw className="w-[18px] h-[18px]" />
          </Button>
          <Button variant="delux" size="delux" onClick={() => setIsAssistantOpen(false)}
            title="Fechar assistente" aria-label="Fechar assistente" className="delux-chat-control">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div ref={feedRef} className="delux-chat-feed flex-1 min-h-0 w-full overflow-y-auto"
        onScroll={() => {
          const feed = feedRef.current;
          if (feed) followLatestRef.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
        }}>
        <div className="delux-chat-thread mx-auto w-full max-w-3xl">
          {messages.map((m, index) => (
            <div key={m.id}
              className={`delux-chat-message flex ${m.role === "user" ? "justify-end" : "justify-start"} ${messages[index - 1]?.role === m.role ? "delux-chat-grouped" : ""}`}>
              <div className={`delux-chat-bubble ${m.role === "user" ? "delux-chat-user" : "delux-chat-assistant"}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && index === messages.length - 1 &&
                  /quais dias|dias da semana|data.*começar|duração ideal|disponibilidade para/i.test(m.content) && (
                  <section className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5" aria-label="Preferências do plano">
                    <div>
                      <p className="text-sm font-semibold">Vamos configurar sua rotina</p>
                      <p className="mt-1 text-xs text-delux-secondary">Toque para escolher. Você não precisa digitar.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-delux-secondary">DIAS DISPONÍVEIS</p>
                      <div className="grid grid-cols-4 gap-2">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label, day) => (
                          <button key={day} type="button" aria-pressed={routineDays.includes(day)}
                            onClick={() => toggleRoutineDay(day)}
                            className={`min-h-10 rounded-xl border px-2 text-xs font-semibold transition-colors ${routineDays.includes(day) ? "border-delux-accent bg-delux-accent/15 text-delux-accent" : "border-white/10 bg-white/[0.03] text-delux-secondary"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-delux-secondary" htmlFor="delux-plan-start">DATA DE INÍCIO</label>
                      <input id="delux-plan-start" type="date" min={getLocalDateString(new Date())} value={routineStartDate}
                        onChange={(event) => setRoutineStartDate(event.target.value)}
                        className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-foreground [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-delux-secondary">DURAÇÃO DO PLANO</p>
                      <div className="grid grid-cols-4 gap-2">
                        {["30", "45", "60", "90"].map((days) => (
                          <button key={days} type="button" aria-pressed={routineDuration === days} onClick={() => setRoutineDuration(days)}
                            className={`min-h-10 rounded-xl border text-xs font-semibold ${routineDuration === days ? "border-delux-accent bg-delux-accent/15 text-delux-accent" : "border-white/10 bg-white/[0.03] text-delux-secondary"}`}>
                            {days} dias
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-delux-secondary">HORÁRIO PREFERIDO</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[["morning", "Manhã"], ["afternoon", "Tarde"], ["evening", "Noite"]].map(([value, label]) => (
                          <button key={value} type="button" aria-pressed={routineTime === value} onClick={() => setRoutineTime(value)}
                            className={`min-h-10 rounded-xl border text-xs font-semibold ${routineTime === value ? "border-delux-accent bg-delux-accent/15 text-delux-accent" : "border-white/10 bg-white/[0.03] text-delux-secondary"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-delux-secondary">TEMPO DISPONÍVEL POR DIA</p>
                      <div className="grid grid-cols-4 gap-2">
                        {["15", "30", "45", "60"].map((minutes) => (
                          <button key={minutes} type="button" aria-pressed={routineMinutes === minutes} onClick={() => setRoutineMinutes(minutes)}
                            className={`min-h-10 rounded-xl border text-xs font-semibold ${routineMinutes === minutes ? "border-delux-accent bg-delux-accent/15 text-delux-accent" : "border-white/10 bg-white/[0.03] text-delux-secondary"}`}>
                            {minutes} min
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button variant="delux" size="delux" type="button" onClick={handleConfirmRoutine}
                      disabled={isLoading || routineDays.length === 0 || !routineStartDate || !routineTime}
                      className="w-full rounded-full py-3 text-sm font-semibold">
                      Confirmar rotina
                    </Button>
                  </section>
                )}
                {m.actions && m.actions.length > 0 && (
                  <div className="delux-chat-actions mt-3 pt-3 space-y-3">
                    <span className="text-xs text-delux-secondary">
                      {m.actions.every((act) => act.applied === true) ? "Alterações aplicadas"
                        : m.actions.some((act) => act.applied === false) ? "Aguardando sua aprovação" : "Alterações descartadas"}
                    </span>
                    {m.actions.map((act) => (
                      <div key={act.id} className="delux-chat-action space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="shrink-0 mt-0.5 text-delux-secondary">
                            {act.applied === true ? <Check className="w-4 h-4" /> : act.applied === false
                              ? <AlertCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </span>
                          <span className="font-medium leading-relaxed min-w-0">{act.summary}</span>
                        </div>
                        {act.type === "create_goal" && Array.isArray(act.payload?.steps) && (
                          <div className="space-y-3">
                            {act.payload.steps.map((step: any, index: number) => (
                              <div key={index} className="text-xs leading-relaxed">
                                <span className="font-semibold">{index + 1}. {step.title}</span>
                                <span className="text-delux-secondary"> · {Math.min(preferences.dailyMinutes, Number(step.durationMinutes) || preferences.dailyMinutes)} min</span>
                                {step.instruction && <p className="mt-1 text-delux-secondary whitespace-pre-wrap">{step.instruction}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                        {act.applied === false && (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="delux" size="delux" type="button"
                              onClick={() => handleApproveAction(m.id, act.id)} className="delux-chat-approve px-3 py-2 text-xs font-semibold rounded-full">
                              Aprovar e aplicar
                            </Button>
                            <Button variant="delux" size="delux" type="button"
                              onClick={() => handleDiscardAction(m.id, act.id)} className="delux-chat-discard px-3 py-2 text-xs font-medium rounded-full">
                              Descartar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div role="status" aria-label="Assistente respondendo" className="delux-chat-message flex justify-start">
              <div className="delux-chat-bubble delux-chat-assistant delux-chat-typing flex items-center gap-1.5">
                <span /><span /><span />
              </div>
            </div>
          )}
          {error && (
            <div role="alert" className="delux-chat-bubble delux-chat-assistant mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-1" /><p>{error}</p></div>
              {lastFailedText && <Button variant="delux" size="delux" type="button"
                onClick={() => handleSendMessage(lastFailedText)} className="delux-chat-discard rounded-full px-3 py-2 text-xs flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" />Tentar novamente
              </Button>}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="delux-chat-composer shrink-0 w-full">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="delux-chat-composer-inner flex items-end gap-2 max-w-3xl mx-auto">
          <div className="delux-chat-field flex-1 min-w-0">
            <textarea ref={inputRef} rows={1} aria-label="Mensagem" placeholder="Mensagem" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault(); handleSendMessage();
                }
              }}
              className="block w-full resize-none bg-transparent text-base focus:outline-none"
            />
          </div>
          <Button variant="delux" size="delux" type="submit" disabled={isLoading || !input.trim()}
            className="delux-chat-send flex items-center justify-center shrink-0 rounded-full" aria-label="Enviar mensagem">
            <ArrowUp className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
};
