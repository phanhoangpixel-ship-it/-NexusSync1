import React, { useState, useMemo } from 'react';
import { CommissionCalculationRecord, CommissionPlan } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Tag,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sliders,
  Eye,
  Scale,
  Sparkles,
  Lock,
  Boxes,
  RotateCcw
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { CalculationBasisBadge, CommissionStatusBadge, AnomalyRiskBadge } from './M14Badges';

interface CalculationLedgerTabProps {
  calculations: CommissionCalculationRecord[];
  plans: CommissionPlan[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
  onOpenDispute: (calc: CommissionCalculationRecord) => void;
  onSelectCalculation?: (calc: CommissionCalculationRecord) => void;
}

export const CalculationLedgerTab: React.FC<CalculationLedgerTabProps> = ({
  calculations,
  plans,
  onRefresh,
  onNotify,
  setConfirmDialog,
  onOpenDispute,
  onSelectCalculation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [basisFilter, setBasisFilter] = useState<'ALL' | 'GROSS_MARGIN' | 'REVENUE'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Margin-based calculation modal state
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [calcOrderId, setCalcOrderId] = useState<string>('');
  const [calcSalesRepId, setCalcSalesRepId] = useState<number>(1);
  const [calcRevenue, setCalcRevenue] = useState<number>(500000000);
  const [calcCogs, setCalcCogs] = useState<number>(320000000);
  const [calcPlanId, setCalcPlanId] = useState<number | ''>('');
  const [calcNotes, setCalcNotes] = useState<string>('');

  // Computed Margin Preview
  const computedMargin = Math.max(0, calcRevenue - calcCogs);
  const computedMarginPercent = calcRevenue > 0 ? ((computedMargin / calcRevenue) * 100).toFixed(1) : '0';

  // Tab 2 KPI Metric Strip
  const metrics = useMemo(() => {
    const list = calculations || [];
    const totalCount = list.length;
    const grossMarginCount = list.filter((c) => c.calculationBasis === 'GROSS_MARGIN').length;
    const totalCommission = list.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
    const totalRevenue = list.reduce((acc, c) => acc + (c.revenueAmount || c.baseAmount || 0), 0);

    return { totalCount, grossMarginCount, totalCommission, totalRevenue };
  }, [calculations]);

  const filteredCalculations = useMemo(() => {
    return (calculations || []).filter((c) => {
      const matchSearch =
        (c.calculationCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.salesRepName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.salesOrderCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchBasis = basisFilter === 'ALL' || c.calculationBasis === basisFilter;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchBasis && matchStatus;
    });
  }, [calculations, searchQuery, basisFilter, statusFilter]);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    totalItems: filteredCalculations.length,
    syncWithUrl: false,
  });
  const paginatedItems = pagination.paginatedData(filteredCalculations);

  const handleExecuteMarginCalc = async () => {
    if (!calcSalesRepId || calcRevenue <= 0) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập nhân viên kinh doanh và doanh thu hợp lệ');
      return;
    }

    try {
      const payload = {
        salesOrderId: calcOrderId ? Number(calcOrderId) : undefined,
        salesPersonId: Number(calcSalesRepId),
        revenueAmount: Number(calcRevenue),
        cogsAmount: Number(calcCogs),
        planId: calcPlanId ? Number(calcPlanId) : undefined,
        notes: calcNotes || `Tính hoa hồng theo Biên Lợi Nhuận Gộp (${computedMarginPercent}%)`,
      };

      const res = await fetch('/api/commission/calculate/margin-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Tính toán thành công', data.message);
        setShowMarginModal(false);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi tính toán', data.error || 'Có lỗi xảy ra');
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
              Tổng Bút Toán Tính
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Sổ cái hoa hồng toàn hệ thống
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Margin M42 COGS
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.grossMarginCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Bút toán gắn kết giá vốn thực tế
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Doanh Thu Cơ Sở
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-blue-600 dark:text-blue-400 mt-1">
            {metrics.totalRevenue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Cơ sở doanh thu phát sinh
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Hoa Hồng Thực Tính
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-purple-600 dark:text-purple-400 mt-1">
            {metrics.totalCommission.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Trích trước TK 6418 / 3388
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Sổ Nhật Ký Tính Toán Hoa Hồng (Commission Ledger)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ghi nhận toàn bộ bút toán hoa hồng theo Doanh số (Revenue) & Lợi nhuận gộp (M42 Gross Margin)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMarginModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tính Hoa Hồng Theo Margin (M42 COGS)</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã bút toán, tên NVKD, mã đơn hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setBasisFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setBasisFilter('GROSS_MARGIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'GROSS_MARGIN'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Gross Margin M42
            </button>
            <button
              type="button"
              onClick={() => setBasisFilter('REVENUE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'REVENUE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              Doanh Thu
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ELIGIBLE">Đủ điều kiện (ELIGIBLE)</option>
              <option value="ACCRUED">Tích lũy (ACCRUED)</option>
              <option value="SETTLED">Đã quyết toán (SETTLED)</option>
              <option value="DISPUTED">Đang khiếu nại (DISPUTED)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredCalculations.length}</span> bút toán
          </div>
        </div>

        {/* Calculations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                <th className="py-3 px-3">Mã Bút Toán</th>
                <th className="py-3 px-3">Nhân Viên KD</th>
                <th className="py-3 px-3">Cơ Sở & Đơn Gốc</th>
                <th className="py-3 px-3 text-right">Doanh Số (VND)</th>
                <th className="py-3 px-3 text-right">Giá Vốn M42 (COGS)</th>
                <th className="py-3 px-3 text-right">Lợi Nhuận Gộp (Margin)</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Thưởng</th>
                <th className="py-3 px-3 text-right">Hoa Hồng Thực Tính</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    Không có bút toán hoa hồng nào khớp với điều kiện lọc
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c) => {
                  const isSettled = c.status === 'SETTLED';
                  const isAccrued = c.status === 'ACCRUED';
                  const isDisputed = c.status === 'DISPUTED';
                  const isClawback = Boolean(c.isClawback);

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                        isClawback
                          ? 'border-l-4 border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                          : isSettled
                          ? 'border-l-4 border-purple-600 bg-purple-50/20 dark:bg-purple-950/20'
                          : isDisputed
                          ? 'border-l-4 border-amber-600 bg-amber-50/20 dark:bg-amber-950/20'
                          : isAccrued
                          ? 'border-l-4 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                          : 'border-l-4 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 inline-block tabular-nums">
                          {c.calculationCode}
                        </span>
                        {c.isClawback && (
                          <div className="mt-1">
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                              Thu hồi RMA
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(c.calculatedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.salesRepName || `NVKD #${c.salesPersonId}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.planName || 'Chính sách mặc định'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <CalculationBasisBadge basis={c.calculationBasis} marginPercent={c.marginPercent} />
                        {c.salesOrderCode && (
                          <div className="font-mono text-[11px] text-blue-700 dark:text-blue-300 mt-1 tabular-nums">
                            SO: <span className="font-semibold">{c.salesOrderCode}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                        {(c.revenueAmount || c.baseAmount || 0).toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {c.cogsAmount > 0 ? `${c.cogsAmount.toLocaleString('vi-VN')} ₫` : '—'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {c.marginAmount > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {c.marginAmount.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                              ({c.marginPercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                            {c.ratePercent}%
                          </span>
                          {c.acceleratorMultiplier > 1 && (
                            <span className="text-[9px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700">
                              x{c.acceleratorMultiplier} Accel
                            </span>
                          )}
                          <AnomalyRiskBadge ratePercent={c.ratePercent} threshold={20} />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className={`font-bold text-sm ${c.commissionAmount >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {c.commissionAmount.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <CommissionStatusBadge status={c.status} />
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDispute(c)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Tạo khiếu nại điều chỉnh hoa hồng"
                          >
                            <Scale className="w-3 h-3" />
                            <span>Khiếu nại</span>
                          </button>

                          {onSelectCalculation && (
                            <button
                              onClick={() => onSelectCalculation(c)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 rounded-lg transition-colors border border-indigo-300 dark:border-indigo-800 cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-indigo-700 dark:text-indigo-400" />
                              <span>360°</span>
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

        {/* L4: Sticky Pagination Control */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl">
          <PaginationControl
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredCalculations.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Margin-Based Calculation Modal */}
      {showMarginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tính Hoa Hồng Theo Biên Lợi Nhuận Gộp (M42 COGS)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tích hợp trực tiếp dữ liệu Giá Vốn Hàng Bán M42 Landed Cost để tính hoa hồng chính xác
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Đơn Hàng (SO)</label>
                  <input
                    type="number"
                    value={calcOrderId}
                    onChange={(e) => setCalcOrderId(e.target.value)}
                    placeholder="VD: 101"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Nhân Viên KD *</label>
                  <input
                    type="number"
                    value={calcSalesRepId}
                    onChange={(e) => setCalcSalesRepId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Doanh Thu Đơn Hàng (VND) *</label>
                  <input
                    type="number"
                    value={calcRevenue}
                    onChange={(e) => setCalcRevenue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Vốn COGS M42 (VND)</label>
                  <input
                    type="number"
                    value={calcCogs}
                    onChange={(e) => setCalcCogs(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Live Margin Preview Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Lợi Nhuận Gộp Ước Tính:</span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    {computedMargin.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">Tỷ Suất Lợi Nhuận (Margin %):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {computedMarginPercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chọn Kế Hoạch Áp Dụng</label>
                <select
                  value={calcPlanId}
                  onChange={(e: any) => setCalcPlanId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="">-- Mặc định (Tự động chọn theo loại) --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.calculationBasis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú tính toán</label>
                <input
                  type="text"
                  value={calcNotes}
                  onChange={(e) => setCalcNotes(e.target.value)}
                  placeholder="VD: Tính hoa hồng hợp đồng thiết bị công nghiệp"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowMarginModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteMarginCalc}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Thực Thi Tính Bút Toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
