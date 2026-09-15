import React from 'react';
import { BRANCHES } from '../../config/moduleRegistry';
import { Building2 } from 'lucide-react';
import { dispatchContextChange } from '../../hooks/useWorkspaceContextSync';

export interface BranchSelectorProps {
  currentBranch: string;
  onBranchChange: (branchId: string) => void;
  variant?: 'header' | 'sidebar' | 'card';
  className?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  currentBranch,
  onBranchChange,
  variant = 'sidebar',
  className = '',
}) => {
  const handleSelectBranch = (newBranchId: string) => {
    onBranchChange(newBranchId);
    dispatchContextChange({ branchId: newBranchId, timestamp: Date.now() });
  };

  const activeBranch = BRANCHES.find((b) => b.id === currentBranch) || BRANCHES[0];

  if (variant === 'sidebar') {
    return (
      <div id="nexus-sidebar-branch-selector" className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Building2 className="w-3 h-3" />
            <span>Đơn vị / Chi nhánh</span>
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
            {activeBranch.code}
          </span>
        </div>
        <div className="relative">
          <select
            id="sidebar-branch-select-input"
            value={currentBranch}
            onChange={(e) => handleSelectBranch(e.target.value)}
            className="w-full text-xs font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 py-1.5 px-2.5 rounded-lg outline-none cursor-pointer truncate transition-colors"
          >
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                {b.code} — {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div id="nexus-card-branch-selector" className={`p-4 rounded-xl bg-slate-50 border border-slate-200 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Chi nhánh làm việc (Branch)</h4>
              <p className="text-[11px] text-slate-500">Phân định dữ liệu chứng từ và tồn kho kho bãi</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
            {activeBranch.code}
          </span>
        </div>
        <select
          value={currentBranch}
          onChange={(e) => handleSelectBranch(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:border-blue-500 py-2 px-3 rounded-lg outline-none cursor-pointer transition-colors shadow-2xs"
        >
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.name} {b.isDefault ? '(Mặc định)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div id="nexus-branch-selector" className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <select
        id="nexus-branch-select-input"
        value={currentBranch}
        onChange={(e) => handleSelectBranch(e.target.value)}
        className="text-xs font-semibold text-slate-700 bg-transparent hover:bg-slate-100 py-1 px-1.5 rounded-md outline-none cursor-pointer max-w-[150px] lg:max-w-[210px] truncate"
      >
        {BRANCHES.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </select>
    </div>
  );
};

