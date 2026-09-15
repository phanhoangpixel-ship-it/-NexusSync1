import React from 'react';
import { ENVIRONMENT_PROFILES } from '../../config/moduleRegistry';
import { Layers } from 'lucide-react';

export interface EnvironmentProfileSelectorProps {
  currentProfile: string;
  onProfileChange: (profileId: string) => void;
  variant?: 'header' | 'sidebar' | 'card';
  className?: string;
}

export const EnvironmentProfileSelector: React.FC<EnvironmentProfileSelectorProps> = ({
  currentProfile,
  onProfileChange,
  variant = 'sidebar',
  className = '',
}) => {
  const activeProfile =
    ENVIRONMENT_PROFILES.find((p) => p.id === currentProfile) ||
    ENVIRONMENT_PROFILES.find((p) => p.id === 'FULL_ERP') ||
    ENVIRONMENT_PROFILES[0];

  if (variant === 'sidebar') {
    return (
      <div id="nexus-sidebar-profile-selector" className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
          <span className="flex items-center gap-1.5 text-purple-400">
            <Layers className="w-3 h-3" />
            <span>Hồ sơ môi trường</span>
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 truncate max-w-[80px]">
            {activeProfile.id}
          </span>
        </div>
        <div className="relative">
          <select
            id="sidebar-profile-select-input"
            value={currentProfile}
            onChange={(e) => onProfileChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 py-1.5 px-2.5 rounded-lg outline-none cursor-pointer truncate transition-colors"
          >
            {ENVIRONMENT_PROFILES.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div id="nexus-card-profile-selector" className={`p-4 rounded-xl bg-slate-50 border border-slate-200 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hồ sơ Môi trường ERP (Profile)</h4>
              <p className="text-[11px] text-slate-500">Giới hạn phân hệ nghiệp vụ theo mô hình vận hành</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
            {activeProfile.id}
          </span>
        </div>
        <select
          value={currentProfile}
          onChange={(e) => onProfileChange(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:border-purple-500 py-2 px-3 rounded-lg outline-none cursor-pointer transition-colors shadow-2xs mb-2"
        >
          {ENVIRONMENT_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
          {activeProfile.description}
        </p>
      </div>
    );
  }

  return (
    <div id="nexus-profile-selector" className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      <Layers className="w-3.5 h-3.5 text-slate-400 font-bold shrink-0" />
      <select
        value={currentProfile}
        onChange={(e) => onProfileChange(e.target.value)}
        className="text-xs font-semibold text-slate-700 bg-transparent hover:bg-slate-100 py-1 px-1.5 rounded-md outline-none cursor-pointer max-w-[140px] lg:max-w-[180px] truncate"
      >
        {ENVIRONMENT_PROFILES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};
