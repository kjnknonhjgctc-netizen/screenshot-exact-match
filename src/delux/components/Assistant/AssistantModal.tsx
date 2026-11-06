// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  Flame,
  Check,
  Target,
  Clock,
  AlertCircle,
  Lightbulb,
  Zap,
  Calendar,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ChatMessage, GoalCategory } from "../../types";
import { DAY_NAMES, getLocalDateString } from "../../utils/dateUtils";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";

const STARTER_PROMPTS = [
  "Reagende minha próxima tarefa para amanhã às 14:00",
  "Ajuste meus dias de rotina para Segunda, Quarta e Sexta",
  "Adicione uma etapa de 20 min de leitura hoje às 20:30",
  "Estou sem tempo hoje, reduza meu tempo diário para 15 min",
];

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
    addGoal,
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

  // Sync chat to local storage
  useEffect(() => {
    try {
      localStorage.setItem("delux_assistant_chat", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save assistant chat", e);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAssistantOpen) {
      const reduce =
        preferences.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      messagesEndRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [messages, isAssistantOpen, isLoading, preferences.reducedMotion]);

  const present = useAnimatedPresence(isAssistantOpen, preferences.reducedMotion);
  if (!present) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

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
      role="dialog"
      data-motion-state={isAssistantOpen ? "open" : "closed"}
      inert={!isAssistantOpen}
      aria-modal="true"
      aria-labelledby="assistant-title"
      className="delux-chat-screen fixed inset-0 z-50 flex flex-col bg-delux-canvas text-delux-text animate-in fade-in duration-200"
    >
      {/* Minimal top controls: no title bar or status text. The device owns its status bar. */}
      <div className="delux-chat-top flex items-center justify-end gap-2 px-4 shrink-0">
        {messages.length > 0 && (
          <Button
            variant="delux"
            size="delux"
            onClick={handleClearChat}
            title="Limpar histórico da conversa"
            aria-label="Limpar conversa"
            className="w-10 h-10 rounded-full text-delux-secondary hover:text-delux-text bg-delux-elevated/70 border border-delux-border/70 flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="delux"
          size="delux"
          onClick={() => setIsAssistantOpen(false)}
          aria-label="Fechar assistente"
          className="w-10 h-10 rounded-full text-delux-secondary hover:text-delux-text bg-delux-elevated/70 border border-delux-border/70 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="delux-chat-feed flex-1 min-h-0 w-full max-w-4xl mx-auto overflow-y-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto space-y-5 pt-4 sm:pt-10">
            <div className="delux-chat-welcome rounded-3xl border border-delux-border bg-delux-elevated/70 p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-delux-accent">
                <Sparkles className="w-5 h-5" />
                <span>Como posso ajudar sua rotina?</span>
              </div>
              <p className="text-sm text-delux-secondary leading-relaxed">
                Sou seu assistente de execução e estratégia. Posso ajudar a criar metas,
                organizar etapas, ajustar horários e adaptar seus planos à sua rotina.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-delux-muted block px-1">
                Sugestões rápidas
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {STARTER_PROMPTS.map((prompt) => (
                  <Button
                    variant="delux"
                    size="delux"
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="delux-chat-suggestion w-full p-4 rounded-2xl bg-delux-elevated/70 border border-delux-border hover:border-delux-action/50 text-left text-sm font-medium text-delux-text transition-all flex items-center justify-between gap-3"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-4 h-4 text-delux-action shrink-0" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`delux-chat-message flex items-end gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-10 h-10 rounded-2xl bg-delux-elevated border border-delux-border text-delux-accent flex items-center justify-center shrink-0 mb-1">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}

              <div
                className={`delux-chat-bubble max-w-[88%] sm:max-w-[82%] px-4 sm:px-5 py-4 rounded-[24px] text-[15px] sm:text-base leading-relaxed space-y-3 ${
                  m.role === "user"
                    ? "delux-chat-user bg-delux-elevated border border-delux-border text-delux-text rounded-br-md"
                    : "delux-chat-assistant bg-delux-elevated/80 border border-delux-border text-delux-text rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {m.actions && m.actions.length > 0 && (
                  <div className="pt-3 border-t border-delux-border space-y-3 mt-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-delux-accent">
                      <Zap className="w-4 h-4" />
                      <span>
                        {m.actions.every((act) => act.applied === true)
                          ? "Alterações aplicadas"
                          : m.actions.some((act) => act.applied === false)
                            ? "Aguardando sua aprovação"
                            : "Alterações descartadas"}
                      </span>
                    </div>
                    {m.actions.map((act) => (
                      <div
                        key={act.id}
                        className="delux-chat-action rounded-2xl bg-delux-canvas/90 border border-delux-border p-3.5 space-y-3"
                      >
                        <div className="flex items-start gap-3 text-sm">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${act.applied === true ? "bg-delux-success/20 text-delux-success" : act.applied === false ? "bg-delux-attention/20 text-delux-attention" : "bg-delux-muted/20 text-delux-muted"}`}
                          >
                            {act.applied === true ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : act.applied === false ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </span>
                          <span className="font-medium text-delux-text leading-snug flex-1">
                            {act.summary}
                          </span>
                        </div>
                        {act.type === "create_goal" && Array.isArray(act.payload?.steps) && (
                          <div className="pl-10 space-y-2">
                            {act.payload.steps.slice(0, 14).map((step: any, index: number) => (
                              <div key={index} className="text-xs text-delux-secondary">
                                <span className="font-semibold text-delux-text">
                                  {index + 1}. {step.title}
                                </span>
                                <span> · {Math.min(preferences.dailyMinutes, Number(step.durationMinutes) || preferences.dailyMinutes)} min</span>
                                {step.instruction && (
                                  <p className="mt-1 leading-relaxed">{step.instruction}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {act.applied === false && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                              variant="delux"
                              size="delux"
                              type="button"
                              onClick={() => handleDiscardAction(m.id, act.id)}
                              className="px-4 py-2.5 rounded-xl bg-delux-elevated text-delux-secondary text-xs font-semibold"
                            >
                              Descartar
                            </Button>
                            <Button
                              variant="delux"
                              size="delux"
                              type="button"
                              onClick={() => handleApproveAction(m.id, act.id)}
                              className="px-4 py-2.5 rounded-xl bg-delux-action text-delux-light text-xs font-semibold"
                            >
                              Aprovar e aplicar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-delux-elevated border border-delux-border text-delux-secondary flex items-center justify-center shrink-0 mb-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-sm text-delux-secondary">
            <div className="w-10 h-10 rounded-2xl bg-delux-elevated border border-delux-border text-delux-accent flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="rounded-2xl bg-delux-elevated border border-delux-border px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-delux-action animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-delux-action animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-delux-action animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-xs">Pensando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-delux-danger/15 border border-delux-danger/30 text-sm text-delux-warning space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {lastFailedText && (
              <div className="flex justify-end">
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => handleSendMessage(lastFailedText)}
                  className="px-4 py-2 rounded-xl bg-delux-danger/20 text-delux-danger-text text-sm font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tentar novamente</span>
                </Button>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="delux-chat-composer shrink-0 w-full px-3 sm:px-6 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="delux-chat-composer-inner flex items-center gap-2 max-w-4xl mx-auto rounded-[28px] p-2"
        >
          <input
            type="text"
            aria-label="Mensagem"
            placeholder="Mensagem"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="min-w-0 flex-1 px-4 sm:px-5 py-3.5 rounded-full bg-delux-elevated border border-delux-border text-[15px] sm:text-base text-delux-text placeholder-delux-secondary focus:border-delux-action focus:outline-none transition-colors min-h-[56px]"
          />
          <Button
            variant="delux"
            size="delux"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="delux-chat-send w-14 h-14 rounded-full bg-delux-action hover:bg-delux-action-hover active:opacity-85 disabled:opacity-35 text-delux-light flex items-center justify-center shrink-0 transition-all"
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
};
