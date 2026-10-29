// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MainTab } from "../../types";
import { Toast } from "../Common/Toast";
import { MenuDrawer } from "./MenuDrawer";

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

  const [mobileBarsHidden, setMobileBarsHidden] = useState(false);
  const previousScrollTop = useRef(0);
  const scrollTick = useRef<number | null>(null);

  // Listen to both the app's inner scroller and the document. Depending on the
  // screen/route, either the main region or the page itself may own scrolling.
  useEffect(() => {
    const updateFromScroll = (rawTop: number) => {
      if (scrollTick.current !== null) cancelAnimationFrame(scrollTick.current);
      scrollTick.current = requestAnimationFrame(() => {
        const current = Math.max(0, rawTop);
        const previous = previousScrollTop.current;
        if (current < 24) setMobileBarsHidden(false);
        else if (current > previous + 5) setMobileBarsHidden(true);
        else if (current < previous - 5) setMobileBarsHidden(false);
        previousScrollTop.current = current;
      });
    };
    const onWindowScroll = () => updateFromScroll(window.scrollY || document.documentElement.scrollTop || 0);
    const main = document.querySelector(".delux-content");
    const onMainScroll = () => updateFromScroll((main as HTMLElement | null)?.scrollTop || 0);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    main?.addEventListener("scroll", onMainScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      main?.removeEventListener("scroll", onMainScroll);
      if (scrollTick.current !== null) cancelAnimationFrame(scrollTick.current);
    };
  }, []);

  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Início", icon: <Home className="w-[22px] h-[22px]" /> },
    { id: "goals", label: "Metas", icon: <Target className="w-[22px] h-[22px]" /> },
    { id: "plan", label: "Meu plano", icon: <Compass className="w-[22px] h-[22px]" /> },
    { id: "calendar", label: "Calendário", icon: <Calendar className="w-[22px] h-[22px]" /> },
    { id: "progress", label: "Progresso", icon: <BarChart3 className="w-[22px] h-[22px]" /> },
  ];

  return (
    <div className="min-h-screen bg-delux-canvas text-delux-text flex flex-col md:flex-row font-sans selection:bg-delux-purple/30">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 delux-glass border-r shrink-0 sticky top-0 h-screen select-none z-20">
        {/* Brand Area */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-delux-light/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-delux-brand-start/95 via-delux-brand-mid/95 to-delux-blue/95 p-0.5 shadow-md shadow-delux-brand-mid/30 flex items-center justify-center relative overflow-hidden">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full p-1.5 text-delux-light"
                aria-label="Logo Delux"
              >
                <path
                  d="M8 22L16 10L24 22"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 18L16 13L19 18"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.75"
                />
                <circle cx="16" cy="6" r="2.2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-delux-text tracking-tight">DELUX</span>
                <span className="text-[10px] font-bold text-delux-purple bg-delux-purple/10 px-1.5 py-0.5 rounded">
                  2.0
                </span>
              </div>
              <p className="text-[11px] text-delux-secondary leading-none mt-0.5">
                Planos reais para sua rotina
              </p>
            </div>
          </div>

          {/* Streak pill in header */}
          <Button
            variant="delux"
            size="delux"
            onClick={() => openDrawer("achievements")}
            title={`${streakDays} dias consecutivos de atividade · Clique para ver conquistas`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-delux-amber/10 hover:bg-delux-amber/20 border border-delux-amber/30 text-delux-amber text-xs font-semibold tabular-nums transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-delux-amber" />
            <span>{streakDays}</span>
          </Button>
        </div>

        {/* Quick Add Goal & Gemini Assistant Buttons */}
        <div className="px-4 pt-4 space-y-2">
          <Button
            variant="delux"
            size="delux"
            onClick={() => setIsCreateGoalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-delux-purple hover:bg-delux-purple-hover text-delux-light text-xs font-semibold shadow-md shadow-delux-purple/20 transition-all active:opacity-85"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </Button>

          <Button
            variant="delux"
            size="delux"
            onClick={() => setIsAssistantOpen(true)}
            className="w-full flex items-center justify-between py-2 px-3.5 rounded-xl delux-glass-action text-xs font-semibold text-delux-text transition-all group active:opacity-85"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-delux-purple-light group-hover:rotate-12 transition-transform" />
              <span>Assistente Delux IA</span>
            </div>
            <span className="text-[10px] font-bold text-delux-purple bg-delux-purple/15 px-1.5 py-0.5 rounded">
              IA
            </span>
          </Button>
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Button
                variant="delux"
                size="delux"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "delux-selected text-delux-text border border-transparent"
                    : "text-delux-secondary hover:text-delux-text hover:bg-delux-elevated/50"
                }`}
              >
                <span className={isActive ? "text-delux-purple" : "text-delux-muted"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-delux-purple" />}
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Hamburger Menu Button */}
        <div className="p-4 border-t border-delux-border/60">
          <Button
            variant="delux"
            size="delux"
            onClick={() => openDrawer("preferences")}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl delux-glass-action text-xs font-medium text-delux-secondary hover:text-delux-text transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Menu className="w-4 h-4 text-delux-purple-light" />
              <span>Menu & Preferências</span>
            </div>
            <span className="text-[10px] text-delux-muted">Opções</span>
          </Button>
        </div>
      </aside>

      {/* MOBILE STICKY TOP APP BAR (iOS Style Glass Header) */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 delux-glass delux-mobile-header border-b transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none ${mobileBarsHidden ? "-translate-y-[82%] scale-[0.97] blur-[8px] opacity-0 pointer-events-none" : "translate-y-0 scale-100 blur-0 opacity-100"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-delux-brand-start via-delux-brand-mid to-delux-blue p-0.5 shadow-md shadow-delux-brand-mid/30 flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full p-1 text-delux-light"
              aria-label="Logo Delux"
            >
              <path
                d="M8 22L16 10L24 22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 18L16 13L19 18"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
              <circle cx="16" cy="6" r="2.2" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-delux-text">DELUX</span>
            <span className="text-[9px] font-bold text-delux-purple bg-delux-purple/15 px-1 py-0.2 rounded">
              2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak pill button */}
          <Button
            variant="delux"
            size="delux"
            onClick={() => openDrawer("achievements")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-delux-amber/10 active:bg-delux-amber/20 border border-delux-amber/30 text-delux-amber text-xs font-bold tabular-nums min-h-[36px]"
            title="Ver conquistas da sequência"
          >
            <Flame className="w-3.5 h-3.5 fill-delux-amber" />
            <span>{streakDays}</span>
          </Button>

          {/* Menu Hambúrguer trigger with 44px hit area */}
          <Button
            variant="delux"
            size="delux"
            onClick={() => openDrawer("preferences")}
            aria-label="Abrir menu de opções e preferências"
            className="w-11 h-11 rounded-xl text-delux-secondary active:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="delux-content flex-1 flex flex-col min-h-0 overflow-y-auto pt-14 md:pt-0 relative">
        <div className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </div>

        {/* MOBILE FLOATING ASSISTANT THUMB TRIGGER */}
        <Button
          variant="delux"
          size="delux"
          onClick={() => setIsAssistantOpen(true)}
          className={`md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full delux-glass delux-primary-action delux-floating-assistant text-delux-light active:opacity-85 transition-[transform,opacity,filter] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none ${mobileBarsHidden ? "translate-y-10 scale-90 blur-[6px] opacity-0 pointer-events-none" : "translate-y-0 scale-100 blur-0 opacity-100"}`}
          aria-label="Abrir Assistente Delux IA"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold">Assistente IA</span>
        </Button>
      </main>

      {/* MOBILE FIXED BOTTOM TAB BAR (iOS Ergonomic Thumb-Zone) */}
      <nav
        aria-label="Navegação inferior mobile"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 delux-glass delux-mobile-nav transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none ${mobileBarsHidden ? "translate-y-[115%] scale-[0.94] blur-[10px] opacity-0 pointer-events-none" : "translate-y-0 scale-100 blur-0 opacity-100"}`}
      >
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Button
                variant="delux"
                size="delux"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-1 min-h-[48px] text-center transition-all rounded-[18px] ${isActive ? "delux-selected" : ""}`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? "text-delux-purple-light" : "text-delux-muted"
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-semibold tracking-tight whitespace-nowrap transition-colors ${
                    isActive ? "text-delux-text" : "text-delux-muted"
                  }`}
                >
                  {item.label}
                </span>
              </Button>
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
