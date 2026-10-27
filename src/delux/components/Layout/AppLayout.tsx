// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from 'react';
import {
  Home,
  Target,
  Compass,
  Calendar,
  BarChart3,
  Menu,
  Plus,
  Flame,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MainTab } from '../../types';
import { Toast } from '../Common/Toast';
import { MenuDrawer } from './MenuDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    openDrawer,
    streakDays,
    setIsCreateGoalOpen,
    setIsAssistantOpen,
  } = useApp();

  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-[22px] h-[22px]" /> },
    { id: 'goals', label: 'Metas', icon: <Target className="w-[22px] h-[22px]" /> },
    { id: 'plan', label: 'Meu plano', icon: <Compass className="w-[22px] h-[22px]" /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar className="w-[22px] h-[22px]" /> },
    { id: 'progress', label: 'Progresso', icon: <BarChart3 className="w-[22px] h-[22px]" /> },
  ];

  return (
    <div className="min-h-screen bg-[#09090D] text-[#F5F5FA] flex flex-col md:flex-row font-sans selection:bg-[#8B5CF6]/30">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#121219] border-r border-[#292936] shrink-0 sticky top-0 h-screen select-none z-20">
        {/* Brand Area */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[#292936]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
              <span className="text-white font-black text-sm tracking-tighter">D</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-[#F5F5FA] tracking-tight">DELUX</span>
                <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">2.0</span>
              </div>
              <p className="text-[11px] text-[#A1A1B4] leading-none mt-0.5">Planos reais para sua rotina</p>
            </div>
          </div>

          {/* Streak pill in header */}
          <button
            onClick={() => openDrawer('achievements')}
            title={`${streakDays} dias consecutivos de atividade · Clique para ver conquistas`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 border border-[#FBBF24]/30 text-[#FBBF24] text-xs font-semibold tabular-nums transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-[#FBBF24]" />
            <span>{streakDays}</span>
          </button>
        </div>

        {/* Quick Add Goal & Gemini Assistant Buttons */}
        <div className="px-4 pt-4 space-y-2">
          <button
            onClick={() => setIsCreateGoalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-md shadow-[#8B5CF6]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>

          <button
            onClick={() => setIsAssistantOpen(true)}
            className="w-full flex items-center justify-between py-2 px-3.5 rounded-xl bg-[#1A1A24] hover:bg-[#232332] border border-[#8B5CF6]/40 text-xs font-semibold text-[#F5F5FA] transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A78BFA] group-hover:rotate-12 transition-transform" />
              <span>Assistente Delux IA</span>
            </div>
            <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 px-1.5 py-0.5 rounded">
              Gemini
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1A1A24] text-[#F5F5FA] shadow-sm shadow-black/40 border border-[#292936]'
                    : 'text-[#A1A1B4] hover:text-[#F5F5FA] hover:bg-[#1A1A24]/50'
                }`}
              >
                <span className={isActive ? 'text-[#8B5CF6]' : 'text-[#6E6E82]'}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Hamburger Menu Button */}
        <div className="p-4 border-t border-[#292936]/60">
          <button
            onClick={() => openDrawer('preferences')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1A1A24] hover:bg-[#232332] border border-[#292936] text-xs font-medium text-[#A1A1B4] hover:text-[#F5F5FA] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Menu className="w-4 h-4 text-[#A78BFA]" />
              <span>Menu & Preferências</span>
            </div>
            <span className="text-[10px] text-[#6E6E82]">Opções</span>
          </button>
        </div>
      </aside>

      {/* MOBILE STICKY TOP APP BAR (iOS Style Glass Header) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#09090D]/85 backdrop-blur-xl border-b border-[#292936]/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-md shadow-[#8B5CF6]/30">
            <span className="text-white font-extrabold text-xs">D</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-[#F5F5FA]">DELUX</span>
            <span className="text-[9px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 px-1 py-0.2 rounded">2.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini Assistant Header Trigger */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 active:bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 text-[#A78BFA] text-xs font-bold min-h-[36px]"
            title="Abrir Assistente Gemini IA"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">IA</span>
          </button>

          {/* Streak pill button */}
          <button
            onClick={() => openDrawer('achievements')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBBF24]/10 active:bg-[#FBBF24]/20 border border-[#FBBF24]/30 text-[#FBBF24] text-xs font-bold tabular-nums min-h-[36px]"
            title="Ver conquistas da sequência"
          >
            <Flame className="w-3.5 h-3.5 fill-[#FBBF24]" />
            <span>{streakDays}</span>
          </button>

          {/* Menu Hambúrguer trigger with 44px hit area */}
          <button
            onClick={() => openDrawer('preferences')}
            aria-label="Abrir menu de opções e preferências"
            className="w-11 h-11 rounded-xl text-[#A1A1B4] active:text-[#F5F5FA] active:bg-[#1A1A24] transition-colors flex items-center justify-center shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-28 md:pb-8 relative">
        <div className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </div>

        {/* MOBILE FLOATING ASSISTANT THUMB TRIGGER */}
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-xl shadow-[#8B5CF6]/30 border border-white/20 active:scale-95 transition-transform"
          aria-label="Abrir Assistente Delux IA"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold">Assistente IA</span>
        </button>
      </main>

      {/* MOBILE FIXED BOTTOM TAB BAR (iOS Ergonomic Thumb-Zone) */}
      <nav
        aria-label="Navegação inferior mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D14]/92 backdrop-blur-2xl border-t border-[#292936]/80 px-2 pt-1 pb-[max(env(safe-area-inset-bottom,8px),10px)]"
      >
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center py-1 min-h-[48px] text-center transition-all active:scale-90"
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? 'text-[#8B5CF6] bg-[#8B5CF6]/15 scale-105'
                      : 'text-[#6E6E82]'
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-semibold tracking-tight whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#F5F5FA]' : 'text-[#6E6E82]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MENU DRAWER & TOAST */}
      <MenuDrawer />
      <Toast />
    </div>
  );
};
