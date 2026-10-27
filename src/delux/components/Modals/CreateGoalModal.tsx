import React, { useState } from 'react';
import { X, Sparkles, Calendar as CalendarIcon, ArrowRight, Plus, Trash2, AlertCircle, Loader2, Bot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoalCategory, PlanningMethod } from '../../types';
import { DAY_NAMES, getLocalDateString, addDays } from '../../utils/dateUtils';
import { getStepsForGoal } from '../../utils/planGenerator';

const CATEGORIES: GoalCategory[] = [
  'Estudos',
  'Carreira',
  'Saúde e condicionamento',
  'Criatividade',
  'Finanças pessoais',
  'Hábitos',
  'Projetos pessoais',
  'Outros',
];

interface ManualTaskInput {
  title: string;
  instruction: string;
  date: string;
  durationMinutes: number;
}

export const CreateGoalModal: React.FC = () => {
  const {
    isCreateGoalOpen,
    setIsCreateGoalOpen,
    preferences,
    addGoal,
    openDrawer,
    showToast,
  } = useApp();

  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Estudos');
  const [deadline, setDeadline] = useState('');
  const [method, setMethod] = useState<PlanningMethod>('auto');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Manual tasks list if manual method chosen
  const [manualTasks, setManualTasks] = useState<ManualTaskInput[]>([
    {
      title: '',
      instruction: '',
      date: getLocalDateString(new Date()),
      durationMinutes: preferences.dailyMinutes,
    },
  ]);

  if (!isCreateGoalOpen) return null;

  const previewSteps = method === 'auto' && title.trim().length > 2
    ? getStepsForGoal(title, category, preferences.dailyMinutes)
    : [];

  const handleAddManualTask = () => {
    setManualTasks((prev) => [
      ...prev,
      {
        title: '',
        instruction: '',
        date: getLocalDateString(new Date()),
        durationMinutes: preferences.dailyMinutes,
      },
    ]);
  };

  const handleRemoveManualTask = (index: number) => {
    setManualTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualTaskChange = (index: number, field: keyof ManualTaskInput, value: any) => {
    setManualTasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerateWithGemini = async () => {
    if (!title.trim()) {
      showToast('Digite o que quer conquistar acima para o Gemini personalizar as etapas.', 'info');
      return;
    }

    setIsGeneratingWithAi(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/assistant/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: title.trim(),
          category,
          reason: reason.trim(),
          dailyMinutes: preferences.dailyMinutes,
          availableDaysCount: preferences.availableDays.length || 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao comunicar com o servidor Gemini.');
      }

      const data = await res.json();
      if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
        let currentDate = new Date();
        const availableDaysSet = new Set(
          preferences.availableDays.length > 0 ? preferences.availableDays : [1, 2, 3, 4, 5]
        );

        const newTasks: ManualTaskInput[] = data.steps.map((st: any) => {
          while (!availableDaysSet.has(currentDate.getDay())) {
            currentDate = addDays(currentDate, 1);
          }
          const taskDate = getLocalDateString(currentDate);
          currentDate = addDays(currentDate, 1);

          return {
            title: st.title || 'Ação prática',
            instruction: st.instruction || '',
            date: taskDate,
            durationMinutes: st.durationMinutes || preferences.dailyMinutes,
          };
        });

        setManualTasks(newTasks);
        setMethod('manual');
        if (data.advice) {
          setAiAdvice(data.advice);
        }
        showToast('Plano personalizado gerado pelo Gemini IA!', 'achievement');
      } else {
        throw new Error('O modelo não retornou etapas estruturadas.');
      }
    } catch (err: any) {
      console.error('Error in handleGenerateWithGemini:', err);
      showToast(err.message || 'Erro ao gerar etapas com Gemini.', 'error');
    } finally {
      setIsGeneratingWithAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Por favor, informe o que você quer conquistar.', 'error');
      return;
    }

    if (method === 'auto') {
      if (preferences.availableDays.length === 0) {
        showToast('Nenhum dia disponível configurado nas preferências.', 'error');
        return;
      }
      addGoal({
        title: title.trim(),
        reason: reason.trim() || undefined,
        category,
        method: 'auto',
        deadline: deadline || undefined,
        dailyMinutes: preferences.dailyMinutes,
      });
    } else {
      const validTasks = manualTasks.filter((t) => t.title.trim().length > 0);
      if (validTasks.length === 0) {
        showToast('Adicione ao menos uma etapa para o plano manual.', 'error');
        return;
      }
      addGoal(
        {
          title: title.trim(),
          reason: reason.trim() || undefined,
          category,
          method: 'manual',
          deadline: deadline || undefined,
          dailyMinutes: preferences.dailyMinutes,
        },
        validTasks
      );
    }

    setIsCreateGoalOpen(false);
    // Reset form
    setTitle('');
    setReason('');
    setDeadline('');
    setCategory('Estudos');
    setMethod('auto');
    setAiAdvice(null);
  };

  const availableDayNames = preferences.availableDays
    .map((d) => DAY_NAMES[d].replace('-feira', ''))
    .join(', ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Background click to dismiss */}
      <div
        className="fixed inset-0 z-0"
        onClick={() => setIsCreateGoalOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-2xl bg-[#121219] border-t sm:border border-[#292936] shadow-2xl text-[#F5F5FA] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-[#3E3E52] rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3 sm:py-4 border-b border-[#292936]/80 shrink-0">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-[#F5F5FA]">
              Criar Nova Meta
            </h3>
            <p className="text-xs text-[#A1A1B4] mt-0.5">
              Transforme sua intenção em etapas para a sua rotina real.
            </p>
          </div>
          <button
            onClick={() => setIsCreateGoalOpen(false)}
            className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F5F5FA] hover:bg-[#1A1A24] transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
          {/* O que quer conquistar */}
          <div>
            <label htmlFor="goal-title" className="block text-xs font-semibold text-[#F5F5FA] mb-1.5">
              O que você quer conquistar? *
            </label>
            <input
              id="goal-title"
              type="text"
              required
              placeholder="Ex: Aprender violão, Correr 5 km, Dominar React..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-[#1A1A24] border border-[#292936] focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F5FA] placeholder-[#6E6E82] transition-colors min-h-[48px]"
            />
          </div>

          {/* Por que é importante */}
          <div>
            <label htmlFor="goal-reason" className="block text-xs font-semibold text-[#A1A1B4] mb-1.5">
              Por que isso é importante para você? <span className="text-[10px] text-[#6E6E82]">(opcional)</span>
            </label>
            <input
              id="goal-reason"
              type="text"
              placeholder="Ex: Para tocar com amigos, crescer na carreira..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F5FA] placeholder-[#6E6E82] transition-colors min-h-[44px]"
            />
          </div>

          {/* Categoria e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="goal-category" className="block text-xs font-semibold text-[#F5F5FA] mb-1.5">
                Categoria
              </label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F5FA] transition-colors min-h-[44px]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="goal-deadline" className="block text-xs font-semibold text-[#A1A1B4] mb-1.5">
                Prazo final <span className="text-[10px] text-[#6E6E82]">(opcional)</span>
              </label>
              <input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A24] border border-[#292936] focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F5FA] transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {/* Gemini AI Custom Generator Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1B4B]/50 via-[#181824] to-[#121219] border border-[#8B5CF6]/30 shadow-lg shadow-purple-950/20 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F5F5FA] flex items-center gap-1.5">
                    <span>Gerador Inteligente Gemini IA</span>
                    <span className="text-[10px] font-semibold text-[#A78BFA] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                      Gemini 3.8
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#A1A1B4]">
                    Cria etapas práticas e acionáveis personalizadas para a sua rotina real.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingWithAi || !title.trim()}
              onClick={handleGenerateWithGemini}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                !title.trim()
                  ? 'bg-[#1A1A24] border border-[#292936] text-[#6E6E82] cursor-not-allowed'
                  : isGeneratingWithAi
                  ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 cursor-wait'
                  : 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-md shadow-purple-500/25 active:scale-[0.99]'
              }`}
            >
              {isGeneratingWithAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#A78BFA]" />
                  <span>Gemini IA analisando e estruturando etapas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar etapas personalizadas com Gemini IA</span>
                </>
              )}
            </button>

            {aiAdvice && (
              <div className="p-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-xs text-[#E9D5FF] space-y-1 animate-in fade-in">
                <p className="font-semibold text-[11px] text-[#A78BFA] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Conselho do Delux Gemini:
                </p>
                <p className="text-[11px] leading-relaxed text-[#D8B4FE]">{aiAdvice}</p>
              </div>
            )}
          </div>

          {/* Método de Planejamento */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F5FA] mb-2">
              Como prefere organizar as etapas?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('auto')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  method === 'auto'
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#F5F5FA] ring-1 ring-[#8B5CF6]/40'
                    : 'bg-[#1A1A24] border-[#292936] text-[#A1A1B4] hover:border-[#3E3E52]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-xs font-bold text-[#F5F5FA]">Plano Automático</span>
                </div>
                <p className="text-[11px] text-[#A1A1B4] leading-normal">
                  O Delux organiza etapas práticas e agenda apenas nos seus dias disponíveis.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('manual')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  method === 'manual'
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#F5F5FA] ring-1 ring-[#8B5CF6]/40'
                    : 'bg-[#1A1A24] border-[#292936] text-[#A1A1B4] hover:border-[#3E3E52]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-xs font-bold text-[#F5F5FA]">Plano Manual</span>
                </div>
                <p className="text-[11px] text-[#A1A1B4] leading-normal">
                  Você define suas próprias etapas, datas e durações passo a passo.
                </p>
              </button>
            </div>
          </div>

          {/* Availability Context Pill */}
          {method === 'auto' && (
            <div className="p-3.5 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1B4] text-[11px] font-medium">Sua disponibilidade atual:</span>
                <button
                  type="button"
                  onClick={() => openDrawer('preferences')}
                  className="text-[11px] text-[#A78BFA] hover:underline font-semibold"
                >
                  Alterar dias
                </button>
              </div>
              <p className="text-xs text-[#F5F5FA] font-medium">
                {availableDayNames || 'Nenhum dia selecionado'} · {preferences.dailyMinutes} min/dia
              </p>
              {preferences.availableDays.length === 0 && (
                <div className="flex items-center gap-1.5 text-[#F87171] text-[11px] pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Selecione ao menos 1 dia para poder gerar o plano.</span>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW OF STEPS FOR AUTO */}
          {method === 'auto' && previewSteps.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-[#A1A1B4] mb-2">
                Prévia das etapas práticas ({previewSteps.length} etapas sugeridas):
              </span>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {previewSteps.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#14141E] border border-[#292936]/60 text-xs flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#F5F5FA] truncate">{s.title}</p>
                      <p className="text-[10px] text-[#6E6E82] truncate">{s.instruction}</p>
                    </div>
                    <span className="text-[10px] text-[#A1A1B4] tabular-nums shrink-0">
                      {s.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANUAL TASK BUILDER */}
          {method === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5FA]">Suas etapas manuais</span>
                <button
                  type="button"
                  onClick={handleAddManualTask}
                  className="flex items-center gap-1 text-xs text-[#A78BFA] hover:text-white font-semibold py-1 px-2 rounded-lg bg-[#1A1A24]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar etapa</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {manualTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#14141E] border border-[#292936] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#A78BFA]">Etapa {idx + 1}</span>
                      {manualTasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualTask(idx)}
                          className="text-[#F87171] p-1 rounded hover:bg-red-500/10"
                          aria-label="Remover etapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Título da etapa..."
                      value={task.title}
                      onChange={(e) => handleManualTaskChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:outline-none focus:border-[#8B5CF6] min-h-[40px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={task.date}
                        onChange={(e) => handleManualTaskChange(idx, 'date', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] min-h-[38px]"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="240"
                          value={task.durationMinutes}
                          onChange={(e) => handleManualTaskChange(idx, 'durationMinutes', parseInt(e.target.value, 10) || 15)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] min-h-[38px]"
                        />
                        <span className="text-[10px] text-[#A1A1B4]">min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Bottom Thumb Zone Actions */}
          <div className="pt-3 pb-2 sm:pb-0 border-t border-[#292936] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateGoalOpen(false)}
              className="px-4 py-3 text-xs font-semibold text-[#A1A1B4] hover:text-[#F5F5FA] rounded-xl transition-colors min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/30 transition-all min-h-[48px]"
            >
              <span>Gerar e Salvar Plano</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
