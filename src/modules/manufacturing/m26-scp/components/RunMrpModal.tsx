import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, Layers, AlertCircle, Play } from 'lucide-react';

interface RunMrpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const RunMrpModal: React.FC<RunMrpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [runType, setRunType] = useState<'regenerative' | 'net-change'>('regenerative');
  const [planningHorizonDays, setPlanningHorizonDays] = useState<number>(90);
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/scm/mrp/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runType,
          planningHorizonDays: Number(planningHorizonDays),
          warehouseId: Number(warehouseId),
          triggeredBy: 'SCM Lead Planner',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi chạy thuật toán MRP');
      }

      onNotify(
        'success',
        'Thuật toán MRP hoàn tất',
        `Đã phân tích ${data.run?.totalProductsAnalyzed || 0} sản phẩm trong ${data.run?.executionDurationMs || 0}ms. Phát hiện ${data.run?.totalExceptions || 0} ngoại lệ.`
      );
      onSuccess(data);
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Chạy MRP thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cấu Hình &amp; Khởi Chạy Thuật Toán Cân Bằng MRP</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Material Requirements Planning Engine &amp; Cân bằng Cung - Cầu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRun} className="p-6 space-y-5">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Phương Thức Chạy MRP (Run Strategy) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setRunType('regenerative')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  runType === 'regenerative'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Regenerative (Tái Tạo)</span>
                  {runType === 'regenerative' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Xóa bỏ lịch trình cũ, tính toán lại toàn diện từ đầu cho tất cả BOM, tồn kho và đơn hàng.
                </p>
              </div>

              <div
                onClick={() => setRunType('net-change')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  runType === 'net-change'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Net-Change (Biến Thiên)</span>
                  {runType === 'net-change' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Chỉ tính toán những mặt hàng có biến động giao dịch gần nhất, tối ưu tốc độ xử lý.
                </p>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tầm Nhìn Kế Hoạch (Planning Horizon)
              </label>
              <select
                value={planningHorizonDays}
                onChange={(e) => setPlanningHorizonDays(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              >
                <option value={30}>30 Ngày (Ngắn hạn / Tactical)</option>
                <option value={60}>60 Ngày (Trung hạn)</option>
                <option value={90}>90 Ngày (Quý / Chuẩn MRP II)</option>
                <option value={180}>180 Ngày (Dài hạn / Strategic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kho Phụ Trách Cân Bằng
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value={1}>Kho Trung Tâm WMS (Central Hub)</option>
                <option value={2}>Kho Phân Phối Miền Nam (DC SGN)</option>
                <option value={0}>Tất cả các kho toàn hệ thống (Multi-site)</option>
              </select>
            </div>
          </div>

          {/* Cross-module Data Integration Pipeline Note */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Đồng Bộ Dữ Liệu Liên Module (Cross-Module Pipeline)
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">M13 Sales Orders</span>
                Đơn hàng bán xác nhận
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">M25 BOM &amp; MO</span>
                Định mức &amp; Lệnh SX
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">M17 On-Hand WMS</span>
                Tồn kho khả dụng
              </div>
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Đang Chạy Thuật Toán...' : 'Khởi Chạy MRP Ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
