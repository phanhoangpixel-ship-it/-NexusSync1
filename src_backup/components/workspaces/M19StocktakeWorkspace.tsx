import React, { useState } from 'react';
import { 
  ClipboardCheck, Edit3, Scale, Users, Calendar, 
  BookOpen, ShieldCheck, RefreshCw, Plus, Layers
} from 'lucide-react';
import { SelectedEntityContext } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { StocktakeMasterSessionsTab } from './stocktake/StocktakeMasterSessionsTab';
import { StocktakeFieldExecutionTab } from './stocktake/StocktakeFieldExecutionTab';
import { StocktakeVarianceReconciliationTab } from './stocktake/StocktakeVarianceReconciliationTab';
import { StocktakeTaskAssignmentTab } from './stocktake/StocktakeTaskAssignmentTab';
import { StocktakeSchedulesTab } from './stocktake/StocktakeSchedulesTab';
import { StocktakeLedgerHistoryTab } from './stocktake/StocktakeLedgerHistoryTab';

type StocktakeSubTab = 'sessions' | 'field_count' | 'variance' | 'assignments' | 'schedules' | 'ledger';

interface M19StocktakeWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const M19StocktakeWorkspace: React.FC<M19StocktakeWorkspaceProps> = ({
  onSelectEntity,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<StocktakeSubTab>('M19', 'sessions');
  const [activeSessionId, setActiveSessionId] = useState<string>('STK-HN-2026-09A');

  // Handle adapter for notification types (maps danger -> error)
  const notifyAdapter = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    onNotify(type, title, message || '');
  };

  const handleOpenSessionCount = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('field_count');
  };

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M19 • WMS STOCKTAKE
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Rule #03 • SHA-256 GL Ledger
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Quản Lý Kiểm Kê &amp; Kiểm Đếm Mù Kho Vận
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Phiên Kiểm Kê</span>
          </button>

          <button
            onClick={() => setActiveTab('field_count')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'field_count'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Bàn Đếm Mù Hiện Trường</span>
          </button>

          <button
            onClick={() => setActiveTab('variance')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'variance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Đối Soát Chênh Lệch</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Phân Công Đội Đếm</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Định Kỳ &amp; Đóng Băng Kho</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ Cái Bất Biến</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Stocktake Core Engine
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            Blind Count &amp; Variance
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'sessions' && (
          <StocktakeMasterSessionsTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
            onOpenSessionCount={handleOpenSessionCount}
          />
        )}

        {activeTab === 'field_count' && (
          <StocktakeFieldExecutionTab
            onNotify={notifyAdapter}
            defaultSessionId={activeSessionId}
          />
        )}

        {activeTab === 'variance' && (
          <StocktakeVarianceReconciliationTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
          />
        )}

        {activeTab === 'assignments' && (
          <StocktakeTaskAssignmentTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
          />
        )}

        {activeTab === 'schedules' && (
          <StocktakeSchedulesTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
          />
        )}

        {activeTab === 'ledger' && (
          <StocktakeLedgerHistoryTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
          />
        )}
      </div>
    </div>
  );
};

export default M19StocktakeWorkspace;

