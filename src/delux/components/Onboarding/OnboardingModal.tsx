// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { ArrowRight, Check, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GoalCategory } from "../../types";
import { DAY_NAMES } from "../../utils/dateUtils";

const STARTER_SUGGESTIONS = [
  { title: "Aprender violão", category: "Criatividade" as GoalCategory },
  { title: "Inglês para conversação", category: "Estudos" as GoalCategory },
  { title: "Correr 5 km sem parar", category: "Saúde e condicionamento" as GoalCategory },
  { title: "Programação web do zero", category: "Carreira" as GoalCategory },
  { title: "Hábito de leitura diária", category: "Hábitos" as GoalCategory },
  { title: "Organizar finanças pessoais", category: "Finanças pessoais" as GoalCategory },
];

export const OnboardingModal: React.FC = () => {
  const { goals, preferences, updatePreferences, addGoal, setActiveTab } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoalTitle, setSelectedGoalTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>("Estudos");
  const [customGoal, setCustomGoal] = useState("");

  const [hasDismissed, setHasDismissed] = useState(() => {
    return localStorage.getItem("delux_onboarding_completed") === "true";
  });

  if (goals.length > 0 || hasDismissed) {
    return null;
  }

  const handleDayToggle = (dayIdx: number) => {
    const current = preferences.availableDays;
    const exists = current.includes(dayIdx);
    if (exists && current.length === 1) return;
    const updated = exists ? current.filter((d) => d !== dayIdx) : [...current, dayIdx].sort();
    updatePreferences({ availableDays: updated });
  };

  const handleCompleteOnboarding = () => {
    const finalTitle = customGoal.trim() || selectedGoalTitle.trim() || "Aprender violão";
    addGoal({
      title: finalTitle,
      category: selectedCategory,
      method: "auto",
      dailyMinutes: preferences.dailyMinutes,
    });
    localStorage.setItem("delux_onboarding_completed", "true");
    setHasDismissed(true);
    setActiveTab("home");
  };

  const handleSkip = () => {
    localStorage.setItem("delux_onboarding_completed", "true");
    setHasDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 delux-glass-overlay animate-in fade-in duration-200"
    >
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-3xl delux-glass-panel border-t sm:border text-delux-text flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-delux-border-hover rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-delux-purple to-delux-purple-light text-delux-light flex items-center justify-center mx-auto shadow-lg shadow-delux-purple/30">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-delux-text tracking-tight">
                  Bem-vindo ao Delux 2.0
                </h2>
                <p className="text-xs text-delux-secondary max-w-sm mx-auto leading-relaxed">
                  Transforme objetivos em planos que cabem na sua rotina real com pequenas ações
                  diárias.
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-delux-text mb-2">
                  Escolha um objetivo sugerido ou digite o seu:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {STARTER_SUGGESTIONS.map((item) => {
                    const isSelected = selectedGoalTitle === item.title && !customGoal;
                    return (
                      <Button
                        variant="delux"
                        size="delux"
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setSelectedGoalTitle(item.title);
                          setSelectedCategory(item.category);
                          setCustomGoal("");
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all active:opacity-85 ${
                          isSelected
                            ? "bg-delux-purple/20 border-delux-purple text-delux-text ring-1 ring-delux-purple"
                            : "bg-delux-elevated border-delux-border text-delux-secondary hover:text-delux-text"
                        }`}
                      >
                        <p className="font-bold text-sm text-delux-text">{item.title}</p>
                        <span className="text-[10px] text-delux-purple-light font-semibold">
                          {item.category}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Ou digite seu próprio objetivo aqui..."
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value);
                    setSelectedGoalTitle("");
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-delux-elevated border border-delux-border text-xs text-delux-text focus:border-delux-purple focus:outline-none min-h-[48px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-delux-border">
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-delux-muted hover:text-delux-secondary py-2"
                >
                  Explorar primeiro
                </Button>
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3 bg-delux-purple hover:bg-delux-purple-hover active:opacity-85 text-delux-light text-xs font-bold rounded-xl shadow-lg transition-all min-h-[48px]"
                >
                  <span>Minha Disponibilidade</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-delux-text">Sua Disponibilidade Semanal</h3>
                <p className="text-xs text-delux-secondary mt-0.5">
                  O planejador nunca agenda tarefas automáticas em dias que você desmarcar.
                </p>
              </div>

              {/* Dias da semana com touch targets grandes */}
              <div>
                <span className="block text-xs font-semibold text-delux-secondary mb-2">
                  Toque nos dias em que você pode dedicar tempo:
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((name, idx) => {
                    const isSelected = preferences.availableDays.includes(idx);
                    return (
                      <Button
                        variant="delux"
                        size="delux"
                        key={idx}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        className={`py-3 text-xs font-extrabold rounded-xl border transition-all active:opacity-85 min-h-[48px] ${
                          isSelected
                            ? "bg-delux-purple border-delux-purple text-delux-light shadow-md shadow-delux-purple/30"
                            : "bg-delux-elevated border-delux-border text-delux-muted"
                        }`}
                      >
                        {name.substring(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Minutos por dia */}
              <div>
                <span className="block text-xs font-semibold text-delux-secondary mb-2">
                  Tempo por sessão:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <Button
                      variant="delux"
                      size="delux"
                      key={mins}
                      type="button"
                      onClick={() => updatePreferences({ dailyMinutes: mins })}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all active:opacity-85 min-h-[48px] ${
                        preferences.dailyMinutes === mins
                          ? "bg-delux-purple border-delux-purple text-delux-light shadow-md"
                          : "bg-delux-elevated border-delux-border text-delux-secondary"
                      }`}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-delux-border">
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-delux-secondary hover:text-delux-text py-2 px-3"
                >
                  Voltar
                </Button>
                <Button
                  variant="delux"
                  size="delux"
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex items-center gap-2 px-6 py-3 bg-delux-green hover:bg-delux-green-hover active:opacity-85 text-delux-ink text-xs font-extrabold rounded-xl shadow-lg transition-all min-h-[48px]"
                >
                  <span>Gerar Plano Agora</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
