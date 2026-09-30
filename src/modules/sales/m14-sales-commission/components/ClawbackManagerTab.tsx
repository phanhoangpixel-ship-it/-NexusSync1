import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import React, { useState, useMemo } from 'react';
import { ClawbackItem } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  RotateCcw,
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  ArrowDownLeft,
  Info,
  DollarSign,
  Boxes,
  Clock,
  Filter
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { CommissionStatusBadge } from './M14Badges';

interface ClawbackManagerTabProps {
  clawbacks: ClawbackItem[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const ClawbackManagerTab: React.FC<ClawbackManagerTabProps> = ({
  clawbacks,
  onRefresh,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clawPage, setClawPage] = useState<number>(1);
  const [clawPageSize, setClawPageSize] = useState<number>(15);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [rmaId, setRmaId] = useState<string>('');
  const [rmaCode, setRmaCode] = useState<string>('RMA-2026-');
  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [returnAmount, setReturnAmount] = useState<number>(50000000);
  const [clawbackReason, setClawbackReason] = useState<string>('Khách hàng hoàn trả hàng lỗi kỹ thuật theo RMA');

  // KPI Metrics
  const metrics = useMemo(() => {
    const list = clawbacks || [];
    const totalCount = list.length;
    const settledCount = list.filter((c) => c.status === 'SETTLED').length;
    const pendingCount = list.filter((c) => c.status !== 'SETTLED').length;
    const totalClawbackAmount = list.reduce((acc, c) => acc + Math.abs(c.commissionAmount || 0), 0);

    return { totalCount, settledCount, pendingCount, totalClawbackAmount };
  }, [clawbacks]);

  const filteredClawbacks = useMemo(() => {
    return (clawbacks || []).filter((cb) => {
      const matchSearch =
        (cb.calculationCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cb.salesRepName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cb.rmaCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || cb.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clawbacks, searchQuery, statusFilter]);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    totalItems: filteredClawbacks.length,
    syncWithUrl: false,
  });
  const paginatedItems = pagination.paginatedData(filteredClawbacks);

  const handleGenerateClawback = async () => {
    if (!salesOrderId && !rmaId && !rmaCode) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập ID Đơn hàng hoặc Mã RMA');
      return;
    }

    try {
      const payload = {
        rmaId: rmaId ? Number(rmaId) : undefined,
        rmaCode: rmaCode || undefined,
        salesOrderId: salesOrderId ? Number(salesOrderId) : undefined,
        returnAmount: Number(returnAmount),
        reason: clawbackReason,
      };

      const res = await fetch('/api/commission/clawbacks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Thu hồi thành công', data.message);
        setShowGenerateModal(false);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi thu hồi', data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* L2: 4-Card KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Thu Hồi RMA
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Khấu trừ tự động từ M15 RMA
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Khấu Trừ Xong
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.settledCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Đã trừ vào bảng lương / quyết toán
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chờ Khấu Trừ Kỳ Này
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            {metrics.pendingCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Sẽ cấn trừ ở đợt quyết toán tới
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Giá Trị Khấu Trừ
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-rose-600 dark:text-rose-400 mt-1">
            {metrics.totalClawbackAmount.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Bảo toàn quỹ chi phí hoa hồng
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Động Cơ Thu Hồi Hoa Hồng (Clawback Engine — M14 ↔ M15 RMA)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động khấu trừ hoa hồng tương ứng khi khách hàng trả hàng hoặc phát sinh RMA hoàn tiền (Credit Note)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khấu Trừ Hoa Hồng Theo RMA</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã thu hồi, mã RMA, nhân viên kinh doanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ELIGIBLE">Sẵn sàng khấu trừ (ELIGIBLE)</option>
              <option value="SETTLED">Đã khấu trừ xong (SETTLED)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredClawbacks.length}</span> bản ghi
          </div>
        </div>

        {/* Clawbacks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                <th className="py-3 px-3">Mã Thu Hồi</th>
                <th className="py-3 px-3">Nhân Viên Bị Khấu Trừ</th>
                <th className="py-3 px-3">Mã RMA / Đơn Gốc</th>
                <th className="py-3 px-3 text-right">Giá Trị Trả Hàng (VND)</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Thu Hồi (%)</th>
                <th className="py-3 px-3 text-right">Số Tiền Khấu Trừ</th>
                <th className="py-3 px-3">Lý Do Hoàn Trả</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    Không có bút toán thu hồi hoa hồng nào trong hệ thống
                  </td>
                </tr>
              ) : (
                paginatedItems.map((cb) => {
                  const isSettled = cb.status === 'SETTLED';

                  return (
                    <tr
                      key={cb.id}
                      className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                        isSettled
                          ? 'border-l-4 border-slate-400 bg-slate-50/20 dark:bg-slate-900/20'
                          : 'border-l-4 border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 inline-block tabular-nums">
                          {cb.calculationCode}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {cb.salesRepName || `NVKD #${cb.salesPersonId}`}
                      </td>

                      <td className="py-3 px-3">
                        {cb.rmaCode ? (
                          <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 inline-block tabular-nums">
                            {cb.rmaCode}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            SO-{cb.salesOrderId || 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                        {cb.baseAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {cb.ratePercent}%
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {cb.commissionAmount.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[220px] truncate" title={cb.notes || ''}>
                        {cb.notes || 'Khấu trừ hoa hồng do RMA hoàn tiền'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <CommissionStatusBadge status={cb.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Pagination */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl">
          <PaginationControl
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredClawbacks.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Generate Clawback Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Khấu Trừ Thu Hồi Hoa Hồng (RMA Return Clawback)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Nhập mã phiếu RMA hoặc đơn hàng gốc để sinh bút toán khấu trừ hoa hồng tương ứng
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Phiếu RMA (M15)</label>
                  <input
                    type="text"
                    value={rmaCode}
                    onChange={(e) => setRmaCode(e.target.value)}
                    placeholder="VD: RMA-2026-0001"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Đơn Hàng (SO)</label>
                  <input
                    type="number"
                    value={salesOrderId}
                    onChange={(e) => setSalesOrderId(e.target.value)}
                    placeholder="VD: 101"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá trị hàng hoàn trả (VND) *</label>
                <input
                  type="number"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý do thu hồi / ghi chú</label>
                <textarea
                  value={clawbackReason}
                  onChange={(e) => setClawbackReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateClawback}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Tạo Bút Toán Khấu Trừ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
