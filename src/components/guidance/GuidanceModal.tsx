import React, { useState } from 'react';
import {
  Compass,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Briefcase,
  HelpCircle,
  Layers,
  BookOpen,
  Workflow,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
} from 'lucide-react';
import { IntentBar } from './IntentBar';
import { BusinessGpsTracker } from './BusinessGpsTracker';
import { MyWorkWidget } from './MyWorkWidget';
import { NextActionCard } from './NextActionCard';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { BusinessGuidanceService, ACTION_CONTRACTS } from '../../services/guidanceEngine';
import { NextBestAction } from '../../types/guidance';
import { UserSession } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState } from '../../types';
import { MODULE_REGISTRY } from '../../config/moduleRegistry';
import { getModuleContract } from '../knowledge/ModuleGuidedDrawer';

interface GuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  currentBranch?: string;
  currentModuleId?: string;
  onNavigateToModule: (moduleId: string, payload?: any) => void;
}

export const GuidanceModal: React.FC<GuidanceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentBranch = 'BR_HO',
  currentModuleId = 'M01',
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTION' | 'WORKFLOW' | 'CONTRACT'>('ACTION');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const sampleNextAction: NextBestAction =
    BusinessGuidanceService.getNextBestAction('SalesOrder', 'SUBMITTED', currentUser.role) ||
    BusinessGuidanceService.getNextBestAction('PurchaseOrder', 'APPROVED', currentUser.role)!;

  const currentModule = MODULE_REGISTRY.find((m) => m.moduleId === currentModuleId) || MODULE_REGISTRY[0];
  const currentContract = getModuleContract(currentModule);

  if (!isOpen) return null;

  return (
    <>
      <div
        id="nexus-guidance-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          id="nexus-guidance-modal-container"
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-inner border border-blue-400/40">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Trợ Giúp & Định Hướng Doanh Nghiệp (Smart Guidance Hub)
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    NexusSync ERP
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Hệ sinh thái hỗ trợ thông minh: Hành động tiếp theo, Bản đồ hành trình & Hướng dẫn phân hệ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (3 Clean Tabs) */}
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-3 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('ACTION')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'ACTION'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>📌 1. Hành Động Tiếp Theo (Next Best Action)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WORKFLOW')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'WORKFLOW'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>🗺️ 2. Bản Đồ Hành Trình & Tiến Trình (Workflow Visualizer)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONTRACT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'CONTRACT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 3. Tài Liệu & Hướng Dẫn Phân Hệ ({currentModule.moduleId})</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 flex flex-col gap-6">
            {activeTab === 'ACTION' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Xác Định Mục Tiêu Nhanh Bằng Ngôn Ngữ Tự Nhiên</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Nhập yêu cầu nghiệp vụ để hệ thống tự động định tuyến đến phân hệ chuẩn và đề xuất hành động tối ưu.
                  </p>
                  <IntentBar
                    currentUser={currentUser}
                    currentBranch={currentBranch}
                    currentModuleId={currentModuleId}
                    onNavigateToModule={(modId, payload) => {
                      onNavigateToModule(modId, payload);
                      onClose();
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Gợi Ý Đề Xuất Bước Tiếp Theo (NBA)
                    </h4>
                    <NextActionCard
                      action={sampleNextAction}
                      onExecuteAction={(act) => {
                        onNavigateToModule(act.targetModuleId, { action: act });
                        onClose();
                      }}
                    />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      Hồ Sơ Cần Xử Lý (My Work Queue)
                    </h4>
                    <MyWorkWidget
                      currentUser={currentUser}
                      currentBranch={currentBranch}
                      onNavigateToRecord={(modId, recordId, nextAction) => {
                        onNavigateToModule(modId, { recordId, nextAction });
                        onClose();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'WORKFLOW' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <BusinessGpsTracker
                    currentModuleId={currentModuleId}
                    onNavigateToStepModule={(modId) => {
                      onNavigateToModule(modId);
                      onClose();
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'CONTRACT' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm">
                        {currentModule.moduleId}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{currentModule.moduleName}</h3>
                        <p className="text-xs text-slate-500">
                          Phân khu: <span className="font-semibold text-slate-700">{currentModule.domain}</span> • Trạng thái:{' '}
                          <span className="text-emerald-600 font-semibold">Active & Governed</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToModule(currentModule.moduleId);
                        onClose();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Mở Phân Hệ Này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <span>Domain Engine & Authority</span>
                      </div>
                      <p className="text-xs text-slate-700 font-mono font-semibold bg-white p-2.5 rounded border border-slate-200">
                        {currentContract.engine}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Database Impact & Persistence</span>
                      </div>
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                        {currentContract.dbImpact}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Sai Lầm Phổ Biến Cần Tránh</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {currentContract.commonMistake}
                      </p>
                    </div>

                    <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-900 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-600" />
                        <span>Quy Tắc Khi Không Nên Sử Dụng</span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {currentContract.whenNotToUse}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Bất Biến Nghiệp Vụ & Kiểm Soát (Invariants)
                    </h4>
                    <ul className="space-y-1.5 text-xs text-blue-950">
                      {currentContract.invariants.map((inv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{inv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">
              NexusSync ERP v3.4 — Smart Guidance Hub & Contextual Unification
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
};
