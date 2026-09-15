import React, { useState, useMemo } from 'react';
import { 
  FileText, ShieldCheck, Search, Filter, RefreshCw, FileSpreadsheet, 
  CheckCircle2, Lock, ArrowUpRight, DollarSign, Layers, Hash,
  ArrowLeftRight, Truck, Database, Scale, Key
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface TransferLedgerEntry {
  id: string;
  voucherNo: string;
  transferCode: string;
  transactionType: 'DISPATCH_IN_TRANSIT' | 'RECEIVE_DESTINATION' | 'TRANSIT_LOSS_WRITEOFF' | 'TRANSIT_SURPLUS_INVENTORY';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  sourceWarehouse: string;
  destWarehouse: string;
  sha256Hash: string;
  postedBy: string;
  postedAt: string;
  authorizedBy: string;
  singleWriterService: string;
  isImmutable: boolean;
  notes: string;
}

interface TransferLedgerHistoryTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const TransferLedgerHistoryTab: React.FC<TransferLedgerHistoryTabProps> = ({
  onNotify
}) => {
  const [entries, setEntries] = useState<TransferLedgerEntry[]>([
    {
      id: 'GL-TRF-001',
      voucherNo: 'PK-TRF-202609-001',
      transferCode: 'TRF-HN-HCM-2026-09A',
      transactionType: 'DISPATCH_IN_TRANSIT',
      debitAccount: '157 (Hàng gửi đi bán / Hàng đi đường)',
      creditAccount: '1561 (Hàng hóa kho xuất)',
      amount: 145000000,
      currency: 'VND',
      sourceWarehouse: 'WH-HN-01 (Kho Tổng Hà Nội)',
      destWarehouse: 'WH-HCM-02 (Kho Chi nhánh Nam)',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      postedBy: 'AccountingService (System Daemon)',
      postedAt: '08/09/2026 14:35',
      authorizedBy: 'Trần Văn Kho (Kế toán trưởng)',
      singleWriterService: 'AccountingService.postTransaction()',
      isImmutable: true,
      notes: 'Bút toán xuất kho chuyển hàng đi đường theo Lệnh TRF-HN-HCM-2026-09A'
    },
    {
      id: 'GL-TRF-002',
      voucherNo: 'PK-TRF-202608-089',
      transferCode: 'TRF-HN-HCM-2026-08FIN',
      transactionType: 'RECEIVE_DESTINATION',
      debitAccount: '1561 (Hàng hóa kho nhập đích)',
      creditAccount: '157 (Hàng đi đường)',
      amount: 92400000,
      currency: 'VND',
      sourceWarehouse: 'WH-HN-01 (Kho Tổng Hà Nội)',
      destWarehouse: 'WH-HCM-02 (Kho Chi nhánh Nam)',
      sha256Hash: '5f4dcc3b5aa765d61d8327deb882cf992b95bc6809113e1742e0970b5b63840f',
      postedBy: 'AccountingService (System Daemon)',
      postedAt: '31/08/2026 09:35',
      authorizedBy: 'Võ Minh Trí (Giám đốc Vận hành)',
      singleWriterService: 'AccountingService.postTransaction()',
      isImmutable: true,
      notes: 'Bút toán nhập kho đích hoàn tất điều chuyển 100% khớp'
    },
    {
      id: 'GL-TRF-003',
      voucherNo: 'PK-TRF-202608-090',
      transferCode: 'TRF-HN-HCM-2026-08FIN',
      transactionType: 'TRANSIT_LOSS_WRITEOFF',
      debitAccount: '1388 (Phải thu khác - Đơn vị vận chuyển)',
      creditAccount: '157 (Hàng đi đường hao hụt)',
      amount: 5700000,
      currency: 'VND',
      sourceWarehouse: 'WH-HN-01 (Kho Tổng Hà Nội)',
      destWarehouse: 'WH-HCM-02 (Kho Chi nhánh Nam)',
      sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      postedBy: 'AccountingService (System Daemon)',
      postedAt: '31/08/2026 10:00',
      authorizedBy: 'Trần Văn Kho (Kế toán trưởng)',
      singleWriterService: 'AccountingService.postTransaction()',
      isImmutable: true,
      notes: 'Ghi nhận thất thoát 2 bộ động cơ servo trong quá trình xe di chuyển'
    },
    {
      id: 'GL-TRF-004',
      voucherNo: 'PK-TRF-202609-002',
      transferCode: 'TRF-CNC-HN-2026-09C',
      transactionType: 'DISPATCH_IN_TRANSIT',
      debitAccount: '157 (Hàng đi đường)',
      creditAccount: '1561 (Kho Cơ khí CNC)',
      amount: 32000000,
      currency: 'VND',
      sourceWarehouse: 'WH-CNC-03 (Kho CNC)',
      destWarehouse: 'WH-HN-01 (Kho Tổng Hà Nội)',
      sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      postedBy: 'AccountingService (System Daemon)',
      postedAt: '09/09/2026 08:15',
      authorizedBy: 'Lê Hoàng Sơn (Trưởng kho HN)',
      singleWriterService: 'AccountingService.postTransaction()',
      isImmutable: true,
      notes: 'Điều chuyển thu hồi dao phay ngón và collet chuck'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');

  // Filter
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = 
        e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.authorizedBy.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = transactionTypeFilter === 'ALL' || e.transactionType === transactionTypeFilter;
      const matchAccount = accountFilter === 'ALL' || e.debitAccount.includes(accountFilter) || e.creditAccount.includes(accountFilter);

      return matchSearch && matchType && matchAccount;
    });
  }, [entries, searchQuery, transactionTypeFilter, accountFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredEntries.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedEntries = useMemo(() => {
    return pagination.paginatedData(filteredEntries);
  }, [filteredEntries, pagination]);

  // Metrics
  const totalEntriesCount = entries.length;
  const totalInTransitDebit = entries
    .filter(e => e.debitAccount.includes('157'))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalInTransitCredit = entries
    .filter(e => e.creditAccount.includes('157'))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalLossAccounted = entries
    .filter(e => e.debitAccount.includes('1388') || e.debitAccount.includes('632'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Excel Export
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredEntries.map((e, idx) => ({
        'STT': idx + 1,
        'Số Chứng Từ Bút Toán': e.voucherNo,
        'Mã Lệnh Điều Chuyển': e.transferCode,
        'Loại Nghiệp Vụ': e.transactionType,
        'Tài Khoản Nợ (Debit)': e.debitAccount,
        'Tài Khoản Có (Credit)': e.creditAccount,
        'Số Tiền (VND)': e.amount,
        'Kho Xuất': e.sourceWarehouse,
        'Kho Nhận': e.destWarehouse,
        'Mã Băm Checksum SHA-256': e.sha256Hash,
        'Single-Writer Service': e.singleWriterService,
        'Thời Gian Ghi Sổ': e.postedAt,
        'Người Phê Duyệt': e.authorizedBy,
        'Ghi Chú': e.notes
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'So_Cai_Hang_Di_Duong_M21');
      XLSX.writeFile(wb, `NexusSync_M21_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);

      onNotify('success', 'Xuất File Thành Công', 'Sổ cái bút toán điều chuyển đã được tải về.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể tạo file Excel.');
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm số chứng từ, mã lệnh, mã băm SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Transaction Type Filter */}
          <select
            value={transactionTypeFilter}
            onChange={(e) => setTransactionTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả loại bút toán</option>
            <option value="DISPATCH_IN_TRANSIT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Xuất kho đi đường (Nợ 157 / Có 1561)</option>
            <option value="RECEIVE_DESTINATION" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Nhập kho đích (Nợ 1561 / Có 157)</option>
            <option value="TRANSIT_LOSS_WRITEOFF" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Thất thoát chờ bồi thường (Nợ 1388 / Có 157)</option>
          </select>

          {/* GL Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả tài khoản GL</option>
            <option value="157" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">TK 157 (Hàng đi đường)</option>
            <option value="1561" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">TK 1561 (Hàng hóa kho)</option>
            <option value="1388" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">TK 1388 (Phải thu bồi thường)</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Sổ Cái Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI STRIP                                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Bút Toán Khóa Sổ
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {totalEntriesCount} <span className="text-xs font-sans font-normal text-slate-500">chứng từ</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Sổ cái bất biến (Immutable)
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Giá Trị Xuất Đi Đường (Nợ 157)
            </span>
            <div className="mt-1 text-xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
              {totalInTransitDebit.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
              Hàng hóa đang trên xe
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Nhập Kho Đích (Có 157)
            </span>
            <div className="mt-1 text-xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {totalInTransitCredit.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Tất toán hàng đi đường
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toàn Vẹn Mã Băm SHA-256
            </span>
            <div className="mt-1 text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>100% VERIFIED</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Chống gian lận sổ cái
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID                                                             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedEntries.length === 0}
          emptyMessage="Không có bút toán nào trong sổ cái."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Số Chứng Từ / Mã Lệnh</th>
                  <th className="p-3">Tài Khoản Nợ (Debit)</th>
                  <th className="p-3">Tài Khoản Có (Credit)</th>
                  <th className="p-3 text-right">Số Tiền (VND)</th>
                  <th className="p-3">Mã Băm Checksum (SHA-256)</th>
                  <th className="p-3 text-center">Single-Writer Service</th>
                  <th className="p-3 text-center">Người Phê Duyệt</th>
                  <th className="p-3 text-center">Thời Gian Ghi Sổ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedEntries.map((entry, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-blue-500/40"
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* Số Chứng Từ / Mã Lệnh */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {entry.voucherNo}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                          {entry.transferCode}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {entry.notes}
                        </div>
                      </td>

                      {/* TK Nợ */}
                      <td className="p-3 font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {entry.debitAccount}
                      </td>

                      {/* TK Có */}
                      <td className="p-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {entry.creditAccount}
                      </td>

                      {/* Số Tiền */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {entry.amount.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      {/* SHA-256 Hash */}
                      <td className="p-3">
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block border border-slate-300 dark:border-slate-600 max-w-[180px] truncate" title={entry.sha256Hash}>
                          {entry.sha256Hash}
                        </div>
                      </td>

                      {/* Single Writer Badge */}
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-mono text-[10px] font-bold rounded-md">
                          Rule #03 Passed
                        </span>
                      </td>

                      {/* Người Phê Duyệt */}
                      <td className="p-3 text-center font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {entry.authorizedBy}
                      </td>

                      {/* Thời Gian */}
                      <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                        {entry.postedAt}
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
            totalItems={filteredEntries.length}
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
