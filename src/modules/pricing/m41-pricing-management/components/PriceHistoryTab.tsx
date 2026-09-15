import React from 'react';
import { History, Calendar, CheckCircle2, User, ArrowRight, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import { PriceAuditLog } from '../../../../types/pricingManagement';
import { formatVND } from '../../../../lib/currency';

interface PriceHistoryTabProps {
  auditLogs: PriceAuditLog[];
  onRollbackPrice?: (log: PriceAuditLog) => void;
}

export const PriceHistoryTab: React.FC<PriceHistoryTabProps> = ({
  auditLogs,
  onRollbackPrice
}) => {
  return (
    <div className="space-y-6">
      {/* Informative Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Lịch Sử Biến Động Giá & Nhật Ký Kiểm Toán (Immutable Price Audit Trail)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Ghi nhận toàn bộ vết lịch sử thay đổi giá: Giá cũ, Giá mới, Ngày hiệu lực, Quy tắc áp dụng, Người tạo (Maker), Người duyệt (Checker) và Lý do can thiệp.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="py-3.5 px-4">Thời Gian & Mã Log</th>
                <th className="py-3.5 px-3">Sản Phẩm & Bảng Giá</th>
                <th className="py-3.5 px-3 text-right">Giá Cũ</th>
                <th className="py-3.5 px-3 text-center"></th>
                <th className="py-3.5 px-3 text-left font-bold text-indigo-900 dark:text-indigo-200">Giá Mới</th>
                <th className="py-3.5 px-3">Quy Tắc & Lý Do</th>
                <th className="py-3.5 px-3">Người Thay Đổi (Maker)</th>
                <th className="py-3.5 px-3">Người Duyệt (Checker)</th>
                <th className="py-3.5 px-3 text-center">Hiệu Lực</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/60">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">{log.changedAt}</div>
                    <span className="text-[11px] text-slate-400 font-mono">{log.id}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{log.productName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Bảng: {log.priceListName} ({log.priceListCode}) | ĐVT: {log.uom}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono text-slate-400 dark:text-slate-500 line-through text-xs">
                    {formatVND(log.oldPrice)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 inline" />
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {formatVND(log.newPrice)}
                  </td>

                  <td className="py-3.5 px-3 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{log.ruleApplied}</div>
                    <div className="text-slate-500 dark:text-slate-400 line-clamp-1">{log.reason}</div>
                    {log.isOverride && (
                      <span className="inline-block text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold mt-1 border border-amber-200 dark:border-amber-800">
                        Manual Override
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.changedBy}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {log.approvedBy}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {log.effectiveFrom} → {log.effectiveTo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
