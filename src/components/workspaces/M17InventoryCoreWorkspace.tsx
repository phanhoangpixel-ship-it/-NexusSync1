import React, { useState, useEffect, useCallback } from 'react';
import { 
  Boxes, Layers, ArrowDownUp, AlertTriangle, RefreshCw, Plus, 
  Search, ShieldCheck, Database, CheckCircle2, FileText, Filter, Warehouse, MapPin, ArrowRight
} from 'lucide-react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DeepLinkBanner } from '../common/DeepLinkBanner';
import { EnterpriseTable, ColumnDef } from '../common/EnterpriseTable';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { useWorkspaceContextSync } from '../../hooks/useWorkspaceContextSync';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../data/enterpriseMaster';

const defaultBalances = ENTERPRISE_MASTER_PRODUCTS.map((p, idx) => {
  const stockPhysical = p.stock;
  const stockReserved = Math.floor(p.stock * 0.1);
  const stockQuarantine = Math.floor(p.stock * 0.05);
  const stockAvailable = stockPhysical - stockReserved - stockQuarantine;
  return {
    id: idx + 1,
    productId: idx + 1,
    productSku: p.sku,
    productName: p.name,
    warehouseCode: 'WH-MAIN',
    warehouseName: 'Kho Tổng Trung Tâm',
    locationCode: 'LOC-A-01-01',
    stockPhysical,
    stockReserved,
    stockQuarantine,
    stockAvailable,
    baseUnit: p.unit,
    costPrice: p.costPrice,
    retailPrice: p.retailPrice,
    totalCost: p.stock * p.costPrice
  };
});

