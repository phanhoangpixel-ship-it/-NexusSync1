import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Filter,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { BusinessGuidanceService } from '../../services/guidanceEngine';
import { MyWorkPendingItem, NextBestAction } from '../../types/guidance';
import { UserSession } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState } from '../../types';

interface MyWorkWidgetProps {
  currentUser: UserSession;
  currentBranch?: string;
  onNavigateToRecord: (moduleId: string, recordId: string | number, nextAction?: NextBestAction) => void;
  className?: string;
}

export const MyWorkWidget: React.FC<MyWorkWidgetProps> = ({
  currentUser,
  currentBranch = 'BR_HO',
  onNavigateToRecord,
  className = '',
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT' | 'HIGH'>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load items from authoritative engine
  const [workItems, setWorkItems] = useState<MyWorkPendingItem[]>(() =>
    BusinessGuidanceService.getMyWorkItems(currentUser, currentBranch)
  );

  const filteredItems = workItems.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.priority === filterType;
  });

  const handleProcessAction = (item: MyWorkPendingItem) => {
    const nextAction = item.nextAction;

    // RULE #19: Always use ConfirmDialog for approvals and high-risk state changes
    if (
      nextAction.contract.requiresConfirmation ||
      nextAction.contract.riskLevel === 'HIGH' ||
      nextAction.contract.riskLevel === 'MEDIUM'
    ) {
      setConfirmDialog({
        isOpen: true,
        title: `Xử lý hồ sơ: ${item.businessReference}`,
        message: `Bạn đang chuẩn bị thực hiện bước "${nextAction.label}" cho chứng từ ${item.businessReference} (${item.title}). Tác động: ${nextAction.contract.expectedResult}. Bạn có muốn chuyển vào phân hệ xử lý ngay?`,
        variant: nextAction.contract.riskLevel === 'HIGH' ? 'danger' : 'primary',
        confirmText: 'Mở Xử Lý Ngay',
        cancelText: 'Xem Lại',
        onConfirm: () => {
          setConfirmDialog(null);
          onNavigateToRecord(item.sourceModuleId, item.entityId, nextAction);
        },
      });
    } else {
      onNavigateToRecord(item.sourceModuleId, item.entityId, nextAction);
    }
  };

  const handleQuickComplete = (item: MyWorkPendingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Chấp thuận nhanh: ${item.businessReference}`,
      message: `Xác nhận thực thi trực tiếp hành động "${item.nextAction.label}" cho ${item.businessReference}?`,
      variant: 'primary',
      confirmText: 'Xác Nhận Duyệt Nhanh',
      cancelText: 'Đóng',
      onConfirm: () => {
        setConfirmDialog(null);
        // Remove item from pending list
        setWorkItems((prev) => prev.filter((i) => i.id !== item.id));
        setSuccessToast(`Đã thực thi thành công "${item.nextAction.label}" cho ${item.businessReference}!`);
        setTimeout(() => setSuccessToast(null), 3500);
      },
    });
  };

  return (
    <>
      <div
        id="nexus-my-work-widget"
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-950/80 text-white dark:text-blue-300 flex items-center justify-center shadow-2xs shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Hồ Sơ Nghiệp Vụ Cần Xử Lý (My Work)
                </h3>
                <span className="px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-mono font-bold">
                  {workItems.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Tự động đề xuất Bước Nghiệp Vụ Tiếp Theo (Next Best Action) cho vai trò {currentUser.role}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Tất Cả ({workItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('URGENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'URGENT'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Khẩn Cấp
            </button>
            <button
              type="button"
              onClick={() => setFilterType('HIGH')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'HIGH'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Ưu Tiên Cao
            </button>
          </div>
        </div>

        {/* Success Toast Feedback */}
        {successToast && (
          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Work Items List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[380px]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Tất cả nghiệp vụ đã hoàn thành!</p>
              <p className="text-slate-500 dark:text-slate-400">Hiện không có chứng từ nào chờ bạn xử lý.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isUrgent = item.priority === 'URGENT';
              const isHigh = item.priority === 'HIGH';

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {item.businessReference}
                      </span>
                      <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-semibold">
                        [{item.sourceModuleId}]
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isUrgent
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                            : isHigh
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.stateLabel}
                      </span>
                      {item.amountText && (
                        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 ml-auto sm:ml-0">
                          {item.amountText}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate" title={item.title}>
                      {item.title}
                    </h4>

                    {/* Next Best Action Suggestion Pill */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.dueTimeText}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        Bước tiếp: {item.nextAction.disclosure.beginner.nextStepTitle}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={(e) => handleQuickComplete(item, e)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                      title="Duyệt nhanh trực tiếp nếu đã kiểm tra chứng từ"
                    >
                      Duyệt Nhanh
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProcessAction(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      <span>XỬ LÝ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RULE #19: ConfirmDialog */}
      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
};
