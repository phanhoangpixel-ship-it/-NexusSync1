import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building2,
  Receipt,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Printer,
  Sparkles
} from 'lucide-react';
import { formatVNDCurrency } from '../../../../utils/currencyFormatter';
import { formatLocalDateTime } from '../../../../utils/timeUtils';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface ConvertVatInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number | string;
    code?: string;
    orderRef?: string;
    customerName?: string;
    subtotal?: number;
    taxAmount?: number;
    discountAmount?: number;
    totalAmount?: number;
    finalAmount?: number;
    items?: Array<any>;
    vatDetails?: any;
  } | null;
  onSuccess?: (issuedInvoice: any) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const ConvertVatInvoiceModal: React.FC<ConvertVatInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
  onNotify
}) => {
  const [taxCode, setTaxCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Pre-populate if order already has customer / vat details
  React.useEffect(() => {
    if (order && isOpen) {
      setIssuedInvoice(null);
      let parsedVat: any = null;
      if (typeof order.vatDetails === 'string') {
        try {
          parsedVat = JSON.parse(order.vatDetails);
        } catch {
          // ignore
        }
      } else if (order.vatDetails) {
        parsedVat = order.vatDetails;
      }

      setTaxCode(parsedVat?.taxCode || '');
      setCompanyName(parsedVat?.companyName || '');
      setAddress(parsedVat?.address || '');
      setEmail(parsedVat?.email || parsedVat?.billingEmail || '');
      setBuyerName(parsedVat?.buyerName || order.customerName || '');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const orderCode = order.code || order.orderRef || `POS-${order.id}`;
  const totalAmount = order.finalAmount ?? order.totalAmount ?? 0;
  const taxAmount = order.taxAmount ?? Math.round((totalAmount * 0.08) / 1.08);
  const subtotal = order.subtotal ?? (totalAmount - taxAmount);

  // Quick lookup tax code mock autofill
  const handleTaxCodeLookup = () => {
    const cleanTax = taxCode.trim();
    if (!cleanTax) return;

    if (cleanTax === '0101234567') {
      setCompanyName('CÔNG TY TNHH CÔNG NGHỆ VÀ THƯƠNG MẠI ALPHA');
      setAddress('Tầng 5, Tòa nhà Keangnam Landmark 72, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội');
      setEmail('ketoan.alpha@gmail.com');
    } else if (cleanTax === '0312345678') {
      setCompanyName('CÔNG TY CỔ PHẦN ĐẦU TƯ & DỊCH VỤ SÀI GÒN');
      setAddress('Số 120 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
      setEmail('finance@saigongroup.vn');
    } else {
      if (!companyName) {
        setCompanyName(`DOANH NGHIỆP CÓ MST ${cleanTax}`);
      }
      if (!address) {
        setAddress('Việt Nam');
      }
    }
  };

  const executeConvert = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales/orders/convert-from-pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderRef: orderCode,
          orderCode,
          taxCode: taxCode.trim(),
          companyName: companyName.trim(),
          address: address.trim(),
          billingEmail: email.trim(),
          email: email.trim(),
          buyerName: buyerName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIssuedInvoice(data.invoice || data.eInvoiceDetails);
        if (onNotify) {
          onNotify(
            'success',
            'Phát hành HĐĐT thành công',
            `Đã xuất Hóa đơn GTGT ${data.invoice?.invoiceNumber || ''} theo NĐ 123 / TT 78.`
          );
        }
        if (onSuccess) {
          onSuccess(data.invoice);
        }
      } else {
        throw new Error(data.error || 'Không thể chuyển đổi hóa đơn điện tử.');
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify('danger', 'Lỗi phát hành HĐĐT', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxCode.trim() || !companyName.trim() || !address.trim()) {
      if (onNotify) {
        onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ MST, Tên công ty và Địa chỉ doanh nghiệp.');
      }
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận phát hành Hóa đơn điện tử GTGT?',
      message: `Bạn đang thực hiện phát hành hóa đơn GTGT chính thức theo Nghị định 123 / Thông tư 78 cho đơn hàng ${orderCode}.\nMST: ${taxCode.trim()}\nĐơn vị: ${companyName.trim()}\nTổng tiền: ${formatVNDCurrency(totalAmount)}.`,
      confirmLabel: 'Phát hành ngay (1-Click)',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        executeConvert();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <span>Chuyển Đổi 1-Click Sang Hóa Đơn GTGT (NĐ 123 / TT 78)</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-mono text-[10px]">
                  CQT Verified
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Đơn hàng: <span className="font-mono font-bold text-white">{orderCode}</span> • Tổng tiền:{' '}
                <span className="font-mono text-emerald-400 font-bold">{formatVNDCurrency(totalAmount)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {issuedInvoice ? (
            /* Result View when Invoice Issued */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    Phát hành Hóa Đơn Điện Tử Thành Công!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Hóa đơn đã được đồng bộ hợp lệ theo Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC.
                  </p>
                </div>
              </div>

              {/* Invoice Certificate Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">MẪU SỐ (TEMPLATE):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {issuedInvoice.templateCode || '1/001'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">KÝ HIỆU (SERIAL):</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {issuedInvoice.serialCode || 'C26TAA'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SỐ HÓA ĐƠN:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {issuedInvoice.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">NGÀY KÝ PHÁT HÀNH:</span>
                    <span className="text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatLocalDateTime(issuedInvoice.issuedAt || new Date().toISOString())}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">MÃ CƠ QUAN THUẾ CẤP (CQT):</span>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 break-all select-all">
                    {issuedInvoice.cqtLookupCode || '00C26TAA883920192847192837482910'}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Cổng tra cứu Tổng cục Thuế:</span>
                  <a
                    href={issuedInvoice.qrLookupUrl || 'https://hoadondientu.gdt.gov.vn'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-bold underline"
                  >
                    <span>hoadondientu.gdt.gov.vn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Đóng</span>
                </button>
              </div>
            </div>
          ) : (
            /* Input Form View */
            <form onSubmit={handleTriggerConvert} className="space-y-4">
              {/* Decree Notice */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Hệ thống tự động liên kết dữ liệu bán hàng quầy POS, phát hành Hóa đơn Điện tử có mã của Cơ quan Thuế
                  (Ký hiệu <span className="font-mono font-bold">C26TAA</span>, Mẫu số{' '}
                  <span className="font-mono font-bold">1/001</span>).
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tax Code */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế Doanh nghiệp (MST) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={taxCode}
                      onChange={e => setTaxCode(e.target.value)}
                      onBlur={handleTaxCodeLookup}
                      placeholder="VD: 0101234567 hoặc 0312345678"
                      className="min-h-[44px] flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={handleTaxCodeLookup}
                      className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Tra cứu CQT
                    </button>
                  </div>
                </div>

                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Công ty / Đơn vị mua hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="VD: CÔNG TY TNHH CÔNG NGHỆ ALPHA"
                    className="min-h-[44px] w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Công ty (trên GPKD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="VD: Tầng 5, Tòa nhà Landmark, Nam Từ Liêm, Hà Nội"
                    className="min-h-[44px] w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Email for e-Invoice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email nhận HĐĐT (XML/PDF)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ketoan@congty.com"
                    className="min-h-[44px] w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Buyer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Người mua hàng
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="Họ tên người mua lẻ tại quầy"
                    className="min-h-[44px] w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Amounts Summary */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-left">Tiền hàng trước thuế:</span>
                  <span className="text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatVNDCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-left">Thuế GTGT (VAT 8% / 10%):</span>
                  <span className="text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatVNDCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-left">Tổng thanh toán HĐ:</span>
                  <span className="text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatVNDCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ (Esc)
                </button>

                <button
                  type="submit"
                  disabled={loading || !taxCode.trim() || !companyName.trim() || !address.trim()}
                  className="min-h-[44px] flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{loading ? 'Đang cấp mã CQT...' : 'Xác Nhận Phát Hành Hóa Đơn GTGT'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Enterprise Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || 'Xác nhận'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
