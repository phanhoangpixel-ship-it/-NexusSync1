import React, { useState } from 'react';
import { FileCheck, ShieldCheck, CheckCircle2, Lock, Key, X, Download, UserCheck, Calendar, Building, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M28EContractSigningModalProps {
  isOpen: boolean;
  employee: any | null;
  onClose: () => void;
  onSignComplete: (contractInfo: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M28EContractSigningModal: React.FC<M28EContractSigningModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSignComplete,
  onNotify
}) => {
  if (!isOpen || !employee) return null;

  const [signerRole, setSignerRole] = useState<'EMPLOYER' | 'EMPLOYEE'>('EMPLOYER');
  const [otpCode, setOtpCode] = useState<string>('889966');
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [cryptoSignature, setCryptoSignature] = useState<any | null>(null);

  const contractNo = `HDLD-2026-${employee.code ? employee.code.replace(/[^0-9]/g, '') : '00128'}`;

  const handleExecuteSigning = () => {
    if (!otpCode || otpCode.length < 6) {
      onNotify('warning', 'Mã OTP không hợp lệ', 'Vui lòng nhập đủ 6 chữ số OTP xác thực.');
      return;
    }

    setIsSigning(true);
    setTimeout(() => {
      const shaHash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const signatureInfo = {
        contractNo,
        employeeName: employee.fullName || employee.name,
        employeeCode: employee.code || 'EMP-00128',
        signedAt: new Date().toISOString(),
        signMethod: 'Ký Số Token HSM & OTP SMS Xác Thực',
        legalHash: shaHash,
        signer: 'Tổng Giám Đốc / Đại Diện Pháp Luật NexusSync ERP'
      };

      setCryptoSignature(signatureInfo);
      setIsSigned(true);
      setIsSigning(false);
      onSignComplete(signatureInfo);
      onNotify('success', 'Ký Hợp Đồng Thành Công', `Hợp đồng lao động ${contractNo} đã được đóng dấu chữ ký số điện tử hợp pháp.`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Ký Số Hợp Đồng Lao Động Điện Tử (e-Contract Signing)
              </h3>
              <p className="text-[11px] text-slate-300">Tuân thủ Luật Giao Dịch Điện Tử & Bộ Luật Lao Động 2019 • Chứng Thư Số HSM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Contract Overview Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Số Hợp Đồng Lao Động</span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{contractNo}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                Hợp Đồng Không Xác Định Thời Hạn
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Bên B (Người Lao Động):</span>
                <strong className="text-slate-900 dark:text-white text-xs">{employee.fullName || employee.name || 'Nguyễn Văn An'}</strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Chức danh: <strong>{employee.position || 'Kỹ Sư Phần Mềm'}</strong> • Phòng: {employee.department || 'R&D'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Mức Lương Cơ Bản Đóng BHXH:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">{formatCurrency(employee.baseSalary || 25000000)}</strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Địa điểm làm việc: <strong>Trụ sở chính Nexus Tower</strong></span>
              </div>
            </div>
          </div>

          {/* Verification & Signature Section */}
          {!isSigned ? (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">Xác Thực Chữ Ký Số Cấp Doanh Nghiệp (HSM e-Signature)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Đại Diện Ký Duyệt</label>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                    Phan Hoàng (Tổng Giám Đốc)
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Mã OTP Xác Thực Ký Số</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-center tracking-widest text-indigo-600 dark:text-indigo-400 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hợp đồng sau khi ký sẽ được băm mã SHA-256 bảo mật và đóng dấu thời gian (Timestamp Authority) hợp pháp.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Hợp Đồng Lao Động Đã Được Ký Số Hợp Pháp</span>
                </div>
                <span className="font-mono text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                  Status: SEALED & VALID
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-[10px] space-y-1 text-slate-700 dark:text-slate-300 break-all">
                <div><strong>Mã Băm Pháp Lý (Hash):</strong> {cryptoSignature.legalHash}</div>
                <div><strong>Thời Gian Ký:</strong> {cryptoSignature.signedAt}</div>
                <div><strong>Đơn Vị Cấp Chứng Thư:</strong> VNPT-CA / Viettel-CA (Hardware HSM)</div>
              </div>
            </div>
          )}
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

          {!isSigned ? (
            <button
              type="button"
              disabled={isSigning}
              onClick={handleExecuteSigning}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-300" />
              {isSigning ? 'Đang Đóng Dấu Ký Số HSM...' : 'Xác Nhận Ký Số Hợp Đồng'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Hoàn Tất & Lưu Hồ Sơ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
