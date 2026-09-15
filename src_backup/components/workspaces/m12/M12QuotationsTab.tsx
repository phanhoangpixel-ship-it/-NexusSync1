import React, { useState } from 'react';
import { CrmQuotationItem } from './m12Types';
import {
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Send,
  Eye,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

interface M12QuotationsTabProps {
  quotations: CrmQuotationItem[];
  onOpenNewQuotationModal: () => void;
  onConvertToSalesOrder: (quotationId: number) => void;
  onUpdateQuotationStatus: (quotationId: number, status: CrmQuotationItem['status']) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12QuotationsTab: React.FC<M12QuotationsTabProps> = ({
  quotations,
  onOpenNewQuotationModal,
  onConvertToSalesOrder,
  onUpdateQuotationStatus,
  onNotify,
}) => {
  const [selectedQuotation, setSelectedQuotation] = useState<CrmQuotationItem | null>(null);

  const getStatusBadge = (status: CrmQuotationItem['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      case 'SENT':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'ACCEPTED':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'REJECTED':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700';
      case 'CONVERTED_TO_SO':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
  };

  const getStatusLabel = (status: CrmQuotationItem['status']) => {
    switch (status) {
      case 'DRAFT': return 'Bản Thảo (DRAFT)';
      case 'SENT': return 'Đã Gửi Khách (SENT)';
      case 'ACCEPTED': return 'Khách Chấp Thuận (ACCEPTED)';
      case 'REJECTED': return 'Từ Chối (REJECTED)';
      case 'CONVERTED_TO_SO': return 'Đã Tạo Đơn SO (M13)';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Quản Lý Báo Giá Thương Mại (Commercial Quotations & Price Agreements)
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenNewQuotationModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Báo Giá Mới</span>
        </button>
      </div>

      {/* Quotations List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                <th className="py-3 px-4">Số Báo Giá</th>
                <th className="py-3 px-4">Tiêu đề & Khách hàng</th>
                <th className="py-3 px-4">Ngày lập / Hiệu lực</th>
                <th className="py-3 px-4 text-right">Tổng Tiền (VND)</th>
                <th className="py-3 px-4">Điều khoản</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có báo giá thương mại nào được khởi tạo.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  let items = [];
                  try {
                    if (q.itemsPayload) items = JSON.parse(q.itemsPayload);
                  } catch (e) {}

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-purple-700 dark:text-purple-400">
                        {q.quotationCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{q.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{q.customerName}</span>
                          {q.contactPerson && <span>• {q.contactPerson}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        <div>Lập: {q.issueDate}</div>
                        <div className="text-slate-400">Hết hạn: {q.validUntil}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        <div>{Number(q.grandTotal || 0).toLocaleString('vi-VN')} VND</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Gồm VAT {q.taxRate}% ({(Number(q.taxAmount || 0) / 1000000).toFixed(1)}M)
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{q.paymentTerms || 'NET30'}</div>
                        <div className="text-slate-400 text-[10px] truncate max-w-[140px]">{q.deliveryTerms}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${getStatusBadge(q.status)}`}>
                          {getStatusLabel(q.status)}
                        </span>
                        {q.convertedSalesOrderCode && (
                          <div className="text-[10px] font-mono text-emerald-600 font-bold mt-1">
                            {q.convertedSalesOrderCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedQuotation(q)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            title="Xem chi tiết các mặt hàng"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chi tiết</span>
                          </button>

                          {q.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => onUpdateQuotationStatus(q.id, 'SENT')}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer flex items-center gap-1"
                              title="Gửi Báo Giá tới khách hàng"
                            >
                              <Send className="w-3 h-3" />
                              <span>Gửi Khách</span>
                            </button>
                          )}

                          {q.status === 'SENT' && (
                            <button
                              type="button"
                              onClick={() => onUpdateQuotationStatus(q.id, 'ACCEPTED')}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1"
                              title="Khách hàng đã chấp thuận"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Duyệt Nhận</span>
                            </button>
                          )}

                          {(q.status === 'ACCEPTED' || q.status === 'SENT') && (
                            <button
                              type="button"
                              onClick={() => onConvertToSalesOrder(q.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              title="Chuyển đổi thành Đơn Bán Hàng (SO M13) & Khóa giữ tồn kho"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Tạo Đơn SO (M13)</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for Items */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                  {selectedQuotation.quotationCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedQuotation.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Khách hàng: <strong className="text-slate-800 dark:text-slate-200">{selectedQuotation.customerName}</strong> • Hiệu lực đến: {selectedQuotation.validUntil}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuotation(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Tên Hàng Hóa / Dịch Vụ</th>
                    <th className="py-2.5 px-3 text-center">Số Lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                    <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(() => {
                    let lines = [];
                    try {
                      if (selectedQuotation.itemsPayload) lines = JSON.parse(selectedQuotation.itemsPayload);
                    } catch (e) {}

                    return lines.map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-2 px-3 font-mono font-semibold text-purple-700 dark:text-purple-400">
                          {l.sku || 'PROD-GEN'}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                          {l.name || l.productName}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {l.quantity || l.qty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {Number(l.unitPrice || l.price || 0).toLocaleString('vi-VN')} VND
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {Number((l.quantity || 1) * (l.unitPrice || l.price || 0)).toLocaleString('vi-VN')} VND
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tiền hàng chưa thuế:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {Number(selectedQuotation.subtotal || 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Thuế VAT ({selectedQuotation.taxRate}%):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    +{Number(selectedQuotation.taxAmount || 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>
                {Number(selectedQuotation.discountAmount) > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Chiết khấu thương mại:</span>
                    <span className="font-bold">
                      -{Number(selectedQuotation.discountAmount).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-purple-700 dark:text-purple-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Tổng thanh toán:</span>
                  <span>{Number(selectedQuotation.grandTotal || 0).toLocaleString('vi-VN')} VND</span>
                </div>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-800 dark:text-slate-200">Ghi chú & Điều khoản: </strong>
                {selectedQuotation.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
