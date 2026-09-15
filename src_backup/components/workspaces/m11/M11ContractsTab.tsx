import React, { useState, useMemo } from 'react';
import { FrameworkContractItem, SupplierItem, ContractExpiryAlert } from './m11Types';
import { SelectedEntityContext } from '../../../types';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  Building2,
  History,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface M11ContractsTabProps {
  contracts: FrameworkContractItem[];
  suppliers: SupplierItem[];
  onOpenNewContractModal: () => void;
  onOpenRenewModal: (contract: FrameworkContractItem) => void;
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M11ContractsTab: React.FC<M11ContractsTabProps> = ({
  contracts,
  suppliers,
  onOpenNewContractModal,
  onOpenRenewModal,
  onSelectEntity,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<FrameworkContractItem | null>(null);

  // Reference date: assume system clock / current date
  const now = new Date();

  // Compute remaining days and alerts
  const computedContracts = useMemo(() => {
    return contracts.map(contract => {
      const end = new Date(contract.endDate);
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let urgency: 'EXPIRED' | 'CRITICAL_30D' | 'WARNING_60D' | 'UPCOMING_90D' | 'SAFE' = 'SAFE';
      if (daysRemaining < 0 || contract.status === 'EXPIRED') {
        urgency = 'EXPIRED';
      } else if (daysRemaining <= 30) {
        urgency = 'CRITICAL_30D';
      } else if (daysRemaining <= 60) {
        urgency = 'WARNING_60D';
      } else if (daysRemaining <= 90) {
        urgency = 'UPCOMING_90D';
      }

      const committed = contract.committedValue || 1;
      const used = contract.usedValue || 0;
      const utilization = Math.min(Math.round((used / committed) * 100), 100);

      return {
        ...contract,
        daysRemaining,
        urgency,
        utilization
      };
    });
  }, [contracts]);

  // Expiry alerts summary
  const alerts = useMemo(() => {
    const expiredCount = computedContracts.filter(c => c.urgency === 'EXPIRED').length;
    const criticalCount = computedContracts.filter(c => c.urgency === 'CRITICAL_30D').length;
    const warningCount = computedContracts.filter(c => c.urgency === 'WARNING_60D').length;
    const totalCommitted = computedContracts.reduce((acc, c) => acc + (c.committedValue || 0), 0);
    const totalUsed = computedContracts.reduce((acc, c) => acc + (c.usedValue || 0), 0);
    const avgUtilization = totalCommitted > 0 ? Math.round((totalUsed / totalCommitted) * 100) : 0;

    return {
      expiredCount,
      criticalCount,
      warningCount,
      totalCommitted,
      totalUsed,
      avgUtilization
    };
  }, [computedContracts]);

  // Filtered list
  const filteredContracts = useMemo(() => {
    return computedContracts.filter(c => {
      const matchSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

      const matchUrgency =
        urgencyFilter === 'ALL' ||
        (urgencyFilter === 'EXPIRED' && c.urgency === 'EXPIRED') ||
        (urgencyFilter === 'CRITICAL_30D' && c.urgency === 'CRITICAL_30D') ||
        (urgencyFilter === 'WARNING_60D' && c.urgency === 'WARNING_60D') ||
        (urgencyFilter === 'EXPIRING_SOON' && (c.urgency === 'CRITICAL_30D' || c.urgency === 'WARNING_60D' || c.urgency === 'EXPIRED'));

      return matchSearch && matchStatus && matchUrgency;
    });
  }, [computedContracts, searchTerm, statusFilter, urgencyFilter]);

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Automated Renewal Alerts Banner */}
      {(alerts.expiredCount > 0 || alerts.criticalCount > 0 || alerts.warningCount > 0) && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-sm dark:border-amber-900/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Cảnh báo Tự động: Hợp đồng Khung sắp & đã hết hiệu lực (Automated Expiry Warnings)
                </h4>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                  Có <span className="font-bold text-rose-600 dark:text-rose-400">{alerts.expiredCount}</span> hợp đồng đã hết hạn,{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-400">{alerts.criticalCount}</span> hợp đồng còn dưới 30 ngày, và{' '}
                  <span className="font-bold text-amber-600 dark:text-amber-400">{alerts.warningCount}</span> hợp đồng cần rà soát đàm phán trong 60 ngày tới.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  setUrgencyFilter('EXPIRING_SOON');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-slate-800"
              >
                <Filter className="h-3.5 w-3.5" />
                Lọc HĐ cần gia hạn ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Contracts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hợp đồng Khung hiệu lực</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {computedContracts.filter(c => c.status === 'ACTIVE').length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ {contracts.length} tổng số</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Thỏa thuận BPA & Price Locks</p>
        </div>

        {/* Total Committed Budget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Ngân sách cam kết</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(alerts.totalCommitted)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            Đã giải ngân {formatCurrency(alerts.totalUsed)} ({alerts.avgUtilization}%)
          </p>
        </div>

        {/* Expiring ≤ 30 Days */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-xs dark:border-orange-900/40 dark:bg-orange-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-orange-800 dark:text-orange-300">Cảnh báo Hạn ≤ 30 Ngày</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {alerts.criticalCount}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400">HĐ cần gia hạn gấp</span>
          </div>
          <p className="mt-1 text-[11px] text-orange-700 dark:text-orange-400">Tự động báo cáo hội đồng SRM</p>
        </div>

        {/* Average Discount / Cost Saving */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chiết khấu Khung trung bình</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(contracts.reduce((acc, c) => acc + (c.discountRate || 0), 0) / (contracts.length || 1)).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">tiết kiệm chi phí mua sắm</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Đơn giá khóa trần bảo hộ lạm phát</p>
        </div>
      </div>

      {/* Action Bar & Search/Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã HĐ, tên nhà cung cấp, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="ACTIVE">ACTIVE (Đang hiệu lực)</option>
            <option value="PENDING_RENEWAL">PENDING_RENEWAL (Chờ gia hạn)</option>
            <option value="EXPIRED">EXPIRED (Đã hết hạn)</option>
            <option value="TERMINATED">TERMINATED (Đã chấm dứt)</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả Thời hạn</option>
            <option value="EXPIRING_SOON">Sắp & Đã hết hạn (Cảnh báo)</option>
            <option value="CRITICAL_30D">Khẩn cấp (≤ 30 ngày)</option>
            <option value="WARNING_60D">Cần chú ý (≤ 60 ngày)</option>
            <option value="EXPIRED">Đã quá hạn (Expired)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewContractModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ký kết Hợp đồng Khung (BPA)
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Mã & Loại Hợp đồng</th>
                <th className="px-4 py-3.5">Nhà Cung Cấp (M09)</th>
                <th className="px-4 py-3.5">Thời hạn & Cảnh báo</th>
                <th className="px-4 py-3.5">Ngân sách & Tiến độ</th>
                <th className="px-4 py-3.5">Cam kết SLA & Khóa giá</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy hợp đồng thỏa thuận khung phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const isExpiring = contract.urgency === 'CRITICAL_30D' || contract.urgency === 'WARNING_60D';
                  const isExpired = contract.urgency === 'EXPIRED';

                  return (
                    <tr
                      key={contract.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      {/* Contract ID & Title */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {contract.id}
                              </span>
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {contract.contractType === 'PRICE_LOCK' ? 'Price Lock' : contract.contractType === 'SERVICE_SLA' ? 'SLA' : 'BPA Framework'}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 max-w-[240px] text-xs font-medium text-slate-600 dark:text-slate-300">
                              {contract.title}
                            </p>
                            {contract.renewalHistory && contract.renewalHistory.length > 0 && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                <History className="h-3 w-3" />
                                Đã gia hạn {contract.renewalHistory.length} lần
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Supplier Info */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              if (contract.supplierId) {
                                onSelectEntity({ type: 'supplier', id: contract.supplierId });
                              }
                            }}
                            className="flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            {contract.supplier}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Mã: {contract.supplierCode || `SUP-${String(contract.supplierId || 1).padStart(3, '0')}`}</span>
                            <span>•</span>
                            <span>{contract.paymentTerms || 'NET30'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Period & Expiry Alert */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{contract.startDate} → <span className="font-semibold">{contract.endDate}</span></span>
                          </div>
                          {isExpired ? (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Đã hết hạn hiệu lực
                            </div>
                          ) : isExpiring ? (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3.5 w-3.5 animate-pulse" />
                              Còn {contract.daysRemaining} ngày (Cần gia hạn)
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Còn {contract.daysRemaining} ngày
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Budget & Utilization */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1.5 min-w-[160px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(contract.usedValue)}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              / {formatCurrency(contract.committedValue)}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                contract.utilization > 90
                                  ? 'bg-rose-500'
                                  : contract.utilization > 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${contract.utilization}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Giải ngân: {contract.utilization}%</span>
                            {contract.discountRate ? (
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                Giảm {contract.discountRate}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* SLA Targets & Price Locks */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              OTIF ≥ {contract.slaTargetOtif || 95}%
                            </span>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              IQC ≥ {contract.slaTargetQuality || 98}%
                            </span>
                          </div>
                          {contract.priceLocks && contract.priceLocks.length > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Lock className="h-3 w-3 text-slate-400" />
                              Khóa giá {contract.priceLocks.length} SKU nguyên liệu
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            contract.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : contract.status === 'PENDING_RENEWAL'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : contract.status === 'EXPIRED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {contract.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Renew Button */}
                          <button
                            onClick={() => onOpenRenewModal(contract)}
                            title="Gia hạn hợp đồng khung"
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Gia hạn
                          </button>

                          {/* Detail Button */}
                          <button
                            onClick={() => setSelectedContractForDetail(contract)}
                            title="Xem chi tiết & bảng khóa giá"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
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

      {/* Contract Detail Drawer / Modal */}
      {selectedContractForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chi tiết Hợp đồng Khung: {selectedContractForDetail.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đối tác: {selectedContractForDetail.supplier}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContractForDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Tiêu đề:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContractForDetail.title}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Thời hạn:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedContractForDetail.startDate} → {selectedContractForDetail.endDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Ngân sách cam kết:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedContractForDetail.committedValue)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Đã giải ngân:</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedContractForDetail.usedValue)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Chiết khấu thương mại:</span>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">
                    {selectedContractForDetail.discountRate || 0}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Điều khoản thanh toán:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedContractForDetail.paymentTerms || 'NET30'}
                  </p>
                </div>
              </div>

              {/* Price Locks Table */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Danh mục đơn giá khóa trần (Price Locks)
                </h4>
                {selectedContractForDetail.priceLocks && selectedContractForDetail.priceLocks.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Mã SKU</th>
                          <th className="px-3 py-2">Tên Mặt hàng / Vật tư</th>
                          <th className="px-3 py-2">ĐVT</th>
                          <th className="px-3 py-2 text-right">Đơn giá khóa trần</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedContractForDetail.priceLocks.map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">{p.itemCode}</td>
                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{p.itemName}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{p.unit}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(p.lockedPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Không có danh mục khóa giá riêng lẻ; áp dụng bảng giá niêm yết có chiết khấu.</p>
                )}
              </div>

              {/* Renewal History */}
              {selectedContractForDetail.renewalHistory && selectedContractForDetail.renewalHistory.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-emerald-500" />
                    Lịch sử các lần gia hạn hợp đồng
                  </h4>
                  <div className="space-y-2">
                    {selectedContractForDetail.renewalHistory.map((rh, idx) => (
                      <div key={idx} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            Gia hạn ngày: {rh.renewalDate}
                          </span>
                          <span className="text-[11px] text-slate-500">Người phê duyệt: {rh.renewedBy}</span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">
                          Thời hạn mới: <span className="font-medium text-slate-800 dark:text-slate-200">{rh.newEndDate}</span> (trước đó: {rh.previousEndDate})
                        </p>
                        {rh.notes && <p className="mt-0.5 text-slate-500 italic">{rh.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContractForDetail.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú & Thỏa thuận:</span>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{selectedContractForDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                onClick={() => setSelectedContractForDetail(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const contract = selectedContractForDetail;
                  setSelectedContractForDetail(null);
                  onOpenRenewModal(contract);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Gia hạn Hợp đồng này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
