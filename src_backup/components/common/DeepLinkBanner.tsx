import React from 'react';
import { ArrowRight, LucideIcon, Sparkles } from 'lucide-react';

export interface DeepLinkBannerProps {
  targetModule?: string;
  sourceModule?: string;
  targetRoute?: string;
  route?: string;
  title?: string;
  description: string;
  actionText?: string;
  badgeText?: string;
  icon?: LucideIcon;
  variant?: 'indigo' | 'blue' | 'purple' | 'amber' | 'emerald' | 'neutral';
  onNavigate?: () => void;
  className?: string;
}

export const DeepLinkBanner: React.FC<DeepLinkBannerProps> = ({
  targetModule = 'Liên kết hệ thống',
  sourceModule,
  targetRoute,
  route,
  title,
  description,
  actionText = 'Chuyển đến phân hệ',
  badgeText,
  icon: Icon = Sparkles,
  variant = 'neutral',
  onNavigate,
  className = '',
}) => {
  const effectiveRoute = targetRoute || route || '/';
  const effectiveBadge = badgeText || targetModule;
  const effectiveTitle = title || `Liên kết nghiệp vụ ${targetModule}`;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
    // Universal event dispatch for App.tsx router
    window.dispatchEvent(
      new CustomEvent('nexus-navigate', {
        detail: {
          route: effectiveRoute,
          moduleId: targetModule,
        },
      })
    );
  };

  return (
    <div
      id={`deep-link-banner-${String(effectiveBadge).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs px-3.5 py-2.5 sm:px-4 sm:py-3 transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {effectiveBadge}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {effectiveTitle}
            </h4>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-1">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNavigate}
        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
      >
        <span>{actionText}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

