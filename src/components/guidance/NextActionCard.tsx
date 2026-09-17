import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Sparkles,
  Info,
  Clock,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { NextBestAction, UserExpertiseLevel } from '../../types/guidance';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState } from '../../types';

interface NextActionCardProps {
  action: NextBestAction;
  onExecuteAction: (action: NextBestAction) => void;
  userLevelDefault?: UserExpertiseLevel;
  className?: string;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({
  action,
  onExecuteAction,
  userLevelDefault = 'BEGINNER',
  className = '',
}) => {
  const [userLevel, setUserLevel] = useState<UserExpertiseLevel>(userLevelDefault);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const handleActionClick = () => {
    if (!action.isExecutable) return;

    // RULE #19: Always use ConfirmDialog instead of browser window.confirm
    if (action.contract.requiresConfirmation || action.contract.riskLevel === 'HIGH' || action.contract.riskLevel === 'MEDIUM') {
      setConfirmDialog({
        isOpen: true,
        title: `Xác nhận thực hiện: ${action.label}`,
        message: `Bạn đang chuẩn bị thực hiện bước nghiệp vụ "${action.label}". Hành động này sẽ chuyển trạng thái sang [${action.resultingState}] và tác động tới: ${action.contract.databaseEffect}. Bạn có chắc chắn muốn tiếp tục?`,
        variant: action.contract.riskLevel === 'HIGH' ? 'danger' : 'warning',
        confirmText: 'Xác Nhận & Tiếp Tục',
        cancelText: 'Hủy Bỏ',
        onConfirm: () => {
          setConfirmDialog(null);
          onExecuteAction(action);
        },
      });
    } else {
      onExecuteAction(action);
    }
  };

  return (
    <>
      <div
        id={`next-action-card-${action.actionId}`}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all ${className}`}
      >
        {/* Header with Title & Progressive Disclosure Switcher */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                  Next Best Action
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  Mục tiêu: {action.resultingState}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
                {action.disclosure.beginner.nextStepTitle}
              </h3>
            </div>
          </div>

          {/* Progressive Disclosure Tabs: Beginner / Intermediate / Expert */}
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setUserLevel('BEGINNER')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                userLevel === 'BEGINNER'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Chế độ Cơ bản: Hướng dẫn ngắn gọn, thao tác nhanh"
            >
              🟢 Cơ Bản
            </button>
            <button
              type="button"
              onClick={() => setUserLevel('INTERMEDIATE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                userLevel === 'INTERMEDIATE'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Chế độ Trung cấp: Giải thích vì sao & kết quả đầu ra"
            >
              🟡 Nghiệp Vụ
            </button>
            <button
              type="button"
              onClick={() => setUserLevel('EXPERT')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                userLevel === 'EXPERT'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Chế độ Chuyên gia: Xem Quy tắc cốt lõi, API, DB Write & Audit"
            >
              🔵 Chuyên Gia
            </button>
          </div>
        </div>

        {/* Body Content by Level */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* LEVEL 1: BEGINNER VIEW */}
          {userLevel === 'BEGINNER' && (
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {action.disclosure.beginner.simpleGuidance}
                </p>
              </div>

              {/* Preconditions check list */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Điều kiện trước khi thực hiện
                </h4>
                <div className="space-y-1.5">
                  {action.preconditions.map((prec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{prec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 2: INTERMEDIATE VIEW */}
          {userLevel === 'INTERMEDIATE' && (
            <div className="flex flex-col gap-3.5">
              {/* VÌ SAO */}
              <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-xs">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  VÌ SAO PHẢI LÀM BƯỚC NÀY?
                </h4>
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                  {action.disclosure.intermediate.whyReason}
                </p>
              </div>

              {/* SAU KHI THỰC HIỆN */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 text-xs">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  KẾT QUẢ ĐẠT ĐƯỢC SAU KHI THỰC HIỆN
                </h4>
                <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  {action.disclosure.intermediate.expectedOutcome}
                </p>
              </div>

              {/* TÁC ĐỘNG TỔNG THỂ */}
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200">Tác động quy trình: </span>
                {action.disclosure.intermediate.impactSummary}
              </div>
            </div>
          )}

          {/* LEVEL 3: EXPERT VIEW */}
          {userLevel === 'EXPERT' && (
            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Core Engine Authority:</span>
                  <span className="text-blue-400 font-bold">{action.disclosure.expert.coreEngine}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">API Endpoint:</span>
                  <span className="text-emerald-400 font-bold">{action.disclosure.expert.apiEndpoint}</span>
                </div>
                <div className="border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 block mb-0.5">Database Write Effect:</span>
                  <span className="text-slate-300 font-sans">{action.disclosure.expert.databaseEffect}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Audit & Compliance Rule:</span>
                  <span className="text-amber-400 font-sans">{action.disclosure.expert.auditRule}</span>
                </div>
                {action.disclosure.expert.eventTriggered && (
                  <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Event Stream:</span>
                    <span className="text-indigo-400 font-bold">{action.disclosure.expert.eventTriggered}</span>
                  </div>
                )}
              </div>

              {/* Business Rules */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 font-sans text-xs mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Quy tắc nghiệp vụ cốt lõi (Business Invariants):
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 font-sans text-xs">
                  {action.disclosure.expert.businessRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Blocked Reason Warning if user is not authorized */}
          {!action.isExecutable && action.blockedReason && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hành động bị khóa theo phân quyền:</p>
                <p className="mt-0.5 leading-relaxed">{action.blockedReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={!action.isExecutable}
              onClick={handleActionClick}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                action.isExecutable
                  ? action.contract.riskLevel === 'HIGH'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{action.disclosure.beginner.actionButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RULE #19: ConfirmDialog to replace window.confirm */}
      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
};
