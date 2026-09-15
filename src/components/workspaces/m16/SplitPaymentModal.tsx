import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatVNDCurrency } from '../../../utils/currencyFormatter';

export interface PaymentSplitRow {
  id: string;
  method: 'CASH' | 'CARD' | 'VIETQR' | 'TRANSFER';
  amount: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartGrandTotal: number;
  cartSubtotal: number;
  cartTax: number;
  discountAmount: number;
  itemCount: number;
  customer: any;
  requiresVatInvoice: boolean;
  setRequiresVatInvoice: (val: boolean) => void;
  vatDetails: { companyName: string; taxCode: string; address: string; email: string };
  setVatDetails: React.Dispatch<React.SetStateAction<{ companyName: string; taxCode: string; address: string; email: string }>>;
  onConfirmCheckout: (paymentSplits: PaymentSplitRow[]) => void;
  processing: boolean;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  cartGrandTotal,
  cartSubtotal,
  cartTax,
  discountAmount,
  itemCount,
  customer,
  requiresVatInvoice,
  setRequiresVatInvoice,
  vatDetails,
  setVatDetails,
  onConfirmCheckout,
  processing
}) => {
  const [splits, setSplits] = useState<PaymentSplitRow[]>([
    { id: '1', method: 'CASH', amount: cartGrandTotal }
  ]);

  // Reset splits when modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setSplits([{ id: '1', method: 'CASH', amount: cartGrandTotal }]);
    }
  }, [isOpen, cartGrandTotal]);

  const totalTendered = useMemo(() => {
    return splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [splits]);

  const remainingDeficit = useMemo(() => {
    return Math.max(0, cartGrandTotal - totalTendered);
  }, [cartGrandTotal, totalTendered]);

  const cashPortion = useMemo(() => {
    return splits.filter(s => s.method === 'CASH').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [splits]);

  const nonCashPortion = useMemo(() => {
    return splits.filter(s => s.method !== 'CASH').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [splits]);

  const changeDue = useMemo(() => {
    // If total tendered > cartGrandTotal and cash was paid, change is given from cash
    if (totalTendered > cartGrandTotal && cashPortion > 0) {
      const requiredCash = Math.max(0, cartGrandTotal - nonCashPortion);
      return Math.max(0, cashPortion - requiredCash);
    }
    return 0;
  }, [totalTendered, cartGrandTotal, cashPortion, nonCashPortion]);

  const isExactOrOver = totalTendered >= cartGrandTotal;

  const handleAddSplit = () => {
    if (remainingDeficit > 0) {
      setSplits(prev => [
        ...prev,
        { id: String(Date.now()), method: 'CARD', amount: remainingDeficit }
      ]);
    } else {
      setSplits(prev => [
        ...prev,
        { id: String(Date.now()), method: 'CARD', amount: 0 }
      ]);
    }
  };

  const handleRemoveSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSplit = (id: string, field: 'method' | 'amount', value: any) => {
    setSplits(prev =>
      prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : value
          };
        }
        return s;
      })
    );
  };

  const handleQuickPreset = (method: 'CASH' | 'CARD' | 'VIETQR' | 'TRANSFER', amount: number) => {
    setSplits([{ id: '1', method, amount }]);
  };

  const methodIcons: Record<string, any> = {
    CASH: Banknote,
    CARD: CreditCard,
    VIETQR: QrCode,
    TRANSFER: ArrowRight
  };

  const methodLabels: Record<string, string> = {
    CASH: 'Tiền mặt (CASH)',
    CARD: 'Thẻ ATM / Visa / Master',
    VIETQR: 'Chuyển khoản QR (VIETQR)',
    TRANSFER: 'Chuyển khoản ngân hàng'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Thanh Toán Đơn Hàng POS</h3>
              <p className="text-[11px] text-slate-400">
                Khách hàng: <span className="font-semibold text-slate-200">{customer?.name ?? 'Khách lẻ vãng lai'}</span> • {itemCount} món
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Amount Overview Card */}
          <div className="p-4 bg-blue-50/80 dark:bg-slate-800/80 rounded-2xl border border-blue-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Tổng tiền cần thanh toán
              </span>
              <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {formatVNDCurrency(cartGrandTotal)}
              </span>
            </div>

            <div className="text-right text-xs space-y-0.5 font-mono text-slate-500 dark:text-slate-400">
              <div>Tạm tính: {formatVNDCurrency(cartSubtotal)}</div>
              {discountAmount > 0 && <div className="text-emerald-600">Giảm giá: -{formatVNDCurrency(discountAmount)}</div>}
              <div>VAT (10%): {formatVNDCurrency(cartTax)}</div>
            </div>
          </div>

          {/* Quick Method Buttons */}
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Chọn nhanh phương thức toàn phần:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset('CASH', cartGrandTotal)}
                className="min-h-[44px] py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Tiền mặt đủ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('CARD', cartGrandTotal)}
                className="min-h-[44px] py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Quẹt thẻ đủ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('VIETQR', cartGrandTotal)}
                className="min-h-[44px] py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>VietQR đủ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('CASH', Math.ceil(cartGrandTotal / 500000) * 500000)}
                className="min-h-[44px] py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Tròn {formatVNDCurrency(Math.ceil(cartGrandTotal / 500000) * 500000)}</span>
              </button>
            </div>
          </div>

          {/* Split Payment Tender Rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Chi tiết các dòng thanh toán (Split Tender):
              </span>
              <button
                type="button"
                onClick={handleAddSplit}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm phương thức</span>
              </button>
            </div>

            <div className="space-y-2">
              {splits.map((split, idx) => {
                const Icon = methodIcons[split.method] || Banknote;
                return (
                  <div
                    key={split.id}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </div>

                    <div className="w-44">
                      <select
                        value={split.method}
                        onChange={e => handleUpdateSplit(split.id, 'method', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200"
                      >
                        <option value="CASH">Tiền mặt (CASH)</option>
                        <option value="CARD">Thẻ ngân hàng (CARD)</option>
                        <option value="VIETQR">Mã VietQR động</option>
                        <option value="TRANSFER">Chuyển khoản</option>
                      </select>
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={split.amount || ''}
                        onChange={e => handleUpdateSplit(split.id, 'amount', e.target.value)}
                        placeholder="Nhập số tiền..."
                        className="w-full text-xs font-mono font-bold text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white tabular-nums"
                      />
                    </div>

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplit(split.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation & Balance Status Box */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tổng tiền khách trả:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {formatVNDCurrency(totalTendered)}
              </span>
            </div>

            {remainingDeficit > 0 ? (
              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Còn thiếu (Deficit):</span>
                </span>
                <span className="text-sm tabular-nums">
                  {formatVNDCurrency(remainingDeficit)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tiền thừa trả lại khách (Change Due):</span>
                </span>
                <span className="text-sm tabular-nums">
                  {formatVNDCurrency(changeDue)}
                </span>
              </div>
            )}
          </div>

          {/* VAT Invoice Accordion */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={requiresVatInvoice}
                onChange={e => setRequiresVatInvoice(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
              />
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Yêu cầu xuất Hóa đơn Điện tử VAT 10%</span>
            </label>

            {requiresVatInvoice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-xs">
                <input
                  type="text"
                  placeholder="Tên công ty / Đơn vị..."
                  value={vatDetails.companyName}
                  onChange={e => setVatDetails(v => ({ ...v, companyName: e.target.value }))}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Mã số thuế (MST)..."
                  value={vatDetails.taxCode}
                  onChange={e => setVatDetails(v => ({ ...v, taxCode: e.target.value }))}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Địa chỉ công ty..."
                  value={vatDetails.address}
                  onChange={e => setVatDetails(v => ({ ...v, address: e.target.value }))}
                  className="sm:col-span-2 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy bỏ (Esc)
          </button>

          <button
            type="button"
            disabled={!isExactOrOver || processing}
            onClick={() => onConfirmCheckout(splits)}
            className="min-h-[44px] flex-1 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {processing ? 'Đang xử lý...' : `Xác nhận & Thu tiền (${formatVNDCurrency(cartGrandTotal)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
