// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, ArrowUp, RotateCcw, Check, AlertCircle, Plus, History, ImagePlus, Mic, Square, ChevronLeft } from "lucide-react";
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
    updatePreferences,
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatArchive, setChatArchive] = useState<{ id: string; title: string; messages: ChatMessage[] }[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("delux_assistant_archive") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  });
  const [photo, setPhoto] = useState<{ data: string; name: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
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

  useEffect(() => {
    try { localStorage.setItem("delux_assistant_archive", JSON.stringify(chatArchive)); } catch {}
  }, [chatArchive]);

  const startNewChat = () => {
    if (messages.length) {
      setChatArchive((prev) => [{
        id: String(Date.now()),
        title: messages.find((m) => m.role === "user")?.content.slice(0, 48) || "Conversa",
        messages,
      }, ...prev].slice(0, 30));
    }
    setMessages([]);
    setPhoto(null);
    setInput("");
    setHistoryOpen(false);
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      showToast("Selecione uma imagem de até 4 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto({ data: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("O reconhecimento de voz não está disponível neste navegador.", "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput((current) => [current, transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = () => { setListening(false); showToast("Não foi possível captar sua voz.", "error"); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setListening(false); }
  };

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

  const handleSendMessage = async (textToSend?: string, contextOverrides: Record<string, unknown> = {}) => {
    const text = (textToSend || input).trim();
    if ((!text && !photo) || isLoading) return;
    const imageToSend = photo;
    const messageText = text || "Analise a imagem que enviei.";
    setPhoto(null);

    followLatestRef.current = true;
    setError(null);
    setLastFailedText(null);
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: imageToSend ? `${messageText}\n📷 Imagem anexada: ${imageToSend.name}` : messageText,
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
      ...contextOverrides,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      // Send only recent messages (up to 8 turns) to maintain lightning-fast response times
      const trimmedPayloadMessages = newMessages.slice(-8).map((m, i, arr) => ({
        role: m.role,
        content: m.content,
        ...(i === arr.length - 1 && imageToSend ? { image: imageToSend.data } : {}),
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

      const responseText = await res.text();
      const contentType = res.headers.get("content-type") || "";
      let data: any;
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("O servidor do assistente retornou JSON inválido. Nenhuma proposta foi criada. Verifique os logs da rota /api/assistant/chat.");
        }
      } else {
        console.error("Assistant endpoint returned non-JSON response:", {
          status: res.status,
          contentType,
          preview: responseText.slice(0, 300),
        });
        throw new Error(
          res.status === 404
            ? "A rota do assistente não foi encontrada no deploy. Sincronize/republique o projeto no Lovable."
            : `O servidor do assistente retornou uma página HTML (HTTP ${res.status}) em vez de JSON. Verifique o deploy e os logs do servidor.`,
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || "Erro na comunicação com o assistente de IA.");
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
    const today = getLocalDateString(new Date());
    if (routineStartDate < today) {
      showToast("A data de início não pode estar no passado.", "error");
      return;
    }
    const dayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const selectedDays = routineDays.map((day) => dayNames[day]).join(", ");
    const timeNames = { morning: "manhã", afternoon: "tarde", evening: "noite" };
    const dailyMinutes = Number(routineMinutes);
    const preferencesSaved = updatePreferences({
      availableDays: routineDays,
      dailyMinutes,
      preferredTime: routineTime,
    });
    if (!preferencesSaved) return;

    const message = [
      "Quero criar um plano com estas preferências CONFIRMADAS:",
      `Dias disponíveis: ${selectedDays} (valores: ${routineDays.join(", ")}; 0=domingo, 1=segunda, ..., 6=sábado).`,
      `Data de início: ${routineStartDate}.`,
      `Duração total: ${routineDuration} dias.`,
      `Horário preferido: ${timeNames[routineTime]}.`,
      `Tempo disponível por dia: ${dailyMinutes} minutos.`,
      "Não pergunte novamente esses dados. Use exatamente essas escolhas para criar a proposta da meta, distribuir as etapas somente nos dias selecionados e respeitar a data de início e a duração. Mostre a proposta para minha aprovação antes de aplicar."
    ].join("\\n");
    handleSendMessage(message, {
      availableDays: routineDays,
      dailyMinutes,
      preferredTime: routineTime,
    });
  };

  const handleApproveAction = (messageId: string, actionId: string) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    const targetAction = targetMessage?.actions?.find((action) => action.id === actionId);
    if (!targetAction || targetAction.applied !== false) return;
    let applied = false;
    let applyError = "";
    try {
      if (targetAction.type === "create_goal" &&
        (!targetAction.payload?.startDate || !Array.isArray(targetAction.payload?.availableDays) ||
          targetAction.payload.availableDays.length === 0)) {
        applyError = "Esta proposta foi criada sem data de início ou dias disponíveis. Peça ao Assistente para gerar a proposta novamente e confirme sua rotina.";
      } else {
        applied = executeAssistantAction(targetAction);
        if (!applied) applyError = "O DELUX recusou esta alteração por inconsistência nos dados ou no calendário. Gere uma nova proposta para tentar novamente.";
      }
    } catch (actionError) {
      console.error("Failed to apply approved assistant action:", actionError);
      applyError = actionError instanceof Error ? actionError.message : "Ocorreu um erro inesperado ao aplicar a alteração.";
    }
    setMessages((prev) =>
      prev.map((message) =>
        message.id !== messageId
          ? message
          : {
              ...message,
              actions: message.actions?.map((action) =>
                action.id === actionId ? { ...action, applied, applyError } : action,
              ),
            },
      ),
    );
    if (!applied)
      showToast(applyError || "A alteração não foi aplicada. Revise os dados e tente novamente.", "error");
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
      <header className="flex shrink-0 items-center justify-between px-4 py-3 bg-delux-bg/95">
        <span id="assistant-title" className="text-sm font-semibold text-delux-text">DELUX</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setHistoryOpen((value) => !value)} aria-label="Histórico de conversas"
            className="p-2.5 rounded-full text-delux-secondary hover:bg-white/10"><History className="w-5 h-5" /></button>
          <button type="button" onClick={startNewChat} aria-label="Nova conversa"
            className="p-2.5 rounded-full text-delux-secondary hover:bg-white/10"><Plus className="w-5 h-5" /></button>
          <button type="button" onClick={() => setIsAssistantOpen(false)} aria-label="Fechar assistente"
            className="p-2.5 rounded-full text-delux-secondary hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
      </header>
      {historyOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-delux-bg p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Histórico</h2>
            <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Voltar ao chat" className="p-2 rounded-full hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></button>
          </div>
          <button type="button" onClick={startNewChat} className="text-left rounded-xl border border-delux-border px-4 py-3 mb-4">+ Nova conversa</button>
          {chatArchive.length === 0 && <p className="text-sm text-delux-secondary">Suas conversas anteriores aparecerão aqui.</p>}
          {chatArchive.map((chat) => (
            <button key={chat.id} type="button" onClick={() => {
              if (messages.length) setChatArchive((prev) => [{ id: String(Date.now()), title: messages.find((m) => m.role === "user")?.content.slice(0, 48) || "Conversa", messages }, ...prev.filter((item) => item.id !== chat.id)].slice(0, 30));
              else setChatArchive((prev) => prev.filter((item) => item.id !== chat.id));
              setMessages(chat.messages);
              setHistoryOpen(false);
            }} className="text-left truncate px-4 py-3 rounded-xl hover:bg-white/10 text-sm">{chat.title}</button>
          ))}
        </div>
      )}

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
                        {act.applyError && act.applied !== true && (
                          <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs leading-relaxed text-red-200">
                            {act.applyError}
                          </p>
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
        {photo && <div className="max-w-3xl mx-auto px-4 pb-2 flex items-center gap-2 text-xs text-delux-secondary">
          <ImagePlus className="w-4 h-4" /><span className="truncate">{photo.name}</span>
          <button type="button" onClick={() => setPhoto(null)} aria-label="Remover foto"><X className="w-4 h-4" /></button>
        </div>}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="delux-chat-composer-inner flex items-end gap-2 max-w-3xl mx-auto">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(event) => { handlePhoto(event.target.files?.[0]); event.target.value = ""; }} />
          <button type="button" onClick={() => photoRef.current?.click()} aria-label="Enviar foto" title="Adicionar foto" className="shrink-0 p-2 rounded-full text-delux-secondary hover:bg-white/10"><ImagePlus className="w-5 h-5" /></button>
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
          <button type="button" onClick={toggleVoice} aria-label={listening ? "Parar ditado" : "Ditar mensagem"} className={`shrink-0 p-2 rounded-full ${listening ? "text-red-400" : "text-delux-secondary"}`}>{listening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
          <Button variant="delux" size="delux" type="submit" disabled={isLoading || (!input.trim() && !photo)}
            className="delux-chat-send flex items-center justify-center shrink-0 rounded-full" aria-label="Enviar mensagem">
            <ArrowUp className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
};
