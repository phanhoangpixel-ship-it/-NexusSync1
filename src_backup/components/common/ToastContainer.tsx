import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, ArrowRight, ExternalLink } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onNavigate?: (route: string) => void;
}

interface SingleToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  onNavigate?: (route: string) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onDismiss, onNavigate }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 4500;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id]);

  let borderStyle = 'border-blue-200/90 dark:border-blue-800/80';
  let badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50';
  let progressColor = 'bg-blue-600';
  let iconBg = 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400';
  let Icon = Info;

  if (toast.type === 'success') {
    borderStyle = 'border-emerald-200/90 dark:border-emerald-800/80';
    badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50';
    progressColor = 'bg-emerald-600';
    iconBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400';
    Icon = CheckCircle2;
  } else if (toast.type === 'danger') {
    borderStyle = 'border-rose-200/90 dark:border-rose-800/80';
    badgeStyle = 'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50';
    progressColor = 'bg-rose-600';
    iconBg = 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400';
    Icon = AlertCircle;
  } else if (toast.type === 'warning') {
    borderStyle = 'border-amber-200/90 dark:border-amber-800/80';
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50';
    progressColor = 'bg-amber-500';
    iconBg = 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400';
    Icon = AlertTriangle;
  }

  const handleActionClick = () => {
    if (toast.link && onNavigate) {
      onNavigate(toast.link);
      onDismiss(toast.id);
    }
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto relative overflow-hidden flex flex-col rounded-2xl border backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5 ${borderStyle}`}
      role="alert"
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {toast.module && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${badgeStyle}`}>
                {toast.module}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(toast.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed break-words font-normal">
            {toast.message}
          </p>

          {/* 1-touch Quick Action Link */}
          {toast.link && onNavigate && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                <span>Xem ngay</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          title="Đóng thông báo"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-dismiss countdown bar */}
      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onNavigate }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <SingleToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};
