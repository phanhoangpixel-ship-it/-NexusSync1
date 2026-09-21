import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Plus } from 'lucide-react';

interface CreateForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CreateForecastModal: React.FC<CreateForecastModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [historicalAvg, setHistoricalAvg] = useState<number>(50);
  const [forecastQty, setForecastQty] = useState<number>(65);
  const [forecastMethod, setForecastMethod] = useState<
    'EXPONENTIAL_SMOOTHING' | 'HOLT_WINTERS' | 'MOVING_AVERAGE' | 'LINEAR_REGRESSION' | 'MANUAL'
  >('EXPONENTIAL_SMOOTHING');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
            if (!selectedProductId) {
              setSelectedProductId(data[0].id);
            }
          }
        })
        .catch((err) => console.error('Error fetching products:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn sản phẩm cần lập dự báo.');
      return;
    }
    if (forecastQty <= 0) {
      onNotify('warning', 'Số lượng không hợp lệ', 'Sản lượng dự báo phải lớn hơn 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/scm/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(selectedProductId),
          warehouseId: 1,
          period,
          startDate,
          endDate,
          historicalAvgDemand: Number(historicalAvg),
          forecastQuantity: Number(forecastQty),
          forecastMethod,
          notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Lỗi khi tạo dự báo tiêu thụ');
      }

      onNotify('success', 'Thành công', 'Đã khởi tạo bản ghi dự báo tiêu thụ nhu cầu mới.');
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thiết Lập Dự Báo Tiêu Thụ Mới (Demand Forecast)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mô hình toán học dự phóng nhu cầu tiêu thụ chuỗi cung ứng</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sản Phẩm Mục Tiêu <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chu Kỳ Dự Báo</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="WEEKLY">Theo Tuần (Weekly)</option>
                <option value="MONTHLY">Theo Tháng (Monthly)</option>
                <option value="QUARTERLY">Theo Quý (Quarterly)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương Pháp Dự Báo</label>
              <select
                value={forecastMethod}
                onChange={(e) => setForecastMethod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="EXPONENTIAL_SMOOTHING">San Bằng Số Mũ (Exp Smoothing)</option>
                <option value="HOLT_WINTERS">Holt-Winters (Mùa Vụ &amp; Xu Thế)</option>
                <option value="MOVING_AVERAGE">Trung Bình Động (Moving Average)</option>
                <option value="LINEAR_REGRESSION">Hồi Quy Tuyến Tính (Linear)</option>
                <option value="MANUAL">Nhập Thủ Công Chuyên Gia (Manual)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Bắt Đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Kết Thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lịch Sử Tiêu Thụ Trung Bình
              </label>
              <input
                type="number"
                value={historicalAvg}
                onChange={(e) => setHistoricalAvg(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sản Lượng Dự Báo <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={forecastQty}
                onChange={(e) => setForecastQty(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Dự Báo</label>
            <input
              type="text"
              placeholder="Ghi chú giả định thị trường, chương trình khuyến mãi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Đang Lưu...' : 'Lưu Bản Ghi Dự Báo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
