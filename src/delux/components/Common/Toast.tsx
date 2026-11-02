// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from "react";
import { CheckCircle2, Info, Trophy, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-delux-success shrink-0" />,
    achievement: <Trophy className="w-4 h-4 text-delux-attention shrink-0" />,
    info: <Info className="w-4 h-4 text-delux-accent shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-delux-warning shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="delux-toast fixed bottom-20 md:bottom-8 right-1/2 md:right-8 translate-x-1/2 md:translate-x-0 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg delux-glass border text-delux-text text-xs font-medium shadow-2xl shadow-delux-ink/80 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 max-w-[90vw] whitespace-nowrap"
    >
      {icons[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
};
