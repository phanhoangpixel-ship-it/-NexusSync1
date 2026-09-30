import React, { useState } from 'react';
import { Landmark, CheckCircle2, RefreshCw, Send, ShieldCheck, Key, Lock, ArrowRight, DollarSign, X, Building, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M32BankHostToHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M32BankHostToHostModal: React.FC<M32BankHostToHostModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [selectedBank, setSelectedBank] = useState<'VCB' | 'TCB' | 'BIDV'>('VCB');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('H2H-PAY-20260927-01');

  const [paymentBatches] = useState([
    {
      id: 'H2H-PAY-20260927-01',
      bankName: 'Vietcombank Corporate Banking (H2H Direct)',
      bankCode: 'VCB',
      accountNo: '0011002233445 (VND Corporate)',
      totalAmount: 1850000000,
      totalOrders: 14,
      vendorBeneficiaries: 'Samsung Electronics, Nitto Denko, Nippon Sanso',
      status: 'READY_TO_SIGN',
      protocol: 'ISO 20022 XML (pain.001.001.03)',
      hsmStatus: 'HARDWARE_HSM_ONLINE'
    },
    {
      id: 'H2H-PAY-20260927-02',
      bankName: 'Techcombank Open Banking API',
      bankCode: 'TCB',
      accountNo: '19033445566778 (VND Corporate)',
      totalAmount: 640000000,
      totalOrders: 6,
      vendorBeneficiaries: 'Việt Sơn Mechatronics, Khang Thịnh Plastic',
      status: 'READY_TO_SIGN',
      protocol: 'RESTful OAuth 2.0 mTLS MT101',
      hsmStatus: 'HARDWARE_HSM_ONLINE'
    }
  ]);

  const [transmissionLogs, setTransmissionLogs] = useState<string[]>([
    '05:15:02 [H2H] Thiết lập phiên bảo mật mTLS 1.3 với Vietcombank Gateway...',
    '05:15:03 [H2H] Kiểm tra chứng thư số HSM Doanh nghiệp: Hợp lệ (Hết hạn: 2028-12-31)',
    '05:15:04 [H2H] Sẵn sàng phát lệnh chi điện tử tự động.'
  ]);

  const handleTransmitBatch = () => {
    setIsTransmitting(true);
    setTransmissionLogs(prev => [...prev, `05:16:10 [H2H] Đang đóng gói bản tin chuẩn ISO 20022 (pain.001) cho ${selectedBatchId}...`]);

    setTimeout(() => {
      setTransmissionLogs(prev => [
        ...prev,
        `05:16:11 [H2H] Chữ ký số điện tử HSM đã được đính kèm (SHA256withRSA).`,
        `05:16:12 [H2H] Phản hồi từ Ngân hàng [ACK-200]: Lệnh chi tiền thành công! Mã giao dịch: FT262700998811.`
      ]);
      setIsTransmitting(false);
      onNotify('success', 'Phát Lệnh Chi H2H Thành Công', `Đã chuyển khoản thành công lô thanh toán ${selectedBatchId} qua cổng Host-to-Host.`);
    }, 1200);
  };

  const currentBatch = paymentBatches.find(b => b.id === selectedBatchId) || paymentBatches[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Cổng Tích Hợp Ngân Hàng Doanh Nghiệp Host-to-Host (H2H Direct Banking)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  mTLS &amp; ISO 20022
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Phát lệnh chi thanh toán nhà cung cấp tự động &amp; Tra soát giao dịch trực tuyến tức thời</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Bank Selector Strip */}
          <div className="grid grid-cols-2 gap-3">
            {paymentBatches.map(batch => (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  selectedBatchId === batch.id
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{batch.bankName}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    {batch.protocol}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">TK Trích Nợ: <strong className="font-mono text-slate-800 dark:text-slate-200">{batch.accountNo}</strong></div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Số lượng: <strong>{batch.totalOrders} lệnh chi</strong></span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(batch.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Current Batch Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-slate-900 dark:text-white">Chi Tiết Lô Lệnh Chi Điện Tử: <span className="font-mono text-emerald-600">{currentBatch.id}</span></span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Hardware Token HSM Đã Xác Thực
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Danh Sách NCC Thụ Hưởng:</span>
                <strong className="text-slate-800 dark:text-slate-200 leading-snug block mt-0.5">{currentBatch.vendorBeneficiaries}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Kênh Kết Nối Bảo Mật:</span>
                <strong className="text-slate-800 dark:text-slate-200 block mt-0.5">VPN IPsec Chuyên Dụng / mTLS Port 8443</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Đối Soát Sổ Cái Tức Thời:</span>
                <strong className="text-indigo-600 dark:text-indigo-400 block mt-0.5">Tự động gạch nợ TK 331 &amp; Có TK 1121</strong>
              </div>
            </div>
          </div>

          {/* Terminal / Live Transmission Log */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] text-slate-300 space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-2">
              <span>H2H SECURE COMMUNICATION CONSOLE</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE GATEWAY</span>
            </div>
            {transmissionLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                {log}
              </div>
            ))}
            {isTransmitting && (
              <div className="text-amber-400 flex items-center gap-2 pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang gửi bản tin tài chính và chờ mã xác thực giao dịch từ Ngân hàng...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={isTransmitting}
            onClick={handleTransmitBatch}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isTransmitting ? 'Đang Phát Lệnh Chi...' : 'Ký Số HSM & Phát Lệnh Chi H2H Trực Tuyến'}
          </button>
        </div>
      </div>
    </div>
  );
};
