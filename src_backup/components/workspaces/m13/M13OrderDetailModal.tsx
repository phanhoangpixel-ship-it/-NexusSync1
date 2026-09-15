import React from 'react';
import { 
  X, Download, Receipt, CreditCard, Truck, Boxes, 
  ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText, 
  Building2, Hash, Calendar, DollarSign, UserCheck, AlertTriangle
} from 'lucide-react';
import { safeNumber } from '../../../utils/salesOrderDataNormalizer';
import { parseNumber } from '../../../utils/numberFormat';
import { SalesOrderSyncService } from '../../../services/SalesOrderSyncService';

interface M13OrderDetailModalProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
  onOpenVatModal: (order: any) => void;
  onOpenPaymentModal: (order: any) => void;
  onDownloadVatPdf: (order: any) => void;
  onUpdateFulfillment: (orderId: string, nextStatus: string) => void;
  masterCustomers?: any[];
}

export const M13OrderDetailModal: React.FC<M13OrderDetailModalProps> = ({
  isOpen,
  order,
  onClose,
  onOpenVatModal,
  onOpenPaymentModal,
  onDownloadVatPdf,
  onUpdateFulfillment,
  masterCustomers = []
}) => {
  if (!isOpen || !order) return null;

  const items = order.items ?? [];
  const itemsTotal = items.reduce((sum: number, it: any) => {
    const unitPrice = safeNumber(it.unitPriceNumeric ?? it.price, 0);
    const qty = safeNumber(it.qty ?? it.quantity, 1);
    const lineAmount = safeNumber(it.amount, unitPrice * qty);
    return sum + lineAmount;
  }, 0);

  const cleanTotal = typeof order.totalAmountNumeric === 'number' && order.totalAmountNumeric > 0
    ? order.totalAmountNumeric
    : (typeof order.totalAmount === 'number' && order.totalAmount > 0
        ? order.totalAmount
        : (parseNumber(order.totalAmount || order.amount) || itemsTotal || 0));

  const amountPaid = typeof order.amountPaid === 'number' ? order.amountPaid : 0;
  const remaining = Math.max(0, cleanTotal - amountPaid);
  const taxRateDisplay = order.taxRate !== undefined && order.taxRate !== null ? `${order.taxRate}%` : '10%';
  const isPos = order.sourceModule === 'M16_POS';

  // Master customer validation check
  const taxCheck = order.taxCode ? SalesOrderSyncService.validateTaxCode(order.taxCode) : { isValid: false };
  const hasValidM07 = Boolean(order.customerId || (order.taxCode && taxCheck.isValid));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold font-mono tabular-nums">
              SO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-wide font-mono tabular-nums">{order.id}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tabular-nums ${
                  order.status === 'CONFIRMED' || order.status === 'INVOICED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {order.status}
                </span>
                {isPos && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                    M16 POS OMNICHANNEL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{order.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* 4 Status KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng Giá Trị SO</span>
              <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {cleanTotal.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[10px] text-slate-500">VAT Rate: {taxRateDisplay}</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">Hóa Đơn VAT Điện Tử</span>
              {order.vatStatus === 'ISSUED' ? (
                <div>
                  <p className="text-xs font-mono tabular-nums font-bold text-purple-800 dark:text-purple-300">
                    {order.vatInvoiceNumber}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">Mã CQT: {order.cqtCode}</p>
                </div>
              ) : (
                <p className="text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">Chưa phát hành</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Thanh Toán & Quyết Toán</span>
              <p className="text-xs font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300">
                {amountPaid >= cleanTotal ? 'Đã thanh toán đủ' : `Đã thu ${amountPaid.toLocaleString('vi-VN')} đ`}
              </p>
              {remaining > 0 && (
                <p className="text-[10px] font-mono text-blue-700 dark:text-blue-400">Còn nợ: {remaining.toLocaleString('vi-VN')} đ</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Kho WMS & Giữ Chỗ</span>
              <p className="text-xs font-mono tabular-nums font-bold text-indigo-800 dark:text-indigo-300">
                {order.reservationStatus || 'RESERVED'}
              </p>
              <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">Fulfillment: {order.fulfillmentStatus || 'PENDING'}</p>
            </div>
          </div>

          {/* Customer & Legal Info with M07 Master Data Validation Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Thông Tin Khách Hàng & Địa Chỉ Xuất Hóa Đơn</span>
              </h4>
              <div className="flex items-center gap-2">
                {hasValidM07 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>M07 KHÁCH HÀNG HỢP LỆ</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>CHƯA XÁC THỰC M07</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tên Công Ty / Doanh Nghiệp:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Mã Số Thuế (MST):</span>
                <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">{order.taxCode || 'Chưa cung cấp'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Email Nhận Hóa Đơn:</span>
                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{order.billingEmail || 'invoicing@customer.vn'}</span>
              </div>
              <div className="md:col-span-3">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Địa Chỉ Doanh Nghiệp / Giao Hàng:</span>
                <span className="text-slate-800 dark:text-slate-200">{order.address || 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh'}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Danh Mục Hàng Hóa & Đơn Giá Đã Khóa ({items.length} mặt hàng)</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Tên Hàng Hóa / Dịch Vụ</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-right">Số Lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                    <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((it: any, idx: number) => {
                    const lineUnitPrice = safeNumber(it.unitPriceNumeric ?? it.price, 0);
                    const lineQty = safeNumber(it.qty ?? it.quantity, 1);
                    const lineAmount = safeNumber(it.amount, lineUnitPrice * lineQty);

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">{it.sku}</td>
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">{it.name}</td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">{it.uop || 'Cái'}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">{lineQty}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {lineUnitPrice.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {lineAmount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tiền hàng chưa thuế (Subtotal):</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                {(order.subtotalAmount ?? Math.round(cleanTotal / 1.1)).toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tiền thuế GTGT VAT ({order.taxRate ?? 10}%):</span>
              <span className="font-mono tabular-nums font-semibold text-purple-700 dark:text-purple-400">
                {(order.taxAmount ?? (cleanTotal - Math.round(cleanTotal / 1.1))).toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Tổng thanh toán đã gồm VAT:</span>
              <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold">
                {cleanTotal.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>

          {/* Electronic Invoice Card */}
          {order.vatStatus === 'ISSUED' ? (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-purple-700 dark:text-purple-400 shrink-0" />
                <div>
                  <h5 className="font-bold text-purple-900 dark:text-purple-200">Hóa Đơn Điện Tử VAT Đã Được Cấp Mã CQT</h5>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Số HĐ: {order.vatInvoiceNumber} • Ký hiệu {order.vatSerial || '1C26TAA'} • Mã CQT: {order.cqtCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDownloadVatPdf(order)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Bản PDF NĐ123</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
                <div>
                  <h5 className="font-bold text-blue-900 dark:text-blue-200">Chưa Phát Hành Hóa Đơn Điện Tử VAT</h5>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Ký số HSM tự động & cấp mã Cơ quan Thuế trực tiếp theo Nghị định 123/2020/NĐ-CP
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenVatModal(order);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Phát Hành VAT Ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {remaining > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(order);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Thu Tiền ({remaining.toLocaleString('vi-VN')} đ)</span>
              </button>
            )}
            {order.fulfillmentStatus !== 'SHIPPED' && order.fulfillmentStatus !== 'COMPLETED' && (
              <button
                onClick={() => {
                  onUpdateFulfillment(order.id, 'SHIPPED');
                  onClose();
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Xuất Kho WMS (Goods Issue)</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
