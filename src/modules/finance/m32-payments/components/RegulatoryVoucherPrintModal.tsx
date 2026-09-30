import React, { useEffect, useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { numberToVietnameseWords } from '../../../../engines/treasuryService';

interface RegulatoryVoucherPrintModalProps {
  voucherId: number | null;
  onClose: () => void;
  onNotify?: (type: 'success' | 'warning' | 'danger' | 'info', title: string, message: string) => void;
}

export const RegulatoryVoucherPrintModal: React.FC<RegulatoryVoucherPrintModalProps> = ({
  voucherId,
  onClose,
  onNotify = () => {},
}) => {
  const [formData, setFormData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!voucherId) return;
    const fetchFormData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/treasury/vouchers/${voucherId}/printable-form`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu biểu mẫu');
        const data = await res.json();
        setFormData(data);
      } catch (e: any) {
        onNotify('danger', 'Lỗi tải biểu mẫu', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, [voucherId]);

  if (!voucherId) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (formData?.formMetadata?.voucherCode) {
      navigator.clipboard.writeText(formData.formMetadata.voucherCode);
      setCopied(true);
      onNotify('info', 'Đã sao chép', `Đã chép mã [${formData.formMetadata.voucherCode}] vào clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isReceipt = formData?.formMetadata?.voucherType === 'RECEIPT';
  const voucherDate = formData?.formMetadata?.date ? new Date(formData.formMetadata.date) : new Date();

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Biểu Mẫu Bộ Tài Chính: {formData?.formMetadata?.formCode || (isReceipt ? 'Mẫu 01 - TT' : 'Mẫu 02 - TT')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {formData?.formMetadata?.voucherCode} • Chuẩn Thông tư 200/2014/TT-BTC & TT 133/2016/TT-BTC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
              title="Sao chép số chứng từ"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Đã chép' : 'Sao chép số'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              In Biểu Mẫu (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Printable Sheet */}
        <div className="p-8 overflow-y-auto text-slate-900 bg-slate-100 dark:bg-slate-950 font-sans text-sm print:p-0 print:overflow-visible print:bg-white">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Đang kết xuất biểu mẫu chứng từ kế toán chuẩn Bộ Tài chính...
            </div>
          ) : formData ? (
            <div className="max-w-[760px] mx-auto bg-white border border-slate-300 p-8 rounded-lg shadow-sm print:border-none print:shadow-none print:p-0">
              
              {/* Header Top: Enterprise Info vs Form Metadata */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-900 leading-tight">
                    {formData.companyInfo?.name || 'TẬP ĐOÀN NEXUSSYNC CORP'}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Địa chỉ: {formData.companyInfo?.address}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Mã số thuế: <strong className="text-slate-800">{formData.companyInfo?.taxCode}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs uppercase px-2.5 py-1 bg-slate-100 rounded border border-slate-300 text-slate-800 inline-block">
                    {formData.formMetadata?.formCode || (isReceipt ? 'Mẫu số 01 - TT' : 'Mẫu số 02 - TT')}
                  </span>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                    (Ban hành theo Thông tư số 200/2014/TT-BTC & TT 133/2016/TT-BTC của Bộ Tài chính)
                  </p>
                  <div className="mt-2 text-xs font-mono space-y-0.5">
                    <div>Quyển số: <strong>01/2026</strong></div>
                    <div>Số: <strong className="text-indigo-700">{formData.formMetadata?.voucherCode}</strong></div>
                    <div>Nợ TK: <strong className="text-emerald-700">{formData.formMetadata?.debitAccount}</strong></div>
                    <div>Có TK: <strong className="text-amber-700">{formData.formMetadata?.creditAccount}</strong></div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center my-6">
                <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                  {isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI'}
                </h2>
                <p className="text-xs text-slate-600 italic mt-1">
                  Ngày {voucherDate.getDate()} tháng {voucherDate.getMonth() + 1} năm {voucherDate.getFullYear()}
                </p>
              </div>

              {/* Body Details (Tabular Fields) */}
              <div className="space-y-3 text-[13px] leading-relaxed">
                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">
                    {isReceipt ? 'Họ và tên người nộp tiền:' : 'Họ và tên người nhận tiền:'}
                  </span>
                  <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {formData.partnerInfo?.fullName || 'N/A'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">Địa chỉ / Đơn vị:</span>
                  <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {formData.partnerInfo?.address || 'Việt Nam'}
                    {formData.partnerInfo?.taxCode && formData.partnerInfo.taxCode !== 'N/A' && ` (MST: ${formData.partnerInfo.taxCode})`}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">
                    {isReceipt ? 'Lý do nộp:' : 'Lý do chi:'}
                  </span>
                  <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {formData.partnerInfo?.reason || 'Thanh toán tiền hàng / dịch vụ'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">Số tiền:</span>
                  <span className="font-black text-indigo-700 text-base border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {Number(formData.financialInfo?.amount || 0).toLocaleString('vi-VN')} {formData.financialInfo?.currency || 'VNĐ'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">Viết bằng chữ:</span>
                  <span className="font-semibold italic text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {formData.financialInfo?.amountInWords}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-medium text-slate-700 shrink-0">Kèm theo:</span>
                  <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    <strong>{formData.financialInfo?.attachedDocsCount || 0}</strong> chứng từ gốc ({formData.financialInfo?.attachedDocsDescription || 'Kèm bảng kê đối chiếu'})
                  </span>
                </div>

                {formData.financialInfo?.bankName && (
                  <div className="flex items-baseline">
                    <span className="w-48 font-medium text-slate-700 shrink-0">Phương thức thanh toán:</span>
                    <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      {formData.financialInfo?.paymentMethod === 'CASH' ? 'Tiền mặt tại quỹ' : `Chuyển khoản qua ${formData.financialInfo?.bankName} (STK: ${formData.financialInfo?.bankAccountNumber})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Date of Signing */}
              <div className="text-right mt-6 text-xs text-slate-600 italic">
                Ngày {voucherDate.getDate()} tháng {voucherDate.getMonth() + 1} năm {voucherDate.getFullYear()}
              </div>

              {/* 5 Regulatory Signatures Box */}
              <div className="grid grid-cols-5 gap-2 text-center mt-4 pt-2 border-t border-slate-200">
                
                {/* 1. Giám đốc */}
                <div className="flex flex-col justify-between h-32">
                  <div>
                    <div className="font-bold text-xs uppercase text-slate-900">Giám đốc</div>
                    <div className="text-[10px] text-slate-500 italic">(Ký, họ tên, đóng dấu)</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {formData.signatures?.director?.signed && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 mb-1">
                        <ShieldCheck className="w-3 h-3" /> Đã ký điện tử
                      </span>
                    )}
                    <div>{formData.signatures?.director?.name || 'Trần Đại Quang'}</div>
                  </div>
                </div>

                {/* 2. Kế toán trưởng */}
                <div className="flex flex-col justify-between h-32">
                  <div>
                    <div className="font-bold text-xs uppercase text-slate-900">Kế toán trưởng</div>
                    <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {formData.signatures?.chiefAccountant?.signed && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 mb-1">
                        <ShieldCheck className="w-3 h-3" /> Đã ký số
                      </span>
                    )}
                    <div>{formData.signatures?.chiefAccountant?.name || 'Nguyễn Thị Hương'}</div>
                  </div>
                </div>

                {/* 3. Người nộp/nhận */}
                <div className="flex flex-col justify-between h-32">
                  <div>
                    <div className="font-bold text-xs uppercase text-slate-900">
                      {isReceipt ? 'Người nộp tiền' : 'Người nhận tiền'}
                    </div>
                    <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    <div>{formData.signatures?.receiverOrPayer?.name || formData.partnerInfo?.fullName}</div>
                  </div>
                </div>

                {/* 4. Người lập biểu */}
                <div className="flex flex-col justify-between h-32">
                  <div>
                    <div className="font-bold text-xs uppercase text-slate-900">Người lập biểu</div>
                    <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 mb-1">
                      <CheckCircle2 className="w-3 h-3" /> Xác thực
                    </span>
                    <div>{formData.signatures?.preparer?.name || 'Hoàng Nam'}</div>
                  </div>
                </div>

                {/* 5. Thủ quỹ */}
                <div className="flex flex-col justify-between h-32">
                  <div>
                    <div className="font-bold text-xs uppercase text-slate-900">Thủ quỹ</div>
                    <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {formData.signatures?.cashier?.signed && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 mb-1">
                        <ShieldCheck className="w-3 h-3" /> Đã chi/thu
                      </span>
                    )}
                    <div>{formData.signatures?.cashier?.name || 'Phạm Thu Trang'}</div>
                  </div>
                </div>
              </div>

              {/* Sub-note for Cash Receipts/Disbursements */}
              <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 italic flex justify-between items-center">
                <span>
                  Đã {isReceipt ? 'nhận đủ số tiền (viết bằng chữ)' : 'nhận đủ số tiền (viết bằng chữ)'}: <strong>{formData.financialInfo?.amountInWords}</strong>
                </span>
                <span className="font-mono text-[10px]">
                  GL Posted: {formData.accounting?.postedGL ? `Entry #${formData.accounting?.accountingEntryId || 'AUTO'}` : 'Chưa ghi sổ'}
                </span>
              </div>

            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Chứng từ điện tử được bảo vệ bởi Sổ cái M30 & Kiểm toán M02
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
