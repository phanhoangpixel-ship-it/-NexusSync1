import React, { useState } from 'react';
import { FrameworkContractItem } from './m11Types';
import { X, Calendar, DollarSign, Percent, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface M11RenewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: FrameworkContractItem | null;
  onRenewSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M11RenewContractModal: React.FC<M11RenewContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onRenewSuccess,
  onNotify,
}) => {
  // Calculate default new end date (+1 year from current end date or from today)
  const currentEnd = contract ? new Date(contract.endDate) : new Date();
  const defaultNewEnd = new Date(currentEnd.getTime() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [newEndDate, setNewEndDate] = useState<string>(defaultNewEnd);
  const [additionalCommittedValue, setAdditionalCommittedValue] = useState<number>(contract?.committedValue || 1000000000);
  const [newDiscountRate, setNewDiscountRate] = useState<number>(contract?.discountRate || 0);
  const [renewalNotes, setRenewalNotes] = useState<string>('Gia hạn phụ lục hợp đồng nguyên tắc thêm 12 tháng theo thỏa thuận đàm phán SRM.');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !contract) return null;

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndDate) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn ngày hết hạn mới.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/purchase/contracts/${contract.id}/renew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          newEndDate,
          additionalCommittedValue: Number(additionalCommittedValue) || 0,
          newDiscountRate: Number(newDiscountRate) || 0,
          renewalNotes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      onNotify('success', 'Gia hạn thành công', data.message || `Đã gia hạn hợp đồng ${contract.id} đến ngày ${newEndDate}.`);
      onRenewSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error renewing contract:', err);
      onNotify('danger', 'Lỗi gia hạn hợp đồng', err.message || 'Không thể thực hiện gia hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Gia hạn Hợp đồng Khung (BPA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã HĐ: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.id}</span> — {contract.supplier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRenew} className="space-y-4 p-6">
          {/* Current Contract Info Card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tiêu đề hợp đồng:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.title}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Thời hạn hiện tại:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {contract.startDate} → <span className="text-amber-600 dark:text-amber-400">{contract.endDate}</span>
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Đã giải ngân:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(contract.usedValue)} / {formatCurrency(contract.committedValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày hết hạn mới (New End Date) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Hiệu lực hợp đồng sẽ được nối tiếp tự động đến ngày này.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hạn mức ngân sách bổ sung (VND)
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={additionalCommittedValue !== undefined && additionalCommittedValue !== null ? Number(additionalCommittedValue).toLocaleString('vi-VN') : '0'}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAdditionalCommittedValue(raw ? Number(raw) : 0);
                  }}
                  placeholder="Ví dụ: 1.000.000.000"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                Tổng ngân sách mới: {formatCurrency((contract.committedValue || 0) + (Number(additionalCommittedValue) || 0))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chiết khấu thương mại mới (%)
              </label>
              <div className="relative">
                <Percent className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={newDiscountRate}
                  onChange={(e) => setNewDiscountRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trạng thái sau gia hạn
              </label>
              <div className="flex h-[38px] items-center rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                ACTIVE (Tự động kích hoạt lại hiệu lực)
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ghi chú / Điều khoản phụ lục bổ sung
            </label>
            <textarea
              rows={3}
              value={renewalNotes}
              onChange={(e) => setRenewalNotes(e.target.value)}
              placeholder="Nhập căn cứ biên bản họp thương thảo, số phụ lục HĐ..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Đang xử lý...' : 'Xác nhận Gia hạn Hợp đồng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
