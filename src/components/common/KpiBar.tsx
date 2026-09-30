import React from 'react';

export interface KpiMetricItem {
  id: string;
  label: string;
  value: string | number;
  changePercent?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo';
  onClick?: () => void;
}

export interface KpiBarProps {
  metrics: KpiMetricItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const variantStyles: Record<
  string,
  { bgIcon: string; textIcon: string; textVal: string }
> = {
  default: {
    bgIcon: 'bg-slate-100 dark:bg-slate-700/60',
    textIcon: 'text-slate-600 dark:text-slate-300',
    textVal: 'text-slate-900 dark:text-white',
  },
  blue: {
    bgIcon: 'bg-blue-50 dark:bg-blue-950/60',
    textIcon: 'text-blue-600 dark:text-blue-400',
    textVal: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    bgIcon: 'bg-emerald-50 dark:bg-emerald-950/60',
    textIcon: 'text-emerald-600 dark:text-emerald-400',
    textVal: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bgIcon: 'bg-amber-50 dark:bg-amber-950/60',
    textIcon: 'text-amber-600 dark:text-amber-400',
    textVal: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bgIcon: 'bg-rose-50 dark:bg-rose-950/60',
    textIcon: 'text-rose-600 dark:text-rose-400',
    textVal: 'text-rose-600 dark:text-rose-400',
  },
  purple: {
    bgIcon: 'bg-purple-50 dark:bg-purple-950/60',
    textIcon: 'text-purple-600 dark:text-purple-400',
    textVal: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    bgIcon: 'bg-indigo-50 dark:bg-indigo-950/60',
    textIcon: 'text-indigo-600 dark:text-indigo-400',
    textVal: 'text-indigo-600 dark:text-indigo-400',
  },
};

export const KpiBar: React.FC<KpiBarProps> = ({
  metrics,
  columns = 4,
  className = '',
}) => {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : columns === 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3.5 ${className}`}>
      {metrics.map((item) => {
        const style = variantStyles[item.variant || 'default'];
        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={`p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3 transition-all ${
              item.onClick
                ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xs'
                : ''
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                {item.label}
              </span>
              <div
                className={`font-mono tabular-nums font-bold text-xl sm:text-2xl truncate ${style.textVal}`}
              >
                {typeof item.value === 'number'
                  ? item.value.toLocaleString('vi-VN')
                  : item.value}
              </div>
              {item.changeLabel && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {item.changeLabel}
                </div>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bgIcon} ${style.textIcon}`}
            >
              {item.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
};
