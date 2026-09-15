import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, Search, Filter, RefreshCw, FileSpreadsheet, Download, 
  Eye, QrCode, Barcode, ShieldAlert, AlertTriangle, CheckCircle2, 
  ArrowLeftRight, ClipboardCheck, Clock, ShieldCheck, Tag, Info, 
  Boxes, ChevronRight, X, ExternalLink, SlidersHorizontal, ArrowDownUp,
  Layers, Warehouse, MapPin, DollarSign, Activity, AlertOctagon, Printer,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ENTERPRISE_MASTER_PRODUCTS, EnterpriseProduct } from '../../../../data/enterpriseMaster';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';

export interface WarehouseProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  zone: string;
  aisle: string;
  rack: string;
  binLocation: string;
  lotNo: string;
  mfgDate: string;
  expDate: string;
  daysToExpiry: number;
  physicalQty: number;      // Tồn vật lý thực tế
  reservedQty: number;      // Tồn đang giữ chỗ theo SO/WO
  availableQty: number;     // Tồn khả dụng thực xuất (ATP)
  incomingQty: number;      // Đang trên đường về theo PO
  minStock: number;         // Định mức tồn an toàn tối thiểu
  maxStock: number;         // Định mức tồn an toàn tối đa
  unit: string;             // Đơn vị tính cơ bản
  packSpec: string;         // Quy cách đóng gói
  unitCost: number;         // Giá vốn bình quân (VNĐ)
  totalValue: number;       // Tổng giá trị tồn kho (VNĐ)
  storageCondition: string; // Điều kiện bảo quản
  qualityStatus: 'READY' | 'INSPECTING' | 'QUARANTINED' | 'CLOSED';
  inventoryHealth: 'NORMAL' | 'LOW_STOCK' | 'OVER_STOCK' | 'NEAR_EXPIRY' | 'LOCKED';
  lastMovementDate: string;
  imageUrl?: string;
}

