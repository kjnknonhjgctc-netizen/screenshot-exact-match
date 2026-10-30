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
        ? parsed.filter((message) => message && typeof message.id === 'string' &&
            ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
            .map((message) => ({
              ...message,
              actions: Array.isArray(message.actions)
                ? message.actions.filter((action) => action && typeof action === 'object')
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
      const reduce = preferences.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      messagesEndRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
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

      // Apply actions and preserve the real execution result in the chat.
      const assistantActions = Array.isArray(data.actions)
        ? data.actions
            .filter((action: any) => action && typeof action === 'object')
            .map((action: any) => {
              try {
                return { ...action, applied: executeAssistantAction(action) };
              } catch (actionError) {
                console.error('Failed to apply assistant action:', actionError);
                return { ...action, applied: false };
              }
            })
        : [];
      const failedActions = assistantActions.filter((action: any) => !action.applied).length;

      const assistantMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant",
        content: failedActions > 0
          ? `${data.reply}\n\nAtenção: ${failedActions} alteração(ões) não foi(ram) aplicada(s). Confira a validação exibida antes de considerar sua programação atualizada.`
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 delux-glass-overlay animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 z-0"
        onClick={() => setIsAssistantOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:w-[440px] h-[92dvh] sm:h-[680px] max-h-[92dvh] rounded-t-[32px] sm:rounded-2xl delux-glass-panel border-t sm:border text-delux-text flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-delux-border-hover rounded-full" />
        </div>

        {/* Assistant Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-delux-border shrink-0 bg-delux-canvas/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-delux-purple to-delux-purple-light text-delux-light flex items-center justify-center shadow-md shadow-delux-purple/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="assistant-title" className="text-sm font-extrabold text-delux-text">
                  Assistente Delux IA
                </h3>
                <span className="text-[9px] font-bold text-delux-purple bg-delux-purple/15 px-1.5 py-0.5 rounded">
                  IA
                </span>
              </div>
              <p className="text-[10px] text-delux-secondary">Coach de execução e estratégia</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="delux"
                size="delux"
                onClick={handleClearChat}
                title="Limpar histórico da conversa"
                className="w-9 h-9 rounded-xl text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="delux"
              size="delux"
              onClick={() => setIsAssistantOpen(false)}
              className="w-9 h-9 rounded-xl text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Real Context Synchronization Pill */}
        <div className="px-4 py-2 bg-delux-elevated/70 border-b border-delux-border/60 flex items-center justify-between text-[11px] text-delux-secondary shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-delux-green" />
            <span className="truncate">
              Conectado: {goals.length} {goals.length === 1 ? "meta" : "metas"} · {streakDays}d de
              sequência
            </span>
          </div>
          <span className="font-semibold text-delux-purple-light shrink-0 tabular-nums">
            {overallProgress}% avanço
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-delux-elevated border border-delux-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-delux-purple-light">
                  <Lightbulb className="w-4 h-4" />
                  <span>Como posso ajudar sua rotina?</span>
                </div>
                <p className="text-xs text-delux-secondary leading-relaxed">
                  Sou o assistente inteligente do Delux com conexão direta ao <strong>IA</strong>.
                  Tenho acesso completo para reagendar tarefas em dias e horários da semana,
                  redistribuir rotinas, criar metas ou orientar sua consistência diária.
                </p>
              </div>

              {/* Starter chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-delux-muted block px-1">
                  Sugestões Rápidas
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <Button
                      variant="delux"
                      size="delux"
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 rounded-xl bg-delux-card border border-delux-border hover:border-delux-purple/50 active:bg-delux-elevated text-left text-xs font-medium text-delux-text transition-all flex items-center justify-between gap-2 active:opacity-85"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-delux-purple shrink-0" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-delux-purple/20 text-delux-purple-light flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    m.role === "user"
                      ? "bg-delux-purple text-delux-light font-medium rounded-tr-sm"
                      : "bg-delux-elevated border border-delux-border text-delux-text rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Render executed actions if any */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="pt-2 border-t border-delux-border space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-delux-purple-light">
                        <Zap className="w-3 h-3 text-delux-purple-light" />
                        <span>{m.actions.every((act) => act.applied !== false) ? "Ações aplicadas no app" : m.actions.some((act) => act.applied !== false) ? "Algumas ações foram aplicadas" : "Nenhuma ação foi aplicada"}</span>
                      </div>
                      <div className="space-y-1">
                        {m.actions.map((act) => (
                          <div
                            key={act.id}
                            className="p-2 rounded-xl bg-delux-canvas/80 border border-delux-purple/30 text-[11px] text-delux-ai-text flex items-center gap-2"
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${act.applied !== false ? "bg-delux-purple/20 text-delux-purple-light" : "bg-delux-danger/20 text-delux-red"}`}>
                              {act.applied !== false ? <Check className="w-3 h-3 stroke-[3]" /> : <AlertCircle className="w-3 h-3" />}
                            </span>
                            <span className="font-medium text-delux-text leading-tight flex-1">
                              {act.summary}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-delux-border text-delux-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2.5 justify-start items-center text-xs text-delux-secondary">
              <div className="w-7 h-7 rounded-lg bg-delux-purple/20 text-delux-purple-light flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-delux-elevated border border-delux-border flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-delux-purple animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-delux-purple animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-delux-purple animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] text-delux-secondary">Pensando...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-delux-danger/15 border border-delux-danger/30 text-xs text-delux-red space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {lastFailedText && (
                <div className="pt-1 flex justify-end">
                  <Button
                    variant="delux"
                    size="delux"
                    type="button"
                    onClick={() => handleSendMessage(lastFailedText)}
                    className="px-3 py-1.5 rounded-lg bg-delux-danger/20 hover:bg-delux-danger/30 text-delux-danger-text text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tentar novamente</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="delux-assistant-input p-3 sm:p-4 bg-delux-canvas/70 border-t border-delux-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Reagendar tarefa, mudar rotina ou pedir ajuda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="min-w-0 flex-1 px-4 py-3 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-text placeholder-delux-muted focus:border-delux-purple focus:outline-none transition-colors min-h-[48px]"
            />
            <Button
              variant="delux"
              size="delux"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-xl bg-delux-purple hover:bg-delux-purple-hover active:opacity-85 disabled:opacity-40 text-delux-light flex items-center justify-center shrink-0 transition-all shadow-md shadow-delux-purple/30"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
