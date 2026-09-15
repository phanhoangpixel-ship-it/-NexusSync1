import React from 'react';
import { X, Printer, CheckCircle2, QrCode, Store, Sparkles } from 'lucide-react';
import { formatVNDCurrency } from '../../../utils/currencyFormatter';
import { formatLocalDateTime } from '../../../utils/timeUtils';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    code: string;
    createdAt?: string;
    customerName?: string;
    cashierName?: string;
    branchName?: string;
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      price: number;
      discountPercent?: number;
    }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
    paymentMethods?: Array<{ method: string; amount: number }>;
    changeDue?: number;
  } | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  if (!isOpen || !orderData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header toolbar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">Xem trước Hóa đơn nhiệt 80mm (F10)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Content Viewport */}
        <div className="p-5 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="pos-thermal-receipt"
            className="w-[320px] bg-white text-black p-4 font-mono text-[11px] shadow-md border border-slate-300 rounded-sm leading-tight select-text"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-black space-y-1">
              <div className="font-bold text-sm uppercase tracking-wider">NEXUSSYNC RETAIL</div>
              <div className="text-[10px]">Hệ thống Siêu thị Bán lẻ Đa kênh</div>
              <div className="text-[9px] text-slate-600">Đ/c: Tầng 1, Tòa nhà NexusSync, Hà Nội</div>
              <div className="text-[9px] text-slate-600">Hotline: 1900 8888 • MST: 0109988776</div>
            </div>

            {/* Receipt Metadata */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="text-center font-bold text-xs">HÓA ĐƠN BÁN LẺ POS</div>
              <div className="flex justify-between">
                <span>Số HĐ:</span>
                <span className="font-bold">{orderData.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày giờ:</span>
                <span>{orderData.createdAt ? formatLocalDateTime(orderData.createdAt) : formatLocalDateTime(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{orderData.cashierName ?? 'Thu ngân Ca'}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold">{orderData.customerName ?? 'Khách lẻ vãng lai'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-black">
                <span className="col-span-6">Tên / SKU</span>
                <span className="col-span-2 text-center">SL</span>
                <span className="col-span-4 text-right">T.Tiền</span>
              </div>

              <div className="divide-y divide-dashed divide-slate-300 py-1">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="py-1">
                    <div className="font-bold text-[10px] truncate">{item.name}</div>
                    <div className="grid grid-cols-12 text-[9px] text-slate-700">
                      <span className="col-span-6">{item.sku}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold text-black tabular-nums">
                        {formatVNDCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculations */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span className="tabular-nums">{formatVNDCurrency(orderData.subtotal)}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Chiết khấu khuyến mãi:</span>
                  <span className="tabular-nums">-{formatVNDCurrency(orderData.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Thuế GTGT (VAT 10%):</span>
                <span className="tabular-nums">{formatVNDCurrency(orderData.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
                <span>TỔNG THANH TOÁN:</span>
                <span className="tabular-nums text-sm font-black">{formatVNDCurrency(orderData.finalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[9px]">
              <div className="font-bold text-[10px]">PHƯƠNG THỨC THANH TOÁN:</div>
              {orderData.paymentMethods?.map((pm, i) => (
                <div key={i} className="flex justify-between">
                  <span>• {pm.method}:</span>
                  <span className="font-bold tabular-nums">{formatVNDCurrency(pm.amount)}</span>
                </div>
              ))}
              {orderData.changeDue !== undefined && orderData.changeDue > 0 && (
                <div className="flex justify-between font-bold pt-0.5">
                  <span>Tiền thối lại khách:</span>
                  <span className="tabular-nums">{formatVNDCurrency(orderData.changeDue)}</span>
                </div>
              )}
            </div>

            {/* Dynamic QR Transfer & Barcode Mock */}
            <div className="py-3 flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-1.5 bg-slate-100 border border-slate-300 rounded">
                <QrCode className="w-16 h-16 text-black" />
              </div>
              <div className="text-[8px] text-slate-500 font-mono">
                Quét mã VietQR tra cứu e-Invoice / Bảo hành
              </div>
              <div className="text-[10px] tracking-widest font-mono font-bold">
                ||||| | |||| || |||||| | |||||
              </div>
              <div className="text-[8px] text-slate-400">
                *{orderData.code}*
              </div>
            </div>

            {/* Footer Thank-You */}
            <div className="text-center pt-2 text-[9px] text-slate-600 border-t border-dashed border-black">
              <div>Cảm ơn Quý khách & Hẹn gặp lại!</div>
              <div className="text-[8px] text-slate-400 mt-0.5">Hàng đã mua được đổi trả trong vòng 07 ngày kèm hóa đơn.</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng (Esc)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Hóa Đơn Nhiệt 80mm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