// Transform Enterprise Master Products into Full WMS Dataset
export function mapEnterpriseProductsToWms(items: EnterpriseProduct[]): WarehouseProductItem[] {
  const warehouses = [
    { id: 'WH-HCM-01', name: 'Kho Tổng Trung Tâm (TP.HCM)', zone: 'Zone A - Kho Điện Tử & Thiết Bị', aisle: 'Aisle 01', rack: 'Rack 02', binPrefix: 'BIN-A1' },
    { id: 'WH-HN-02', name: 'Kho Vận Trung Chuyển (Hà Nội)', zone: 'Zone H - Cơ Khí & Tự Động Hóa', aisle: 'Aisle 02', rack: 'Rack 04', binPrefix: 'BIN-H2' },
    { id: 'WH-DN-04', name: 'Kho Hàng Miền Trung (Đà Nẵng)', zone: 'Zone D - Tổng Hợp', aisle: 'Aisle 01', rack: 'Rack 01', binPrefix: 'BIN-D1' },
    { id: 'WH-COLD-03', name: 'Kho Lạnh & Phòng Sạch (Bình Dương)', zone: 'Zone S - Phòng Sạch ESD', aisle: 'Aisle 01', rack: 'Rack 03', binPrefix: 'BIN-S1' },
  ];

  const warehouseMap: Record<string, typeof warehouses[0]> = {
    'WH-HCM-01': warehouses[0],
    'WH-HN-02': warehouses[1],
    'WH-DN-04': warehouses[2],
    'WH-COLD-03': warehouses[3],
  };

  return items.map((p, idx) => {
    const wh = (p.warehouseId && warehouseMap[p.warehouseId]) ? warehouseMap[p.warehouseId] : warehouses[idx % warehouses.length];
    const physical = p.stock || 50;
    const reservedValues = [2, 3, 5, 5, 7, 12, 2, 18, 225, 5, 3, 18, 13, 9, 187, 645, 149];
    const reserved = reservedValues[idx % reservedValues.length];
    const available = Math.max(0, physical - reserved);
    const incoming = Math.floor(physical * 0.3);
    const minStock = 2;
    const maxStock = Math.max(100, physical * 3);
    const unitCost = p.costPrice || 100000;
    const totalValue = physical * unitCost;

    let inventoryHealth: 'NORMAL' | 'LOW_STOCK' | 'OVER_STOCK' | 'NEAR_EXPIRY' | 'LOCKED' = 'NORMAL';
    if (available <= minStock) inventoryHealth = 'LOW_STOCK';
    else if (physical >= maxStock * 0.9) inventoryHealth = 'OVER_STOCK';

    const expDate = 'Không thời hạn';
    const daysToExpiry = 9999;

    let packSpec = p.packSpec || 'Hộp tiêu chuẩn 1 Cái';
    let storageCondition = p.storageCondition || 'Nhiệt độ phòng 20°C - 30°C, Khô ráo';
    const qualityStatus: 'READY' | 'INSPECTING' | 'QUARANTINED' | 'CLOSED' = 'READY';

    if (!p.packSpec) {
      if (p.category === 'Thiết bị CNTT' || p.category === 'Phụ kiện') {
        packSpec = 'Thùng carton chống tĩnh điện ESD';
      }
    }

    if (!p.storageCondition) {
      if (p.category === 'Thiết bị CNTT') {
        storageCondition = 'Kho khô mát, Tránh ẩm, Nhiệt độ < 28°C';
      }
    }

    const binLocation = p.binLocation || `${wh.binPrefix}-${String((idx % 12) + 1).padStart(2, '0')}`;
    const lotNo = p.lotNo || `LOT-2026-${p.sku.replace(/[^a-zA-Z0-9]/g, '')}`;

    return {
      id: `WMS-PRD-${String(idx + 1).padStart(3, '0')}`,
      sku: p.sku,
      barcode: `893850${String(1000000 + idx * 79).slice(1)}`,
      name: p.name,
      category: p.category || 'Chung',
      warehouseId: wh.id,
      warehouseName: wh.name,
      zone: wh.zone,
      aisle: wh.aisle,
      rack: wh.rack,
      binLocation,
      lotNo,
      mfgDate: '15/01/2026',
      expDate,
      daysToExpiry,
      physicalQty: physical,
      reservedQty: reserved,
      availableQty: available,
      incomingQty: incoming,
      minStock,
      maxStock,
      unit: p.unit || 'Cái',
      packSpec,
      unitCost,
      totalValue,
      storageCondition,
      qualityStatus,
      inventoryHealth,
      lastMovementDate: '09/09/2026 00:30',
      imageUrl: p.imageUrl
    };
  });
}

// Initial dataset aligned with Enterprise Master Products from localStorage if available
export const getInitialWarehouseProducts = (): WarehouseProductItem[] => {
  try {
    const saved = localStorage.getItem('NEXUSSYNC_ERP_ITEM_MASTER');
    if (saved) {
      const parsed = JSON.parse(saved);
      return mapEnterpriseProductsToWms(parsed);
    }
  } catch (e) {
    console.error(e);
  }
  return mapEnterpriseProductsToWms(ENTERPRISE_MASTER_PRODUCTS);
};

export const INITIAL_WAREHOUSE_PRODUCTS: WarehouseProductItem[] = getInitialWarehouseProducts();

interface WarehouseProductsTabProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  handleNavigateToModule: (route: string, moduleId: string, actionDesc: string) => void;
  onRequestConfirm?: (config: ConfirmDialogState) => void;
}

