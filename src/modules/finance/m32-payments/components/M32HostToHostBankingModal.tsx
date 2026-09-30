import React, { useState } from 'react';
import { Landmark, CheckCircle2, ShieldCheck, RefreshCw, X, ArrowRight, DollarSign, Lock, AlertCircle, Play, Building2, Zap } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M32HostToHostBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentBatchSuccess: (batchResult: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M32HostToHostBankingModal: React.FC<M32HostToHostBankingModalProps> = ({
  isOpen,
  onClose,
  onPaymentBatchSuccess,
  onNotify
}) => {
  if (!isOpen) return null;

  const [selectedBank, setSelectedBank] = useState<'VCB' | 'TCB' | 'BIDV'>('VCB');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [otpToken, setOtpToken] = useState<string>('982143');

  const [batchInvoices] = useState([
    {
      id: 'PAY-H2H-01',
      supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      bankAccount: '0011004567890 (VCB Hội Sở)',
      invoiceNo: '0008924',
      amount: 450000000,
      description: 'Chi trả tiền hàng linh kiện đợt 1 hợp đồng CON-2026-001',
      status: 'PENDING_APPROVAL'
    },
    {
      id: 'PAY-H2H-02',
      supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
      bankAccount: '19034567890012 (Techcombank Ba Đình)',
      invoiceNo: '0001298',
      amount: 180000000,
      description: 'Thanh toán hạt nhựa sinh học PO-2026-002',
      status: 'PENDING_APPROVAL'
    },
    {
      id: 'PAY-H2H-03',
      supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
      bankAccount: '12410000889922 (BIDV Quang Trung)',
      invoiceNo: '0003451',
      amount: 320000000,
      description: 'Quyết toán máy đo laser quang học đợt 2',
      status: 'PENDING_APPROVAL'
    }
  ]);

  const totalBatchAmount = batchInvoices.reduce((s, i) => s + i.amount, 0);

  const handleExecuteH2HPayment = () => {
    if (!otpToken || otpToken.length < 6) {
      onNotify('warning', 'Mã Token không hợp lệ', 'Vui lòng nhập đủ 6 ký tự bảo mật Corporate Token.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentBatchSuccess({
        bank: selectedBank,
        totalAmount: totalBatchAmount,
        count: batchInvoices.length,
        referenceNo: `H2H-${selectedBank}-${Date.now().toString().slice(-6)}`
      });
      onNotify('success', 'Lệnh Chuyển Tiền H2H Đã Gửi Ngân Hàng', `Đã thực hiện chi trả ${formatCurrency(totalBatchAmount)} cho ${batchInvoices.length} nhà cung cấp qua cổng Open Banking ${selectedBank}.`);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Cổng Thanh Toán Doanh Nghiệp Host-to-Host (H2H / Open Banking API)
              </h3>
              <p className="text-[11px] text-slate-300">Chi trả lô tự động, kết nối trực tiếp Core Banking VCB / BIDV / Techcombank</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Bank Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Chọn Cổng Ngân Hàng Kết Nối Trực Tiếp (Direct Corporate API)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'VCB', name: 'Vietcombank Corporate Host-to-Host', account: '1029887766 (TK Tiền Gửi 1121)', balance: 14500000000 },
                { id: 'TCB', name: 'Techcombank Business Direct API', account: '1909887766 (TK Tiền Gửi 1121)', balance: 8200000000 },
                { id: 'BIDV', name: 'BIDV iBank Open API Connect', account: '1249887766 (TK Tiền Gửi 1121)', balance: 6500000000 }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedBank === b.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs block text-slate-900 dark:text-white">{b.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{b.account}</span>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                    Khả dụng: {formatCurrency(b.balance)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Invoices Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Danh Sách Hồ Sơ Thanh Toán Lô Được Chọn ({batchInvoices.length} khoản chi):
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                Tổng cộng: {formatCurrency(totalBatchAmount)}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Mã Giao Dịch & HĐ</th>
                    <th className="p-2.5">Đơn Vị Thụ Hưởng (NCC)</th>
                    <th className="p-2.5">Số Tài Khoản Nhận</th>
                    <th className="p-2.5">Nội Dung Hạch Toán</th>
                    <th className="p-2.5 text-right">Số Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {batchInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">{inv.id}</span>
                        <span className="text-[10px] text-slate-500">HĐ: {inv.invoiceNo}</span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{inv.supplier}</td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{inv.bankAccount}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{inv.description}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatCurrency(inv.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authorization Block */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">Xác Thực Lệnh Chuyển Tiền Lô (Maker-Checker Authorization)</span>
                <span className="text-[11px] text-slate-500">Ký duyệt cấp 2: Giám Đốc Tài Chính (CFO) / Kế Toán Trưởng</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Corporate Token:</span>
              <input
                type="text"
                maxLength={6}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-center tracking-widest text-indigo-600 dark:text-indigo-400 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tự động hạch toán Nợ 331 / Có 1121 vào Sổ Cái Kế Toán ngay khi lệnh thành công
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteH2HPayment}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isProcessing ? 'Đang Thực Thi Lệnh H2H...' : 'Ký Duyệt & Phát Lệnh Chuyển Tiền Lô'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
