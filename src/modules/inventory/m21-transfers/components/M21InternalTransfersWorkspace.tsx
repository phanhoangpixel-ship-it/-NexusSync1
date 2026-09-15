import React, { useState } from 'react';
import { 
  ArrowLeftRight, Send, Scale, Users, Calendar, 
  BookOpen, ShieldCheck, RefreshCw, Plus, Layers, Truck, CheckSquare
} from 'lucide-react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { TransferMasterOrdersTab } from './TransferMasterOrdersTab';
import { TransferDispatchExecutionTab } from './TransferDispatchExecutionTab';
import { TransferDiscrepancyReconciliationTab } from './TransferDiscrepancyReconciliationTab';
import { TransferFleetAssignmentTab } from './TransferFleetAssignmentTab';
import { TransferRoutesSchedulesTab } from './TransferRoutesSchedulesTab';
import { TransferLedgerHistoryTab } from './TransferLedgerHistoryTab';

export type TransferSubTab = 'master_orders' | 'dispatch_desk' | 'discrepancy' | 'fleet' | 'routes' | 'ledger';

interface M21InternalTransfersWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const M21InternalTransfersWorkspace: React.FC<M21InternalTransfersWorkspaceProps> = ({
  onSelectEntity,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<TransferSubTab>('M21', 'master_orders');
  const [activeTransferId, setActiveTransferId] = useState<string>('TRF-HN-HCM-2026-09A');

  // Handle adapter for notification types (maps danger -> error)
  const notifyAdapter = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    onNotify(type, title, message || '');
  };

  const handleOpenExecutionDesk = (transferId: string) => {
    setActiveTransferId(transferId);
    setActiveTab('dispatch_desk');
  };

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M21 • WMS INTERNAL TRANSFERS &amp; IN-TRANSIT
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Rule #03 • SHA-256 In-Transit Ledger (TK 157)
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Điều Chuyển Kho Nội Bộ &amp; Quản Trị Hàng Đi Đường
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
            onClick={() => setActiveTab('master_orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'master_orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Lệnh Điều Chuyển</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch_desk')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dispatch_desk'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Bàn Soát Hàng &amp; Thực Nhận</span>
          </button>

          <button
            onClick={() => setActiveTab('discrepancy')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'discrepancy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Đối Soát Chênh Lệch</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Phân Công Đội Xe</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'routes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tuyến Cố Định &amp; Đóng Băng</span>
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
            <span>Sổ Cái Đi Đường (TK 157)</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Transfer Authority
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            2-Step Dispatch &amp; Receive
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'master_orders' && (
          <TransferMasterOrdersTab
            onNotify={notifyAdapter}
            onSelectEntity={onSelectEntity}
            onOpenExecutionDesk={handleOpenExecutionDesk}
          />
        )}

        {activeTab === 'dispatch_desk' && (
          <TransferDispatchExecutionTab
            onNotify={notifyAdapter}
            defaultTransferId={activeTransferId}
          />
        )}

        {activeTab === 'discrepancy' && (
          <TransferDiscrepancyReconciliationTab
            onNotify={notifyAdapter}
          />
        )}

        {activeTab === 'fleet' && (
          <TransferFleetAssignmentTab
            onNotify={notifyAdapter}
          />
        )}

        {activeTab === 'routes' && (
          <TransferRoutesSchedulesTab
            onNotify={notifyAdapter}
          />
        )}

        {activeTab === 'ledger' && (
          <TransferLedgerHistoryTab
            onNotify={notifyAdapter}
          />
        )}
      </div>
    </div>
  );
};

export default M21InternalTransfersWorkspace;
