import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, User, ArrowRight, FileCheck } from 'lucide-react';
import { PriceApprovalRequest } from '../../../../types/pricingManagement';
import { formatVND } from '../../../../lib/currency';

interface PriceApprovalTabProps {
  approvalRequests: PriceApprovalRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export const PriceApprovalTab: React.FC<PriceApprovalTabProps> = ({
  approvalRequests,
  onApprove,
  onReject
}) => {
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirmReject = () => {
    if (rejectModalId && rejectReason) {
      onReject(rejectModalId, rejectReason);
      setRejectModalId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Explainer Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Hàng Đợi Phê Duyệt Giá (Maker - Checker Governance Workflow)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Tuân thủ nguyên tắc độc lập thẩm quyền: Nhân viên kinh doanh / Pricing Specialist (Maker) lập đề xuất điều chỉnh giá; Cấp quản lý / Giám đốc tài chính CFO (Checker) xét duyệt biên lợi nhuận trước khi giá có hiệu lực thực tế.
          </p>
        </div>

        {/* State machine pill sequence */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-semibold">DRAFT</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-semibold">SUBMITTED</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded font-semibold">PENDING</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-semibold">APPROVED</span>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {approvalRequests.map((req) => {
          const isPending = req.status === 'PENDING_APPROVAL';
          const marginDelta = req.newMarginPercent - req.oldMarginPercent;

          return (
            <div
              key={req.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border p-5 shadow-sm transition-all ${
                isPending ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-400/20' : 'border-slate-200 dark:border-slate-700 opacity-90'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {req.requestNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{req.productName}</h4>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      req.status === 'PENDING_APPROVAL' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                      req.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                      'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bảng giá: <strong className="text-slate-700 dark:text-slate-300">{req.priceListName}</strong> | SKU: <span className="font-mono">{req.sku}</span>
                  </div>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => setRejectModalId(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Từ Chối (Reject)
                    </button>
                    <button
                      onClick={() => onApprove(req.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Phê Duyệt Giá Mới (Approve)
                    </button>
                  </div>
                )}
              </div>

              {/* Price comparison detail */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Giá Vốn Hiện Tại (Costing):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{formatVND(req.costBasis)}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Giá Bán Cũ:</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 line-through text-sm">{formatVND(req.oldPrice)}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Margin cũ: {req.oldMarginPercent}%</span>
                </div>
                <div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold block">Giá Đề Xuất Mới:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-base">{formatVND(req.newPrice)}</span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block mt-0.5">Margin mới: {req.newMarginPercent}% ({marginDelta >= 0 ? `+${marginDelta.toFixed(2)}` : marginDelta.toFixed(2)}%)</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Người Đề Xuất (Maker):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {req.requester}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{req.requestedAt}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-800 dark:text-white">Lý do điều chỉnh:</strong> {req.reason}
              </div>

              {req.rejectionReason && (
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  <strong>Lý do từ chối:</strong> {req.rejectionReason} (Bởi: {req.approver} lúc {req.approvedAt})
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Từ Chối Phê Duyệt Đề Xuất Giá
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Vui lòng nhập lý do từ chối để chuyển ngược lại cho Maker (Người đề xuất) điều chỉnh lại biên lợi nhuận.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Mức giá đề xuất làm biên lợi nhuận giảm dưới kỳ vọng tài chính của quý 3..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm mb-4 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