interface M17InventoryCoreWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M17InventoryCoreWorkspace: React.FC<M17InventoryCoreWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'balances' | 'ledger'>('M17', 'balances');
  const [balances, setBalances] = useState<any[]>(defaultBalances);
  const [ledger, setLedger] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([
    { id: 1, code: 'WH-01', name: 'Kho Tổng Trung Tâm (Hà Nội)', isActive: true, type: 'MAIN' },
    { id: 2, code: 'WH-02', name: 'Kho Miền Nam (Bình Dương)', isActive: true, type: 'BRANCH' },
    { id: 3, code: 'WH-03', name: 'Kho Đà Nẵng (Miền Trung)', isActive: true, type: 'BRANCH' }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [bRes, lRes, wRes] = await Promise.all([
        fetch('/api/inventory/balances', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/inventory/ledger', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/warehouses', { headers: authHeaders }).then(r => r.json()).catch(() => []),
      ]);
      if (Array.isArray(bRes) && bRes.length > 0) setBalances(bRes);
      if (Array.isArray(lRes)) setLedger(lRes);
      if (Array.isArray(wRes) && wRes.length > 0) setWarehouses(wRes);
    } catch (e) {
      console.error(e);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể kết nối cơ sở dữ liệu phân hệ M17.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useWorkspaceContextSync(useCallback(() => {
    fetchData();
  }, []));

  const handleResetSync = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đồng bộ lại toàn bộ M17 với M07 Item Master',
      message: 'Hành động này sẽ thiết lập lại toàn bộ tồn kho M17 khớp tuyệt đối 100% với danh mục 17 sản phẩm chuẩn từ M07. Bạn có chắc chắn muốn tiếp tục?',
      confirmText: 'Đồng bộ ngay',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const token = localStorage.getItem('nexus_jwt') || '';
          const authHeaders = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
          const res = await fetch('/api/inventory/reset-all', { method: 'POST', headers: authHeaders });
          const data = await res.json();
          if (data.success) {
            onNotify('success', 'Đồng bộ thành công', data.message);
            fetchData();
          } else {
            onNotify('danger', 'Lỗi đồng bộ', data.error || 'Thất bại');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      }
    });
  };

  const filteredBalances = balances.filter(b => {
    const matchSearch = (b.productSku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (b.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchWh = selectedWarehouseFilter === 'ALL' || String(b.warehouseId) === selectedWarehouseFilter;
    return matchSearch && matchWh;
  });

  const balanceColumns: ColumnDef[] = [
    {
      key: 'product',
      header: 'Item',
      width: 260,
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.productName}</div>
          <div className="font-mono text-xs text-indigo-600">{item.productSku}</div>
        </div>
      ),
    },
    {
      key: 'warehouseCode',
      header: 'Warehouse',
      width: 140,
      type: 'code',
      render: (item) => <span className="font-mono text-slate-700">{item.warehouseCode || 'WH-01'}</span>,
    },
    {
      key: 'locationCode',
      header: 'Location',
      width: 130,
      type: 'code',
      render: (item) => <span className="font-mono text-xs text-slate-600">{item.locationCode || 'A1-01-02'}</span>,
    },
    {
      key: 'stockPhysical',
      header: 'Physical',
      width: 140,
      align: 'right',
      isNumeric: true,
      render: (item) => (
        <span className="font-mono tabular-nums font-semibold text-slate-900">
          {Number(item.stockPhysical || 0).toLocaleString('vi-VN')} {item.baseUnit || 'Cái'}
        </span>
      ),
    },
    {
      key: 'stockReserved',
      header: 'Reserved',
      width: 130,
      align: 'right',
      isNumeric: true,
      render: (item) => (
        <span className="font-mono tabular-nums font-semibold text-amber-600">
          {Number(item.stockReserved || 0).toLocaleString('vi-VN')} {item.baseUnit || 'Cái'}
        </span>
      ),
    },
    {
      key: 'stockQuarantine',
      header: 'Quarantine',
      width: 130,
      align: 'right',
      isNumeric: true,
      render: (item) => (
        <span className="font-mono tabular-nums font-semibold text-purple-600">
          {Number(item.stockQuarantine || 0).toLocaleString('vi-VN')} {item.baseUnit || 'Cái'}
        </span>
      ),
    },
    {
      key: 'stockAvailable',
      header: 'Available',
      width: 140,
      align: 'right',
      isNumeric: true,
      render: (item) => {
        const physical = Number(item.stockPhysical || 0);
        const reserved = Number(item.stockReserved || 0);
        const quarantine = Number(item.stockQuarantine || 0);
        const available = physical - reserved - quarantine;
        return (
          <span className="font-mono tabular-nums font-semibold text-emerald-600">
            {available.toLocaleString('vi-VN')} {item.baseUnit || 'Cái'}
          </span>
        );
      },
    },
    {
      key: 'costPrice',
      header: 'Cost',
      width: 140,
      align: 'right',
      isNumeric: true,
      render: (item) => (
        <span className="font-mono tabular-nums font-semibold text-slate-600">
          {(item.costPrice || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      key: 'totalValuation',
      header: 'Total Valuation',
      width: 160,
      align: 'right',
      isNumeric: true,
      render: (item) => {
        const physical = Number(item.stockPhysical || 0);
        return (
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {(physical * (item.costPrice || 0)).toLocaleString('vi-VN')} ₫
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 130,
      align: 'center',
      render: (item) => {
        const physical = Number(item.stockPhysical || 0);
        const reserved = Number(item.stockReserved || 0);
        const quarantine = Number(item.stockQuarantine || 0);
        const available = physical - reserved - quarantine;
        return (
          <button
            type="button"
            onClick={() => {
              onSelectEntity({
                type: 'INVENTORY_ITEM',
                id: item.productSku,
                title: item.productName,
                subtitle: `Kho: ${item.warehouseCode || 'WH-01'} | Khả dụng: ${available} ${item.baseUnit || 'Cái'}`,
              });
              onNotify('info', 'Thẻ Kho & Lô Hàng 360°', `Đã chọn SKU ${item.productSku} vào thanh ngữ cảnh.`);
            }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Thẻ Kho 360°
          </button>
        );
      },
    },
  ];

  const ledgerColumns: ColumnDef[] = [
    {
      key: 'id',
      header: 'ID / Thời gian',
      width: 170,
      render: (l) => (
        <div className="font-mono text-xs text-slate-500">
          #{l.id} <br />
          {new Date(l.createdAt || Date.now()).toLocaleString('vi-VN')}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại Giao Dịch',
      width: 180,
      render: (l) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            l.type.includes('IN') || l.type === 'PURCHASE' || l.type === 'GOODS_RECEIPT'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : l.type.includes('OUT') || l.type === 'SALE' || l.type === 'GOODS_ISSUE'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {l.type}
        </span>
      ),
    },
    {
      key: 'referenceNo',
      header: 'Mã Chứng Từ',
      width: 160,
      type: 'code',
      render: (l) => <span className="font-mono font-semibold text-slate-800">{l.referenceNo}</span>,
    },
    {
      key: 'sku',
      header: 'Vật Tư (SKU)',
      width: 150,
      type: 'code',
      render: (l) => <span className="font-mono text-indigo-600 font-semibold">{l.productSku || `ID:${l.productId}`}</span>,
    },
    {
      key: 'quantity',
      header: 'Số Lượng',
      width: 130,
      align: 'right',
      isNumeric: true,
      render: (l) => (
        <span className={`font-mono tabular-nums font-semibold ${l.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Tồn Sau Giao Dịch',
      width: 160,
      align: 'right',
      isNumeric: true,
      render: (l) => <span className="font-mono tabular-nums font-semibold text-slate-900">{l.balanceAfter}</span>,
    },
    {
      key: 'notes',
      header: 'Diễn Giải / Ghi Chú',
      width: 260,
      render: (l) => <span className="text-xs text-slate-600">{l.notes || 'Giao dịch chuẩn qua InventoryService'}</span>,
    },
  ];

  const totalPhysical = balances.reduce((acc, cur) => acc + (cur.stockPhysical || 0), 0);
  const totalReserved = balances.reduce((acc, cur) => acc + (cur.stockReserved || 0), 0);
  const totalQuarantine = balances.reduce((acc, cur) => acc + (cur.stockQuarantine || 0), 0);
  const totalAvailable = balances.reduce((acc, cur) => acc + (cur.stockAvailable || 0), 0);
  const totalValuation = balances.reduce((acc, cur) => acc + ((cur.stockPhysical || 0) * (cur.costPrice || 0)), 0);

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto space-y-8 text-slate-800 bg-slate-50/50 min-h-screen">
      {/* ConfirmDialog Rule #19 */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Boxes className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">M17: Inventory Core / Enterprise Inventory Authority</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                Single Write Path Active
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Nguồn sự thật duy nhất về Tồn kho 4 trạng thái (Physical = Available + Reserved + Quarantine) và Sổ cái bất biến toàn hệ thống ERP.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleResetSync}
            className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:border-slate-400"
            title="Đồng bộ lại toàn bộ danh mục sản phẩm từ M07"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            Đồng Bộ M07 Item Master
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/stock-adjustment', moduleId: 'M20' } }));
              onNotify('info', 'Chuyển Hướng Phân Hệ', 'Đang chuyển đến phân hệ Quản lý Điều chỉnh tồn kho M20.');
            }}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200 hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Điều Chỉnh Tồn Kho (M20)
          </button>
        </div>
      </div>

      {/* DeepLinkBanner directing to M20 for stock adjustments */}
      <DeepLinkBanner
        targetModule="M20"
        targetRoute="/stock-adjustment"
        title="Quản Lý Điều Chỉnh Tồn Kho Chuyên Biệt (Stock Adjustment Engine)"
        description="Theo quy chuẩn kiến trúc Single Writer Rule #03: Toàn bộ nghiệp vụ lập phiếu điều chỉnh số dư kiểm kê, xuất hủy hư hỏng hoặc cân bằng kho được chuyển giao thẩm quyền độc quyền cho phân hệ M20."
        actionText="Mở Phân Hệ M20"
        badgeText="M20 AUTHORITY"
        variant="amber"
      />

      {/* KPI Cards (5 Pillars of Inventory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">
            <span>Tổng Vật Lý (Physical)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900 relative z-10">
            {totalPhysical.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium relative z-10">Bao gồm cả hàng giữ & cách ly</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">
            <span>Bảo Lưu (Reserved)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-600 relative z-10">
            {totalReserved.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium relative z-10">Đã khóa cho Đơn SO / POS</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">
            <span>Cách Ly KCS (Quarantine)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-purple-600 relative z-10">
            {totalQuarantine.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium relative z-10">Chờ M39 QMS nghiệm thu</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">
            <span>Khả Dụng (Available)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 relative z-10">
            {totalAvailable.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium relative z-10">Sẵn sàng xuất bán & cấp phát</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">
            <span>Giá Trị Kho (Valuation)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-indigo-600 relative z-10 truncate" title={`${totalValuation.toLocaleString('vi-VN')} ₫`}>
            {totalValuation.toLocaleString('vi-VN')} ₫
          </div>
          <p className="text-[11px] text-slate-500 font-medium relative z-10">Theo giá vốn Cost Price</p>
        </div>
      </div>

      {/* Tabs Navigation (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'balances'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" />
            <span>Số Dư Tồn Kho 3 Chiều</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'balances'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {balances.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownUp className="w-4 h-4 shrink-0" />
            <span>Sổ Cái Tồn Kho Bất Biến</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {ledger.length}
            </span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Inventory Authority
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            Physical = Avail + Res + Quar
          </span>
        </div>
      </div>

      {/* TAB 1: BALANCES */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo SKU, Tên vật tư..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả Kho (All Warehouses)</option>
                {warehouses.map(w => (
                  <option key={w.id} value={String(w.id)}>{w.code} - {w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <EnterpriseTable
            columns={balanceColumns}
            data={filteredBalances}
            keyField="id"
            moduleId="M17"
            tableId="inventory_balances"
            moduleName="M17 Quản Lý Tồn Kho"
            tableName="Số Dư Tồn Kho"
            stickyFirstColumn={true}
            stickyHeader={true}
            resizableColumns={true}
            virtualized={true}
            maxHeight={540}
            emptyMessage="Không tìm thấy dữ liệu tồn kho phù hợp."
          />
        </div>
      )}

      {/* TAB 2: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Cái Tồn Kho (Immutable Stock Ledger)</h3>
              <p className="text-xs text-slate-500">Mọi biến động nhập/xuất/điều chỉnh kho đều được ghi nhận bất biến.</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
              Tổng số bút toán: {ledger.length}
            </span>
          </div>

          <EnterpriseTable
            columns={ledgerColumns}
            data={ledger}
            keyField="id"
            moduleId="M17"
            tableId="inventory_ledger"
            moduleName="M17 Quản Lý Tồn Kho"
            tableName="Sổ Cái Biến Động Kho"
            stickyFirstColumn={true}
            stickyHeader={true}
            resizableColumns={true}
            virtualized={true}
            maxHeight={540}
            emptyMessage="Chưa có bút toán sổ cái nào được ghi nhận."
          />
        </div>
      )}
    </div>
  );
};
