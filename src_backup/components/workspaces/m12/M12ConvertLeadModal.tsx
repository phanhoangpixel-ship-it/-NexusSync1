import React, { useState } from 'react';
import { LeadItem } from './m12Types';
import { X, Sparkles, Building2, User, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface M12ConvertLeadModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onConfirmConvert: (leadId: number, conversionPayload: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12ConvertLeadModal: React.FC<M12ConvertLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmConvert,
  onNotify,
}) => {
  const [taxCode, setTaxCode] = useState(`010${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [address, setAddress] = useState('Khu Công nghệ cao Láng Hòa Lạc, Hà Nội, Việt Nam');
  const [paymentTerms, setPaymentTerms] = useState('NET30');
  const [creditLimit, setCreditLimit] = useState(500000000);
  const [customerGroup, setCustomerGroup] = useState('B2B_ENTERPRISE');

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmConvert(lead.id, {
      taxCode,
      address,
      paymentTerms,
      creditLimit: Number(creditLimit) || 0,
      customerGroup,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chuyển Đổi Lead Sang Khách Hàng B2B Master Data (M03)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Summary Info */}
        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
              {lead.leadCode}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Quy mô: {Number(lead.value || 0).toLocaleString('vi-VN')} VND
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lead.company}</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Người liên hệ: <strong>{lead.name}</strong> • SĐT: {lead.phone || 'Chưa cập nhật'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mã Số Thuế Doanh Nghiệp (Tax ID) *
            </label>
            <input
              type="text"
              required
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ Trụ sở / Xuất hóa đơn VAT
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Điều khoản thanh toán
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="NET15">NET 15 ngày</option>
                <option value="NET30">NET 30 ngày (Chuẩn)</option>
                <option value="NET60">NET 60 ngày</option>
                <option value="PREPAID">Trả trước 100% (Prepaid)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hạn mức tín dụng (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={creditLimit !== undefined && creditLimit !== null ? Number(creditLimit).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setCreditLimit(raw ? Number(raw) : 0);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hiệu lực nghiệp vụ tích hợp:</span>
            </div>
            <p>
              • Tạo bản ghi chính thức trong bảng <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">customers</code> (M03 Master Data).
              <br />
              • Đánh dấu Lead là <strong>WON</strong> và kích hoạt sự kiện Outbox <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">CRM_LEAD_CONVERTED</code>.
              <br />
              • Sẵn sàng cho phân hệ M13 tiếp nhận tạo Đơn bán hàng (SO).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Chuyển Đổi M03</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
