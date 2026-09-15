import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  X,
  Compass,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { BusinessGuardAlert } from '../../types/guidance';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState } from '../../types';

interface BusinessGuardBannerProps {
  guardAlert: BusinessGuardAlert | null;
  onDismiss?: () => void;
  onNavigateToSuggestedModule: (moduleId: string, route: string) => void;
  className?: string;
}

export const BusinessGuardBanner: React.FC<BusinessGuardBannerProps> = ({
  guardAlert,
  onDismiss,
  onNavigateToSuggestedModule,
  className = '',
}) => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  if (!guardAlert || !guardAlert.isMisaligned) return null;

  const handleSwitchModule = (targetModuleId: string, targetRoute: string) => {
    // RULE #19: Use ConfirmDialog instead of window.confirm
    setConfirmDialog({
      isOpen: true,
      title: 'Chuyển Sang Nghiệp Vụ Phù Hợp',
      message: `Hệ thống đề xuất chuyển sang phân hệ "${guardAlert.suggestedModuleName}" để thực hiện đúng quy trình "${guardAlert.correctJourney}". Bạn có muốn chuyển ngay bây giờ?`,
      variant: 'primary',
      confirmText: 'Chuyển Ngay',
      cancelText: 'Ở Lại Trang Này',
      onConfirm: () => {
        setConfirmDialog(null);
        onNavigateToSuggestedModule(targetModuleId, targetRoute);
      },
    });
  };

  return (
    <>
      <div
        id="business-guard-alert-banner"
        className={`bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 shadow-md text-amber-950 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase tracking-wider font-mono">
                  Business Guard Alert
                </span>
                <span className="text-xs font-bold text-amber-800">
                  Cảnh Báo Định Tuyến Nghiệp Vụ
                </span>
              </div>
              <h3 className="text-sm font-bold text-amber-950 mt-1">
                Có vẻ bạn đang sử dụng sai nghiệp vụ cho mục tiêu này!
              </h3>
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors"
              title="Đóng cảnh báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Comparison grid: Where you are vs What you intend vs Proper process */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-white/70 p-3 rounded-xl border border-amber-200">
          <div>
            <span className="font-bold text-slate-500 block mb-0.5">Bạn đang ở:</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block font-mono">
              {guardAlert.currentModuleName} ({guardAlert.currentModuleId})
            </span>
          </div>

          <div>
            <span className="font-bold text-slate-500 block mb-0.5">Nội dung cho thấy:</span>
            <span className="font-bold text-amber-900 block">
              {guardAlert.detectedIntent}
            </span>
          </div>

          <div>
            <span className="font-bold text-slate-500 block mb-0.5">Quy trình phù hợp:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              {guardAlert.correctJourney}
            </span>
          </div>
        </div>

        {/* Reason Explanation */}
        <p className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Lý do bảo vệ nghiệp vụ: </span>
          {guardAlert.reason}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 border-t border-amber-200/60">
          <button
            type="button"
            onClick={() =>
              handleSwitchModule(guardAlert.suggestedModuleId, guardAlert.suggestedRoute)
            }
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <span>Đi Đến {guardAlert.suggestedModuleName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
