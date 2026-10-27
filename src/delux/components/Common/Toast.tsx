// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from 'react';
import { CheckCircle2, Info, Trophy, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />,
    achievement: <Trophy className="w-4 h-4 text-[#FBBF24] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#A78BFA] shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-8 right-1/2 md:right-8 translate-x-1/2 md:translate-x-0 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1A1A24] border border-[#292936] text-[#F5F5FA] text-xs font-medium shadow-2xl shadow-black/80 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 max-w-[90vw] whitespace-nowrap"
    >
      {icons[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
};
