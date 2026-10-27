// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useState } from 'react';
import { ArrowRight, Check, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoalCategory } from '../../types';
import { DAY_NAMES } from '../../utils/dateUtils';

const STARTER_SUGGESTIONS = [
  { title: 'Aprender violão', category: 'Criatividade' as GoalCategory },
  { title: 'Inglês para conversação', category: 'Estudos' as GoalCategory },
  { title: 'Correr 5 km sem parar', category: 'Saúde e condicionamento' as GoalCategory },
  { title: 'Programação web do zero', category: 'Carreira' as GoalCategory },
  { title: 'Hábito de leitura diária', category: 'Hábitos' as GoalCategory },
  { title: 'Organizar finanças pessoais', category: 'Finanças pessoais' as GoalCategory },
];

export const OnboardingModal: React.FC = () => {
  const {
    goals,
    preferences,
    updatePreferences,
    addGoal,
    setActiveTab,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoalTitle, setSelectedGoalTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('Estudos');
  const [customGoal, setCustomGoal] = useState('');

  const [hasDismissed, setHasDismissed] = useState(() => {
    return localStorage.getItem('delux_onboarding_completed') === 'true';
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
    const finalTitle = customGoal.trim() || selectedGoalTitle.trim() || 'Aprender violão';
    addGoal({
      title: finalTitle,
      category: selectedCategory,
      method: 'auto',
      dailyMinutes: preferences.dailyMinutes,
    });
    localStorage.setItem('delux_onboarding_completed', 'true');
    setHasDismissed(true);
    setActiveTab('home');
  };

  const handleSkip = () => {
    localStorage.setItem('delux_onboarding_completed', 'true');
    setHasDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-3xl bg-[#121219] border-t sm:border border-[#292936] shadow-2xl text-[#F5F5FA] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-[#3E3E52] rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#8B5CF6]/30">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5FA] tracking-tight">
                  Bem-vindo ao Delux 2.0
                </h2>
                <p className="text-xs text-[#A1A1B4] max-w-sm mx-auto leading-relaxed">
                  Transforme objetivos em planos que cabem na sua rotina real com pequenas ações diárias.
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#F5F5FA] mb-2">
                  Escolha um objetivo sugerido ou digite o seu:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {STARTER_SUGGESTIONS.map((item) => {
                    const isSelected = selectedGoalTitle === item.title && !customGoal;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setSelectedGoalTitle(item.title);
                          setSelectedCategory(item.category);
                          setCustomGoal('');
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F5F5FA] ring-1 ring-[#8B5CF6]'
                            : 'bg-[#1A1A24] border-[#292936] text-[#A1A1B4] hover:text-[#F5F5FA]'
                        }`}
                      >
                        <p className="font-bold text-sm text-[#F5F5FA]">{item.title}</p>
                        <span className="text-[10px] text-[#A78BFA] font-semibold">{item.category}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Ou digite seu próprio objetivo aqui..."
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value);
                    setSelectedGoalTitle('');
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#1A1A24] border border-[#292936] text-xs text-[#F5F5FA] focus:border-[#8B5CF6] focus:outline-none min-h-[48px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#292936]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-[#6E6E82] hover:text-[#A1A1B4] py-2"
                >
                  Explorar primeiro
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all min-h-[48px]"
                >
                  <span>Minha Disponibilidade</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-[#F5F5FA]">Sua Disponibilidade Semanal</h3>
                <p className="text-xs text-[#A1A1B4] mt-0.5">
                  O planejador nunca agenda tarefas automáticas em dias que você desmarcar.
                </p>
              </div>

              {/* Dias da semana com touch targets grandes */}
              <div>
                <span className="block text-xs font-semibold text-[#A1A1B4] mb-2">
                  Toque nos dias em que você pode dedicar tempo:
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((name, idx) => {
                    const isSelected = preferences.availableDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        className={`py-3 text-xs font-extrabold rounded-xl border transition-all active:scale-90 min-h-[48px] ${
                          isSelected
                            ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                            : 'bg-[#1A1A24] border-[#292936] text-[#6E6E82]'
                        }`}
                      >
                        {name.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutos por dia */}
              <div>
                <span className="block text-xs font-semibold text-[#A1A1B4] mb-2">
                  Tempo por sessão:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updatePreferences({ dailyMinutes: mins })}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all active:scale-95 min-h-[48px] ${
                        preferences.dailyMinutes === mins
                          ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-md'
                          : 'bg-[#1A1A24] border-[#292936] text-[#A1A1B4]'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#292936]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#A1A1B4] hover:text-[#F5F5FA] py-2 px-3"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex items-center gap-2 px-6 py-3 bg-[#4ADE80] hover:bg-emerald-500 active:scale-95 text-black text-xs font-extrabold rounded-xl shadow-lg transition-all min-h-[48px]"
                >
                  <span>Gerar Plano Agora</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
