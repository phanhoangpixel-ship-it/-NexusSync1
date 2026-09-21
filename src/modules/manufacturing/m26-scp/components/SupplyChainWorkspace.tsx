import React, { useEffect } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import {
  TrendingUp,
  Cpu,
  ShieldAlert,
  ShoppingCart,
  Network,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ForecastMpsTab } from './ForecastMpsTab';
import { MrpRunResultsTab } from './MrpRunResultsTab';
import { MrpExceptionsTab } from './MrpExceptionsTab';
import { DelegationPrMoTab } from './DelegationPrMoTab';
import { SupplyChainNetworkTab } from './SupplyChainNetworkTab';
import { AuditDmsDossiersTab } from './AuditDmsDossiersTab';

interface SupplyChainWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

type M26TabType = 'mrp' | 'forecast_mps' | 'exceptions' | 'delegation' | 'network' | 'certification';

export const SupplyChainWorkspace: React.FC<SupplyChainWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<M26TabType>('M26', 'mrp');

  useEffect(() => {
    if (activeTab === 'mrp') {
      setPrimaryAction(undefined, undefined);
    }
    return () => setPrimaryAction(undefined, undefined);
  }, [activeTab, setPrimaryAction]);

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (M25 COMPATIBLE & MODERN)            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M26 • SUPPLY CHAIN PLANNING
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Rule #03-#07 • SCM &amp; MRP II Engine
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Kế Hoạch Chuỗi Cung Ứng &amp; Cân Bằng Nhu Cầu MRP
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-semibold">
            <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>13/13 Pass (100%)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (M25 & M41 MASTER SPEC)                         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full pb-0.5 custom-scrollbar">
          <button
            onClick={() => setActiveTab('mrp')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'mrp'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Cân Bằng MRP &amp; Nhu Cầu Ròng</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast_mps')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'forecast_mps'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Dự Báo &amp; Lịch MPS</span>
          </button>

          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'exceptions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Cảnh Báo &amp; Ngoại Lệ</span>
          </button>

          <button
            onClick={() => setActiveTab('delegation')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'delegation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Ủy Quyền Tái Cung Ứng (PR/MO)</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'network'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-4 h-4 shrink-0" />
            <span>Mạng Lưới Chuỗi Cung Ứng</span>
          </button>

          <button
            onClick={() => setActiveTab('certification')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'certification'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Niêm Phong &amp; Chứng Nhận (Audit/DMS)</span>
          </button>
        </div>

        {/* Right Info Strip with Pulsing Green Indicator */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            SCM Engine v3.8
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
            Multi-Level BOM &amp; Pegging
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {activeTab === 'mrp' && (
          <MrpRunResultsTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
        )}

        {activeTab === 'forecast_mps' && (
          <ForecastMpsTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
        )}

        {activeTab === 'exceptions' && (
          <MrpExceptionsTab onNotify={onNotify} />
        )}

        {activeTab === 'delegation' && (
          <DelegationPrMoTab onNotify={onNotify} />
        )}

        {activeTab === 'network' && (
          <SupplyChainNetworkTab onNotify={onNotify} />
        )}

        {activeTab === 'certification' && (
          <AuditDmsDossiersTab onNotify={onNotify} />
        )}
      </div>
    </div>
  );
};

