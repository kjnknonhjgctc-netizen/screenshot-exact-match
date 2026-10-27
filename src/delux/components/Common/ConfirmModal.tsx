import React from 'react';
import { AlertCircle, X } from 'lucide-react';

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
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0 z-0"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-md p-5 sm:p-6 rounded-t-[32px] sm:rounded-2xl bg-[#121219] border-t sm:border border-[#292936] shadow-2xl text-[#F5F5FA] space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="pt-1 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-[#3E3E52] rounded-full" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {isDestructive && (
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-[#F87171] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <h3 id="confirm-modal-title" className="text-base font-bold">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl text-[#A1A1B4] hover:text-[#F5F5FA] active:bg-[#1A1A24] transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#A1A1B4] leading-relaxed">{description}</p>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-3 text-xs font-semibold text-[#A1A1B4] hover:text-[#F5F5FA] bg-[#1A1A24] active:bg-[#232332] rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-3 text-xs font-bold rounded-xl transition-all min-h-[48px] flex items-center justify-center active:scale-95 ${
              isDestructive
                ? 'bg-[#F87171] hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
