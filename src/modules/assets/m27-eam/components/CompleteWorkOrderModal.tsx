import React, { useState } from 'react';
import { X, CheckCircle2, Clock } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface CompleteWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CompleteWorkOrderModal: React.FC<CompleteWorkOrderModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
  onNotify,
}) => {
  const [completeCost, setCompleteCost] = useState<number>(
    workOrder?.totalCost && workOrder.totalCost > 0 ? workOrder.totalCost : 3500000
  );
  const [completeDowntime, setCompleteDowntime] = useState<number>(
    workOrder?.downtimeHours && workOrder.downtimeHours > 0 ? workOrder.downtimeHours : 2.5
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !workOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/eam/work-orders/${workOrder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCost: Number(completeCost),
          downtimeHours: Number(completeDowntime),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi nghiệm thu phiếu bảo trì');
      }

      onNotify(
        'success',
        'Nghiệm thu bảo trì hoàn tất',
        `Phiếu ${workOrder.woCode} đã được nghiệm thu thành công. Chi phí ${completeCost.toLocaleString('vi-VN')} ₫ đã được hạch toán vào TK 627.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Nghiệm thu thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nghiệm Thu Phiếu Bảo Trì (WO)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{workOrder.woCode} • {workOrder.assetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="text-slate-500 dark:text-slate-400">Nội dung công tác:</div>
            <div className="font-semibold text-slate-900 dark:text-white">{workOrder.description}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              KTV phụ trách: <strong>{workOrder.assignedTechnicianName}</strong>
            </div>
          </div>

          <div>
            <CurrencyInput
              label="Tổng Chi Phí Phát Sinh Thực Tế (TK 627) *"
              value={completeCost}
              onChange={(val) => setCompleteCost(val)}
              placeholder="VD: 3.500.000"
              required
              showBadge={true}
              showPresets={true}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thời Gian Dừng Máy Thực Tế (Downtime Giờ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={completeDowntime}
                onChange={(e) => setCompleteDowntime(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                Giờ
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Đang Lưu...' : 'Xác Nhận Nghiệm Thu Hoàn Tất'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
