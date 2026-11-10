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
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DrawerSection, ExecutionRhythm, PreferredTime } from "../../types";
import { DAY_NAMES, formatFriendlyDate } from "../../utils/dateUtils";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useAnimatedPresence } from "../Common/useAnimatedPresence";
import { useAppearance } from "../../theme/appearance";

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
  const { appearance, setAppearance } = useAppearance();
  if (!present) return null;

  const sections: { id: DrawerSection; label: string; icon: React.ReactNode }[] = [
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
            <span className="text-base font-semibold text-delux-text tracking-tight">DELUX</span>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={closeDrawer}
            className="w-10 h-10 rounded-lg text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
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
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
                activeDrawerSection === sec.id
                  ? "delux-selected text-delux-accent"
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
          {/* CONQUISTAS */}
          {activeDrawerSection === "achievements" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-delux-elevated border border-delux-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs text-delux-secondary uppercase tracking-normal font-semibold">
                    Desbloqueadas
                  </h4>
                  <p className="text-xl font-semibold text-delux-text tabular-nums">
                    {achievements.filter((a) => a.unlockedAt).length} de {achievements.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-delux-attention/15 text-delux-attention flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2.5">
                {achievements.map((ach) => {
                  const isUnlocked = Boolean(ach.unlockedAt);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-lg border transition-all flex items-start gap-3 ${
                        isUnlocked
                          ? "bg-delux-elevated border-delux-action/40 text-delux-text"
                          : "bg-delux-surface border-delux-border opacity-60 text-delux-secondary"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? "bg-delux-attention/20 text-delux-attention"
                            : "bg-delux-elevated text-delux-muted"
                        }`}
                      >
                        {iconMap[ach.iconName] || <Award className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-semibold text-delux-text truncate">
                            {ach.title}
                          </h5>
                          {isUnlocked && (
                            <span className="text-[10px] text-delux-success font-semibold shrink-0">
                              {ach.unlockedAt
                                ? formatFriendlyDate(ach.unlockedAt.split("T")[0])
                                : "Conquistada"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-delux-secondary mt-0.5">{ach.description}</p>
                        <span className="inline-block mt-1 text-[10px] text-delux-action font-semibold">
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
                      className="p-3.5 rounded-lg bg-delux-elevated border border-delux-border text-xs space-y-1"
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
                      <p className="font-semibold text-delux-text">{item.title}</p>
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
              <div>
                <h4 className="text-sm font-semibold text-delux-text mb-1">Aparência</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Escolha o tema claro, escuro ou siga o sistema do aparelho.
                </p>
                <div
                  role="radiogroup"
                  aria-label="Aparência"
                  className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-delux-elevated border border-delux-border"
                >
                  {[
                    { id: "light", label: "Claro", icon: <Sun className="w-4 h-4" /> },
                    { id: "dark", label: "Escuro", icon: <Moon className="w-4 h-4" /> },
                    { id: "system", label: "Automático", icon: <Monitor className="w-4 h-4" /> },
                  ].map((opt) => {
                    const selected = appearance === opt.id;
                    return (
                      <Button
                        key={opt.id}
                        variant="delux"
                        size="delux"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setAppearance(opt.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-md text-[11px] font-semibold transition-colors ${
                          selected
                            ? "delux-selected text-delux-text"
                            : "text-delux-secondary hover:text-delux-text"
                        }`}
                      >
                        <span className={selected ? "text-delux-accent" : ""}>{opt.icon}</span>
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-delux-border bg-delux-elevated p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-delux-action/10 text-delux-accent flex items-center justify-center">
                    {preferences.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-delux-text">Efeitos sonoros</h4>
                    <p className="text-xs text-delux-secondary mt-1">
                      {preferences.soundEnabled
                        ? "Sons de botões e ações estão ativados."
                        : "Todos os efeitos sonoros estão desativados."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.soundEnabled}
                  aria-label="Ativar ou desativar efeitos sonoros"
                  onClick={() => {
                    const enabled = !preferences.soundEnabled;
                    updatePreferences({ soundEnabled: enabled });
                    showToast(enabled ? "Efeitos sonoros ativados." : "Efeitos sonoros desativados.", "success");
                  }}
                  className={`inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delux-accent focus-visible:ring-offset-2 focus-visible:ring-offset-delux-elevated ${
                    preferences.soundEnabled
                      ? "justify-end bg-delux-action border-delux-action"
                      : "justify-start bg-delux-border border-delux-border"
                  }`}
                >
                  <span className="block h-6 w-6 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-delux-text mb-1">Dados & Backup</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Exporte seu histórico para guardar uma cópia ou transferir de aparelho.
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button
                    variant="delux"
                    size="delux"
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-delux-elevated active:bg-delux-border border border-delux-border text-xs font-semibold text-delux-text transition-colors min-h-[48px]"
                  >
                    <Download className="w-4 h-4 text-delux-accent" />
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
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-delux-elevated active:bg-delux-border border border-delux-border text-xs font-semibold text-delux-secondary active:text-delux-text transition-colors min-h-[48px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar backup JSON</span>
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-delux-border">
                <h4 className="text-sm font-semibold text-delux-warning mb-1">Zona de perigo</h4>
                <p className="text-xs text-delux-secondary mb-3">
                  Apaga todas as metas, tarefas concluídas e histórico gravados localmente.
                </p>
                <Button
                  variant="delux"
                  size="delux"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-delux-danger/10 active:bg-delux-danger/20 border border-delux-danger/30 text-xs font-semibold text-delux-warning transition-colors min-h-[48px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Limpar todos os dados locais</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-delux-border text-center text-xs text-delux-muted">
                <p className="font-semibold text-delux-secondary">Delux</p>
                <p className="text-[11px] mt-0.5">Local-First Mobile Engine</p>
              </div>
            </div>
          )}

          {/* AJUDA & FILOSOFIA */}
          {activeDrawerSection === "help" && (
            <div className="space-y-4 text-xs text-delux-secondary leading-relaxed">
              <div className="p-4 rounded-lg bg-delux-elevated border border-delux-border">
                <h4 className="text-sm font-semibold text-delux-text mb-2">A promessa do Delux</h4>
                <p className="italic text-delux-accent mb-2">
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
                <h5 className="font-semibold text-delux-text">Privacidade 100% no seu aparelho</h5>
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
