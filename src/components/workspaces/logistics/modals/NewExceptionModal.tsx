import React, { useState } from 'react';
import { X, AlertTriangle, Plus } from 'lucide-react';
import { TransportOrder } from '../types';

interface NewExceptionModalProps {
  isOpen: boolean;
  orders: TransportOrder[];
  onClose: () => void;
  onSubmit: (formData: {
    orderCode: string;
    customerName: string;
    type: 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'DAMAGED_GOODS' | 'SHORT_DELIVERY' | 'REFUSED' | 'VEHICLE_BREAKDOWN' | 'TRAFFIC_DELAY';
    note: string;
  }) => void;
}

export const NewExceptionModal: React.FC<NewExceptionModalProps> = ({
  isOpen,
  orders,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    orderCode: orders[0]?.orderCode || '',
    type: 'TRAFFIC_DELAY' as const,
    note: 'Tắc đường do tai nạn giao thông tại nút giao BOT Pháp Vân.',
  });

  if (!isOpen) return null;

  const selectedOrder = orders.find((o) => o.orderCode === form.orderCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      orderCode: form.orderCode,
      customerName: selectedOrder?.customerName || 'Khách Hàng',
      type: form.type,
      note: form.note,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>Báo Cáo Sự Cố / Ngoại Lệ Giao Hàng</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Chọn Chuyến Xe / Lệnh Vận Chuyển:
            </label>
            <select
              value={form.orderCode}
              onChange={(e) => setForm({ ...form, orderCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.orderCode}>
                  {o.orderCode} - {o.customerName} (Xe: {o.vehiclePlate || 'Chưa gán'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Phân Loại Sự Cố Gặp Phải:
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="TRAFFIC_DELAY">Tắc Đường Kẹt Xe / Sự Cố Giao Thông</option>
              <option value="VEHICLE_BREAKDOWN">Hỏng Hóc Phương Tiện Đột Xuất (Thủng lốp, chết máy)</option>
              <option value="CUSTOMER_UNAVAILABLE">Khách Hàng Vắng Mặt / Không Liên Lạc Được</option>
              <option value="WRONG_ADDRESS">Sai Lệch Địa Chỉ / Đường Cấm Tải Trọng</option>
              <option value="DAMAGED_GOODS">Bóp Méo / Hư Hỏng Hàng Khi Vận Chuyển</option>
              <option value="SHORT_DELIVERY">Sai Lệch / Thiếu Số Lượng Kiện So Với PXK</option>
              <option value="REFUSED">Khách Hàng Từ Chối Nhận Hàng</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Mô Tả Chi Tiết Sự Cố &amp; Đề Xuất Xử Lý:
            </label>
            <textarea
              rows={3}
              required
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Nhận Ngoại Lệ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
