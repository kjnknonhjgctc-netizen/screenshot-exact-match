// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useRef, useState } from "react";
import {
  X,
  Sliders,
  Trophy,
  History,
  Settings as SettingsIcon,
  HelpCircle,
  Download,
  Upload,
  RotateCcw,
  Check,
  Flame,
  Target,
  Zap,
  Award,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DrawerSection, ExecutionRhythm, PreferredTime } from "../../types";
import { DAY_NAMES, formatFriendlyDate } from "../../utils/dateUtils";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";

const iconMap: Record<string, React.ReactNode> = {
  Target: <Target className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
};

export const MenuDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    activeDrawerSection,
    openDrawer,
    closeDrawer,
    preferences,
    updatePreferences,
    achievements,
    history,
    resetAllData,
    exportData,
    importData,
    showToast,
  } = useApp();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const present = useAnimatedPresence(isDrawerOpen, preferences.reducedMotion);
  if (!present) return null;

  const sections: { id: DrawerSection; label: string; icon: React.ReactNode }[] = [
    { id: "preferences", label: "Preferências", icon: <Sliders className="w-4 h-4" /> },
    { id: "achievements", label: "Conquistas", icon: <Trophy className="w-4 h-4" /> },
    { id: "history", label: "Histórico", icon: <History className="w-4 h-4" /> },
    { id: "settings", label: "Configurações", icon: <SettingsIcon className="w-4 h-4" /> },
    { id: "help", label: "Ajuda & Info", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const handleDayToggle = (dayIndex: number) => {
    const current = preferences.availableDays;
    const exists = current.includes(dayIndex);
    if (exists && current.length === 1) {
      showToast("Você deve manter ao menos 1 dia disponível na semana.", "error");
      return;
    }
    const updated = exists ? current.filter((d) => d !== dayIndex) : [...current, dayIndex].sort();
    updatePreferences({ availableDays: updated });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delux-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado com sucesso!", "success");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importData(content);
      if (!res.success) {
        showToast(res.error || "Erro ao importar dados.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 delux-glass-overlay animate-in fade-in duration-200"
        data-motion-state={isDrawerOpen ? "open" : "closed"}
        inert={!isDrawerOpen}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        data-motion-state={isDrawerOpen ? "open" : "closed"}
        inert={!isDrawerOpen}
        aria-label="Menu principal"
        className="fixed top-0 sm:top-0 right-0 bottom-0 z-50 w-full sm:max-w-md delux-glass-panel delux-drawer border-l flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header with touch friendly close button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-delux-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-delux-text tracking-tight">DELUX</span>
            <span className="text-xs text-delux-purple font-bold bg-delux-purple/15 px-2 py-0.5 rounded-md">
              2.0
            </span>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={closeDrawer}
            className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Section Navigation Tabs (Horizontal mobile scroller) */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-delux-canvas border-b border-delux-border overflow-x-auto no-scrollbar shrink-0">
          {sections.map((sec) => (
            <Button
              variant="delux"
              size="delux"
              key={sec.id}
              onClick={() => openDrawer(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
                activeDrawerSection === sec.id
                  ? "delux-selected text-delux-purple-light"
                  : "text-delux-secondary hover:text-delux-text"
              }`}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </Button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 pb-20 sm:pb-8">
          {/* PREFERÊNCIAS */}
          {activeDrawerSection === "preferences" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-delux-text mb-1">
                  Dias disponíveis na semana
                </h4>
                <p className="text-xs text-delux-secondary mb-3">
                  O planejador automático só agendará tarefas nos dias selecionados.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {DAY_NAMES.map((name, idx) => {
                    const isSelected = preferences.availableDays.includes(idx);
                    return (
                      <Button
                        variant="delux"
                        size="delux"
                        key={idx}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold transition-all min-h-[48px] active:opacity-85 ${
                          isSelected
                            ? "bg-delux-purple/15 border-delux-purple/60 text-delux-text"
                            : "bg-delux-elevated border-delux-border text-delux-secondary"
                        }`}
                      >
                        <span>{name}</span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-delux-purple text-delux-light"
                              : "bg-delux-surface border border-delux-border"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Tempo Diário */}
              <div>
                <h4 className="text-sm font-bold text-delux-text mb-1">Tempo diário disponível</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Duração estimada para as tarefas práticas.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <Button
                      variant="delux"
                      size="delux"
                      key={mins}
                      type="button"
                      onClick={() => updatePreferences({ dailyMinutes: mins })}
                      className={`py-3 text-xs font-extrabold rounded-xl border transition-all min-h-[48px] active:opacity-85 ${
                        preferences.dailyMinutes === mins
                          ? "bg-delux-purple border-delux-purple text-delux-light shadow-md"
                          : "bg-delux-elevated border-delux-border text-delux-secondary"
                      }`}
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>
              </div>

              {/* Horário preferido */}
              <div>
                <h4 className="text-sm font-bold text-delux-text mb-1">Horário preferencial</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "morning", label: "Manhã" },
                      { id: "afternoon", label: "Tarde" },
                      { id: "evening", label: "Noite" },
                    ] as { id: PreferredTime; label: string }[]
                  ).map((time) => (
                    <Button
                      variant="delux"
                      size="delux"
                      key={time.id}
                      type="button"
                      onClick={() => updatePreferences({ preferredTime: time.id })}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all min-h-[44px] ${
                        preferences.preferredTime === time.id
                          ? "bg-delux-purple/20 border-delux-purple text-delux-purple-light"
                          : "bg-delux-elevated border-delux-border text-delux-secondary"
                      }`}
                    >
                      {time.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Ritmo */}
              <div>
                <h4 className="text-sm font-bold text-delux-text mb-1">Ritmo de execução</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "light", label: "Leve" },
                      { id: "balanced", label: "Equilibrado" },
                      { id: "intense", label: "Intenso" },
                    ] as { id: ExecutionRhythm; label: string }[]
                  ).map((r) => (
                    <Button
                      variant="delux"
                      size="delux"
                      key={r.id}
                      type="button"
                      onClick={() => updatePreferences({ rhythm: r.id })}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all min-h-[44px] ${
                        preferences.rhythm === r.id
                          ? "bg-delux-purple/20 border-delux-purple text-delux-purple-light"
                          : "bg-delux-elevated border-delux-border text-delux-secondary"
                      }`}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Redução de movimento */}
              <div className="pt-2 border-t border-delux-border">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="text-xs font-bold text-delux-text">Reduzir animações</span>
                    <p className="text-[11px] text-delux-secondary">
                      Transições instantâneas para acessibilidade.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.reducedMotion}
                    onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                    className="w-5 h-5 rounded text-delux-purple focus:ring-0 bg-delux-elevated border-delux-border"
                  />
                </label>
              </div>
            </div>
          )}

          {/* CONQUISTAS */}
          {activeDrawerSection === "achievements" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-delux-elevated border border-delux-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs text-delux-secondary uppercase tracking-wider font-bold">
                    Desbloqueadas
                  </h4>
                  <p className="text-xl font-extrabold text-delux-text tabular-nums">
                    {achievements.filter((a) => a.unlockedAt).length} de {achievements.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-delux-amber/15 text-delux-amber flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2.5">
                {achievements.map((ach) => {
                  const isUnlocked = Boolean(ach.unlockedAt);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                        isUnlocked
                          ? "bg-delux-elevated border-delux-purple/40 text-delux-text"
                          : "bg-delux-surface border-delux-border opacity-60 text-delux-secondary"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? "bg-delux-amber/20 text-delux-amber"
                            : "bg-delux-elevated text-delux-muted"
                        }`}
                      >
                        {iconMap[ach.iconName] || <Award className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-delux-text truncate">
                            {ach.title}
                          </h5>
                          {isUnlocked && (
                            <span className="text-[10px] text-delux-green font-bold shrink-0">
                              {ach.unlockedAt
                                ? formatFriendlyDate(ach.unlockedAt.split("T")[0])
                                : "Conquistada"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-delux-secondary mt-0.5">{ach.description}</p>
                        <span className="inline-block mt-1 text-[10px] text-delux-purple font-semibold">
                          Requisito: {ach.requirement}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HISTÓRICO */}
          {activeDrawerSection === "history" && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-8 text-center text-delux-secondary">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Nenhum evento registrado ainda.</p>
                  <p className="text-[11px] mt-1 text-delux-muted">
                    Conclua etapas ou crie metas para ver o registro cronológico aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map((item, idx) => (
                    <div
                      key={`${item.id || "hist"}_${idx}`}
                      className="p-3.5 rounded-xl bg-delux-elevated border border-delux-border text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-delux-secondary text-[10px]">
                        <span>
                          {item.timestamp
                            ? formatFriendlyDate(item.timestamp.split("T")[0])
                            : "Hoje"}
                        </span>
                        <span className="tabular-nums">
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="font-bold text-delux-text">{item.title}</p>
                      {item.description && (
                        <p className="text-delux-secondary text-[11px]">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          {activeDrawerSection === "settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-delux-border pb-4">
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled ? <Volume2 className="w-5 h-5 text-delux-purple-light shrink-0" /> : <VolumeX className="w-5 h-5 text-delux-secondary shrink-0" />}
                  <h4 id="delux-sound-label" className="text-sm font-bold text-delux-text">Sons do app</h4>
                </div>
                <Button
                  variant="delux"
                  size="delux"
                  role="switch"
                  aria-checked={preferences.soundEnabled}
                  aria-labelledby="delux-sound-label"
                  data-sound={preferences.soundEnabled ? "off" : undefined}
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  className={`relative w-12 h-7 shrink-0 rounded-full border transition-colors ${preferences.soundEnabled ? "bg-delux-purple border-delux-purple" : "bg-delux-elevated border-delux-border"}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-delux-light transition-transform ${preferences.soundEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>
              <div>
                <h4 className="text-sm font-bold text-delux-text mb-1">Dados & Backup</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Exporte seu histórico para guardar uma cópia ou transferir de aparelho.
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-delux-elevated active:bg-delux-border border border-delux-border text-xs font-bold text-delux-text transition-colors min-h-[48px]"
                  >
                    <Download className="w-4 h-4 text-delux-purple-light" />
                    <span>Exportar dados (JSON)</span>
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-delux-elevated active:bg-delux-border border border-delux-border text-xs font-bold text-delux-secondary active:text-delux-text transition-colors min-h-[48px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar backup JSON</span>
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-delux-border">
                <h4 className="text-sm font-bold text-delux-red mb-1">Zona de perigo</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Apaga todas as metas, tarefas concluídas e histórico gravados localmente.
                </p>
                <Button
                  variant="delux"
                  size="delux"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-delux-danger/10 active:bg-delux-danger/20 border border-delux-danger/30 text-xs font-bold text-delux-red transition-colors min-h-[48px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Limpar todos os dados locais</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-delux-border text-center text-xs text-delux-muted">
                <p className="font-bold text-delux-secondary">Delux 2.0</p>
                <p className="text-[11px] mt-0.5">Versão 2.0.0 · Local-First Mobile Engine</p>
              </div>
            </div>
          )}

          {/* AJUDA & FILOSOFIA */}
          {activeDrawerSection === "help" && (
            <div className="space-y-4 text-xs text-delux-secondary leading-relaxed">
              <div className="p-4 rounded-2xl bg-delux-elevated border border-delux-border">
                <h4 className="text-sm font-bold text-delux-text mb-2">A promessa do Delux</h4>
                <p className="italic text-delux-purple-light mb-2">
                  «O Delux transforma objetivos em planos que cabem na rotina real do usuário,
                  ajudando-o a sair da intenção e avançar com pequenas ações concretas, consistentes
                  e mensuráveis.»
                </p>
                <p>
                  Criado para ser usado em qualquer lugar no seu celular, com foco em ações viáveis
                  de 15 a 30 minutos.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-delux-text">Privacidade 100% no seu aparelho</h5>
                <p>
                  Nenhum dado é enviado para servidores externos. Tudo fica armazenado no navegador
                  do seu smartphone.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Limpar todos os dados?"
        description="Esta ação apagará permanentemente todas as suas metas, tarefas concluídas, sequência e histórico gravados neste aparelho."
        confirmLabel="Sim, apagar tudo"
        isDestructive
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          resetAllData();
          closeDrawer();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
