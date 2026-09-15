import React, { useState } from 'react';
import { X, FileCheck, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TransportOrder } from '../../../../../types';

interface PodModalProps {
  isOpen: boolean;
  order: TransportOrder | null;
  onClose: () => void;
  onSubmit: (podData: {
    receiverName: string;
    status: 'DELIVERED_SUCCESS' | 'PARTIAL_DELIVERY' | 'REFUSED' | 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'DAMAGED_GOODS';
    failureReason?: string;
    notes: string;
  }) => void;
}

export const PodModal: React.FC<PodModalProps> = ({ isOpen, order, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    receiverName: '',
    status: 'DELIVERED_SUCCESS' as const,
    failureReason: '',
    notes: 'Đã giao hàng đủ số lượng, niêm phong tem seal nguyên vẹn.',
  });

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span>Xác Nhận Biên Bản Bàn Giao Hàng Hóa (POD)</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold mt-0.5">
                Lệnh: {order.orderCode} • {order.customerName}
              </p>
            </div>
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
              Họ Tên Người Ký Nhận / Đại Diện Khách Hàng:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn Nam (Thủ kho tiếp nhận)"
              value={form.receiverName}
              onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Kết Quả Nghiệm Thu Thực Tế (POD Status):
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="DELIVERED_SUCCESS">Giao Hàng Thành Công (Đủ 100% Niêm Phong)</option>
              <option value="PARTIAL_DELIVERY">Giao Thiếu Số Lượng (Bàn Giao Một Phần)</option>
              <option value="CUSTOMER_UNAVAILABLE">Khách Hàng Vắng Mặt / Kho Đóng Cửa</option>
              <option value="WRONG_ADDRESS">Sai Lệch Địa Chỉ Giao Hàng</option>
              <option value="DAMAGED_GOODS">Hàng Bị Bóp Méo / Hư Hỏng Niêm Phong</option>
              <option value="REFUSED">Khách Hàng Từ Chối Nhận Hàng</option>
            </select>
          </div>

          {form.status !== 'DELIVERED_SUCCESS' && (
            <div>
              <label className="block text-rose-700 dark:text-rose-400 font-semibold mb-1">
                Lý Do Sự Cố Giao Hàng Thất Bại:
              </label>
              <input
                type="text"
                required
                placeholder="Mô tả chi tiết nguyên nhân phát sinh..."
                value={form.failureReason}
                onChange={(e) => setForm({ ...form, failureReason: e.target.value })}
                className="w-full px-3 py-2 border border-rose-300 dark:border-rose-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Ghi Chú Nghiệm Thu &amp; Mã Tem Seal Vận Chuyển:
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Ký POD &amp; Đóng Chặng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
