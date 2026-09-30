import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import React, { useState, useMemo } from 'react';
import { CommissionPayoutBatch, CommissionPayoutItemRecord } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Search,
  Building2,
  FileCheck2,
  DollarSign,
  Send,
  Eye,
  X,
  Layers,
  ShieldCheck,
  Briefcase,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { PayoutStatusBadge } from './M14Badges';

interface PayoutPayrollTabProps {
  payouts: CommissionPayoutBatch[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const PayoutPayrollTab: React.FC<PayoutPayrollTabProps> = ({
  payouts,
  onRefresh,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [payoutPage, setPayoutPage] = useState<number>(1);
  const [payoutPageSize, setPayoutPageSize] = useState<number>(15);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<string[]>([]);

  // Create Payout Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchTitle, setBatchTitle] = useState('Quyết toán Hoa hồng Tháng 09/2026');
  const [batchPeriod, setBatchPeriod] = useState('2026-09');
  const [batchStartDate, setBatchStartDate] = useState('2026-09-01');
  const [batchEndDate, setBatchEndDate] = useState('2026-09-30');
  const [batchMethod, setBatchMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'PAYROLL_INTEGRATION'>('BANK_TRANSFER');
  const [batchNotes, setBatchNotes] = useState('Tổng hợp toàn bộ hoa hồng tích lũy và khấu trừ RMA trong kỳ');

  // Detail Modal
  const [selectedPayout, setSelectedPayout] = useState<CommissionPayoutBatch | null>(null);

  // Pay via Payroll Modal
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [targetPayoutForPayroll, setTargetPayoutForPayroll] = useState<CommissionPayoutBatch | null>(null);
  const [payrollPeriod, setPayrollPeriod] = useState('2026-09');

  // KPI Metrics
  const metrics = useMemo(() => {
    const list = payouts || [];
    const totalBatches = list.length;
    const totalPaid = list.filter((p) => p.status === 'PAID' || p.status === 'DISBURSED').reduce((acc, p) => acc + (p.totalNetAmount || 0), 0);
    const totalClawbacks = list.reduce((acc, p) => acc + (p.totalClawbackAmount || 0), 0);
    const totalBeneficiaries = list.reduce((acc, p) => acc + (p.totalBeneficiaries || 0), 0);

    return { totalBatches, totalPaid, totalClawbacks, totalBeneficiaries };
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    return (payouts || []).filter((p) => {
      const matchSearch =
        (p.payoutCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.period || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payouts, searchQuery, statusFilter]);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    totalItems: filteredPayouts.length,
    syncWithUrl: false,
  });
  const paginatedItems = pagination.paginatedData(filteredPayouts);

  const handleCreatePayoutBatch = async () => {
    if (!batchPeriod || !batchStartDate || !batchEndDate) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn kỳ và khoảng thời gian');
      return;
    }

    try {
      const payload = {
        title: batchTitle,
        period: batchPeriod,
        startDate: batchStartDate,
        endDate: batchEndDate,
        paymentMethod: batchMethod,
        notes: batchNotes,
      };

      const res = await fetch('/api/commission/payouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Tạo đợt quyết toán thành công', data.message);
        setShowCreateModal(false);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi tạo đợt', data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleApproveBatch = (batch: CommissionPayoutBatch) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Phê Duyệt Đợt Quyết Toán & Hạch Toán Kế Toán (M30 GL)',
      message: `Bạn có chắc muốn phê duyệt đợt ${batch.payoutCode} (${batch.totalNetAmount.toLocaleString('vi-VN')} VND)? Hệ thống sẽ tự động sinh bút toán trích trước chi phí hoa hồng: Nợ TK 6418 (Chi phí bán hàng) / Có TK 3388 (Phải trả khác).`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/commission/payouts/${batch.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Phê duyệt quyết toán hoa hồng và hạch toán M30 GL' }),
          });
          const data = await res.json();
          if (data.success) {
            onNotify('success', 'Phê duyệt thành công', data.message);
            onRefresh();
          } else {
            onNotify('danger', 'Lỗi phê duyệt', data.error);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      },
    });
  };

  const handleDisburseDirect = (batch: CommissionPayoutBatch) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Chi Trả Trực Tiếp (Bank Transfer / Cash)',
      message: `Xác nhận đã hoàn tất chi trả ${batch.totalNetAmount.toLocaleString('vi-VN')} VND cho đợt ${batch.payoutCode}? Hệ thống sẽ hạch toán xuất tiền: Nợ TK 3388 / Có TK 1121 (hoặc 1111).`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/commission/payouts/${batch.id}/disburse-direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bankReference: `FT-BANK-${Date.now()}` }),
          });
          const data = await res.json();
          if (data.success) {
            onNotify('success', 'Chi trả thành công', data.message);
            onRefresh();
          } else {
            onNotify('danger', 'Lỗi chi trả', data.error);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      },
    });
  };

  const handlePayViaPayroll = async () => {
    if (!targetPayoutForPayroll) return;

    try {
      const res = await fetch(`/api/commission/payouts/${targetPayoutForPayroll.id}/pay-via-payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollPeriod }),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Tích hợp Bảng lương thành công', data.message);
        setShowPayrollModal(false);
        setTargetPayoutForPayroll(null);
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi chi trả qua Bảng lương', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleViewDetail = async (payoutId: number) => {
    try {
      const res = await fetch(`/api/commission/payouts/${payoutId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPayout(data.data);
      } else {
        onNotify('danger', 'Lỗi tải chi tiết', data.error || 'Không thể tải chi tiết đợt quyết toán');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải chi tiết', err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* L2: 4-Card KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Đợt Quyết Toán
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalBatches}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Hạch toán & đối soát định kỳ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Đã Chi Trả (PAID)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.totalPaid.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Đã thanh toán ngân hàng & bảng lương
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Khấu Trừ RMA
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-xl text-rose-600 dark:text-rose-400 mt-1">
            {metrics.totalClawbacks.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Khấu trừ từ hoàn trả hàng M15
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lượt Nhân Viên Thụ Hưởng
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
            {metrics.totalBeneficiaries}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Đội ngũ kinh doanh & phân bổ quản lý
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Bảng Kê Quyết Toán & Chi Trả Lương (Payouts & M28 Payroll Integration)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Quy trình tổng hợp hoa hồng, đối soát khấu trừ RMA, hạch toán Sổ cái GL (Nợ 6418/Có 3388) và ủy quyền chi trả qua Bảng lương M28 HR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Đợt Quyết Toán Mới</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đợt, tiêu đề, kỳ quyết toán..."
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
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="APPROVED">Đã duyệt (APPROVED)</option>
              <option value="PAID">Đã chi trả (PAID)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPayouts.length}</span> đợt quyết toán
          </div>
        </div>

        {/* Payouts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                <th className="py-3 px-3">Mã Đợt</th>
                <th className="py-3 px-3">Tiêu Đề & Kỳ</th>
                <th className="py-3 px-3 text-center">Số Nhân Viên</th>
                <th className="py-3 px-3 text-right">Tổng Hoa Hồng Gốc</th>
                <th className="py-3 px-3 text-right">Khấu Trừ RMA</th>
                <th className="py-3 px-3 text-right">Thực Lĩnh (Net)</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3 text-center">Phương Thức</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    Không có đợt quyết toán hoa hồng nào
                  </td>
                </tr>
              ) : (
                paginatedItems.map((p) => {
                  const isPaid = p.status === 'PAID' || p.status === 'DISBURSED';
                  const isApproved = p.status === 'APPROVED';

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                        isPaid
                          ? 'border-l-4 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : isApproved
                          ? 'border-l-4 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                          : 'border-l-4 border-slate-400 bg-slate-50/20 dark:bg-slate-900/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 inline-block tabular-nums">
                          {p.payoutCode}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Kỳ: {p.period} ({new Date(p.startDate).toLocaleDateString('vi-VN')} — {new Date(p.endDate).toLocaleDateString('vi-VN')})
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.totalBeneficiaries} người
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {p.totalGrossAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                        {p.totalClawbackAmount > 0 ? `-${p.totalClawbackAmount.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                        {p.totalNetAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3 px-3 text-center">
                        <PayoutStatusBadge status={p.status} />
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                        {p.paymentMethod === 'PAYROLL_INTEGRATION'
                          ? 'Bảng lương M28'
                          : p.paymentMethod === 'BANK_TRANSFER'
                          ? 'Chuyển khoản'
                          : 'Tiền mặt'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(p.id)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                            title="Xem chi tiết từng nhân viên"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApproveBatch(p)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold"
                            >
                              Phê Duyệt
                            </button>
                          )}

                          {p.status === 'APPROVED' && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDisburseDirect(p)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold"
                              >
                                Chi Trực Tiếp
                              </button>
                              <button
                                onClick={() => {
                                  setTargetPayoutForPayroll(p);
                                  setShowPayrollModal(true);
                                }}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold"
                              >
                                Ủy Quyền M28
                              </button>
                            </div>
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

        {/* Standard Table Pagination */}
        <TablePagination
          currentPage={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={filteredPayouts.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[10, 15, 25, 50, 100]}
        />
      </div>

      {/* Modal: Create Payout Batch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tạo Đợt Quyết Toán Hoa Hồng Mới
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tự động tập hợp toàn bộ các bút toán hoa hồng hợp lệ (ELIGIBLE) và khấu trừ RMA trong kỳ
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề đợt quyết toán *
                </label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kỳ (YYYY-MM) *</label>
                  <input
                    type="text"
                    value={batchPeriod}
                    onChange={(e) => setBatchPeriod(e.target.value)}
                    placeholder="YYYY-MM"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Từ ngày *</label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đến ngày *</label>
                  <input
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phương thức chi trả dự kiến
                </label>
                <select
                  value={batchMethod}
                  onChange={(e: any) => setBatchMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng Trực tiếp (1121)</option>
                  <option value="PAYROLL_INTEGRATION">Ủy quyền tích hợp Bảng lương M28 HRM (3341)</option>
                  <option value="CASH">Tiền mặt thủ quỹ (1111)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú đợt quyết toán</label>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  rows={2}
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
                onClick={handleCreatePayoutBatch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Tập Hợp & Khởi Tạo Đợt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Chi Tiết Đợt Quyết Toán: {selectedPayout.payoutCode}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedPayout.title} (Kỳ: {selectedPayout.period})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Số nhân viên:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedPayout.totalBeneficiaries}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tổng hoa hồng:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedPayout.totalGrossAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Khấu trừ RMA:</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{selectedPayout.totalClawbackAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Thực lĩnh Net:</span>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{selectedPayout.totalNetAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Nhân Viên</th>
                      <th className="py-2.5 px-3">Phòng Ban</th>
                      <th className="py-2.5 px-3 text-right">Hoa Hồng Gốc</th>
                      <th className="py-2.5 px-3 text-right">Khấu Trừ RMA</th>
                      <th className="py-2.5 px-3 text-right">Thực Lĩnh</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {selectedPayout.items && selectedPayout.items.length > 0 ? (
                      selectedPayout.items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {it.salesRepName || `NVKD ID: ${it.salesPersonId}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{it.department || 'Khối Bán Hàng'}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                            {it.grossCommission.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                            {it.clawbackDeductions > 0 ? `-${it.clawbackDeductions.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                            {it.netPayoutAmount.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {it.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Không có danh sách nhân viên trong đợt này
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end">
              <button
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pay via Payroll */}
      {showPayrollModal && targetPayoutForPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ủy Quyền Chi Trả Qua Bảng Lương (M28 HRM)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đợt: <strong className="text-slate-800 dark:text-white">{targetPayoutForPayroll.payoutCode}</strong> | Số tiền: <strong className="text-purple-700 dark:text-purple-400 font-mono">{targetPayoutForPayroll.totalNetAmount.toLocaleString('vi-VN')} VND</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
                <p className="font-semibold mb-1">Cơ chế hạch toán tích hợp:</p>
                <p className="text-[11px] leading-relaxed">
                  Bút toán Sổ cái GL: <strong>Nợ TK 3388 (Phải trả khác) / Có TK 3341 (Phải trả người lao động)</strong>.
                  Khoản tiền hoa hồng sẽ được cộng dồn trực tiếp vào kỳ lương của nhân viên trên phân hệ M28 HR & Payroll.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kỳ lương áp dụng (Payroll Period) *
                </label>
                <input
                  type="text"
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  placeholder="YYYY-MM (VD: 2026-09)"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShowPayrollModal(false);
                  setTargetPayoutForPayroll(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePayViaPayroll}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Chuyển Vào Bảng Lương M28
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
