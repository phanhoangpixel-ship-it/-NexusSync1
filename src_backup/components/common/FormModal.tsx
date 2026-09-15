import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footerActions?: React.ReactNode;
  hideFooter?: boolean;
  disabled?: boolean;
  error?: string | null;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Lưu thông tin',
  cancelLabel = 'Hủy bỏ',
  size = 'lg',
  footerActions,
  hideFooter = false,
  disabled = false,
  error,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-[95vw] h-[92vh]',
  }[size];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isSubmitting && !disabled) {
      onSubmit(e);
    }
  };

  return (
    <div
      id="form-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        id="form-modal-container"
        className={`w-full ${sizeClasses} bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 tracking-tight truncate leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-500 truncate leading-snug mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-50"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification Bar (if provided) */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form or Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-slate-800 text-sm">
            {children}
          </div>

          {/* Sticky Footer */}
          {!hideFooter && (
            <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between shrink-0 gap-3">
              <div>
                {footerActions}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                {onSubmit && (
                  <button
                    type="submit"
                    disabled={isSubmitting || disabled}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitLabel}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
