// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { Button } from "@/components/ui/button";
import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 delux-glass-overlay animate-in fade-in duration-150"
    >
      <div className="fixed inset-0 z-0" onClick={onCancel} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-md p-5 sm:p-6 rounded-t-[32px] sm:rounded-2xl delux-glass-panel border-t sm:border text-delux-text space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-1 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-delux-border-hover rounded-full" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {isDestructive && (
              <div className="w-10 h-10 rounded-xl bg-delux-danger/15 text-delux-red flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <h3 id="confirm-modal-title" className="text-base font-bold">
              {title}
            </h3>
          </div>
          <Button
            variant="delux"
            size="delux"
            onClick={onCancel}
            className="w-10 h-10 rounded-xl text-delux-secondary hover:text-delux-text active:bg-delux-elevated transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-xs sm:text-sm text-delux-secondary leading-relaxed">{description}</p>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <Button
            variant="delux"
            size="delux"
            onClick={onCancel}
            className="px-5 py-3 text-xs font-semibold text-delux-secondary hover:text-delux-text bg-delux-elevated active:bg-delux-border rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="delux"
            size="delux"
            onClick={onConfirm}
            className={`px-6 py-3 text-xs font-bold rounded-xl transition-all min-h-[48px] flex items-center justify-center active:opacity-85 ${
              isDestructive
                ? "bg-delux-red hover:bg-delux-danger text-delux-light shadow-lg shadow-delux-danger/20"
                : "bg-delux-purple hover:bg-delux-purple-hover text-delux-light shadow-lg shadow-delux-purple/30"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
