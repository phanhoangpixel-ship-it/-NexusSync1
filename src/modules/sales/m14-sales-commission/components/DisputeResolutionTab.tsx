import React, { useState, useMemo } from 'react';
import { CommissionDisputeRecord, CommissionCalculationRecord } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ShieldCheck,
  Scale,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { DisputeStatusBadge } from './M14Badges';

interface DisputeResolutionTabProps {
  disputes: CommissionDisputeRecord[];
  calculations: CommissionCalculationRecord[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
  activeDisputeModalCalc?: CommissionCalculationRecord | null;
  onCloseDisputeModal?: () => void;
}

export const DisputeResolutionTab: React.FC<DisputeResolutionTabProps> = ({
  disputes,
  calculations,
  onRefresh,
  onNotify,
  setConfirmDialog,
  activeDisputeModalCalc,
  onCloseDisputeModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Dispute modal
  const [showSubmitModal, setShowSubmitModal] = useState(!!activeDisputeModalCalc);
  const [calcId, setCalcId] = useState<number | ''>(activeDisputeModalCalc?.id || '');
  const [salesPersonId, setSalesPersonId] = useState<number>(activeDisputeModalCalc?.salesPersonId || 1);
  const [disputedAmount, setDisputedAmount] = useState<number>(activeDisputeModalCalc?.commissionAmount || 0);
  const [expectedAmount, setExpectedAmount] = useState<number>(activeDisputeModalCalc ? activeDisputeModalCalc.commissionAmount * 1.2 : 0);
  const [disputeReason, setDisputeReason] = useState<string>('Biên lợi nhuận gộp tính theo giá vốn cũ, chưa cập nhật lô chi phí M42 mới');

  // Resolve Modal
  const [selectedDispute, setSelectedDispute] = useState<CommissionDisputeRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED_ADJUSTED' | 'RESOLVED_REJECTED'>('RESOLVED_ADJUSTED');
  const [resolutionNotes, setResolutionNotes] = useState<string>('Đã kiểm tra lại giá vốn M42 và chấp thuận điều chỉnh hoa hồng bổ sung');
  const [adjustedAmount, setAdjustedAmount] = useState<number>(0);

  // KPI Metrics
  const metrics = useMemo(() => {
    const list = disputes || [];
    const totalCount = list.length;
    const openCount = list.filter((d) => d.status === 'OPEN').length;
    const adjustedCount = list.filter((d) => d.status === 'RESOLVED_ADJUSTED').length;
    const rejectedCount = list.filter((d) => d.status === 'RESOLVED_REJECTED').length;

    return { totalCount, openCount, adjustedCount, rejectedCount };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return (disputes || []).filter((d) => {
      const matchSearch =
        (d.disputeCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.salesRepName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [disputes, searchQuery, statusFilter]);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    totalItems: filteredDisputes.length,
    syncWithUrl: false,
  });
  const paginatedItems = pagination.paginatedData(filteredDisputes);

  const handleSubmitDispute = async () => {
    if (!disputedAmount || !expectedAmount || !disputeReason.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ số tiền và lý do khiếu nại');
      return;
    }

    try {
      const payload = {
        calculationId: calcId ? Number(calcId) : undefined,
        salesPersonId: Number(salesPersonId),
        disputedAmount: Number(disputedAmount),
        expectedAmount: Number(expectedAmount),
        reason: disputeReason.trim(),
      };

      const res = await fetch('/api/commission/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Đã gửi khiếu nại', data.message);
        setShowSubmitModal(false);
        if (onCloseDisputeModal) onCloseDisputeModal();
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi gửi khiếu nại', data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;

    try {
      const payload = {
        resolution: resolutionAction,
        resolutionStatus: resolutionAction,
        resolutionNotes,
        adjustedAmount: resolutionAction === 'RESOLVED_ADJUSTED' ? Number(adjustedAmount) : 0,
      };

      const res = await fetch(`/api/commission/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Xử lý khiếu nại thành công', data.message);
        setSelectedDispute(null);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi xử lý', data.error || 'Có lỗi xảy ra');
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
              Tổng Khiếu Nại Hoa Hồng
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Quy trình điều chỉnh & bù trừ minh bạch
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đang Chờ Quản Lý Xử Lý
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            {metrics.openCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Cần rà soát lại cơ sở Margin/Quota
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Duyệt Điều Chỉnh
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.adjustedCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Tự động sinh bút toán bù trừ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Bác Bỏ
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400 mt-1">
            {metrics.rejectedCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Duy trì theo số liệu gốc
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Quy Trình Xử Lý Khiếu Nại & Điều Chỉnh (Dispute Engine)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tiếp nhận khiếu nại hoa hồng từ NVKD và tự động sinh bản ghi bù trừ khi được Quản lý phê duyệt
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gửi Khiếu Nại Mới</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã khiếu nại, NVKD, lý do..."
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
              <option value="OPEN">Chờ xử lý (OPEN)</option>
              <option value="RESOLVED_ADJUSTED">Đã điều chỉnh (RESOLVED_ADJUSTED)</option>
              <option value="RESOLVED_REJECTED">Đã bác bỏ (RESOLVED_REJECTED)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredDisputes.length}</span> khiếu nại
          </div>
        </div>

        {/* Disputes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                <th className="py-3 px-3">Mã Khiếu Nại</th>
                <th className="py-3 px-3">Nhân Viên Khiếu Nại</th>
                <th className="py-3 px-3 text-right">Số Tiền Đã Tính</th>
                <th className="py-3 px-3 text-right">Số Tiền Đề Xuất</th>
                <th className="py-3 px-3">Lý Do Chi Tiết</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    Không có khiếu nại hoa hồng nào trong hệ thống
                  </td>
                </tr>
              ) : (
                paginatedItems.map((d) => {
                  const isOpen = d.status === 'OPEN';
                  const isAdjusted = d.status === 'RESOLVED_ADJUSTED';

                  return (
                    <tr
                      key={d.id}
                      className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                        isOpen
                          ? 'border-l-4 border-amber-600 bg-amber-50/20 dark:bg-amber-950/20'
                          : isAdjusted
                          ? 'border-l-4 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-l-4 border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 inline-block tabular-nums">
                          {d.disputeCode}
                        </span>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {d.salesRepName || `NVKD #${d.salesPersonId}`}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {d.disputedAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                        {d.expectedAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[240px] truncate" title={d.reason}>
                        {d.reason}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <DisputeStatusBadge status={d.status} />
                      </td>

                      <td className="py-3 px-3 text-right">
                        {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setAdjustedAmount(d.expectedAmount - d.disputedAmount);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>Xử Lý / Phê Duyệt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 italic">
                            Đã hoàn tất
                          </span>
                        )}
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
            totalItems={filteredDisputes.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Modal: Submit Dispute */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gửi Khiếu Nại & Điều Chỉnh Hoa Hồng
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đề xuất điều chỉnh số tiền hoa hồng do thay đổi giá vốn COGS hoặc điều chỉnh hợp đồng
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Bút Toán (Nếu có)</label>
                  <input
                    type="number"
                    value={calcId}
                    onChange={(e) => setCalcId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Nhân Viên KD *</label>
                  <input
                    type="number"
                    value={salesPersonId}
                    onChange={(e) => setSalesPersonId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số tiền đã tính (VND) *</label>
                  <input
                    type="number"
                    value={disputedAmount}
                    onChange={(e) => setDisputedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số tiền kỳ vọng / đề xuất *</label>
                  <input
                    type="number"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý do khiếu nại chi tiết *</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  if (onCloseDisputeModal) onCloseDisputeModal();
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitDispute}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Gửi Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Phê Duyệt Xử Lý Khiếu Nại: {selectedDispute.disputeCode}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Thẩm định lý do và tự động tạo bút toán bù trừ nếu chấp thuận
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">NVKD khiếu nại:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDispute.salesRepName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền hiện tại:</span>
                  <span className="font-mono">{selectedDispute.disputedAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Đề xuất điều chỉnh:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedDispute.expectedAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="pt-1 text-slate-600 dark:text-slate-400 italic">
                  "{selectedDispute.reason}"
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quyết định xử lý *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction('RESOLVED_ADJUSTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      resolutionAction === 'RESOLVED_ADJUSTED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Chấp Thuận & Bù Trừ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('RESOLVED_REJECTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      resolutionAction === 'RESOLVED_REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Bác Bỏ Khiếu Nại</span>
                  </button>
                </div>
              </div>

              {resolutionAction === 'RESOLVED_ADJUSTED' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số tiền bù trừ bổ sung (VND)
                  </label>
                  <input
                    type="number"
                    value={adjustedAmount}
                    onChange={(e) => setAdjustedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú giải quyết</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResolveDispute}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Xác Nhận Xử Lý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
