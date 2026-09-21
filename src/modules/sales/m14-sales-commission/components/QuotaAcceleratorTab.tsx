import React, { useState, useMemo } from 'react';
import { SalesQuotaRecord } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  Target,
  Zap,
  Plus,
  Search,
  TrendingUp,
  CheckCircle2,
  Award,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';

interface QuotaAcceleratorTabProps {
  quotas: SalesQuotaRecord[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const QuotaAcceleratorTab: React.FC<QuotaAcceleratorTabProps> = ({
  quotas,
  onRefresh,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<number>(1);
  const [period, setPeriod] = useState('2026-09');
  const [targetRevenue, setTargetRevenue] = useState<number>(1000000000);
  const [acceleratorMultiplier, setAcceleratorMultiplier] = useState<number>(1.25);
  const [notes, setNotes] = useState('Chỉ tiêu kinh doanh Quý 3/2026');

  // KPI Metrics
  const metrics = useMemo(() => {
    const list = quotas || [];
    const totalCount = list.length;
    const over100Count = list.filter((q) => q.attainmentPercent >= 100).length;
    const totalTarget = list.reduce((acc, q) => acc + (q.targetRevenue || 0), 0);
    const totalActual = list.reduce((acc, q) => acc + (q.actualRevenue || 0), 0);
    const avgAttainment = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0';

    return { totalCount, over100Count, totalTarget, totalActual, avgAttainment };
  }, [quotas]);

  const filteredQuotas = useMemo(() => {
    return (quotas || []).filter((q) => {
      const matchSearch =
        (q.quotaCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.salesRepName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.period || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotas, searchQuery, statusFilter]);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    totalItems: filteredQuotas.length,
    syncWithUrl: false,
  });
  const paginatedItems = pagination.paginatedData(filteredQuotas);

  const handleCreateQuota = async () => {
    if (!userId || !period || !targetRevenue) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ nhân viên, kỳ và chỉ tiêu doanh số');
      return;
    }

    try {
      const payload = {
        userId: Number(userId),
        period,
        targetRevenue: Number(targetRevenue),
        acceleratorMultiplier: Number(acceleratorMultiplier),
        notes,
      };

      const res = await fetch('/api/commission/quotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Thiết lập thành công', data.message);
        setShowCreateModal(false);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi thiết lập', data.error);
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
              Tổng Chỉ Tiêu Giao
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Kế hoạch kinh doanh theo tháng/quý
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Vượt Quota (&gt;100%)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.over100Count}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Kích hoạt hệ số Accelerator x1.2 - x1.5
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Doanh Số Kế Hoạch
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-blue-600 dark:text-blue-400 mt-1">
            {metrics.totalTarget.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Chỉ tiêu doanh số kỳ này
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tỷ Lệ Đạt Trung Bình
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
            {metrics.avgAttainment}%
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Tiến độ hoàn thành chỉ tiêu chung
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Chỉ Tiêu Doanh Số & Hệ Số Thưởng Gia Tốc (Quotas & Accelerators)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập Target doanh số theo tháng/quý và tự động nhân hệ số thưởng vượt chỉ tiêu (Accelerator Multiplier)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thiết Lập Chỉ Tiêu Mới</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã chỉ tiêu, tên nhân viên, kỳ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang kích hoạt (ACTIVE)</option>
              <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredQuotas.length}</span> chỉ tiêu
          </div>
        </div>

        {/* Quotas Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                <th className="py-3 px-3">Mã Chỉ Tiêu</th>
                <th className="py-3 px-3">Nhân Viên</th>
                <th className="py-3 px-3 text-center">Kỳ Áp Dụng</th>
                <th className="py-3 px-3 text-right">Chỉ Tiêu Doanh Thu</th>
                <th className="py-3 px-3 text-right">Thực Hiện (Actual)</th>
                <th className="py-3 px-3 text-center">Tiến Độ (% Target)</th>
                <th className="py-3 px-3 text-center">Hệ Số Thưởng Vượt</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    Chưa có dữ liệu chỉ tiêu doanh số
                  </td>
                </tr>
              ) : (
                paginatedItems.map((q) => {
                  const isOver100 = q.attainmentPercent >= 100;

                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                        isOver100
                          ? 'border-l-4 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-l-4 border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 inline-block tabular-nums">
                          {q.quotaCode}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {q.salesRepName || `NVKD ID: ${q.userId}`}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {q.period}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {q.targetRevenue.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300">
                        {q.actualRevenue.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                q.attainmentPercent >= 100
                                  ? 'bg-emerald-500'
                                  : q.attainmentPercent >= 75
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, q.attainmentPercent)}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono text-[11px] text-slate-800 dark:text-slate-200 tabular-nums">
                            {q.attainmentPercent}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md font-bold font-mono bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[11px]">
                          x{q.acceleratorMultiplier}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                          {q.status}
                        </span>
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
            totalItems={filteredQuotas.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Modal: Create Quota */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Thiết Lập Chỉ Tiêu Doanh Số (Sales Quota)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Giao chỉ tiêu kinh doanh và kích hoạt hệ số thưởng vượt mức
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhân viên (ID) *</label>
                  <input
                    type="number"
                    value={userId}
                    onChange={(e) => setUserId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kỳ áp dụng *</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="YYYY-MM"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chỉ tiêu doanh thu (VND) *</label>
                <input
                  type="number"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hệ số thưởng vượt Target (Multiplier)</label>
                <input
                  type="number"
                  step="0.05"
                  value={acceleratorMultiplier}
                  onChange={(e) => setAcceleratorMultiplier(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateQuota}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Lưu Chỉ Tiêu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
