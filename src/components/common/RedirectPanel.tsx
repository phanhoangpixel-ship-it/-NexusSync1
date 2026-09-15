import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, ExternalLink, LucideIcon, Info } from 'lucide-react';

export interface RedirectPanelProps {
  sourceModule?: string;
  targetModule: string;
  targetModuleName?: string;
  targetRoute: string;
  title: string;
  description: string;
  reason?: string;
  features?: string[];
  suggestedActions?: string[];
  badgeText?: string;
  icon?: LucideIcon;
  variant?: 'blue' | 'indigo' | 'emerald' | 'purple';
  onNavigate?: () => void;
}

export const RedirectPanel: React.FC<RedirectPanelProps> = ({
  sourceModule = 'M31',
  targetModule,
  targetModuleName = targetModule,
  targetRoute,
  title,
  description,
  reason = 'Tuân thủ nguyên tắc Single-Writer Domain Authority.',
  features = [],
  suggestedActions = [],
  badgeText,
  icon: Icon = ShieldCheck,
  variant = 'blue',
  onNavigate,
}) => {
  const combinedFeatures = features.length > 0 ? features : suggestedActions;
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
    window.dispatchEvent(
      new CustomEvent('nexus-navigate', {
        detail: {
          route: targetRoute,
          moduleId: targetModule,
        },
      })
    );
  };

  const theme = {
    blue: {
      card: 'border-blue-200 bg-gradient-to-b from-blue-50/50 via-white to-slate-50',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
      iconBox: 'bg-blue-100 text-blue-700 border-blue-200',
      accentText: 'text-blue-700',
    },
    indigo: {
      card: 'border-indigo-200 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
      iconBox: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      accentText: 'text-indigo-700',
    },
    emerald: {
      card: 'border-emerald-200 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
      iconBox: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      accentText: 'text-emerald-700',
    },
    purple: {
      card: 'border-purple-200 bg-gradient-to-b from-purple-50/50 via-white to-slate-50',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
      iconBox: 'bg-purple-100 text-purple-700 border-purple-200',
      accentText: 'text-purple-700',
    },
  }[variant];

  return (
    <div
      id={`redirect-panel-${targetModule.toLowerCase()}`}
      className={`rounded-2xl border p-6 sm:p-8 space-y-6 shadow-xs ${theme.card}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${theme.iconBox}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border ${theme.badge}`}>
                {badgeText || `${sourceModule} → ${targetModule}`}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Kiến Trúc Single-Writer Chuyên Biệt
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNavigate}
          className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${theme.btn}`}
        >
          <span>Mở {targetModuleName}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{description}</p>

        {/* Architecture Authority Explanatory Box */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <Info className={`w-4 h-4 ${theme.accentText} shrink-0`} />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nguyên Tắc Kiến Trúc Doanh Nghiệp (Enterprise Architecture Governance)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{reason}</p>
        </div>

        {/* Key Features List of the Target Module */}
        {features.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <h5 className="text-xs font-bold text-slate-700">Các chức năng chính tại phân hệ đích:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800"
                >
                  <CheckCircle2 className={`w-4 h-4 ${theme.accentText} shrink-0`} />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 font-mono">
        <span>Route: {targetRoute}</span>
        <button
          type="button"
          onClick={handleNavigate}
          className={`${theme.accentText} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
        >
          <span>Đi đến {targetModule} ngay</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