export const WarehouseProductsTab: React.FC<WarehouseProductsTabProps> = ({
  onSelectEntity,
  onNotify,
  handleNavigateToModule,
  onRequestConfirm,
}) => {
  // State
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_WAREHOUSE_PRODUCTS);
  const [searchKeyword, setSearchKeyword] = useState(() => {
    try {
      return localStorage.getItem('nexussync_m17_search_query') || '';
    } catch {
      return '';
    }
  });
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState(searchKeyword);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      try {
        localStorage.setItem('nexussync_m17_search_query', searchKeyword);
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [searchKeyword]);
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'sku' | 'name' | 'availableQty' | 'totalValue' | 'expDate'>('totalValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeSkuId, setActiveSkuId] = useState<string | null>(null);

  // Modals / Drawers
  const [selectedProductForCard, setSelectedProductForCard] = useState<WarehouseProductItem | null>(null);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<WarehouseProductItem | null>(null);
  const [quickPreviewProduct, setQuickPreviewProduct] = useState<WarehouseProductItem | null>(null);

  // Sync products with M07 Item Master storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('NEXUSSYNC_ERP_ITEM_MASTER');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProducts(mapEnterpriseProductsToWms(parsed));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Extract unique filter lists
  const uniqueWarehouses = useMemo(() => {
    const set = new Set(products.map(p => JSON.stringify({ id: p.warehouseId, name: p.warehouseName })));
    return Array.from(set).map(item => JSON.parse(item));
  }, [products]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Keyword search
      if (debouncedSearchKeyword.trim()) {
        const kw = debouncedSearchKeyword.toLowerCase();
        const matchSku = p.sku.toLowerCase().includes(kw);
        const matchBarcode = p.barcode.toLowerCase().includes(kw);
        const matchName = p.name.toLowerCase().includes(kw);
        const matchLot = p.lotNo.toLowerCase().includes(kw);
        const matchBin = p.binLocation.toLowerCase().includes(kw);
        const matchWarehouse = p.warehouseName.toLowerCase().includes(kw);
        if (!matchSku && !matchBarcode && !matchName && !matchLot && !matchBin && !matchWarehouse) {
          return false;
        }
      }

      // 2. Warehouse Filter
      if (warehouseFilter !== 'ALL' && p.warehouseId !== warehouseFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
        return false;
      }

      // 4. Inventory Health Filter
      if (healthFilter !== 'ALL' && p.inventoryHealth !== healthFilter) {
        return false;
      }

      // 5. Quality Status Filter
      if (qualityFilter !== 'ALL' && p.qualityStatus !== qualityFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'sku') {
        comparison = a.sku.localeCompare(b.sku);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'availableQty') {
        comparison = a.availableQty - b.availableQty;
      } else if (sortBy === 'totalValue') {
        comparison = a.totalValue - b.totalValue;
      } else if (sortBy === 'expDate') {
        comparison = a.daysToExpiry - b.daysToExpiry;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, debouncedSearchKeyword, warehouseFilter, categoryFilter, healthFilter, qualityFilter, sortBy, sortOrder]);

  const pagination = usePagination({
    totalItems: filteredProducts.length,
    defaultPageSize: 25,
    syncWithUrl: true,
  });

  const paginatedProducts = useMemo(() => {
    return pagination.paginatedData(filteredProducts);
  }, [filteredProducts, pagination.paginatedData]);

  // Aggregate KPI Calculations (Global across all 17 SKUs)
  const metrics = useMemo(() => {
    const totalItems = products.length;
    const totalPhysical = products.reduce((sum, p) => sum + p.physicalQty, 0);
    const totalReserved = products.reduce((sum, p) => sum + p.reservedQty, 0);
    const totalAvailable = products.reduce((sum, p) => sum + p.availableQty, 0);
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStockCount = products.filter(p => p.inventoryHealth === 'LOW_STOCK').length;
    const nearExpiryCount = products.filter(p => p.inventoryHealth === 'NEAR_EXPIRY').length;
    const lockedCount = products.filter(p => p.inventoryHealth === 'LOCKED' || p.qualityStatus === 'QUARANTINED').length;

    return {
      totalItems,
      totalPhysical,
      totalReserved,
      totalAvailable,
      totalValue,
      lowStockCount,
      nearExpiryCount,
      lockedCount,
    };
  }, [products]);

  // Export Warehouse Products to Excel (.xlsx)
  const handleExportProductsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const exportRows = filteredProducts.map((p, idx) => ({
        'STT': idx + 1,
        'Mã SKU': p.sku,
        'Mã Vạch Barcode': p.barcode,
        'Tên Sản Phẩm': p.name,
        'Nhóm Hàng Hóa': p.category,
        'Mã Kho': p.warehouseId,
        'Tên Cơ Sở Kho': p.warehouseName,
        'Khu Vực (Zone)': p.zone,
        'Dãy (Aisle)': p.aisle,
        'Giá Kệ (Rack)': p.rack,
        'Vị Trí Ô Kệ (Bin)': p.binLocation,
        'Số Lô (Lot/Batch)': p.lotNo,
        'Ngày Sản Xuất': p.mfgDate,
        'Hạn Sử Dụng': p.expDate,
        'Số Ngày Còn Lại': p.daysToExpiry >= 9999 ? 'Không hạn' : `${p.daysToExpiry} ngày`,
        'Tồn Vật Lý (On-Hand)': p.physicalQty,
        'Đang Giữ Chỗ (Reserved)': p.reservedQty,
        'Khả Dụng Xuất (ATP)': p.availableQty,
        'Đang Về (Incoming)': p.incomingQty,
        'Đơn Vị Tính': p.unit,
        'Quy Cách Đóng Gói': p.packSpec,
        'Tồn An Toàn Min': p.minStock,
        'Tồn An Toàn Max': p.maxStock,
        'Đơn Giá Vốn (VNĐ)': p.unitCost,
        'Tổng Giá Trị Tồn (VNĐ)': p.totalValue,
        'Điều Kiện Bảo Quản': p.storageCondition,
        'Trạng Thái KCS': p.qualityStatus === 'READY' ? 'Sẵn sàng' : p.qualityStatus === 'INSPECTING' ? 'Chờ kiểm định' : p.qualityStatus === 'QUARANTINED' ? 'Niêm phong/Cách ly' : 'Đã đóng',
        'Tình Trạng Tồn Kho': p.inventoryHealth === 'NORMAL' ? 'Bình thường' : p.inventoryHealth === 'LOW_STOCK' ? 'Cảnh báo thiếu hụt' : p.inventoryHealth === 'NEAR_EXPIRY' ? 'Cận Hạn Sử Dụng' : 'Đang khóa/Cách ly',
        'Biến Động Gần Nhất': p.lastMovementDate,
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 16 }, // SKU
        { wch: 18 }, // Barcode
        { wch: 38 }, // Name
        { wch: 24 }, // Category
        { wch: 14 }, // WH ID
        { wch: 32 }, // WH Name
        { wch: 22 }, // Zone
        { wch: 14 }, // Aisle
        { wch: 14 }, // Rack
        { wch: 16 }, // Bin
        { wch: 20 }, // Lot
        { wch: 14 }, // MFG
        { wch: 14 }, // EXP
        { wch: 18 }, // Days left
        { wch: 22 }, // Physical
        { wch: 22 }, // Reserved
        { wch: 22 }, // Available
        { wch: 20 }, // Incoming
        { wch: 14 }, // UoM
        { wch: 30 }, // Pack spec
        { wch: 18 }, // Min
        { wch: 18 }, // Max
        { wch: 20 }, // Unit cost
        { wch: 24 }, // Total value
        { wch: 36 }, // Condition
        { wch: 20 }, // KCS
        { wch: 24 }, // Health
        { wch: 20 }, // Last movement
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Tồn Kho Sản Phẩm');

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `NexusSync_WMS_DanhSachSanPham_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);
      onNotify('success', 'Xuất Excel Thành Công', `Đã xuất ${filteredProducts.length} mặt hàng tồn kho ra tệp "${fileName}".`);
    } catch (err) {
      console.error(err);
      onNotify('danger', 'Lỗi Xuất File', 'Không thể tạo file Excel cho danh sách sản phẩm.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Metrics Strip */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh Mục Sản Phẩm Tồn Kho Thời Gian Thực
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded text-[10px] font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                  REAL-TIME WMS LEDGER
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị chi tiết 4 chiều tồn kho (Vật lý, Giữ chỗ, Khả dụng, Đang về), vị trí ô kệ, số lô, hạn dùng và giá trị vốn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-products-excel"
              type="button"
              onClick={handleExportProductsExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Xuất bảng dữ liệu đầy đủ ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel Sản Phẩm</span>
            </button>
          </div>
        </div>

        {/* 6 High-Density Operational Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng Mặt Hàng SKU</div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {metrics.totalItems} <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tồn Vật Lý (On-Hand)</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.totalPhysical.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Đang Giữ Chỗ (SO/WO)</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.totalReserved.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Khả Dụng Xuất (ATP)</div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {metrics.totalAvailable.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Cảnh Báo Thiếu / Cận Date</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
              <span>{metrics.lowStockCount + metrics.nearExpiryCount}</span>
              <span className="text-[10px] font-normal text-slate-400">mục</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng Giá Trị Tồn</div>
            <div className="text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5 truncate">
              {(metrics.totalValue / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M ₫
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 relative z-10">
          {/* Search Box */}
          <div className="relative sm:col-span-2 z-10">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-warehouse-products"
              type="text"
              placeholder="Tìm SKU, Tên hàng, Barcode, Số lô, Vị trí ô kệ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="h-9 w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-8.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Warehouse Selector */}
          <div>
            <select
              id="select-filter-wh-products-warehouse"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9 w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">🏢 Tất cả Cơ Sở Kho ({uniqueWarehouses.length})</option>
              {uniqueWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <select
              id="select-filter-wh-products-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">📂 Tất cả Nhóm Hàng ({uniqueCategories.length})</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Health / Alert Selector */}
          <div>
            <select
              id="select-filter-wh-products-health"
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="h-9 w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">🩺 Tất cả Tình Trạng Tồn</option>
              <option value="NORMAL">✅ Bình thường (Ổn định)</option>
              <option value="LOW_STOCK">⚠️ Cảnh báo thiếu hụt (Dưới Min)</option>
              <option value="NEAR_EXPIRY">⏳ Cận Hạn Dùng (FEFO Focus)</option>
              <option value="LOCKED">🔒 Đang khóa / Niêm phong</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Quality Status + Sort Order + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Kiểm định KCS:</span>
            </span>

            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'READY', label: 'Sẵn sàng xuất' },
              { key: 'INSPECTING', label: 'Đang kiểm định' },
              { key: 'QUARANTINED', label: 'Niêm phong cách ly' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setQualityFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  qualityFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-7.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs px-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer font-medium"
              >
                <option value="totalValue">Giá trị tồn kho cao nhất</option>
                <option value="availableQty">Số lượng khả dụng</option>
                <option value="expDate">Hạn sử dụng (FEFO)</option>
                <option value="sku">Mã SKU</option>
                <option value="name">Tên sản phẩm</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="h-7.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                title={`Thứ tự: ${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}`}
              >
                {sortOrder === 'asc' ? '▲ Tăng' : '▼ Giảm'}
              </button>
            </div>

            {(searchKeyword || warehouseFilter !== 'ALL' || categoryFilter !== 'ALL' || healthFilter !== 'ALL' || qualityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  setWarehouseFilter('ALL');
                  setCategoryFilter('ALL');
                  setHealthFilter('ALL');
                  setQualityFilter('ALL');
                }}
                className="h-7.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Products Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bảng Chi Tiết Mặt Hàng Trong Kho
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {filteredProducts.length} Mặt Hàng
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Tự động đồng bộ với Sổ Cái Đơn Ghi (Single-Writer Ledger)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-3 text-center">Hình Ảnh</th>
                <th className="px-3.5 py-3">Mã SKU & Barcode</th>
                <th className="px-3.5 py-3 min-w-[200px]">Tên Sản Phẩm & Nhóm Hàng</th>
                <th className="px-3.5 py-3 min-w-[160px]">Cơ Sở Kho & Vị Trí Ô Kệ</th>
                <th className="px-3.5 py-3">Số Lô & HSD (FEFO)</th>
                <th className="px-3.5 py-3 text-center">Cảnh Báo</th>
                <th className="px-3 py-3 text-right">Tồn Vật Lý</th>
                <th className="px-3 py-3 text-right">Giữ Chỗ</th>
                <th className="px-3 py-3 text-right">Khả Dụng (ATP)</th>
                <th className="px-3.5 py-3 text-right">Giá Vốn / Tổng Giá Trị</th>
                <th className="px-3.5 py-3 text-center">Trạng Thái KCS</th>
                <th className="px-3.5 py-3 text-center">Thao Tác Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 space-y-2">
                    <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Hãy thử xóa từ khóa tìm kiếm hoặc chọn lại các tiêu chí bộ lọc kho/nhóm hàng.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isLowStock = p.inventoryHealth === 'LOW_STOCK';
                  const isNearExpiry = p.inventoryHealth === 'NEAR_EXPIRY';
                  const isLocked = p.inventoryHealth === 'LOCKED' || p.qualityStatus === 'QUARANTINED';
                  const isActive = activeSkuId === p.id;

                  return (
                    <tr 
                      key={p.id}
                      onClick={() => setActiveSkuId(p.id)}
                      className={`transition-all duration-200 cursor-pointer group hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:shadow-xs hover:scale-[1.001] ${
                        isActive
                          ? 'border-l-4 border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 shadow-xs ring-1 ring-indigo-500/20'
                          : isLocked 
                          ? 'border-l-4 border-rose-500 bg-rose-50/30 dark:bg-rose-950/20' 
                          : isNearExpiry 
                          ? 'border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      {/* Product Image */}
                      <td 
                        className="px-3.5 py-3 text-center cursor-pointer group"
                        onClick={() => setQuickPreviewProduct(p)}
                        title="Nhấn để mở Quick Preview hình ảnh & thông tin kỹ thuật SKU"
                      >
                        {p.imageUrl ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto shadow-2xs group-hover:border-indigo-500 transition-all group-hover:scale-105">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto group-hover:border-indigo-500 transition-all group-hover:scale-105" title="Chưa có ảnh - Nhấn để xem chi tiết">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      {/* SKU & Barcode */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            {p.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="px-3.5 py-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1" title={p.name}>
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{p.category}</span>
                          <span>•</span>
                          <span className="italic">{p.packSpec}</span>
                        </div>
                      </td>

                      {/* Warehouse & Location */}
                      <td className="px-3.5 py-3">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={p.warehouseName}>
                          {p.warehouseId}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{p.binLocation}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({p.zone})</span>
                        </div>
                      </td>

                      {/* Lot & Expiry */}
                      <td className="px-3.5 py-3">
                        <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>{p.lotNo}</span>
                          {p.daysToExpiry > 0 && p.daysToExpiry <= 30 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[9px] font-bold border border-amber-300 dark:border-amber-700" title={`Cảnh báo: Sắp hết hạn trong ${p.daysToExpiry} ngày tới`}>
                              <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                              <span>Cận Date ({p.daysToExpiry}d)</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono flex items-center gap-1 mt-0.5">
                          <span className="text-slate-400">HSD:</span>
                          <strong className={p.daysToExpiry <= 30 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                            {p.expDate}
                          </strong>
                        </div>
                      </td>

                      {/* Safety Stock Alert Column */}
                      <td className="px-3.5 py-3 text-center">
                        {p.physicalQty <= p.minStock ? (
                          <div 
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800 cursor-help shadow-2xs"
                            title={`CẢNH BÁO TỒN KHO THẤP: Tồn kho thực tế (${p.physicalQty} ${p.unit}) đã chạm hoặc dưới ngưỡng Safety Stock (${p.minStock} ${p.unit})!`}
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-mono text-xs" title="Tồn kho an toàn">
                            -
                          </span>
                        )}
                      </td>

                      {/* Physical Qty */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {p.physicalQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">{p.unit}</span>
                      </td>

                      {/* Reserved Qty */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        <span className={`text-xs font-semibold ${p.reservedQty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {p.reservedQty > 0 ? p.reservedQty.toLocaleString() : '-'}
                        </span>
                      </td>

                      {/* Available ATP Qty */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`text-xs font-bold ${
                            isLowStock 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : p.availableQty === 0 
                              ? 'text-slate-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {p.availableQty.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          Min: {p.minStock}
                        </div>
                      </td>

                      {/* Unit Cost & Total Value */}
                      <td className="px-3.5 py-3 text-right font-mono tabular-nums">
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          {p.totalValue.toLocaleString()} ₫
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {p.unitCost.toLocaleString()} ₫ / {p.unit}
                        </div>
                      </td>

                      {/* Quality & Health Status Badge */}
                      <td className="px-3.5 py-3 text-center">
                        {p.qualityStatus === 'READY' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                            <span>Sẵn Sàng</span>
                          </span>
                        )}
                        {p.qualityStatus === 'INSPECTING' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80">
                            <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />
                            <span>Kiểm Định</span>
                          </span>
                        )}
                        {p.qualityStatus === 'QUARANTINED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/80">
                            <AlertOctagon className="w-3 h-3 text-rose-600 mr-1" />
                            <span>Niêm Phong</span>
                          </span>
                        )}
                        {isLowStock && (
                          <div className="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center justify-center gap-0.5">
                            <span>Chạm đáy min</span>
                          </div>
                        )}
                      </td>

                      {/* Action Menu Buttons */}
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Stock Card Quick View */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductForCard(p)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                            title="Xem Thẻ Kho & Lịch Sử Giao Dịch"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print QR / Barcode Tag */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductForLabel(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                            title="In Tem Nhãn Barcode / QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Transfer CTA to M21 */}
                          <button
                            type="button"
                            onClick={() => handleNavigateToModule('/transfer', 'M21', `Lập phiếu điều chuyển SKU ${p.sku}`)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg transition-all cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                            title="Lập Lệnh Điều Chuyển Kho (M21)"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <PaginationControl {...pagination} />
        </div>
      </div>

      {/* MODAL 1: STOCK CARD & TRANSACTION HISTORY DRAWER */}
      {selectedProductForCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {selectedProductForCard.sku}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Thẻ Kho & Lịch Sử Giao Dịch
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">{selectedProductForCard.name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductForCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Metrics & Stock Specs */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Vị trí lưu kho</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {selectedProductForCard.binLocation}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedProductForCard.warehouseName}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Số Lô & HSD</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedProductForCard.lotNo}
                  </div>
                  <div className="text-[10px] text-slate-400">EXP: {selectedProductForCard.expDate}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Tồn khả dụng</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedProductForCard.availableQty.toLocaleString()} {selectedProductForCard.unit}
                  </div>
                  <div className="text-[10px] text-slate-400">Tổng vốn: {selectedProductForCard.totalValue.toLocaleString()} ₫</div>
                </div>
              </div>

              {/* Sample Stock Movements Ledger */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Biến Động Gần Nhất (Audit Trail)
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-mono font-bold">NHẬP KHO</span>
                        <span>Phiếu GRN-2026-088</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">08/09/2026 14:15 • Thủ kho: Nguyễn Văn An</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-600">
                      +1,500 {selectedProductForCard.unit}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-mono font-bold">GIỮ CHỖ</span>
                        <span>Lệnh SO-HCM-0912</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">07/09/2026 10:00 • Hệ thống Sales Engine</div>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600">
                      -600 {selectedProductForCard.unit}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductForCard(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForCard(null);
                  handleNavigateToModule('/stocktake', 'M19', `Kiểm kê mặt hàng ${selectedProductForCard.sku}`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
              >
                Lập Phiếu Kiểm Kê M19 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT QR / BARCODE LABEL MODAL */}
      {selectedProductForLabel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tem Nhãn Định Danh Kho WMS
                </h3>
              </div>
              <button
                onClick={() => setSelectedProductForLabel(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              {/* Virtual Label Frame */}
              <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  NEXUSSYNC ENTERPRISE WMS TAG
                </div>

                {/* Simulated Barcode Display */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center space-y-1">
                  <div className="font-mono text-xl tracking-[0.25em] font-black text-black select-none">
                    ||||| ||| |||| ||||| || |||
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    {selectedProductForLabel.barcode}
                  </div>
                </div>

                <div className="text-left space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">SKU:</span>
                    <strong className="text-indigo-600">{selectedProductForLabel.sku}</strong>
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {selectedProductForLabel.name}
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                    <span>Lô: <strong>{selectedProductForLabel.lotNo}</strong></span>
                    <span>HSD: <strong>{selectedProductForLabel.expDate}</strong></span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>VỊ TRÍ Ô KỆ:</span>
                    <span>{selectedProductForLabel.binLocation}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductForLabel(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotify('success', 'In Tem Nhãn', `Đã gửi lệnh in tem nhãn cho SKU ${selectedProductForLabel.sku} ra máy in Zebra WMS-01.`);
                  setSelectedProductForLabel(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Tem Nhãn Zebra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal for Product Image & Technical Specs */}
      {quickPreviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold font-mono text-xs">
                  {quickPreviewProduct.sku}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Quick Preview: Hình Ảnh & Thông Tin SKU</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Đồng bộ từ Item Master (M07) & WMS (M17)</p>
                </div>
              </div>
              <button
                onClick={() => setQuickPreviewProduct(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Large Image Preview Container */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-lg flex items-center justify-center relative group">
                  {quickPreviewProduct.imageUrl ? (
                    <img src={quickPreviewProduct.imageUrl} alt={quickPreviewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-indigo-500 space-y-2">
                      <Package className="w-12 h-12" />
                      <span className="text-[11px] font-semibold text-slate-400">Chưa khai báo hình ảnh</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded-lg border border-white/10">
                    {quickPreviewProduct.sku}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base mt-3 text-center">
                  {quickPreviewProduct.name}
                </h4>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-full font-semibold border border-indigo-200 dark:border-indigo-800 text-[11px]">
                  {quickPreviewProduct.category}
                </span>
              </div>

              {/* Technical Specs Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã SKU / Barcode</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{quickPreviewProduct.sku}</span>
                    <span className="block font-mono text-[10px] text-slate-500">{quickPreviewProduct.barcode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cơ Sở Kho & Vị Trí</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{quickPreviewProduct.warehouseName}</span>
                    <span className="block font-mono text-[11px] text-indigo-600 font-bold">{quickPreviewProduct.binLocation} ({quickPreviewProduct.zone})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Số Lô & Hạn Sử Dụng</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{quickPreviewProduct.lotNo}</span>
                    <span className="block font-mono text-[11px] text-slate-500">{quickPreviewProduct.expDate}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tồn Kho Khả Dụng (ATP)</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{quickPreviewProduct.availableQty} {quickPreviewProduct.unit}</span>
                    <span className="block text-[10px] text-slate-500">Vật lý: {quickPreviewProduct.physicalQty} | Giữ chỗ: {quickPreviewProduct.reservedQty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Quy Cách & Bảo Quản</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{quickPreviewProduct.packSpec}</span>
                    <span className="block text-[10px] text-slate-500 italic">{quickPreviewProduct.storageCondition}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Giá Vốn & Tổng Giá Trị</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{quickPreviewProduct.unitCost.toLocaleString()} đ</span>
                    <span className="block font-mono text-[11px] text-indigo-600 font-bold">Tổng: {quickPreviewProduct.totalValue.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {quickPreviewProduct.id}</span>
              <button
                type="button"
                onClick={() => setQuickPreviewProduct(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
