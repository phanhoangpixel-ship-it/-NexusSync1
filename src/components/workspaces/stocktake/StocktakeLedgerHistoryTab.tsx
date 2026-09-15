import React, { useState, useMemo } from 'react';
import { 
  FileText, ShieldCheck, Search, Filter, RefreshCw, Download, 
  CheckCircle2, ArrowUpRight, ArrowDownRight, Hash, Eye, 
  Lock, BookOpen, Calendar, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';

export interface StockAdjustmentLedgerRecord {
  id: string;
  adjustmentNo: string;
  sessionCode: string;
  warehouseName: string;
  postedAt: string;
  postedBy: string;
  approvedBy: string;
  glAccountDebit: string; // Nợ TK
  glAccountCredit: string; // Có TK
  totalAmount: number;
  totalSkusAdjusted: number;
  adjustmentType: 'LOSS_WRITEOFF' | 'SURPLUS_RECOGNITION' | 'DAMAGED_SCRAP';
  blockchainHash: string;
  status: 'POSTED_IMMUTABLE';
  notes: string;
}

interface StocktakeLedgerHistoryTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const StocktakeLedgerHistoryTab: React.FC<StocktakeLedgerHistoryTabProps> = ({ 
  onNotify,
  onSelectEntity 
}) => {
  const [ledgerRecords, setLedgerRecords] = useState<StockAdjustmentLedgerRecord[]>([
    {
      id: 'ADJ-001',
      adjustmentNo: 'ADJ-2026-0831-01',
      sessionCode: 'STK-HN-2026-08FIN',
      warehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      postedAt: '31/08/2026 17:45',
      postedBy: 'Nguyễn Văn Kiểm (KTV Kho)',
      approvedBy: 'Phạm Đức Anh (Kế toán trưởng)',
      glAccountDebit: 'TK 1388 (Tài sản thiếu chờ xử lý)',
      glAccountCredit: 'TK 1561 (Hàng hóa thương mại)',
      totalAmount: 2100000,
      totalSkusAdjusted: 6,
      adjustmentType: 'LOSS_WRITEOFF',
      blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'POSTED_IMMUTABLE',
      notes: 'Bút toán xử lý hao hụt kiểm kê tháng 8/2026 theo Quyết định HĐQT #12/QĐ-ERP'
    },
    {
      id: 'ADJ-002',
      adjustmentNo: 'ADJ-2026-0731-02',
      sessionCode: 'STK-HCM-2026-07FIN',
      warehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      postedAt: '31/07/2026 18:20',
      postedBy: 'Trần Thị Kho (Thủ kho)',
      approvedBy: 'Võ Minh Trí (Giám sát Vận hành)',
      glAccountDebit: 'TK 1561 (Hàng hóa thương mại)',
      glAccountCredit: 'TK 3381 (Tài sản thừa chờ xử lý)',
      totalAmount: 5400000,
      totalSkusAdjusted: 3,
      adjustmentType: 'SURPLUS_RECOGNITION',
      blockchainHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      status: 'POSTED_IMMUTABLE',
      notes: 'Hạch toán dôi thừa hàng gửi kho đại lý đã đối soát xong'
    },
    {
      id: 'ADJ-003',
      adjustmentNo: 'ADJ-2026-0630-03',
      sessionCode: 'STK-CNC-2026-06FIN',
      warehouseName: 'Kho Cơ khí & Phụ tùng CNC',
      postedAt: '30/06/2026 16:30',
      postedBy: 'Đặng Quốc Huy (KTV Cơ khí)',
      approvedBy: 'Lê Hoàng Sơn (Trưởng kho)',
      glAccountDebit: 'TK 632 (Giá vốn hàng bán / Hỏng hóc)',
      glAccountCredit: 'TK 152 (Nguyên vật liệu & Dao cụ)',
      totalAmount: 8900000,
      totalSkusAdjusted: 4,
      adjustmentType: 'DAMAGED_SCRAP',
      blockchainHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      status: 'POSTED_IMMUTABLE',
      notes: 'Thanh lý dao cụ sứt mẻ gãy mũi trong quá trình gia công CNC'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Làm Mới Sổ Cái GL', 'Đã tải và đối soát các chứng từ điều chỉnh tồn kho bất biến.');
    }, 450);
  };

  const filteredRecords = useMemo(() => {
    return ledgerRecords.filter(r => {
      const matchSearch = r.adjustmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.postedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.approvedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.blockchainHash.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === 'ALL' || r.warehouseName.includes(warehouseFilter);
      const matchType = typeFilter === 'ALL' || r.adjustmentType === typeFilter;
      return matchSearch && matchWh && matchType;
    });
  }, [ledgerRecords, searchTerm, warehouseFilter, typeFilter]);

  const pagination = usePagination({
    totalItems: filteredRecords.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedRecords = useMemo(() => {
    return pagination.paginatedData(filteredRecords);
  }, [filteredRecords, pagination]);

  const typeMap: Record<string, { label: string; className: string }> = {
    LOSS_WRITEOFF: { label: 'Xử Lý Hao Hụt / Thiếu', className: 'text-rose-950 bg-rose-100 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' },
    SURPLUS_RECOGNITION: { label: 'Ghi Nhận Hàng Thừa', className: 'text-emerald-950 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' },
    DAMAGED_SCRAP: { label: 'Xuất Hủy Hàng Hỏng Hóc', className: 'text-amber-950 bg-amber-100 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredRecords.map(r => ({
        'Số Chứng Từ': r.adjustmentNo,
        'Mã Phiên Kiểm Kê': r.sessionCode,
        'Kho Thực Hiện': r.warehouseName,
        'Ngày Ghi Sổ': r.postedAt,
        'Người Lập': r.postedBy,
        'Người Phê Duyệt': r.approvedBy,
        'Nợ TK': r.glAccountDebit,
        'Có TK': r.glAccountCredit,
        'Giá Trị Điều Chỉnh (VNĐ)': r.totalAmount,
        'Số SKU Điều Chỉnh': r.totalSkusAdjusted,
        'Loại Bút Toán': typeMap[r.adjustmentType]?.label || r.adjustmentType,
        'Mã Hash Bất Biến (SHA-256)': r.blockchainHash,
        'Trạng Thái': 'Đã Ghi Sổ Bất Biến (GL Posted)',
        'Ghi Chú': r.notes
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'So_Cai_Dieu_Chinh_Kho_GL');
      XLSX.writeFile(wb, `NexusSync_Stock_Adjustment_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
      onNotify('success', 'Xuất File Excel Thành Công', 'Đã xuất sổ cái chứng từ điều chỉnh tồn kho.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể xuất sổ cái ra file Excel.');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & FILTER STRIP                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-1 items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Tìm theo số chứng từ, mã phiên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Kho Lưu Trữ</option>
            <option value="Hà Nội">Kho Tổng Hà Nội</option>
            <option value="Nam">Kho Chi nhánh Nam</option>
            <option value="CNC">Kho Cơ khí CNC</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Loại Bút Toán</option>
            <option value="LOSS_WRITEOFF">Xử Lý Hao Hụt / Thiếu (TK 1388)</option>
            <option value="SURPLUS_RECOGNITION">Ghi Nhận Hàng Thừa (TK 3381)</option>
            <option value="DAMAGED_SCRAP">Xuất Hủy Hàng Hỏng (TK 632)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
            title="Xuất Sổ Cái Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Sổ Cái GL</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Chứng Từ Điều Chỉnh</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {ledgerRecords.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600">chứng từ GL</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Xác Thực Bất Biến SHA-256</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              100%
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Bảo toàn vẹn</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng SKU Đã Điều Chỉnh</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
              {ledgerRecords.reduce((acc, r) => acc + r.totalSkusAdjusted, 0)}
            </span>
            <span className="text-[11px] text-purple-600 font-medium">SKU đồng bộ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Giá Trị Hạch Toán GL</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {ledgerRecords.reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Sổ cái kế toán Rule #03</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredRecords.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy chứng từ sổ cái nào"
        emptyDescription="Các bút toán điều chỉnh tồn kho sẽ xuất hiện tại đây sau khi được phê duyệt hoặc đặt lại bộ lọc để xem toàn bộ."
        emptyAction={{
          label: 'Đặt lại bộ lọc sổ cái',
          onClick: () => {
            setSearchTerm('');
            setWarehouseFilter('ALL');
            setTypeFilter('ALL');
          },
          variant: 'outline'
        }}
        skeletonRows={5}
        minHeight="min-h-[380px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[140px]">Số Bút Toán &amp; Phiên</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Kho &amp; Ngày Ghi Sổ</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Hạch Toán GL (Nợ / Có)</th>
                  <th className="py-2.5 px-2 text-center min-w-[75px]">Số SKU</th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Giá Trị Hạch Toán</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Loại Bút Toán</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Mã Hash Bất Biến (SHA-256)</th>
                  <th className="py-2.5 px-2 text-center min-w-[110px]">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedRecords.map((record) => {
                  const typeBadge = typeMap[record.adjustmentType] || typeMap.LOSS_WRITEOFF;
                  const isLoss = record.adjustmentType === 'LOSS_WRITEOFF' || record.adjustmentType === 'SCRAP_DAMAGED';
                  return (
                    <tr 
                      key={record.id} 
                      className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isLoss
                          ? 'border-l-4 border-rose-500/80 bg-rose-50/15 dark:bg-rose-950/10'
                          : 'border-l-4 border-emerald-500/80 bg-emerald-50/15 dark:bg-emerald-950/10'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {record.adjustmentNo}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {record.sessionCode}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {record.warehouseName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {record.postedAt}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-[11px] font-mono text-slate-900 dark:text-white font-medium">
                          <span className="font-bold text-blue-700 dark:text-blue-400">Nợ:</span> {record.glAccountDebit}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">Có:</span> {record.glAccountCredit}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                        {record.totalSkusAdjusted} SKU
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {record.totalAmount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold border ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={record.blockchainHash}>
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{record.blockchainHash.slice(0, 14)}...</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          <Lock className="w-3 h-3 mr-1" /> Đã Ghi Sổ GL
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: STICKY PAGINATION CONTROL                                             */}
          {/* ========================================================================= */}
          <div className="sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredRecords.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        </div>
      </L3ContentState>
    </div>
  );
};
