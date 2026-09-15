import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Tags, QrCode, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  Clock, AlertTriangle, ShieldAlert, ArrowUpRight, FileSpreadsheet, Eye, 
  Send, CheckSquare, Download, MapPin, Layers, X, User, Check, Barcode,
  Calendar, ShieldCheck, Box, History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface TraceabilityItem {
  id: string;
  code: string; // Lot number or Serial number
  type: 'SERIAL' | 'LOT_BATCH';
  sku: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  binLocation: string;
  qty: number;
  unit: string;
  mfgDate: string;
  expDate: string;
  status: 'ACTIVE' | 'NEAR_EXPIRY' | 'QUARANTINE' | 'CONSUMED';
  supplierName: string;
  poCode: string;
  historyTimeline: {
    date: string;
    event: string;
    operator: string;
    location: string;
  }[];
}

interface WarehouseTraceabilityTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const WarehouseTraceabilityTab: React.FC<WarehouseTraceabilityTabProps> = ({ onNotify, onSelectEntity }) => {
  const [items, setItems] = useState<TraceabilityItem[]>([
    {
      id: 'TRC-001',
      code: 'SN-MON-2026-0019',
      type: 'SERIAL',
      sku: 'SKU-MED-MON',
      productName: 'Màn hình theo dõi bệnh nhân 7 thông số',
      warehouseCode: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      binLocation: 'BIN-A01-02',
      qty: 1,
      unit: 'Bộ',
      mfgDate: '15/01/2026',
      expDate: '15/01/2031 (Bảo hành 5 năm)',
      status: 'ACTIVE',
      supplierName: 'MedTech Global Corp',
      poCode: 'PO-2026-0104',
      historyTimeline: [
        { date: '09/09/2026 09:30', event: 'Hoàn tất kiểm nhận nhập kho & Gán mã Serial IMEI', operator: 'Nguyễn Văn Kho', location: 'Cửa Nhận Hàng (Staging-In)' },
        { date: '09/09/2026 10:15', event: 'Putaway xếp hàng vào kệ lưu trữ', operator: 'Trần Văn Xếp', location: 'BIN-A01-02' }
      ]
    },
    {
      id: 'TRC-002',
      code: 'LOT-2026-09A',
      type: 'LOT_BATCH',
      sku: 'SKU-RES-10K',
      productName: 'Điện trở dán SMD 10K Ohm 0805',
      warehouseCode: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      binLocation: 'BIN-C10-01',
      qty: 5000,
      unit: 'Con',
      mfgDate: '01/08/2026',
      expDate: '01/08/2029',
      status: 'ACTIVE',
      supplierName: 'Phúc Khang Industrial Materials',
      poCode: 'PO-2026-0108',
      historyTimeline: [
        { date: '08/09/2026 14:00', event: 'Nhập lô hàng nguyên bao cuộn (Tape & Reel)', operator: 'Lê Thị Kiểm', location: 'STAGING-IN' },
        { date: '08/09/2026 15:30', event: 'Lưu kho phòng sạch bảo quản', operator: 'Phạm Văn Xếp', location: 'BIN-C10-01' }
      ]
    },
    {
      id: 'TRC-003',
      code: 'SN-ECG-2026-0088',
      type: 'SERIAL',
      sku: 'SKU-MED-ECG',
      productName: 'Máy đo ECG 12 đạo trình',
      warehouseCode: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      binLocation: 'BIN-QA01',
      qty: 1,
      unit: 'Bộ',
      mfgDate: '10/02/2026',
      expDate: '10/02/2030',
      status: 'QUARANTINE',
      supplierName: 'MedTech Global Corp',
      poCode: 'PO-2026-0104',
      historyTimeline: [
        { date: '09/09/2026 09:30', event: 'Nhập kho', operator: 'Nguyễn Văn Kho', location: 'STAGING-IN' },
        { date: '09/09/2026 10:00', event: 'Chuyển cách ly phòng QA để kiểm định chứng nhận CO/CQ', operator: 'Vũ Kiểm Định', location: 'BIN-QA01' }
      ]
    },
    {
      id: 'TRC-004',
      code: 'LOT-CHEM-2025-X4',
      type: 'LOT_BATCH',
      sku: 'SKU-CHEM-IPA',
      productName: 'Dung dịch tẩy rửa mạch Isopropyl Alcohol (IPA 99.9%)',
      warehouseCode: 'WH-SOUTH',
      warehouseName: 'Kho Chi Nhánh Miền Nam',
      binLocation: 'BIN-HAZ-01',
      qty: 45,
      unit: 'Thùng 20L',
      mfgDate: '15/10/2025',
      expDate: '15/10/2026 (Còn 35 ngày)',
      status: 'NEAR_EXPIRY',
      supplierName: 'Hóa Chất Công Nghiệp Sài Gòn',
      poCode: 'PO-2025-0890',
      historyTimeline: [
        { date: '20/10/2025 09:00', event: 'Nhập kho khu vực hóa chất', operator: 'Đỗ An Toàn', location: 'BIN-HAZ-01' }
      ]
    }
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // L3 Content Area Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Đồng bộ phả hệ', 'Đã tải dữ liệu truy xuất Lô & Serial mới nhất.');
    }, 450);
  }, [onNotify]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  };

  // Drawers / Dialogs / Modals
  const [selectedItem, setSelectedItem] = useState<TraceabilityItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });

  // Form State for Registering Serial/Lot
  const [registerForm, setRegisterForm] = useState({
    code: '',
    type: 'SERIAL' as 'SERIAL' | 'LOT_BATCH',
    sku: 'SKU-RAM-16G',
    productName: 'RAM DDR5 16GB Kingston Fury',
    qty: 1,
    unit: 'Thanh',
    binLocation: 'BIN-B03',
    expDate: '09/09/2029',
    supplierName: 'ABC Technology Corp'
  });

  // Filtered
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = 
        i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || i.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchTerm, typeFilter, statusFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredItems.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredItems);
  }, [pagination, filteredItems]);

  // KPI Metrics
  const kpis = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => i.status === 'ACTIVE').length;
    const nearExpiry = items.filter(i => i.status === 'NEAR_EXPIRY').length;
    const quarantine = items.filter(i => i.status === 'QUARANTINE').length;
    const serialCount = items.filter(i => i.type === 'SERIAL').length;
    const lotCount = items.filter(i => i.type === 'LOT_BATCH').length;

    return { total, active, nearExpiry, quarantine, serialCount, lotCount };
  }, [items]);

  // Handlers
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.code.trim()) return;

    const newItem: TraceabilityItem = {
      id: `TRC-${String(items.length + 1).padStart(3, '0')}`,
      code: registerForm.code.trim().toUpperCase(),
      type: registerForm.type,
      sku: registerForm.sku,
      productName: registerForm.productName,
      warehouseCode: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      binLocation: registerForm.binLocation,
      qty: registerForm.qty,
      unit: registerForm.unit,
      mfgDate: new Date().toLocaleDateString('vi-VN'),
      expDate: registerForm.expDate,
      status: 'ACTIVE',
      supplierName: registerForm.supplierName,
      poCode: 'PO-2026-MANUAL',
      historyTimeline: [
        { date: new Date().toLocaleString('vi-VN'), event: 'Đăng ký mã định danh đơn vị vào hệ thống WMS', operator: 'Quản Trị Viên', location: registerForm.binLocation }
      ]
    };

    setItems(prev => [newItem, ...prev]);
    setIsRegisterModalOpen(false);
    onNotify('success', 'Đăng ký thành công', `Đã ghi nhận mã ${newItem.type === 'SERIAL' ? 'Serial' : 'Số Lô'} ${newItem.code}`);
  };

  const handleExportExcel = () => {
    const data = items.map(i => ({
      'Mã Định Danh (Code)': i.code,
      'Loại': i.type === 'SERIAL' ? 'Mã Serial (IMEI)' : 'Lô Hàng (Lot/Batch)',
      'Mã SKU': i.sku,
      'Tên Sản Phẩm': i.productName,
      'Số Lượng': i.qty,
      'ĐVT': i.unit,
      'Vị Trí Bin': i.binLocation,
      'Kho Lưu Trữ': i.warehouseName,
      'Hạn Sử Dụng/BH': i.expDate,
      'Trạng Thái': i.status,
      'Nhà Cung Cấp': i.supplierName
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Traceability_Master');
    XLSX.writeFile(wb, `NexusSync_Traceability_${new Date().toISOString().split('T')[0]}.xlsx`);
    onNotify('info', 'Xuất dữ liệu', 'Đã tải xuống danh sách truy vết lô / serial Excel.');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L0: TOP HEADER BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <QrCode className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              F. Traceability &amp; Unit Genealogy (Lô, Batch &amp; Serial IMEI)
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-mono font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
              {items.length} Định danh
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý phả hệ nguồn gốc sản phẩm, theo dõi vòng đời Serial/Lot, cảnh báo hạn dùng (FEFO) và lịch sử di chuyển.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-2xs cursor-pointer"
            title="Đồng bộ dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Xuất Excel
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Đăng Ký Lô / Serial
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: KPI METRICS STRIP                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Mã Serial Đang Quản Lý</span>
            <Barcode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {kpis.serialCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đơn vị thiết bị định danh</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Lô Hàng (Lot / Batch)</span>
            <Box className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
            {kpis.lotCount}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Lô sản xuất / nhập khẩu</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Khả Dụng Hoạt Động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis.active}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Sẵn sàng xuất / lắp ráp</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Sắp Hết Hạn (FEFO Alert)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-1">
            {kpis.nearExpiry}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Cần ưu tiên xuất sớm</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Cách Ly / Kiểm Định</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 mt-1">
            {kpis.quarantine}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">Đang chờ phê duyệt QA</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: ADVANCED FILTER TOOLBAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã Serial, Số Lô (Lot), SKU, Tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả định danh (Serial &amp; Lot)</option>
            <option value="SERIAL">Chỉ Mã Serial (IMEI)</option>
            <option value="LOT_BATCH">Chỉ Số Lô (Lot / Batch)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt Động Khả Dụng</option>
            <option value="NEAR_EXPIRY">Sắp Hết Hạn</option>
            <option value="QUARANTINE">Cách Ly Kiểm Định</option>
          </select>
        </div>

        {(searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
          >
            Đặt lại lọc
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* L3: CONTENT AREA (LOADING, ERROR, EMPTY & DATA GRID)                     */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={paginatedItems.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy mã định danh nào"
        emptyDescription="Không có dữ liệu Lot / Serial phù hợp với bộ lọc tìm kiếm hoặc từ khóa hiện tại."
        emptyAction={{
          label: 'Đặt lại bộ lọc tìm kiếm',
          onClick: handleResetFilters
        }}
        skeletonRows={6}
        minHeight="min-h-[420px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mã Định Danh (Code)</th>
                  <th className="py-3 px-4">Loại Quản Lý</th>
                  <th className="py-3 px-4">Sản Phẩm &amp; SKU</th>
                  <th className="py-3 px-4 text-center">Số Lượng</th>
                  <th className="py-3 px-4">Vị Trí Lưu Bin</th>
                  <th className="py-3 px-4">Hạn Dùng / Bảo Hành</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                      {item.type === 'SERIAL' ? <Barcode className="w-4 h-4 text-slate-400" /> : <Box className="w-4 h-4 text-blue-500" />}
                      <span>{item.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        item.type === 'SERIAL' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' 
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      }`}>
                        {item.type === 'SERIAL' ? 'SERIAL NUMBER' : 'LOT / BATCH'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {item.qty.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.binLocation}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.expDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : item.status === 'NEAR_EXPIRY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      }`}>
                        {item.status === 'ACTIVE' ? 'KHẢ DỤNG' : item.status === 'NEAR_EXPIRY' ? 'SẮP HẾT HẠN' : 'CÁCH LY QA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-all cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Phả Hệ</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: PINNED PAGINATION FOOTER                                              */}
          {/* ========================================================================= */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredItems.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* DRAWER: GENEALOGY & TIMELINE                                              */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      {selectedItem.code}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedItem.type === 'SERIAL' ? 'Hồ Sơ Serial IMEI' : 'Hồ Sơ Lô Sản Xuất'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedItem.productName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã SKU:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedItem.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị trí hiện tại:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedItem.binLocation} ({selectedItem.warehouseName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhà cung cấp:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạn dùng / Bảo hành:</span>
                  <span className="font-mono text-slate-700">{selectedItem.expDate}</span>
                </div>
              </div>

              {/* Genealogy Timeline */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" /> Dòng Thời Gian Phả Hệ (Genealogy Tracking)
                </h4>
                <div className="relative border-l-2 border-emerald-200 dark:border-emerald-800 ml-3 pl-4 space-y-4">
                  {selectedItem.historyTimeline.map((ev, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="font-mono text-[10px] text-slate-400">{ev.date}</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{ev.event}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Nhân sự: <strong>{ev.operator}</strong></span>
                        <span>•</span>
                        <span>Vị trí: <strong>{ev.location}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end bg-slate-50">
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER SERIAL / LOT                                              */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Đăng Ký Mã Định Danh Đơn Vị (Serial / Lot)
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại Định Danh *</label>
                  <select
                    value={registerForm.type}
                    onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SERIAL">Mã Serial (IMEI)</option>
                    <option value="LOT_BATCH">Số Lô (Lot / Batch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã Định Danh *</label>
                  <input
                    type="text"
                    required
                    placeholder={registerForm.type === 'SERIAL' ? 'VD: SN-2026-9901' : 'VD: LOT-2026-09C'}
                    value={registerForm.code}
                    onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Sản Phẩm *</label>
                <input
                  type="text"
                  required
                  value={registerForm.productName}
                  onChange={(e) => setRegisterForm({ ...registerForm, productName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vị Trí Lưu Bin *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.binLocation}
                    onChange={(e) => setRegisterForm({ ...registerForm, binLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hạn Dùng / Bảo Hành *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.expDate}
                    onChange={(e) => setRegisterForm({ ...registerForm, expDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Lưu Định Danh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Mandatory Rule #19)                                       */}
      {/* ========================================================================= */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WarehouseTraceabilityTab;
