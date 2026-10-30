// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  X,
  Sparkles,
  Calendar as CalendarIcon,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Bot,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GoalCategory, PlanningMethod } from "../../types";
import { DAY_NAMES, getLocalDateString, addDays, parseLocalDateString } from "../../utils/dateUtils";
import { getStepsForGoal } from "../../utils/planGenerator";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";

const CATEGORIES: GoalCategory[] = [
  "Estudos",
  "Carreira",
  "Saúde e condicionamento",
  "Criatividade",
  "Finanças pessoais",
  "Hábitos",
  "Projetos pessoais",
  "Outros",
];

interface ManualTaskInput {
  title: string;
  instruction: string;
  date: string;
  durationMinutes: number;
}

const getNextAvailableDate = (availableDays: number[]) => {
  let candidate = new Date();
  candidate.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < 7; offset += 1) {
    if (availableDays.includes(candidate.getDay())) return getLocalDateString(candidate);
    candidate = addDays(candidate, 1);
  }
  return getLocalDateString(candidate);
};

export const CreateGoalModal: React.FC = () => {
  const { isCreateGoalOpen, setIsCreateGoalOpen, preferences, addGoal, openDrawer, showToast } =
    useApp();

  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Estudos");
  const [deadline, setDeadline] = useState("");
  const [method, setMethod] = useState<PlanningMethod>("auto");
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Manual tasks list if manual method chosen
  const [manualTasks, setManualTasks] = useState<ManualTaskInput[]>([
    {
      title: "",
      instruction: "",
      date: getNextAvailableDate(preferences.availableDays),
      durationMinutes: preferences.dailyMinutes,
    },
  ]);

  const present = useAnimatedPresence(isCreateGoalOpen, preferences.reducedMotion);
  if (!present) return null;

  const previewSteps =
    method === "auto" && title.trim().length > 2
      ? getStepsForGoal(title, category, preferences.dailyMinutes)
      : [];

  const handleAddManualTask = () => {
    setManualTasks((prev) => [
      ...prev,
      {
        title: "",
        instruction: "",
        date: getNextAvailableDate(preferences.availableDays),
        durationMinutes: preferences.dailyMinutes,
      },
    ]);
  };

  const handleRemoveManualTask = (index: number) => {
    setManualTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualTaskChange = (index: number, field: keyof ManualTaskInput, value: any) => {
    setManualTasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleGenerateWithGemini = async () => {
    if (!title.trim()) {
      showToast("Digite o que quer conquistar acima para a IA personalizar as etapas.", "info");
      return;
    }

    if (!Array.isArray(preferences.availableDays) || preferences.availableDays.length === 0) {
      showToast('Configure ao menos um dia disponível antes de gerar o plano.', 'error');
      return;
    }

    setIsGeneratingWithAi(true);
    setAiAdvice(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch("/api/assistant/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalTitle: title.trim(),
          category,
          reason: reason.trim(),
          dailyMinutes: preferences.dailyMinutes,
          availableDaysCount: preferences.availableDays.length,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao comunicar com o assistente de IA.");
      }

      const data = await res.json();
      const validSteps = Array.isArray(data.steps)
        ? data.steps.filter((step: any) => step && typeof step.title === 'string' && step.title.trim()).slice(0, 12)
        : [];
      if (validSteps.length > 0) {
        let currentDate = new Date();
        const availableDaysSet = new Set(
          preferences.availableDays.length > 0 ? preferences.availableDays : [1, 2, 3, 4, 5],
        );

        const newTasks: ManualTaskInput[] = validSteps.map((st: any) => {
          while (!availableDaysSet.has(currentDate.getDay())) {
            currentDate = addDays(currentDate, 1);
          }
          const taskDate = getLocalDateString(currentDate);
          currentDate = addDays(currentDate, 1);

          return {
            title: st.title || "Ação prática",
            instruction: typeof st.instruction === "string" ? st.instruction : "",
            date: taskDate,
            durationMinutes: Number.isFinite(Number(st.durationMinutes))
              ? Math.min(240, Math.max(5, Math.round(Number(st.durationMinutes))))
              : preferences.dailyMinutes,
          };
        });

        setManualTasks(newTasks);
        setMethod("manual");
        if (data.advice) {
          setAiAdvice(data.advice);
        }
        showToast("Plano personalizado gerado pela IA!", "achievement");
      } else {
        throw new Error("O modelo não retornou etapas estruturadas.");
      }
    } catch (err: any) {
      console.error("Error in handleGenerateWithGemini:", err);
      showToast(err.name === 'AbortError'
        ? 'A geração demorou mais que o esperado. Tente novamente.'
        : (err.message || "Erro ao gerar etapas com IA."), "error");
    } finally {
      window.clearTimeout(timeoutId);
      setIsGeneratingWithAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Por favor, informe o que você quer conquistar.", "error");
      return;
    }

    if (method === "auto") {
      if (preferences.availableDays.length === 0) {
        showToast("Nenhum dia disponível configurado nas preferências.", "error");
        return;
      }
      const created = addGoal({
        title: title.trim(),
        reason: reason.trim() || undefined,
        category,
        method: "auto",
        deadline: deadline || undefined,
        dailyMinutes: preferences.dailyMinutes,
      });
      if (!created) return;
    } else {
      const validTasks = manualTasks.filter((t) => t.title.trim().length > 0);
      if (validTasks.length === 0) {
        showToast("Adicione ao menos uma etapa para o plano manual.", "error");
        return;
      }
      const invalidTask = validTasks.find((task) =>
        !task.date ||
        getLocalDateString(parseLocalDateString(task.date)) !== task.date ||
        !preferences.availableDays.includes(parseLocalDateString(task.date).getDay()),
      );
      if (invalidTask) {
        showToast('Uma ou mais etapas estão em dias indisponíveis. Ajuste as datas antes de criar o plano.', 'error');
        return;
      }
      const created = addGoal(
        {
          title: title.trim(),
          reason: reason.trim() || undefined,
          category,
          method: "manual",
          deadline: deadline || undefined,
          dailyMinutes: preferences.dailyMinutes,
        },
        validTasks,
      );
      if (!created) return;
    }

    setIsCreateGoalOpen(false);
    // Reset form
    setTitle("");
    setReason("");
    setDeadline("");
    setCategory("Estudos");
    setMethod("auto");
    setManualTasks([{
      title: "",
      instruction: "",
      date: getNextAvailableDate(preferences.availableDays),
      durationMinutes: preferences.dailyMinutes,
    }]);
    setAiAdvice(null);
  };

  const availableDayNames = preferences.availableDays
    .map((d) => DAY_NAMES[d].replace("-feira", ""))
    .join(", ");

  return (
    <div
      role="dialog"
      data-motion-state={isCreateGoalOpen ? "open" : "closed"}
      inert={!isCreateGoalOpen}
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 delux-glass-overlay animate-in fade-in duration-200"
    >
      {/* Background click to dismiss */}
      <div
        className="fixed inset-0 z-0"
        onClick={() => setIsCreateGoalOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-2xl delux-glass-panel border-t sm:border text-delux-text flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-delux-border-hover rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3 sm:py-4 border-b border-delux-border/80 shrink-0">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-delux-text">
              Criar Nova Meta
            </h3>
            <p className="text-xs text-delux-secondary mt-0.5">
              Transforme sua intenção em etapas para a sua rotina real.
            </p>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={() => setIsCreateGoalOpen(false)}
            className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-text hover:bg-delux-elevated transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5"
        >
          {/* O que quer conquistar */}
          <div>
            <label
              htmlFor="goal-title"
              className="block text-xs font-semibold text-delux-text mb-1.5"
            >
              O que você quer conquistar? *
            </label>
            <input
              id="goal-title"
              type="text"
              required
              placeholder="Ex: Aprender violão, Correr 5 km, Dominar React..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-delux-elevated border border-delux-border focus:border-delux-purple focus:outline-none text-sm text-delux-text placeholder-delux-muted transition-colors min-h-[48px]"
            />
          </div>

          {/* Por que é importante */}
          <div>
            <label
              htmlFor="goal-reason"
              className="block text-xs font-semibold text-delux-secondary mb-1.5"
            >
              Por que isso é importante para você?{" "}
              <span className="text-[10px] text-delux-muted">(opcional)</span>
            </label>
            <input
              id="goal-reason"
              type="text"
              placeholder="Ex: Para tocar com amigos, crescer na carreira..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-delux-elevated border border-delux-border focus:border-delux-purple focus:outline-none text-xs text-delux-text placeholder-delux-muted transition-colors min-h-[44px]"
            />
          </div>

          {/* Categoria e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label
                htmlFor="goal-category"
                className="block text-xs font-semibold text-delux-text mb-1.5"
              >
                Categoria
              </label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-delux-elevated border border-delux-border focus:border-delux-purple focus:outline-none text-xs text-delux-text transition-colors min-h-[44px]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="goal-deadline"
                className="block text-xs font-semibold text-delux-secondary mb-1.5"
              >
                Prazo final <span className="text-[10px] text-delux-muted">(opcional)</span>
              </label>
              <input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-delux-elevated border border-delux-border focus:border-delux-purple focus:outline-none text-xs text-delux-text transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {/* Gemini AI Custom Generator Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-delux-ai-tint/50 via-delux-ai-surface to-delux-surface border border-delux-purple/30 shadow-lg shadow-delux-ai-tint/20 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-delux-purple/20 border border-delux-purple/40 flex items-center justify-center text-delux-purple-light shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-delux-text flex items-center gap-1.5">
                    <span>Gerador Inteligente Delux IA</span>
                    <span className="text-[10px] font-semibold text-delux-purple-light px-1.5 py-0.5 rounded-full bg-delux-purple/20 border border-delux-purple/30">
                      IA
                    </span>
                  </h4>
                  <p className="text-[11px] text-delux-secondary">
                    Cria etapas práticas e acionáveis personalizadas para a sua rotina real.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="delux"
              size="delux"
              type="button"
              disabled={isGeneratingWithAi || !title.trim()}
              onClick={handleGenerateWithGemini}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                !title.trim()
                  ? "bg-delux-elevated border border-delux-border text-delux-muted cursor-not-allowed"
                  : isGeneratingWithAi
                    ? "bg-delux-purple/20 text-delux-purple-light border border-delux-purple/40 cursor-wait"
                    : "bg-gradient-to-r from-delux-purple to-delux-purple-hover hover:from-delux-purple-hover hover:to-delux-purple-deep text-delux-light shadow-md shadow-delux-purple/25 active:opacity-85"
              }`}
            >
              {isGeneratingWithAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-delux-purple-light" />
                  <span>Delux IA analisando e estruturando etapas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar etapas personalizadas com Delux IA</span>
                </>
              )}
            </Button>

            {aiAdvice && (
              <div className="p-3 rounded-xl bg-delux-purple/10 border border-delux-purple/30 text-xs text-delux-ai-text space-y-1 animate-in fade-in">
                <p className="font-semibold text-[11px] text-delux-purple-light flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Conselho do Delux IA:
                </p>
                <p className="text-[11px] leading-relaxed text-delux-ai-soft">{aiAdvice}</p>
              </div>
            )}
          </div>

          {/* Método de Planejamento */}
          <div>
            <label className="block text-xs font-semibold text-delux-text mb-2">
              Como prefere organizar as etapas?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="delux"
                size="delux"
                type="button"
                onClick={() => setMethod("auto")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  method === "auto"
                    ? "bg-delux-purple/15 border-delux-purple text-delux-text ring-1 ring-delux-purple/40"
                    : "bg-delux-elevated border-delux-border text-delux-secondary hover:border-delux-border-hover"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-delux-purple-light" />
                  <span className="text-xs font-bold text-delux-text">Plano Automático</span>
                </div>
                <p className="text-[11px] text-delux-secondary leading-normal">
                  O Delux organiza etapas práticas e agenda apenas nos seus dias disponíveis.
                </p>
              </Button>

              <Button
                variant="delux"
                size="delux"
                type="button"
                onClick={() => setMethod("manual")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  method === "manual"
                    ? "bg-delux-purple/15 border-delux-purple text-delux-text ring-1 ring-delux-purple/40"
                    : "bg-delux-elevated border-delux-border text-delux-secondary hover:border-delux-border-hover"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="w-4 h-4 text-delux-purple-light" />
                  <span className="text-xs font-bold text-delux-text">Plano Manual</span>
                </div>
                <p className="text-[11px] text-delux-secondary leading-normal">
                  Você define suas próprias etapas, datas e durações passo a passo.
                </p>
              </Button>
            </div>
          </div>

          {/* Availability Context Pill */}
          {method === "auto" && (
            <div className="p-3.5 rounded-xl bg-delux-elevated border border-delux-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-delux-secondary text-[11px] font-medium">
                  Sua disponibilidade atual:
                </span>
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => openDrawer("preferences")}
                  className="text-[11px] text-delux-purple-light hover:underline font-semibold"
                >
                  Alterar dias
                </Button>
              </div>
              <p className="text-xs text-delux-text font-medium">
                {availableDayNames || "Nenhum dia selecionado"} · {preferences.dailyMinutes} min/dia
              </p>
              {preferences.availableDays.length === 0 && (
                <div className="flex items-center gap-1.5 text-delux-red text-[11px] pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Selecione ao menos 1 dia para poder gerar o plano.</span>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW OF STEPS FOR AUTO */}
          {method === "auto" && previewSteps.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-delux-secondary mb-2">
                Prévia das etapas práticas ({previewSteps.length} etapas sugeridas):
              </span>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {previewSteps.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-delux-card border border-delux-border/60 text-xs flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-delux-purple/20 text-delux-purple-light text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-delux-text truncate">{s.title}</p>
                      <p className="text-[10px] text-delux-muted truncate">{s.instruction}</p>
                    </div>
                    <span className="text-[10px] text-delux-secondary tabular-nums shrink-0">
                      {s.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANUAL TASK BUILDER */}
          {method === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-delux-text">Suas etapas manuais</span>
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={handleAddManualTask}
                  className="flex items-center gap-1 text-xs text-delux-purple-light hover:text-delux-light font-semibold py-1 px-2 rounded-lg bg-delux-elevated"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar etapa</span>
                </Button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {manualTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-delux-card border border-delux-border space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-delux-purple-light">
                        Etapa {idx + 1}
                      </span>
                      {manualTasks.length > 1 && (
                        <Button
                          variant="delux"
                          size="delux"
                          type="button"
                          onClick={() => handleRemoveManualTask(idx)}
                          className="text-delux-red p-1 rounded hover:bg-delux-danger/10"
                          aria-label="Remover etapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Título da etapa..."
                      value={task.title}
                      onChange={(e) => handleManualTaskChange(idx, "title", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-delux-elevated border border-delux-border text-xs text-delux-text focus:outline-none focus:border-delux-purple min-h-[40px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={task.date}
                        onChange={(e) => handleManualTaskChange(idx, "date", e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-delux-elevated border border-delux-border text-xs text-delux-text min-h-[38px]"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="240"
                          value={task.durationMinutes}
                          onChange={(e) =>
                            handleManualTaskChange(
                              idx,
                              "durationMinutes",
                              parseInt(e.target.value, 10) || 15,
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-delux-elevated border border-delux-border text-xs text-delux-text min-h-[38px]"
                        />
                        <span className="text-[10px] text-delux-secondary">min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Bottom Thumb Zone Actions */}
          <div className="pt-3 pb-2 sm:pb-0 border-t border-delux-border flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="delux"
              size="delux"
              type="button"
              onClick={() => setIsCreateGoalOpen(false)}
              className="px-4 py-3 text-xs font-semibold text-delux-secondary hover:text-delux-text rounded-xl transition-colors min-h-[48px]"
            >
              Cancelar
            </Button>
            <Button
              variant="delux"
              size="delux"
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-delux-purple hover:bg-delux-purple-hover active:opacity-85 text-delux-light text-xs font-bold rounded-xl shadow-lg shadow-delux-purple/30 transition-all min-h-[48px]"
            >
              <span>Gerar e Salvar Plano</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
