import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Search, Filter, RefreshCw, 
  FileSpreadsheet, ArrowUpRight, Check, X, ShieldCheck, DollarSign,
  TrendingDown, TrendingUp, Layers, HelpCircle, FileText, Send,
  ArrowLeftRight, Truck, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';

export interface TransferDiscrepancyRecord {
  id: string;
  transferCode: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  sourceWarehouse: string;
  destWarehouse: string;
  shippedQty: number;
  receivedQty: number;
  varianceQty: number;
  unitCost: number;
  varianceAmount: number;
  rootCause: 'IN_TRANSIT_DAMAGE' | 'PILFERAGE_LOSS' | 'MISCOUNT_DISPATCH' | 'CARRIER_MISPLACEMENT' | 'UNRESOLVED';
  carrierClaimStatus: 'NOT_FILED' | 'CLAIM_PENDING' | 'CLAIM_APPROVED' | 'CLAIM_REJECTED';
  isExceedTolerance: boolean;
  status: 'PENDING_INVESTIGATION' | 'PROPOSED_M20' | 'SETTLED' | 'REJECTED';
  investigator: string;
  notes: string;
}

interface TransferDiscrepancyReconciliationTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const TransferDiscrepancyReconciliationTab: React.FC<TransferDiscrepancyReconciliationTabProps> = ({
  onNotify
}) => {
  const [discrepancies, setDiscrepancies] = useState<TransferDiscrepancyRecord[]>([
    {
      id: 'DISC-001',
      transferCode: 'TRF-HN-HCM-2026-08FIN',
      sku: 'SKU-ENG-088',
      productName: 'Động cơ servo AC 750W Delta',
      category: 'Động cơ & Biến tần',
      uom: 'Bộ',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      destWarehouse: 'Kho Chi nhánh Nam',
      shippedQty: 20,
      receivedQty: 18,
      varianceQty: -2,
      unitCost: 2850000,
      varianceAmount: -5700000,
      rootCause: 'IN_TRANSIT_DAMAGE',
      carrierClaimStatus: 'CLAIM_PENDING',
      isExceedTolerance: true,
      status: 'PENDING_INVESTIGATION',
      investigator: 'Lê Hoàng Sơn (Trưởng kho)',
      notes: 'Hàng bị va đập móp vỏ trong quá trình xe qua đèo Hải Vân. Đã lập biên bản 3 bên với tài xế.'
    },
    {
      id: 'DISC-002',
      transferCode: 'TRF-HN-DN-2026-09B',
      sku: 'SKU-VAL-012',
      productName: 'Van điện từ khí nén 24V SMC',
      category: 'Khí nén',
      uom: 'Cái',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      destWarehouse: 'Kho Đà Nẵng',
      shippedQty: 20,
      receivedQty: 22,
      varianceQty: 2,
      unitCost: 2300000,
      varianceAmount: 4600000,
      rootCause: 'MISCOUNT_DISPATCH',
      carrierClaimStatus: 'NOT_FILED',
      isExceedTolerance: true,
      status: 'PROPOSED_M20',
      investigator: 'Phạm Đức Anh (Kế toán)',
      notes: 'Thủ kho xuất đếm dư 1 hộp 2 chiếc. Kho nhận đã nhập kho và đề xuất bút toán tăng tồn M20.'
    },
    {
      id: 'DISC-003',
      transferCode: 'TRF-CNC-HN-2026-09C',
      sku: 'SKU-CUT-001',
      productName: 'Dao phay ngón hợp kim 4 me Carbide',
      category: 'Cơ khí chính xác',
      uom: 'Cái',
      sourceWarehouse: 'Kho CNC',
      destWarehouse: 'Kho Tổng Hà Nội',
      shippedQty: 20,
      receivedQty: 19,
      varianceQty: -1,
      unitCost: 850000,
      varianceAmount: -850000,
      rootCause: 'CARRIER_MISPLACEMENT',
      carrierClaimStatus: 'NOT_FILED',
      isExceedTolerance: false,
      status: 'SETTLED',
      investigator: 'Đặng Quốc Huy (KTV)',
      notes: 'Thất lạc 1 dao phay trong thùng xốp. Đã tìm lại được sau khi kiểm tra lại cốp xe nội bộ.'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [rootCauseFilter, setRootCauseFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirm Dialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter Logic
  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter(d => {
      const matchSearch = 
        d.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.investigator.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRootCause = rootCauseFilter === 'ALL' || d.rootCause === rootCauseFilter;
      const matchSeverity = severityFilter === 'ALL' || 
        (severityFilter === 'EXCEED_TOLERANCE' && d.isExceedTolerance) ||
        (severityFilter === 'NEGATIVE_LOSS' && d.varianceQty < 0) ||
        (severityFilter === 'POSITIVE_SURPLUS' && d.varianceQty > 0);
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;

      return matchSearch && matchRootCause && matchSeverity && matchStatus;
    });
  }, [discrepancies, searchQuery, rootCauseFilter, severityFilter, statusFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredDiscrepancies.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedDiscrepancies = useMemo(() => {
    return pagination.paginatedData(filteredDiscrepancies);
  }, [filteredDiscrepancies, pagination]);

  // KPI Metrics Calculation
  const totalNetDiscrepancyAmount = discrepancies.reduce((acc, curr) => acc + curr.varianceAmount, 0);
  const exceedToleranceCount = discrepancies.filter(d => d.isExceedTolerance).length;
  const totalLossAmount = Math.abs(
    discrepancies.filter(d => d.varianceAmount < 0).reduce((acc, curr) => acc + curr.varianceAmount, 0)
  );
  const totalSurplusAmount = discrepancies
    .filter(d => d.varianceAmount > 0)
    .reduce((acc, curr) => acc + curr.varianceAmount, 0);

  // Handler: Propose M20 Adjustment (Rule #19)
  const handleProposeM20 = (record: TransferDiscrepancyRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: `Đề Xuất Bút Toán Điều Chỉnh M20 Cho SKU ${record.sku}?`,
      message: `Hệ thống sẽ tạo phiếu đề xuất điều chỉnh kho M20 với số lượng ${record.varianceQty > 0 ? `+${record.varianceQty}` : record.varianceQty} ${record.uom} (Giá trị: ${Math.abs(record.varianceAmount).toLocaleString('vi-VN')} ₫) do nguyên nhân "${record.rootCause}". Bút toán dự kiến: ${record.varianceQty < 0 ? 'Nợ 1388 / Có 157' : 'Nợ 1561 / Có 3381'}.`,
      confirmText: 'Tạo Đề Xuất M20',
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        setDiscrepancies(prev => prev.map(d => d.id === record.id ? { ...d, status: 'PROPOSED_M20' } : d));
        setConfirmDialog(null);
        onNotify('success', 'Đã Đề Xuất M20', `Đã chuyển tiếp hồ sơ xử lý chênh lệch sang Module M20 Stock Adjustment.`);
      }
    });
  };

  // Handler: File Insurance Claim (Rule #19)
  const handleFileClaim = (record: TransferDiscrepancyRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: `Lập Hồ Sơ Bồi Thường Đơn Vị Vận Tải Cho Lệnh ${record.transferCode}?`,
      message: `Xác nhận lập hồ sơ khiếu nại bồi thường thiệt hại giá trị ${Math.abs(record.varianceAmount).toLocaleString('vi-VN')} ₫ đối với đơn vị vận tải do làm hỏng hóc ${Math.abs(record.varianceQty)} ${record.uom} SKU ${record.sku}.`,
      confirmText: 'Lập Hồ Sơ Khiếu Nại',
      cancelText: 'Hủy Bỏ',
      variant: 'warning',
      onConfirm: () => {
        setDiscrepancies(prev => prev.map(d => d.id === record.id ? { ...d, carrierClaimStatus: 'CLAIM_PENDING' } : d));
        setConfirmDialog(null);
        onNotify('info', 'Đã Gửi Hồ Sơ Khiếu Nại', `Hồ sơ bồi thường cho lệnh ${record.transferCode} đã được gửi tới đơn vị vận tải.`);
      }
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredDiscrepancies.map((d, idx) => ({
        'STT': idx + 1,
        'Mã Lệnh': d.transferCode,
        'Mã SKU': d.sku,
        'Tên Sản Phẩm': d.productName,
        'Ngành Hàng': d.category,
        'ĐVT': d.uom,
        'Kho Xuất': d.sourceWarehouse,
        'Kho Nhận': d.destWarehouse,
        'SL Xuất': d.shippedQty,
        'SL Nhận': d.receivedQty,
        'SL Chênh Lệch': d.varianceQty,
        'Đơn Giá (VND)': d.unitCost,
        'Giá Trị Chênh Lệch (VND)': d.varianceAmount,
        'Nguyên Nhân': d.rootCause,
        'Trạng Thái Khiếu Nại': d.carrierClaimStatus,
        'Vượt Dung Sai': d.isExceedTolerance ? 'CÓ' : 'KHÔNG',
        'Trạng Thái Xử Lý': d.status,
        'Cán Bộ Phụ Trách': d.investigator,
        'Ghi Chú': d.notes
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Doi_Soat_Chenh_Lech_M21');
      XLSX.writeFile(wb, `NexusSync_M21_Discrepancies_${new Date().toISOString().slice(0, 10)}.xlsx`);

      onNotify('success', 'Xuất File Thành Công', 'Báo cáo đối soát chênh lệch đã được tải về.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể tạo file Excel.');
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & FILTER STRIP                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã lệnh, SKU, tên sản phẩm, cán bộ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả mức độ</option>
            <option value="EXCEED_TOLERANCE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Vượt ngưỡng dung sai</option>
            <option value="NEGATIVE_LOSS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Thất thoát / Hỏng hóc (Lệch âm)</option>
            <option value="POSITIVE_SURPLUS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Dôi dư hàng hóa (Lệch dương)</option>
          </select>

          {/* Root Cause Filter */}
          <select
            value={rootCauseFilter}
            onChange={(e) => setRootCauseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả nguyên nhân</option>
            <option value="IN_TRANSIT_DAMAGE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Hư hỏng trong vận chuyển</option>
            <option value="PILFERAGE_LOSS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Mất mát / Rách vỡ kiện</option>
            <option value="MISCOUNT_DISPATCH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Lỗi đếm tại kho xuất</option>
            <option value="CARRIER_MISPLACEMENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Thất lạc phương tiện</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả trạng thái xử lý</option>
            <option value="PENDING_INVESTIGATION" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Chờ điều tra</option>
            <option value="PROPOSED_M20" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đã đề xuất M20</option>
            <option value="SETTLED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đã giải quyết xong</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSearchQuery('');
              setRootCauseFilter('ALL');
              setSeverityFilter('ALL');
              setStatusFilter('ALL');
              onNotify('info', 'Làm Mới', 'Đã đặt lại toàn bộ bộ lọc đối soát.');
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI STRIP (4 METRIC CARDS)                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Tổng Giá Trị Lệch Net */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Giá Trị Lệch Ròng (Net)
            </span>
            <div className={`mt-1 text-2xl font-mono tabular-nums font-bold ${
              totalNetDiscrepancyAmount < 0 ? 'text-rose-600 dark:text-rose-400' :
              totalNetDiscrepancyAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' :
              'text-slate-900 dark:text-white'
            }`}>
              {totalNetDiscrepancyAmount > 0 ? `+${totalNetDiscrepancyAmount.toLocaleString('vi-VN')}` : totalNetDiscrepancyAmount.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Net = Dôi Dư - Thất Thoát
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Lệch Vượt Dung Sai */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dòng Lệch Vượt Dung Sai
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
              {exceedToleranceCount} <span className="text-xs font-sans font-normal text-slate-500">dòng</span>
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
              Bắt buộc lập biên bản giải trình
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Thất Thoát / Hỏng Hóc (Ghi Giảm TK 1388/632) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thất Thoát Chờ Bồi Thường (TK 1388)
            </span>
            <div className="mt-1 text-xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
              {totalLossAmount.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>Yêu cầu nhà xe bồi hoàn</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Dôi Dư Cần Ghi Nhận (TK 3381) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dôi Dư Chờ Nhập Tồn (TK 3381)
            </span>
            <div className="mt-1 text-xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              +{totalSurplusAmount.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Nhập kho tăng tài sản</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID & RECONCILIATION TABLE                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedDiscrepancies.length === 0}
          emptyMessage="Không có dòng chênh lệch nào cần xử lý."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã Lệnh / SKU</th>
                  <th className="p-3">Tuyến Kho (Xuất ➔ Nhận)</th>
                  <th className="p-3 text-right">SL Xuất</th>
                  <th className="p-3 text-right">SL Nhận</th>
                  <th className="p-3 text-right">Chênh Lệch</th>
                  <th className="p-3 text-right">Giá Trị Chênh Lệch</th>
                  <th className="p-3">Nguyên Nhân Gốc Rễ</th>
                  <th className="p-3 text-center">Trạng Thái Xử Lý</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedDiscrepancies.map((record, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        record.isExceedTolerance ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
                        record.varianceQty < 0 ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10' :
                        'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                      }`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* Mã Lệnh / SKU */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {record.transferCode}
                        </div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5">
                          {record.productName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          SKU: <span className="font-bold text-slate-700 dark:text-slate-300">{record.sku}</span>
                        </div>
                      </td>

                      {/* Tuyến Kho */}
                      <td className="p-3 text-xs">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {record.sourceWarehouse}
                        </div>
                        <div className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          ➔ {record.destWarehouse}
                        </div>
                      </td>

                      {/* SL Xuất */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        {record.shippedQty} {record.uom}
                      </td>

                      {/* SL Nhận */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        {record.receivedQty} {record.uom}
                      </td>

                      {/* Chênh Lệch Qty */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs">
                        <span className={record.varianceQty < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {record.varianceQty > 0 ? `+${record.varianceQty}` : record.varianceQty} {record.uom}
                        </span>
                      </td>

                      {/* Giá Trị Chênh Lệch (VND) */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs">
                        <span className={record.varianceAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {record.varianceAmount > 0 ? `+${record.varianceAmount.toLocaleString('vi-VN')}` : record.varianceAmount.toLocaleString('vi-VN')} ₫
                        </span>
                        {record.isExceedTolerance && (
                          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                            Vượt dung sai
                          </div>
                        )}
                      </td>

                      {/* Nguyên Nhân */}
                      <td className="p-3">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {record.rootCause === 'IN_TRANSIT_DAMAGE' ? 'Vỡ hỏng vận chuyển' :
                           record.rootCause === 'MISCOUNT_DISPATCH' ? 'Đếm sai khi xuất' :
                           record.rootCause === 'CARRIER_MISPLACEMENT' ? 'Thất lạc trên xe' : 'Chưa rõ nguyên nhân'}
                        </span>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {record.notes}
                        </div>
                      </td>

                      {/* Trạng Thái Xử Lý */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full border font-bold inline-flex items-center gap-1 ${
                          record.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200' :
                          record.status === 'PROPOSED_M20' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200' :
                          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200'
                        }`}>
                          {record.status === 'SETTLED' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {record.status === 'PROPOSED_M20' && <FileText className="w-3 h-3 text-blue-700" />}
                          {record.status === 'PENDING_INVESTIGATION' && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                          <span>{record.status}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {record.status === 'PENDING_INVESTIGATION' && (
                            <button
                              onClick={() => handleProposeM20(record)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Đề xuất bút toán điều chỉnh M20"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Đề Xuất M20</span>
                            </button>
                          )}

                          {record.varianceAmount < 0 && record.carrierClaimStatus === 'NOT_FILED' && (
                            <button
                              onClick={() => handleFileClaim(record)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Lập hồ sơ đòi bồi thường nhà xe"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Khiếu Nại Xe</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </L3ContentState>

        {/* L4: STICKY FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredDiscrepancies.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 COMPLIANCE)                                      */}
      {/* ========================================================================= */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
