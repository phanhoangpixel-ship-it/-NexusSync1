import React, { useState, useEffect } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Boxes,
  Layers,
  ArrowDownUp,
  AlertTriangle,
  FileSpreadsheet,
  History,
  Package,
  Plus,
  SlidersHorizontal,
  ClipboardCheck,
  Search,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface InventoryDashboardProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onOpenAdjustmentModal: () => void;
  onOpenStocktakeModal: () => void;
  onNavigate: (route: string) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  onSelectEntity,
  onOpenAdjustmentModal,
  onOpenStocktakeModal,
  onNavigate,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'balances' | 'ledger' | 'products'>('M17', 'balances');
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [bRes, lRes, pRes] = await Promise.all([
        fetch('/api/inventory/balances', { headers: authHeaders }).then((r) => r.json()).catch(() => []),
        fetch('/api/inventory/ledger', { headers: authHeaders }).then((r) => r.json()).catch(() => []),
        fetch('/api/products', { headers: authHeaders }).then((r) => r.json()).catch(() => []),
      ]);
      setBalances(Array.isArray(bRes) ? bRes : []);
      setLedger(Array.isArray(lRes) ? lRes : []);
      setProducts(Array.isArray(pRes) ? pRes : []);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleResetAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận đồng bộ lại toàn bộ dữ liệu kho & sản phẩm từ M07',
      message: 'Hành động này sẽ thiết lập lại toàn bộ tồn kho M17 khớp tuyệt đối 100% với danh mục 17 sản phẩm chuẩn từ M07. Bạn có chắc chắn muốn tiếp tục?',
      confirmText: 'Đồng bộ toàn bộ',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('nexus_jwt') || '';
          const authHeaders = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
          const res = await fetch('/api/inventory/reset-all', { method: 'POST', headers: authHeaders });
          if (res.ok) {
            setConfirmDialog(null);
            fetchInventoryData();
            if (onNotify) onNotify('success', 'Đồng bộ thành công', 'Đã đặt lại toàn bộ dữ liệu kho M17 khớp với danh mục sản phẩm chuẩn.');
          } else {
            if (onNotify) onNotify('danger', 'Lỗi đồng bộ', 'Không thể đồng bộ dữ liệu kho từ server.');
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  // Compute Invariants & KPIs from Authoritative Backend Data
  const totalPhysical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
  const totalReserved = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
  const totalAvailable = balances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);
  const totalValuation = balances.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const lowStockCount = balances.filter((b) => (b.stockAvailable || 0) < 10).length;

  const filteredBalances = balances.filter(
    (b) =>
      b.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLedger = ledger.filter(
    (l) =>
      l.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (b: any) => {
    onSelectEntity({
      type: 'INVENTORY_BALANCE',
      id: b.id,
      code: b.productSku,
      title: `${b.productName} — ${b.warehouseName}`,
      status: (b.stockAvailable || 0) > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      lineage: [
        { id: `prod-${b.productId}`, type: 'Sản phẩm', code: b.productSku, relation: 'MASTER_ITEM', status: 'ACTIVE' },
        { id: `wh-${b.warehouseId}`, type: 'Kho lưu trữ', code: b.warehouseCode || 'WH-01', relation: 'STORED_IN', status: 'ACTIVE' },
        { id: `adj-01`, type: 'Điều chỉnh gần nhất', code: 'ADJ-2026-0001', relation: 'LAST_MOVEMENT', status: 'APPROVED' },
      ],
      auditTrail: [
        { id: 1, action: 'Cập nhật số dư tự động', timestamp: new Date().toISOString(), user: 'InventoryService', sha256Checksum: 'a7b8c9d0e1f2...99' },
        { id: 2, action: 'Khởi tạo số dư đầu kỳ', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'admin', sha256Checksum: '33e44f55a1b2...88' },
      ],
      glEntries: [
        { account: 'TK 156', accountName: 'Hàng hóa tồn kho', debit: b.totalCost || 0, credit: 0, description: 'Giá trị hàng hóa thực tế' },
        { account: 'TK 331', accountName: 'Phải trả người bán', debit: 0, credit: b.totalCost || 0, description: 'Nguồn hình thành tồn kho' },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Physical Stock */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tồn thực tế (Physical)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{totalPhysical.toLocaleString('vi-VN')}</span>
            <span className="text-xs text-slate-500 font-medium">Đơn vị</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tổng sản phẩm hiện vật trong kho</p>
        </div>

        {/* Reserved / Allocated */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Giữ chỗ (Allocated)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">{totalReserved.toLocaleString('vi-VN')}</span>
            <span className="text-xs text-slate-500 font-medium">Đơn vị</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đã cam kết cho đơn bán hàng (SO)</p>
        </div>

        {/* Available Stock */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Khả dụng (Available)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">{totalAvailable.toLocaleString('vi-VN')}</span>
            <span className="text-xs text-slate-500 font-medium">Đơn vị</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Invariant: Khả dụng = Thực tế − Giữ chỗ</p>
        </div>

        {/* Total Valuation */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng giá trị tồn (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-purple-900 truncate">
              {totalValuation.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">VND</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lowStockCount > 0 ? `${lowStockCount} mặt hàng dưới ngưỡng an toàn` : 'Tất cả mức tồn ổn định'}
          </p>
        </div>
      </div>

      {/* Action Toolbar & Sub-views Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'balances' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Số dư chi tiết (Balances)
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sổ cái kho (Stock Ledger)
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh mục sản phẩm & UOM
          </button>
        </div>

        {/* Quick Search and Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo SKU, tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-56 transition-all"
            />
          </div>

          <button
            onClick={onOpenAdjustmentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Điều chỉnh kho</span>
          </button>

          <button
            onClick={onOpenStocktakeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Kiểm kê đếm mù</span>
          </button>

          <button
            onClick={() => onNavigate('/transfer')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>Chuyển kho</span>
          </button>

          <button
            onClick={handleResetAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs"
            title="Xóa sạch toàn bộ dữ liệu kho & sản phẩm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa sạch data</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STOCK BALANCES */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-center">Mã SKU</th>
                  <th className="py-3 px-4 text-center">Tên sản phẩm</th>
                  <th className="py-3 px-4 text-center">Kho / Vị trí</th>
                  <th className="py-3 px-4 text-center">Tồn thực tế</th>
                  <th className="py-3 px-4 text-center">Giữ chỗ</th>
                  <th className="py-3 px-4 text-center">Khả dụng</th>
                  <th className="py-3 px-4 text-center">Đơn vị</th>
                  <th className="py-3 px-4 text-center">Giá vốn</th>
                  <th className="py-3 px-4 text-center">Tổng thành tiền</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      {loading ? 'Đang tải dữ liệu số dư từ ERP Core...' : 'Không tìm thấy bản ghi số dư tồn kho nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((b) => {
                    const isLow = (b.stockAvailable || 0) < 10;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleRowClick(b)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.productSku}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{b.productName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span>{b.warehouseName}</span>
                          {b.locationCode && (
                            <span className="text-[10px] font-mono text-slate-400 block">{b.locationCode}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {b.stockPhysical}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                          {b.stockReserved}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {b.stockAvailable}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{b.baseUnit}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {b.costPrice ? b.costPrice.toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {b.totalCost ? b.totalCost.toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow ? 'Cảnh báo ít' : 'Đạt chuẩn'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-center">Mã tham chiếu</th>
                  <th className="py-3 px-4 text-center">Loại giao dịch</th>
                  <th className="py-3 px-4 text-center">Sản phẩm</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4 text-center">Tồn sau giao dịch</th>
                  <th className="py-3 px-4 text-center">Ghi chú</th>
                  <th className="py-3 px-4 text-center">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Chưa có giao dịch biến động nào được ghi nhận vào Sổ cái kho.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((l) => {
                    const isPositive = (l.quantity || 0) > 0;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.referenceNo}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              l.type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.type === 'OUT'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {l.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{l.productName || l.productSku}</div>
                          <div className="font-mono text-[10px] text-slate-400">{l.productSku}</div>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${l.quantity}` : l.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {l.balanceAfter}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.notes || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & UOM */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-center">Mã SKU</th>
                  <th className="py-3 px-4 text-center">Tên sản phẩm</th>
                  <th className="py-3 px-4 text-center">Danh mục</th>
                  <th className="py-3 px-4 text-center">Đơn vị cơ sở</th>
                  <th className="py-3 px-4 text-center">Giá bán lẻ</th>
                  <th className="py-3 px-4 text-center">Giá vốn</th>
                  <th className="py-3 px-4 text-center">Serial / Lot</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.sku}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.categoryName || 'Chung'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.baseUnit}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {p.retailPrice ? p.retailPrice.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {p.costPrice ? p.costPrice.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.isSerialTracked ? (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono">
                            SERIAL
                          </span>
                        ) : null}
                        {p.isLotTracked ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">
                            LOT
                          </span>
                        ) : null}
                        {!p.isSerialTracked && !p.isLotTracked && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ConfirmDialog Rule #19 */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
