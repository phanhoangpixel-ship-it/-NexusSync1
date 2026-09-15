import React, { useState, useMemo } from 'react';
import { 
  Boxes, Barcode, QrCode, Search, Filter, RefreshCw, CheckCircle2, 
  AlertTriangle, ShieldAlert, Edit3, Save, Check, X, ArrowRight, 
  MapPin, Eye, Lock, Unlock, Sliders, ShieldCheck, Download
} from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';

export interface FieldCountItem {
  id: string;
  sessionCode: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  binLocation: string;
  lpnCode: string;
  systemQty: number; // Sổ sách
  blindMode: boolean; // Nếu true, ẩn systemQty đối với kiểm đếm viên
  actualQty: number | null; // Số thực tế đếm
  recountQty: number | null; // Số đếm lại lần 2
  variance: number;
  varianceValue: number;
  countedBy: string;
  countedAt: string;
  status: 'PENDING' | 'COUNTING' | 'COUNTED' | 'RECOUNT_REQUIRED';
  sealCondition: 'INTACT' | 'BROKEN' | 'NONE';
  notes: string;
}

interface StocktakeFieldExecutionTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  defaultSessionId?: string;
}

export const StocktakeFieldExecutionTab: React.FC<StocktakeFieldExecutionTabProps> = ({ 
  onNotify,
  defaultSessionId 
}) => {
  const [items, setItems] = useState<FieldCountItem[]>([
    {
      id: 'FCI-001',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-ENG-088',
      productName: 'Động cơ servo AC 750W Delta',
      category: 'Động cơ & Biến tần',
      uom: 'Bộ',
      binLocation: 'BIN-A01-01',
      lpnCode: 'LPN-2026-0881',
      systemQty: 120,
      blindMode: true,
      actualQty: 120,
      recountQty: null,
      variance: 0,
      varianceValue: 0,
      countedBy: 'Nguyễn Văn Kiểm',
      countedAt: '08/09/2026 09:15',
      status: 'COUNTED',
      sealCondition: 'INTACT',
      notes: 'Nguyên kiện pallet, tem niêm phong còn hạn'
    },
    {
      id: 'FCI-002',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-PLC-102',
      productName: 'Bộ lập trình PLC Siemens S7-1200',
      category: 'Tự động hóa',
      uom: 'Bộ',
      binLocation: 'BIN-A01-02',
      lpnCode: 'LPN-2026-0882',
      systemQty: 45,
      blindMode: true,
      actualQty: 43,
      recountQty: null,
      variance: -2,
      varianceValue: -4500000,
      countedBy: 'Nguyễn Văn Kiểm',
      countedAt: '08/09/2026 09:40',
      status: 'COUNTED',
      sealCondition: 'BROKEN',
      notes: 'Thùng carton mở nắp, đếm thực tế thiếu 2 bộ so với thẻ kho'
    },
    {
      id: 'FCI-003',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-SEN-305',
      productName: 'Cảm biến quang điện Panasonic',
      category: 'Thiết bị điện',
      uom: 'Cái',
      binLocation: 'BIN-A02-01',
      lpnCode: 'LPN-2026-0883',
      systemQty: 310,
      blindMode: true,
      actualQty: null,
      recountQty: null,
      variance: 0,
      varianceValue: 0,
      countedBy: 'Chưa phân công',
      countedAt: '—',
      status: 'PENDING',
      sealCondition: 'NONE',
      notes: ''
    },
    {
      id: 'FCI-004',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-INV-204',
      productName: 'Biến tần Inverter 3 pha 380V Mitsubishi',
      category: 'Động cơ & Biến tần',
      uom: 'Cái',
      binLocation: 'BIN-A02-02',
      lpnCode: 'LPN-2026-0884',
      systemQty: 28,
      blindMode: true,
      actualQty: null,
      recountQty: null,
      variance: 0,
      varianceValue: 0,
      countedBy: 'Chưa phân công',
      countedAt: '—',
      status: 'PENDING',
      sealCondition: 'NONE',
      notes: ''
    },
    {
      id: 'FCI-005',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-CBL-501',
      productName: 'Cáp tín hiệu chống nhiễu 2x1.5',
      category: 'Vật tư phụ',
      uom: 'Mét',
      binLocation: 'BIN-B01-01',
      lpnCode: 'LPN-2026-0885',
      systemQty: 1500,
      blindMode: true,
      actualQty: 1500,
      recountQty: null,
      variance: 0,
      varianceValue: 0,
      countedBy: 'Trần Văn Nam',
      countedAt: '08/09/2026 10:10',
      status: 'COUNTED',
      sealCondition: 'INTACT',
      notes: 'Khớp 3 cuộn nguyên 500m'
    },
    {
      id: 'FCI-006',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-VAL-012',
      productName: 'Van điện từ khí nén 24V SMC',
      category: 'Khí nén',
      uom: 'Cái',
      binLocation: 'BIN-B02-01',
      lpnCode: 'LPN-2026-0886',
      systemQty: 80,
      blindMode: true,
      actualQty: 82,
      recountQty: null,
      variance: 2,
      varianceValue: 1200000,
      countedBy: 'Trần Văn Nam',
      countedAt: '08/09/2026 10:30',
      status: 'COUNTED',
      sealCondition: 'INTACT',
      notes: 'Dôi dư 2 cái'
    }
  ]);

  const [activeSessionCode, setActiveSessionCode] = useState('STK-HN-2026-09A');
  const [searchTerm, setSearchTerm] = useState('');
  const [binFilter, setBinFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sealFilter, setSealFilter] = useState('ALL');

  // Input count editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempActualQty, setTempActualQty] = useState<string>('');
  const [tempSeal, setTempSeal] = useState<'INTACT' | 'BROKEN' | 'NONE'>('INTACT');
  const [tempNotes, setTempNotes] = useState<string>('');

  // Quick Barcode Scan Input
  const [scannedBarcode, setScannedBarcode] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm Dialog (Rule #19 Compliance)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Làm Mới Bàn Kiểm Đếm', 'Đã tải dữ liệu hiện trường và đồng bộ trạng thái đếm mới nhất.');
    }, 450);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.binLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.lpnCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBin = binFilter === 'ALL' || i.binLocation.startsWith(binFilter);
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      const matchSeal = sealFilter === 'ALL' || i.sealCondition === sealFilter;
      return matchSearch && matchBin && matchStatus && matchSeal;
    });
  }, [items, searchTerm, binFilter, statusFilter, sealFilter]);

  const pagination = usePagination({
    totalItems: filteredItems.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredItems);
  }, [filteredItems, pagination]);

  const handleStartEdit = (item: FieldCountItem) => {
    setEditingItemId(item.id);
    setTempActualQty(item.actualQty !== null ? item.actualQty.toString() : '');
    setTempSeal(item.sealCondition);
    setTempNotes(item.notes);
  };

  const handleSaveCount = (item: FieldCountItem) => {
    const parsedQty = parseFloat(tempActualQty);
    if (isNaN(parsedQty) || parsedQty < 0) {
      onNotify('warning', 'Số Lượng Không Hợp Lệ', 'Vui lòng nhập số lượng đếm thực tế lớn hơn hoặc bằng 0.');
      return;
    }

    const variance = parsedQty - item.systemQty;
    // Estimated unit cost ~ 2,250,000 VND for sample variance valuation
    const estimatedUnitCost = 2250000;
    const varianceValue = variance * estimatedUnitCost;

    setItems(prev => prev.map(i => {
      if (i.id !== item.id) return i;
      return {
        ...i,
        actualQty: parsedQty,
        variance,
        varianceValue,
        sealCondition: tempSeal,
        notes: tempNotes,
        status: 'COUNTED',
        countedBy: 'Nguyễn Văn Kiểm (KTV Hiện trường)',
        countedAt: new Date().toLocaleString('vi-VN')
      };
    }));

    setEditingItemId(null);
    onNotify('success', 'Đã Ghi Nhận Số Đếm', `Cập nhật số đếm cho SKU ${item.sku} tại vị trí ${item.binLocation} thành công.`);
  };

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode.trim()) return;

    const matched = items.find(i => 
      i.sku.toLowerCase() === scannedBarcode.trim().toLowerCase() ||
      i.lpnCode.toLowerCase() === scannedBarcode.trim().toLowerCase() ||
      i.binLocation.toLowerCase() === scannedBarcode.trim().toLowerCase()
    );

    if (matched) {
      handleStartEdit(matched);
      onNotify('info', 'Tìm Thấy Mã Vạch', `Đã định vị SKU ${matched.sku} tại ${matched.binLocation}. Hãy nhập số lượng thực tế.`);
    } else {
      onNotify('warning', 'Không Khớp Mã Vạch', `Mã "${scannedBarcode}" không thuộc phiên kiểm kê hiện tại.`);
    }
    setScannedBarcode('');
  };

  const handleLockAllCounts = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khóa Toàn Bộ Số Đếm & Chuyển Sang Bàn Đối Soát?',
      message: 'Sau khi khóa, kiểm đếm viên hiện trường sẽ không thể chỉnh sửa số lượng thực tế nữa. Phiên sẽ chuyển sang bước Phân Tích Chênh Lệch (Variance Reconciliation).',
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Đã Khóa Số Đếm Hiện Trường', 'Toàn bộ dữ liệu kiểm kê đã được đóng băng và gửi sang Bàn Đối Soát.');
      }
    });
  };

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* L1: BARCODE SCANNER TOOLBAR & COMMAND BAR                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
        {/* Top Scan Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                  {activeSessionCode}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Bàn Thực Thi Kiểm Đếm Mù Hiện Trường (Blind Count Desk)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Chế độ đếm mù: Số lượng sổ sách được ẩn tự động để đảm bảo tính khách quan và chuẩn mực kiểm toán.
              </p>
            </div>
          </div>

          {/* Quick Scanner Input */}
          <form onSubmit={handleScanBarcode} className="flex items-center gap-1.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Quét mã SKU / LPN / Bin..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              Tìm SKU
            </button>
          </form>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-1 items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Tìm SKU, tên sản phẩm, LPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <select
              value={binFilter}
              onChange={(e) => setBinFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả Vị Trí (Bin)</option>
              <option value="BIN-A01">Khu Vực A01</option>
              <option value="BIN-A02">Khu Vực A02</option>
              <option value="BIN-B01">Khu Vực B01</option>
              <option value="BIN-B02">Khu Vực B02</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="PENDING">Chờ Kiểm Đếm</option>
              <option value="COUNTED">Đã Ghi Nhận Số Đếm</option>
            </select>

            <select
              value={sealFilter}
              onChange={(e) => setSealFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tình Trạng Niêm Phong</option>
              <option value="INTACT">Còn Nguyên Niêm Phong</option>
              <option value="BROKEN">Đã Mở / Rách Niêm Phong</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLockAllCounts}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa Đếm &amp; Gửi Đối Soát</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS (COMPACT & PROPORTIONAL)                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng SKU Cần Đếm</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {items.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">vị trí kệ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đã Ghi Nhận Số Đếm</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {items.filter(i => i.status === 'COUNTED').length}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ({Math.round((items.filter(i => i.status === 'COUNTED').length / items.length) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chờ Kiểm Đếm Hiện Trường</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {items.filter(i => i.status === 'PENDING').length}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">vị trí còn lại</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Niêm Phong Bất Thường</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {items.filter(i => i.sealCondition === 'BROKEN').length}
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">cần lập biên bản</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredItems.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy mặt hàng kiểm đếm nào"
        emptyDescription="Hãy kiểm tra lại bộ lọc tìm kiếm hoặc quét lại mã vạch vị trí/sản phẩm."
        emptyAction={{
          label: 'Đặt lại bộ lọc tìm kiếm',
          onClick: () => {
            setSearchTerm('');
            setBinFilter('ALL');
            setStatusFilter('ALL');
            setSealFilter('ALL');
          },
          variant: 'outline'
        }}
        skeletonRows={6}
        minHeight="min-h-[380px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[110px]">Vị Trí Kệ / LPN</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Sản Phẩm &amp; SKU</th>
                  <th className="py-2.5 px-2 text-center w-14">ĐVT</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Tồn Sổ Sách (Blind)</th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">Thực Tế Đếm (Actual)</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Niêm Phong</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Người Đếm &amp; Giờ</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedItems.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const isCounted = item.status === 'COUNTED' || item.status === 'VERIFIED';
                  const isRecount = item.status === 'RECOUNT_REQUIRED';
                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isEditing 
                          ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80 shadow-2xs' 
                          : isRecount
                          ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                          : isCounted
                          ? 'border-l-4 border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                            {item.binLocation}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {item.lpnCode}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {item.sku}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-1">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          {item.category}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                        {item.uom}
                      </td>

                      {/* Blind Count Cell */}
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                        {item.blindMode && item.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium italic bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 text-[11px]">
                            <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Ẩn Số Liệu
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.systemQty.toLocaleString('vi-VN')}
                          </span>
                        )}
                      </td>

                      {/* Actual Count Input Cell */}
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-blue-400 dark:border-blue-500 shadow-sm">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tempActualQty}
                              onChange={(e) => setTempActualQty(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCount(item);
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                              autoFocus
                              placeholder="0"
                              className="w-24 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 pr-1">
                              {item.uom}
                            </span>
                            <button
                              onClick={() => handleSaveCount(item)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs"
                              title="Lưu số đếm (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {item.actualQty !== null ? (
                              <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-950 dark:bg-blue-900/70 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                                {item.actualQty.toLocaleString('vi-VN')} {item.uom}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                                Chưa nhập đếm
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Seal Condition */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={tempSeal}
                            onChange={(e) => setTempSeal(e.target.value as any)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="INTACT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Còn Niêm Phong</option>
                            <option value="BROKEN" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Đã Mở / Rách</option>
                            <option value="NONE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Không Niêm Phong</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.sealCondition === 'INTACT'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                              : item.sealCondition === 'BROKEN'
                                ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                                : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                          }`}>
                            {item.sealCondition === 'INTACT' ? 'Nguyên Vẹn' : item.sealCondition === 'BROKEN' ? 'Rách Niêm' : 'Không Áp Dụng'}
                          </span>
                        )}
                      </td>

                      {/* Operator & Timestamp */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.countedBy}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {item.countedAt}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveCount(item)}
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Lưu số đếm"
                            >
                              <Check className="w-3 h-3" /> Lưu
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="px-2 py-1 text-[11px] font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Hủy thao tác"
                            >
                              <X className="w-3 h-3" /> Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{item.actualQty !== null ? 'Sửa Đếm' : 'Nhập Đếm'}</span>
                          </button>
                        )}
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
              totalItems={filteredItems.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Rule #19 Compliance)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog 
        state={confirmDialog} 
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};
