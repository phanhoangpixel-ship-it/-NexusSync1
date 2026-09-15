import React, { useState } from 'react';
import { FileText, ArrowRight, CheckCircle2, Building2, DollarSign, X, Sparkles } from 'lucide-react';

interface QuotationOption {
  id: number;
  code: string;
  leadName: string;
  customerName?: string;
  companyName: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_SO';
  validUntil: string;
  items: Array<{
    productId?: number;
    sku?: string;
    productName: string;
    name?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  taxRate?: number;
  notes?: string;
}

interface M13QuotationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuotation: (quotation: QuotationOption) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

const SAMPLE_CRM_QUOTATIONS: QuotationOption[] = [
  {
    id: 101,
    code: 'QUO-2026-0042',
    leadName: 'Dự án Căn hộ Sun Grand City',
    companyName: 'Công ty Cổ phần Xây dựng Coteccons',
    customerName: 'Công ty Cổ phần Xây dựng Coteccons',
    totalAmount: 125000000,
    status: 'ACCEPTED',
    validUntil: '2026-04-15',
    taxRate: 10,
    items: [
      { productId: 1, sku: 'PRD-001', productName: 'Thép hình H-Beam SS400 200x200', quantity: 5, unitPrice: 18500000, discount: 5, subtotal: 87875000 },
      { productId: 2, sku: 'PRD-002', productName: 'Ống thép mạ kẽm nhúng nóng D114', quantity: 30, unitPrice: 1250000, discount: 0, subtotal: 37500000 }
    ],
    notes: 'Báo giá gói vật tư kết cấu thép giai đoạn 1 công trình Sun Grand City'
  },
  {
    id: 102,
    code: 'QUO-2026-0039',
    leadName: 'Gói thầu Nhà xưởng VSIP 3',
    companyName: 'Tập đoàn Xây dựng Hòa Bình',
    customerName: 'Tập đoàn Xây dựng Hòa Bình',
    totalAmount: 88000000,
    status: 'ACCEPTED',
    validUntil: '2026-04-10',
    taxRate: 10,
    items: [
      { productId: 4, sku: 'PRD-004', productName: 'Tôn cuộn mạ màu Az150 0.45mm', quantity: 4, unitPrice: 21000000, discount: 3, subtotal: 81480000 },
      { productId: 5, sku: 'PRD-005', productName: 'Bulong neo móng M24x800 Cấp bền 8.8', quantity: 100, unitPrice: 65000, discount: 0, subtotal: 6500000 }
    ],
    notes: 'Gói cung cấp tôn lợp và bulong kết cấu móng nhà xưởng'
  },
  {
    id: 103,
    code: 'QUO-2026-0035',
    leadName: 'Dự án Cầu vượt nút giao Long Biên',
    companyName: 'Công ty Cổ phần FECON',
    customerName: 'Công ty Cổ phần FECON',
    totalAmount: 45000000,
    status: 'SENT',
    validUntil: '2026-04-20',
    taxRate: 10,
    items: [
      { productId: 3, sku: 'PRD-003', productName: 'Xi măng Poóc lăng PCB40 Bao 50kg', quantity: 400, unitPrice: 95000, discount: 0, subtotal: 38000000 },
      { productId: 5, sku: 'PRD-005', productName: 'Bulong neo móng M24x800 Cấp bền 8.8', quantity: 100, unitPrice: 65000, discount: 0, subtotal: 6500000 }
    ],
    notes: 'Cung cấp xi măng mác cao và bulong neo'
  }
];

export const M13QuotationImportModal: React.FC<M13QuotationImportModalProps> = ({
  isOpen,
  onClose,
  onSelectQuotation,
  onNotify
}) => {
  const [quotations] = useState<QuotationOption[]>(SAMPLE_CRM_QUOTATIONS);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Nhập từ Báo Giá CRM Đã Duyệt (M12 &rarr; M13)</h3>
              <p className="text-[11px] text-slate-300">Chuyển trực tiếp Báo giá được khách hàng chấp thuận thành Đơn bán hàng SO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            Chọn một báo giá từ CRM (M12) dưới đây để nạp tự động thông tin khách hàng, chi tiết dòng hàng hóa và chính sách giá:
          </p>

          <div className="space-y-3">
            {quotations.map(quo => (
              <div
                key={quo.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400">
                      {quo.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      quo.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    }`}>
                      {quo.status === 'ACCEPTED' ? '✓ Khách Chấp Thuận' : 'Đã Gửi Khách'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{quo.companyName}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{quo.leadName} • {quo.items.length} mặt hàng</p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Tổng Giá Trị</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {quo.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectQuotation(quo);
                      onNotify('success', 'Đã Nạp Báo Giá CRM', `Đã chuyển dữ liệu từ ${quo.code} vào biểu mẫu tạo SO.`);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <span>Chọn & Tạo SO</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
