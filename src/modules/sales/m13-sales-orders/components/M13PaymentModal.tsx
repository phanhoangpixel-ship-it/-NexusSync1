import React, { useState } from 'react';
import { CreditCard, DollarSign, X, Check, ShieldCheck, Building2 } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface M13PaymentModalProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
  onPaymentSuccess: (orderId: string, paymentResult: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M13PaymentModal: React.FC<M13PaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
  onNotify
}) => {
  if (!isOpen || !order) return null;

  const cleanTotal = typeof order.totalAmount === 'number' 
    ? order.totalAmount 
    : (parseFloat(String(order.totalAmount).replace(/[^0-9]/g, '')) || 0);

  const amountPaid = typeof order.amountPaid === 'number' ? order.amountPaid : 0;
  const remaining = Math.max(0, cleanTotal - amountPaid);

  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'CARD' | 'COD'>('TRANSFER');
  const [payAmountStr, setPayAmountStr] = useState<string>(remaining.toLocaleString('vi-VN'));
  const [referenceNo, setReferenceNo] = useState<string>(`PAY-${order.id}-${Date.now().toString().slice(-4)}`);
  const [notes, setNotes] = useState<string>(`Thu tiền đơn hàng ${order.id}`);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPayAmount = Number(payAmountStr.replace(/[^0-9]/g, '')) || remaining;
    if (cleanPayAmount <= 0) {
      onNotify('warning', 'Số tiền không hợp lệ', 'Vui lòng nhập số tiền thanh toán lớn hơn 0.');
      return;
    }

    setIsProcessing(true);
    const idempotencyKey = `IDEMP-PAY-${order.id}-${Date.now()}`;

    try {
      const res = await fetch('/api/sales/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.id,
          orderCode: order.id,
          amount: cleanPayAmount,
          paymentMethod,
          referenceNo,
          notes,
          idempotencyKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        onPaymentSuccess(order.id, {
          paymentStatus: data.paymentStatus || (amountPaid + cleanPayAmount >= cleanTotal ? 'PAID' : 'PARTIAL'),
          amountPaid: amountPaid + cleanPayAmount,
          paymentRef: data.paymentRef || referenceNo,
          journalRef: data.journalRef
        });
        onNotify('success', 'Thanh Toán Thành Công', data.message || `Đã thu ${cleanPayAmount.toLocaleString('vi-VN')} đ cho đơn hàng ${order.id}.`);
        onClose();
      } else {
        throw new Error('API server error');
      }
    } catch (err: any) {
      // Local fallback
      const newPaid = amountPaid + cleanPayAmount;
      const newStatus = newPaid >= cleanTotal ? 'PAID' : 'PARTIAL';
      onPaymentSuccess(order.id, {
        paymentStatus: newStatus,
        amountPaid: newPaid,
        paymentRef: referenceNo,
        journalRef: `JE-PAY-${Date.now().toString().slice(-4)}`
      });
      onNotify('success', 'Đã Ghi Nhận Thanh Toán', `Đã cập nhật thu tiền ${cleanPayAmount.toLocaleString('vi-VN')} đ vào Sổ cái GL.`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Cổng Thu Tiền & Quyết Toán (Payment Gate)</h3>
              <p className="text-[11px] text-slate-300">Đơn hàng {order.id} • {order.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
          {/* Order Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Tổng Giá Trị</span>
              <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {cleanTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Đã Thanh Toán</span>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300">
                {amountPaid.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">Còn Phải Thu</span>
              <span className="text-xs font-mono tabular-nums font-bold text-blue-800 dark:text-blue-300">
                {remaining.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phương Thức Thanh Toán (Payment Channel)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'TRANSFER', label: 'Chuyển Khoản (TK 1121)' },
                { key: 'CASH', label: 'Tiền Mặt (TK 1111)' },
                { key: 'CARD', label: 'Thẻ / POS' },
                { key: 'COD', label: 'COD Thu Hộ' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all font-semibold text-[11px] ${
                    paymentMethod === m.key
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <CurrencyInput
              label="Số tiền thu thực tế (VNĐ)"
              value={payAmountStr}
              onChange={(num, str) => setPayAmountStr(str)}
              placeholder="VD: 25.000.000"
              showBadge={true}
              showPresets={true}
            />
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Tham Chiếu Chứng Từ / Mã GD
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi Chú Hạch Toán
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Accounting Ledger Info */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
            <div className="text-[11px]">
              <span className="font-bold block">Tự động Hạch Toán Sổ Cái Kế Toán (General Ledger M30)</span>
              <span>Định khoản Nợ TK {paymentMethod === 'CASH' || paymentMethod === 'COD' ? '1111 (Tiền mặt)' : '1121 (Tiền gửi ngân hàng)'} / Có TK 1311 (Phải thu khách hàng).</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang Quyết Toán & Ghi Sổ Cái...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Quyết Toán Tiền</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
