import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { CreateMaintenancePlanModal } from './CreateMaintenancePlanModal';

interface PreventivePlansTabProps {
  plans: any[];
  assets: any[];
  onRefreshData: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const PreventivePlansTab: React.FC<PreventivePlansTabProps> = ({
  plans,
  assets,
  onRefreshData,
  onNotify,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [triggeringPlan, setTriggeringPlan] = useState<any | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTriggerPlan = async (plan: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/eam/maintenance-plans/${plan.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi kích hoạt phiếu bảo trì PM');
      }

      const data = await res.json();
      onNotify('success', 'Đã khởi tạo phiếu bảo trì', data.message || `Đã sinh phiếu bảo trì cho kế hoạch ${plan.planCode}.`);
      onRefreshData();
    } catch (err: any) {
      onNotify('danger', 'Kích hoạt thất bại', err.message);
    } finally {
      setLoading(false);
      setTriggeringPlan(null);
    }
  };

  const handleBatchTrigger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eam/batch-pm-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi kích hoạt hàng loạt');
      }

      const data = await res.json();
      onNotify(
        'success',
        'Kích hoạt hàng loạt thành công',
        `Hệ thống đã tự động tạo ${data.count} phiếu bảo trì định kỳ (Work Orders) vào hàng đợi.`
      );
      onRefreshData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi kích hoạt hàng loạt', err.message);
    } finally {
      setLoading(false);
      setIsBatchConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* L1 COMMAND STRIP */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lịch Trình Bảo Dưỡng Ngăn Ngừa Sự Cố (PM Schedules)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tự động phát phiếu công tác khi đến kỳ bảo dưỡng định kỳ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBatchConfirmOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Kích Hoạt Hàng Loạt (Batch PM)</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Kế Hoạch PM Mới</span>
          </button>
        </div>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p) => {
          const matchedAsset = assets.find((a) => a.id === p.assetId);
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  {p.planCode}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Chu kỳ: <strong>{p.intervalDays} ngày</strong>
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.title}</h4>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  Thiết bị: {matchedAsset ? `${matchedAsset.code} — ${matchedAsset.name}` : 'Thiết bị xưởng'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">{p.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Lần Thực Hiện Trước</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{p.lastPerformedDate || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Hạn Kỳ Tới</span>
                  <strong className="font-mono text-blue-700 dark:text-blue-400">{p.nextDueDate || 'Trong tuần'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setTriggeringPlan(p)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Phát Phiếu WO Ngay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIRM SINGLE PM TRIGGER */}
      <ConfirmDialog
        isOpen={!!triggeringPlan}
        title={`Khởi tạo phiếu bảo trì cho kế hoạch ${triggeringPlan?.planCode}?`}
        message={`Hệ thống sẽ tạo ngay 1 phiếu công tác Work Order phân công cho đội bảo trì thực hiện: "${triggeringPlan?.title}".`}
        variant="primary"
        confirmText="Xác Nhận Phát Phiếu WO"
        cancelText="Hủy"
        onConfirm={() => triggeringPlan && handleTriggerPlan(triggeringPlan)}
        onClose={() => setTriggeringPlan(null)}
      />

      {/* CONFIRM BATCH PM TRIGGER */}
      <ConfirmDialog
        isOpen={isBatchConfirmOpen}
        title="Kích hoạt hàng loạt lịch bảo dưỡng PM (Batch PM)?"
        message="Hệ thống sẽ tự động quét toàn bộ các kế hoạch bảo dưỡng định kỳ và sinh danh sách phiếu bảo trì WO cho tất cả thiết bị."
        variant="warning"
        confirmText="Kích Hoạt Hàng Loạt"
        cancelText="Hủy"
        onConfirm={handleBatchTrigger}
        onClose={() => setIsBatchConfirmOpen(false)}
      />

      {/* CREATE PLAN MODAL */}
      <CreateMaintenancePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        assets={assets}
        onSuccess={onRefreshData}
        onNotify={onNotify}
      />
    </div>
  );
};
