import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, FileText, CheckCircle2, ShieldCheck, Eye, Trash2, 
  ArrowUpRight, Lock, Check, Network, Filter, Calendar, Warehouse, 
  Clock, AlertTriangle, X, RefreshCw, ChevronDown, ChevronUp, SlidersHorizontal, MapPin
} from 'lucide-react';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { LotInventoryHistoryDrilldown, LotItem } from './LotInventoryHistoryDrilldown';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';

interface LotsBatchesMasterTabProps {
  lots: LotItem[];
  setLots: React.Dispatch<React.SetStateAction<LotItem[]>>;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  onSelectEntity?: (entity: any) => void;
  onViewTraceability?: (lot: LotItem) => void;
  onViewDrilldown?: (lot: LotItem) => void;
}

export const LotsBatchesMasterTab: React.FC<LotsBatchesMasterTabProps> = ({ lots, setLots, onNotify, onSelectEntity, onViewTraceability }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  
  // Advanced Filter States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mfgStartDate, setMfgStartDate] = useState('');
  const [mfgEndDate, setMfgEndDate] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [expiryHorizonFilter, setExpiryHorizonFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState(`LOT-2026-0${lots.length + 1}`);
  const [newSku, setNewSku] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || '');
  const [newProductName, setNewProductName] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.name || '');
  const [newQty, setNewQty] = useState('300');
  const [newWarehouse, setNewWarehouse] = useState('WH-01 (Kho Tổng Hà Nội)');
  const [newExpDate, setNewExpDate] = useState('2029-12-31');

  // Warehouse list extracted dynamically from lots + default options
  const warehouseOptions = useMemo(() => {
    const list = Array.from(new Set(lots.map(l => l.warehouse).filter(Boolean)));
    return list.length > 0 ? list : [
      'WH-01 (Kho Tổng Hà Nội)',
      'WH-02 (Kho Chi nhánh Nam)',
      'WH-03 (Kho Linh kiện CNC)'
    ];
  }, [lots]);

  // Zone / Bin list
  const zoneOptions = [
    { value: 'ALL', label: 'Tất cả Phân Khu (All Zones)' },
    { value: 'ZONE-A', label: 'Khu A: Động Cơ & Thiết Bị Điện (Bin A*)' },
    { value: 'ZONE-B', label: 'Khu B: Tự Động Hóa & PLC (Bin B*)' },
    { value: 'ZONE-C', label: 'Khu C: Biến Tần & CNC (Bin C*)' },
    { value: 'ZONE-D', label: 'Khu D: Vật Liệu Kim Loại & Khung Nhôm (Bin D*)' }
  ];

  // Quick Date Preset Handler
  const applyDatePreset = (preset: 'all' | '30days' | '90days' | '2026' | '2025') => {
    const now = new Date();
    if (preset === 'all') {
      setMfgStartDate('');
      setMfgEndDate('');
    } else if (preset === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setMfgStartDate(past30.toISOString().slice(0, 10));
      setMfgEndDate(now.toISOString().slice(0, 10));
    } else if (preset === '90days') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setMfgStartDate(past90.toISOString().slice(0, 10));
      setMfgEndDate(now.toISOString().slice(0, 10));
    } else if (preset === '2026') {
      setMfgStartDate('2026-01-01');
      setMfgEndDate('2026-12-31');
    } else if (preset === '2025') {
      setMfgStartDate('2025-01-01');
      setMfgEndDate('2025-12-31');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setMfgStartDate('');
    setMfgEndDate('');
    setWarehouseFilter('ALL');
    setZoneFilter('ALL');
    setExpiryHorizonFilter('ALL');
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (mfgStartDate || mfgEndDate) count++;
    if (warehouseFilter !== 'ALL') count++;
    if (zoneFilter !== 'ALL') count++;
    if (expiryHorizonFilter !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, mfgStartDate, mfgEndDate, warehouseFilter, zoneFilter, expiryHorizonFilter, searchQuery]);

  const handleExportExcel = () => {
    try {
      const exportData = filteredLots.map(lot => ({
        'Mã Lô (Batch No)': lot.batchNumber,
        'SKU': lot.sku,
        'Tên Sản Phẩm': lot.productName,
        'Kho Vị Trí': lot.warehouse,
        'Ngày Sản Xuất': lot.mfgDate,
        'Hạn Sử Dụng': lot.expDate,
        'Tồn Hiện Tại': lot.currentQty,
        'Đơn Vị': lot.uom,
        'Trạng Thái': lot.status,
        'Mã Lô NCC': lot.supplierLot
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Lo');
      XLSX.writeFile(wb, `NexusSync_Lots_${new Date().toISOString().slice(0, 10)}.xlsx`);
      onNotify('success', 'Xuất File Excel Thành Công', 'Đã xuất dữ liệu lô hàng ra file Excel.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể xuất dữ liệu ra file Excel.');
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLotPayload = {
      batchNumber: newBatchNo,
      sku: newSku,
      productName: newProductName,
      category: 'Vật tư tiêu chuẩn',
      warehouse: newWarehouse,
      mfgDate: new Date().toISOString().slice(0, 10),
      expDate: newExpDate,
      initialQty: parseInt(newQty) || 0,
      uom: 'Cái',
      supplierLot: `SUP-${new Date().getTime().toString().slice(-5)}`
    };

    try {
      const res = await fetch('/api/inventory/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLotPayload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLots(prev => [json.data, ...prev]);
          setIsModalOpen(false);
          onNotify('success', 'Tạo Lô Thành Công', `Đã lưu lô ${json.data.batchNumber} vào hệ thống cơ sở dữ liệu.`);
          return;
        }
      }
    } catch (err) {
      console.error('API create lot error:', err);
    }

    // Fallback local
    const fallbackLot: LotItem = {
      id: `LOT-${new Date().getTime()}`,
      ...newLotPayload,
      currentQty: parseInt(newQty) || 0,
      status: 'ACTIVE'
    };
    setLots(prev => [fallbackLot, ...prev]);
    setIsModalOpen(false);
    onNotify('success', 'Tạo Lô Thành Công', `Đã tạo lô ${fallbackLot.batchNumber} thành công.`);
  };

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const filteredLots = useMemo(() => {
    const now = new Date();

    return lots.filter(lot => {
      // 1. Full text search
      const matchSearch = 
        !searchQuery.trim() ||
        lot.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lot.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lot.supplierLot && lot.supplierLot.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Expiry status filter
      const matchStatus = statusFilter === 'ALL' || lot.status === statusFilter;

      // 3. Warehouse filter
      const matchWarehouse = warehouseFilter === 'ALL' || lot.warehouse === warehouseFilter;

      // 4. Warehouse Zone / Location Bin filter
      let matchZone = true;
      if (zoneFilter !== 'ALL') {
        const loc = (lot.zoneLocation || lot.warehouse || '').toUpperCase();
        if (zoneFilter === 'ZONE-A') {
          matchZone = loc.includes('BIN-A') || loc.includes('KHU A') || loc.includes('HÀ NỘI');
        } else if (zoneFilter === 'ZONE-B') {
          matchZone = loc.includes('BIN-B') || loc.includes('KHU B') || loc.includes('NAM');
        } else if (zoneFilter === 'ZONE-C') {
          matchZone = loc.includes('BIN-C') || loc.includes('KHU C') || loc.includes('CNC');
        } else if (zoneFilter === 'ZONE-D') {
          matchZone = loc.includes('BIN-D') || loc.includes('KHU D') || loc.includes('KIM LOẠI');
        }
      }

      // 5. Production Date Range filter (mfgDate)
      let matchMfgDate = true;
      if (mfgStartDate && lot.mfgDate) {
        matchMfgDate = matchMfgDate && lot.mfgDate >= mfgStartDate;
      }
      if (mfgEndDate && lot.mfgDate) {
        matchMfgDate = matchMfgDate && lot.mfgDate <= mfgEndDate;
      }

      // 6. Expiry Horizon Filter
      let matchExpiryHorizon = true;
      if (expiryHorizonFilter !== 'ALL' && lot.expDate) {
        const expDate = new Date(lot.expDate);
        const daysToExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (expiryHorizonFilter === 'EXPIRED') {
          matchExpiryHorizon = daysToExpiry < 0;
        } else if (expiryHorizonFilter === 'UNDER_30') {
          matchExpiryHorizon = daysToExpiry >= 0 && daysToExpiry <= 30;
        } else if (expiryHorizonFilter === 'UNDER_90') {
          matchExpiryHorizon = daysToExpiry >= 0 && daysToExpiry <= 90;
        } else if (expiryHorizonFilter === 'OVER_365') {
          matchExpiryHorizon = daysToExpiry > 365;
        }
      }

      return matchSearch && matchStatus && matchWarehouse && matchZone && matchMfgDate && matchExpiryHorizon;
    });
  }, [lots, searchQuery, statusFilter, warehouseFilter, zoneFilter, mfgStartDate, mfgEndDate, expiryHorizonFilter]);

  const pagination = usePagination({
    totalItems: filteredLots.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedLots = useMemo(() => {
    return pagination.paginatedData(filteredLots);
  }, [filteredLots, pagination]);

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Đang Hoạt Động', className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' },
    EXPIRED_SOON: { label: 'Cảnh Báo Hạn', className: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' },
    EXPIRED: { label: 'Đã Hết Hạn', className: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' },
    QUARANTINED: { label: 'Đang Biệt Ly (QC)', className: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-bold' },
    DEPLETED: { label: 'Đã Xuất Hết', className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 font-semibold' }
  };

  const handleQuarantine = (lot: LotItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Đưa Lô ${lot.batchNumber} Vào Biệt Ly (Quarantine)?`,
      message: `Hành động này sẽ khóa xuất kho cho toàn bộ số lượng ${lot.currentQty} ${lot.uom} còn lại của lô này để phục vụ công tác kiểm tra chất lượng (Rule #19).`,
      onConfirm: () => {
        setLots(prev => prev.map(l => l.id === lot.id ? { ...l, status: 'QUARANTINED' as any } : l));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('warning', 'Đã Biệt Ly Lô', `Lô ${lot.batchNumber} đã chuyển sang trạng thái chờ QC.`);
      }
    });
  };

  const handleDelete = (lot: LotItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xóa Lô ${lot.batchNumber}?`,
      message: `Cảnh báo: Hành động xóa lô (Soft Delete) sẽ ẩn lô này khỏi hệ thống. Nếu lô đã có lịch sử xuất/nhập, bạn không nên xóa (Rule #19).`,
      onConfirm: () => {
        setLots(prev => prev.filter(l => l.id !== lot.id));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Đã Xóa Lô', `Đã xóa lô ${lot.batchNumber} thành công.`);
      }
    });
  };

  return (
    <div className="space-y-3.5">
      {/* L1: COMMAND BAR & FILTER STRIP */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col gap-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-1 items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Quick Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã Lô, SKU, Tên SP, NCC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="ACTIVE">Đang Hoạt Động (Hạn Tốt)</option>
              <option value="EXPIRED_SOON">Cảnh Báo Cận Hạn (&le; 45 ngày)</option>
              <option value="EXPIRED">Đã Hết Hạn</option>
              <option value="QUARANTINED">Biệt Ly (QC Lock)</option>
              <option value="DEPLETED">Đã Xuất Hết</option>
            </select>

            {/* Warehouse Quick Filter */}
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả Kho Lưu Trữ</option>
              {warehouseOptions.map(wh => (
                <option key={wh} value={wh}>{wh}</option>
              ))}
            </select>

            {/* Toggle Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border cursor-pointer ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Bộ Lọc Nâng Cao</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Reset All Filters button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Xóa tất cả các điều kiện lọc"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button onClick={handleExportExcel} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 cursor-pointer">
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button 
              className="flex-1 md:flex-none px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => { setNewBatchNo(`LOT-2026-0${lots.length + 1}`); setNewSku(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || ''); setNewProductName(ENTERPRISE_MASTER_PRODUCTS[0]?.name || ''); setIsModalOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Lô Mới</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE ADVANCED FILTER PANEL */}
        {showAdvancedFilters && (
          <div className="mt-1 pt-3 border-t border-slate-100 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            {/* 1. Production Date Range (mfgDate) */}
            <div className="md:col-span-5 space-y-1.5 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Khoảng Ngày Sản Xuất (NSX)</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button onClick={() => applyDatePreset('30days')} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer">30 ngày</button>
                  <button onClick={() => applyDatePreset('2026')} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer">Năm 2026</button>
                  <button onClick={() => applyDatePreset('2025')} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer">Năm 2025</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Từ ngày NSX:</span>
                  <input
                    type="date"
                    value={mfgStartDate}
                    onChange={(e) => setMfgStartDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Đến ngày NSX:</span>
                  <input
                    type="date"
                    value={mfgEndDate}
                    onChange={(e) => setMfgEndDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Expiry Horizon & Risk Level */}
            <div className="md:col-span-4 space-y-1.5 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Phân Nhóm Hạn Sử Dụng (HSD)</span>
              </label>
              <select
                value={expiryHorizonFilter}
                onChange={(e) => setExpiryHorizonFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white"
              >
                <option value="ALL">Tất cả khoảng hạn dùng</option>
                <option value="EXPIRED">Đã quá hạn sử dụng (&lt; 0 ngày)</option>
                <option value="UNDER_30">Cực kỳ khẩn cấp (&le; 30 ngày)</option>
                <option value="UNDER_90">Cần ưu tiên xuất FEFO (&le; 90 ngày)</option>
                <option value="OVER_365">Hạn dài an toàn (&gt; 1 năm)</option>
              </select>
              <p className="text-[10px] text-slate-500">
                Tự động tính số ngày còn lại đến hạn để đề xuất xuất kho.
              </p>
            </div>

            {/* 3. Warehouse Zone & Location Bin */}
            <div className="md:col-span-3 space-y-1.5 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Phân Khu Vị Trí (Zone / Bin)</span>
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white"
              >
                {zoneOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Lọc theo dãy kệ và phân khu quy hoạch.
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE FILTER TAGS CHIPS */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Đang lọc theo:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                Từ khóa: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                Trạng thái: {statusBadgeMap[statusFilter]?.label || statusFilter}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            {warehouseFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                Kho: {warehouseFilter}
                <button onClick={() => setWarehouseFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            {zoneFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">
                Khu vực: {zoneOptions.find(z => z.value === zoneFilter)?.label}
                <button onClick={() => setZoneFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            {(mfgStartDate || mfgEndDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800 font-mono">
                NSX: {mfgStartDate || '...'} &rarr; {mfgEndDate || '...'}
                <button onClick={() => { setMfgStartDate(''); setMfgEndDate(''); }} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            {expiryHorizonFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-800">
                Hạn dùng: {
                  expiryHorizonFilter === 'EXPIRED' ? 'Đã quá hạn' :
                  expiryHorizonFilter === 'UNDER_30' ? 'Cận hạn <= 30 ngày' :
                  expiryHorizonFilter === 'UNDER_90' ? 'Cận hạn <= 90 ngày' : 'Hạn dài > 1 năm'
                }
                <button onClick={() => setExpiryHorizonFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            )}

            <span className="text-slate-500 font-mono ml-auto">
              Hiển thị <strong>{filteredLots.length}</strong> / {lots.length} lô
            </span>
          </div>
        )}
      </div>

      {/* L2: KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Số Lô Quản Lý
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {lots.length} <span className="text-xs font-sans font-normal text-slate-500">lô</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lô Đang Hoạt Động
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {lots.filter(l => l.status === 'ACTIVE').length} <span className="text-xs font-sans font-normal text-slate-500">lô</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cảnh Báo Hết Hạn
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
              {lots.filter(l => l.status === 'EXPIRED_SOON').length} <span className="text-xs font-sans font-normal text-slate-500">lô</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Hết Hạn / Quarantined
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
              {lots.filter(l => l.status === 'EXPIRED' || l.status === 'QUARANTINED').length} <span className="text-xs font-sans font-normal text-slate-500">lô</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* L3: DATA GRID & ENTERPRISE TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedLots.length === 0}
          emptyMessage="Không tìm thấy dữ liệu lô hàng nào phù hợp với bộ lọc."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã Lô (Batch No) / NCC</th>
                  <th className="p-3">Sản Phẩm (SKU & Tên)</th>
                  <th className="p-3">Kho & Vị Trí</th>
                  <th className="p-3 text-center">NSX & HSD</th>
                  <th className="p-3 text-right">Tồn Hiện Tại</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedLots.map((lot, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;
                  
                  return (
                    <tr
                      key={lot.id}
                      onClick={() => {
                        if (onViewDrilldown) onViewDrilldown(lot);
                        if (onSelectEntity) onSelectEntity(lot);
                      }}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                        lot.status === 'ACTIVE' ? 'border-l-4 border-transparent' :
                        lot.status === 'EXPIRED_SOON' ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10' :
                        lot.status === 'EXPIRED' ? 'border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/10' :
                        lot.status === 'QUARANTINED' ? 'border-l-4 border-purple-500 bg-purple-50/15 dark:bg-purple-950/10' :
                        'border-l-4 border-transparent'
                      }`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>
                      
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {lot.batchNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          NCC: {lot.supplierLot}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {lot.sku}
                        </div>
                        <div className="font-semibold text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                          {lot.productName}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {lot.warehouse}
                        </div>
                        {lot.zoneLocation && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {lot.zoneLocation}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          NSX: {lot.mfgDate}
                        </div>
                        <div className={`font-mono text-[11px] font-bold mt-0.5 ${
                          lot.status === 'EXPIRED' ? 'text-rose-600 dark:text-rose-400' :
                          lot.status === 'EXPIRED_SOON' ? 'text-amber-600 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          HSD: {lot.expDate}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                          {lot.currentQty.toLocaleString('vi-VN')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Ban đầu: {lot.initialQty.toLocaleString('vi-VN')} {lot.uom}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full border inline-flex items-center gap-1 ${statusBadgeMap[lot.status]?.className}`}>
                          <span>{statusBadgeMap[lot.status]?.label}</span>
                        </span>
                      </td>

                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {onViewTraceability && (
                            <button
                              onClick={() => onViewTraceability(lot)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg transition-colors cursor-pointer"
                              title="Xem Đồ Thị D3 Truy Xuất WO Tiêu Hao"
                            >
                              <Network className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLotForDrilldown(lot);
                              if (onSelectEntity) onSelectEntity(lot);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Chi tiết lô hàng & Biến động kho"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {lot.status !== 'QUARANTINED' && lot.status !== 'EXPIRED' && (
                            <button
                              onClick={() => handleQuarantine(lot)}
                              className="p-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg transition-colors cursor-pointer"
                              title="Biệt ly cách ly (Quarantine)"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(lot)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                            title="Xóa lô hàng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </L3ContentState>

        {/* L4: PAGINATION */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <PaginationControl pagination={pagination} />
        </div>
      </div>

      {/* CREATE LOT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Khởi Tạo Lô Hàng Mới (New Batch / Lot)</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mã Lô (Batch No) *</label>
                  <input
                    type="text"
                    required
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kho Lưu Trữ *</label>
                  <select
                    value={newWarehouse}
                    onChange={(e) => setNewWarehouse(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {warehouseOptions.map(wh => (
                      <option key={wh} value={wh}>{wh}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Chọn Vật Tư / Sản Phẩm (SKU Master) *</label>
                <select
                  value={newSku}
                  onChange={(e) => {
                    const found = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === e.target.value);
                    setNewSku(e.target.value);
                    if (found) setNewProductName(found.name);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  {ENTERPRISE_MASTER_PRODUCTS.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Số Lượng Ban Đầu *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hạn Sử Dụng (EXP Date) *</label>
                  <input
                    type="date"
                    required
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Tạo Lô</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      
    </div>
  );
};

