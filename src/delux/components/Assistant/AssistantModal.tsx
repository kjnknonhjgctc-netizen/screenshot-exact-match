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
