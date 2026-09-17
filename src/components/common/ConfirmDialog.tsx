import React, { useEffect } from 'react';
import { ConfirmDialogState } from '../../types';
import { AlertCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  dialog?: ConfirmDialogState | null;
  dialogState?: ConfirmDialogState | null;
  state?: ConfirmDialogState | null;
  setState?: (state: ConfirmDialogState | ((prev: ConfirmDialogState) => ConfirmDialogState)) => void;
  isOpen?: boolean;
  title?: string;
  message?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
  type?: any;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  onClose?: () => void;
  onCancel?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  const effectiveDialog: ConfirmDialogState | null = props.dialog || props.dialogState || props.state || (props.isOpen ? {
    isOpen: props.isOpen,
    title: props.title || '',
    message: props.message || '',
    variant: props.variant || (props.type === 'danger' ? 'danger' : 'primary'),
    onConfirm: props.onConfirm || (() => {}),
    confirmText: props.confirmText,
    cancelText: props.cancelText,
  } : null);

  const onClose = props.onClose || props.onCancel || effectiveDialog?.onCancel || (() => {
    if (props.setState && effectiveDialog) {
      props.setState({ ...effectiveDialog, isOpen: false });
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (effectiveDialog?.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveDialog?.isOpen, onClose]);

  if (!effectiveDialog || !effectiveDialog.isOpen) return null;

  const isDanger = effectiveDialog.variant === 'danger';
  const isWarning = effectiveDialog.variant === 'warning';

  return (
    <div
      id="confirm-dialog-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all"
    >
      <div
        id="confirm-dialog-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-rose-100 text-rose-600'
                  : isWarning
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isDanger ? (
                <AlertCircle className="w-6 h-6" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{effectiveDialog.title}</h3>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{effectiveDialog.message}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            {effectiveDialog.cancelText || 'Hủy bỏ'}
          </button>
          <button
            type="button"
            onClick={() => {
              effectiveDialog.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-colors ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {effectiveDialog.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
