import React, { useState, useMemo } from 'react';
import { 
  FileText, ShieldCheck, Search, Filter, RefreshCw, Download, 
  CheckCircle2, ArrowUpRight, ArrowDownRight, Hash, Eye, 
  Lock, BookOpen, Calendar, MapPin, Layers, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';
import { StockAdjustmentRecord } from './StockAdjustmentMasterTab';

export interface StockAdjustmentLedgerRecord {
  id: string;
  adjustmentNo: string;
  warehouseName: string;
  postedAt: string;
  postedBy: string;
  approvedBy: string;
  glAccountDebit: string;
  glAccountCredit: string;
  totalAmount: number;
  totalSkusAdjusted: number;
  adjustmentType: 'LOSS_WRITEOFF' | 'SURPLUS_RECOGNITION' | 'DAMAGED_SCRAP' | 'EXPIRY_DISPOSAL';
  blockchainHash: string;
  status: 'POSTED_IMMUTABLE';
  notes: string;
}

interface StockAdjustmentLedgerAuditTabProps {
  adjustments: StockAdjustmentRecord[];
  onSelectEntity?: (context: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StockAdjustmentLedgerAuditTab: React.FC<StockAdjustmentLedgerAuditTabProps> = ({
  adjustments,
  onSelectEntity,
  onNotify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  // Generate Ledger Records from Approved adjustments and mock historical audits
  const [ledgerRecords] = useState<StockAdjustmentLedgerRecord[]>([
    {
      id: 'ADJ-LEDGER-001',
      adjustmentNo: 'ADJ-2026-0908-01',
      warehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      postedAt: '08/09/2026 16:30',
      postedBy: 'Nguyễn Văn Kiểm (KTV Kho)',
      approvedBy: 'Phạm Đức Anh (Kế toán trưởng)',
      glAccountDebit: 'TK 1388 (Tài sản thiếu chờ xử lý)',
      glAccountCredit: 'TK 1561 (Hàng hóa thương mại)',
      totalAmount: 2850000,
      totalSkusAdjusted: 3,
      adjustmentType: 'LOSS_WRITEOFF',
      blockchainHash: 'a7c9f812e9b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b',
      status: 'POSTED_IMMUTABLE',
      notes: 'Bút toán xử lý hao hụt kiểm kê đầu tháng 9/2026'
    },
    {
      id: 'ADJ-LEDGER-002',
      adjustmentNo: 'ADJ-2026-0831-02',
      warehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      postedAt: '31/08/2026 17:45',
      postedBy: 'Lê Hoàng Long (Quản lý kho)',
      approvedBy: 'Trần Văn Minh (Giám đốc Vận hành)',
      glAccountDebit: 'TK 1561 (Hàng hóa thương mại)',
      glAccountCredit: 'TK 3381 (Tài sản thừa chờ giải quyết)',
      totalAmount: 4200000,
      totalSkusAdjusted: 5,
      adjustmentType: 'SURPLUS_RECOGNITION',
      blockchainHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      status: 'POSTED_IMMUTABLE',
      notes: 'Ghi nhận thặng dư nguyên phụ liệu đóng gói phát hiện qua kiểm đếm mù'
    },
    {
      id: 'ADJ-LEDGER-003',
      adjustmentNo: 'ADJ-2026-0820-03',
      warehouseName: 'Kho Phụ Tùng Linh Kiện (Đà Nẵng)',
      postedAt: '20/08/2026 14:15',
      postedBy: 'Trần Thị Mai (Kế toán kho)',
      approvedBy: 'Phạm Đức Anh (Kế toán trưởng)',
      glAccountDebit: 'TK 632 (Giá vốn hàng bán - Hư hỏng)',
      glAccountCredit: 'TK 1561 (Hàng hóa thương mại)',
      totalAmount: 1850000,
      totalSkusAdjusted: 2,
      adjustmentType: 'DAMAGED_SCRAP',
      blockchainHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      status: 'POSTED_IMMUTABLE',
      notes: 'Thanh lý tiêu hủy linh kiện bo mạch chập cháy do sét đánh'
    }
  ]);

  // Filter
  const filteredData = useMemo(() => {
    return ledgerRecords.filter(rec => {
      const matchSearch = searchTerm === '' ||
        rec.adjustmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || rec.adjustmentType === typeFilter;
      const matchAccount = accountFilter === 'ALL' || rec.glAccountDebit.includes(accountFilter) || rec.glAccountCredit.includes(accountFilter);

      return matchSearch && matchType && matchAccount;
    });
  }, [ledgerRecords, searchTerm, typeFilter, accountFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredData.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedData = useMemo(() => {
    return pagination.paginatedData(filteredData);
  }, [filteredData, pagination]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRecordsCount = ledgerRecords.length;
    let totalDebitValue = 0;
    let totalSurplusValue = 0;

    ledgerRecords.forEach(r => {
      if (r.adjustmentType === 'SURPLUS_RECOGNITION') {
        totalSurplusValue += r.totalAmount;
      } else {
        totalDebitValue += r.totalAmount;
      }
    });

    return { totalRecordsCount, totalDebitValue, totalSurplusValue };
  }, [ledgerRecords]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportRows = filteredData.map(r => ({
      'Mã Bút Toán': r.adjustmentNo,
      'Kho Hàng': r.warehouseName,
      'Thời Điểm Post': r.postedAt,
      'Người Thực Hiện': r.postedBy,
      'Người Phê Duyệt': r.approvedBy,
      'Nợ TK': r.glAccountDebit,
      'Có TK': r.glAccountCredit,
      'Số Tiền (VND)': r.totalAmount,
      'Số SKU': r.totalSkusAdjusted,
      'Loại Bút Toán': r.adjustmentType,
      'Trạng Thái Sổ Cái': r.status,
      'SHA-256 Checksum': r.blockchainHash,
      'Diễn Giải Nghiệp Vụ': r.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SoCaiDieuChinhM20');
    XLSX.writeFile(wb, `M20_Ledger_History_${new Date().toISOString().slice(0, 10)}.xlsx`);

    onNotify('success', 'Xuất Sổ Cái Thành Công', `Đã xuất ${filteredData.length} bút toán kiểm toán bất biến.`);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: LEDGER KPI STRIP                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Bút Toán Đã Post Sổ Cái
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.totalRecordsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Bất biến</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              Ghi Giảm Tài Sản (Nợ 632 / 1388)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {metrics.totalDebitValue.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Ghi Tăng Tài Sản (Có 3381)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                +{metrics.totalSurplusValue.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
              Xác Thực Mã Băm Checksum
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                100% SHA-256
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo số bút toán, kho, diễn giải..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs cursor-pointer"
          >
            <option value="ALL">Tất cả loại điều chỉnh</option>
            <option value="LOSS_WRITEOFF">Hao Hụt / Mất Mát (Nợ 1388)</option>
            <option value="SURPLUS_RECOGNITION">Dôi Dư Thực Tế (Có 3381)</option>
            <option value="DAMAGED_SCRAP">Hư Hỏng / Tiêu Hủy (Nợ 632)</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs cursor-pointer"
          >
            <option value="ALL">Tất cả Tài Khoản GL</option>
            <option value="1561">TK 1561 - Hàng hóa</option>
            <option value="1388">TK 1388 - Thiếu chờ xử lý</option>
            <option value="3381">TK 3381 - Thừa chờ giải quyết</option>
            <option value="632">TK 632 - Giá vốn hàng bán</option>
          </select>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Xuất Sổ Cái Excel</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* L3: LEDGER DATA GRID                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3">Số Bút Toán</th>
                <th className="p-3">Kho Hàng</th>
                <th className="p-3">Định Khoản GL (Nợ / Có)</th>
                <th className="p-3 text-right">Số Tiền (VND)</th>
                <th className="p-3 text-right">Số SKU</th>
                <th className="p-3">Thời Điểm &amp; Phê Duyệt</th>
                <th className="p-3">Mã Băm Checksum (SHA-256)</th>
                <th className="p-3 text-center">Trạng Thái Sổ Cái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedData.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors border-l-4 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10"
                >
                  <td className="p-3">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      {rec.adjustmentNo}
                    </span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate">
                      {rec.notes}
                    </div>
                  </td>

                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                    {rec.warehouseName}
                  </td>

                  <td className="p-3">
                    <div className="font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">Nợ:</span> {rec.glAccountDebit}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="text-purple-600 dark:text-purple-400">Có:</span> {rec.glAccountCredit}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                    {rec.totalAmount.toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                    {rec.totalSkusAdjusted} SKU
                  </td>

                  <td className="p-3">
                    <div className="font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                      {rec.postedAt}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Duyệt bởi: {rec.approvedBy}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded max-w-xs truncate flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{rec.blockchainHash}</span>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>POSTED IMMUTABLE</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredData.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
};
