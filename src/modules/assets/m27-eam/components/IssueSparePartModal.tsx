import React, { useState, useEffect } from 'react';
import { X, Package, ShieldCheck, Warehouse, ArrowRight, Layers, AlertCircle } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface IssueSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const IssueSparePartModal: React.FC<IssueSparePartModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
  onNotify,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(250000);
  const [notes, setNotes] = useState<string>('Xuất phụ tùng thay thế phục vụ sửa chữa định kỳ');
  const [loading, setLoading] = useState(false);
  const [fetchingCatalog, setFetchingCatalog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalog = async () => {
      setFetchingCatalog(true);
      try {
        const res = await fetch('/api/eam/spare-parts');
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
            setSelectedProductId(data.products[0].id);
            setUnitCost(data.products[0].costPrice || 250000);
          }
          if (data.warehouses && data.warehouses.length > 0) {
            setWarehouses(data.warehouses);
            setSelectedWarehouseId(data.warehouses[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load spare parts catalog:', err);
      } finally {
        setFetchingCatalog(false);
      }
    };
    fetchCatalog();
  }, [isOpen]);

  // When selected product changes, update default cost
  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && prod.costPrice) {
      setUnitCost(prod.costPrice);
    }
  };

  const [isProcuring, setIsProcuring] = useState(false);
  const [procureSuccessMessage, setProcureSuccessMessage] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalCost = quantity * unitCost;

  if (!isOpen || !workOrder) return null;

  // Handle M08 Purchasing Single-Writer delegation
  const handleCreatePurchaseOrder = async () => {
    setIsProcuring(true);
    setProcureSuccessMessage(null);
    try {
      const res = await fetch('/api/eam/spare-parts/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity,
          unitCost,
          warehouseId: selectedWarehouseId,
          woCode: workOrder.woCode,
          notes: `Đề xuất mua khẩn cấp cho phiếu bảo trì ${workOrder.woCode} (${workOrder.assetName})`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi tạo đơn PO mua hàng');
      }

      const poData = await res.json();
      setProcureSuccessMessage(`Đã phát hành đơn mua hàng ${poData.poCode} qua M08 Purchasing. Trạng thái: PENDING_APPROVAL.`);
      onNotify('success', 'Tạo đơn mua hàng thành công (M08 Single-Writer)', poData.message);
    } catch (err: any) {
      onNotify('danger', 'Tạo đơn mua hàng thất bại', err.message);
    } finally {
      setIsProcuring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      onNotify('warning', 'Số lượng không hợp lệ', 'Số lượng xuất kho phải lớn hơn 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/eam/work-orders/${workOrder.id}/issue-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          warehouseId: selectedWarehouseId,
          quantity,
          unitCost,
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi xuất phụ tùng M17');
      }

      const result = await res.json();
      onNotify(
        'success',
        'Xuất phụ tùng thành công (M17 Single-Writer)',
        result.message || `Đã xuất ${quantity} x [${selectedProduct?.name || 'Phụ tùng'}] và ghi nhận chi phí vào phiếu WO.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Xuất phụ tùng thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Xuất Kho Phụ Tùng Bảo Trì</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" /> M17 Single-Writer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {workOrder.woCode} • {workOrder.assetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Work Order Context Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Phiếu bảo trì:</div>
              <div className="font-bold font-mono text-blue-600 dark:text-blue-400">{workOrder.woCode}</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300">{workOrder.description}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Kỹ thuật viên:</span>
              <strong className="text-slate-800 dark:text-slate-200">{workOrder.assignedTechnicianName}</strong>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vật Tư / Phụ Tùng Thay Thế (M17 Master Catalog) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(Number(e.target.value))}
              disabled={fetchingCatalog}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Tồn khả dụng: {p.stockAvailable} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-slate-400" />
              Kho Xuất Hàng (Kho MRO / Kho Tổng) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Lượng Xuất <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white font-bold"
                required
              />
            </div>
            <div>
              <CurrencyInput
                label="Đơn Giá Xuất Kho (₫) *"
                value={unitCost}
                onChange={(val) => setUnitCost(val)}
                placeholder="250.000"
                required
                showBadge={false}
              />
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tổng giá trị phụ tùng xuất kho:</span>
              <strong className="text-blue-700 dark:text-blue-300 font-mono text-sm">
                {totalCost.toLocaleString('vi-VN')} ₫
              </strong>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
              <span>Định khoản M30:</span>
              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">Nợ TK 627 / Có TK 152</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú Nghiệp Vụ
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Thay thế bạc đạn và vòng đệm kín dầu"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* M08 Purchasing Delegation Banner */}
          {procureSuccessMessage ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              <strong className="block font-semibold">M08 Purchasing Order:</strong>
              {procureSuccessMessage}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
              <div>
                <span className="font-semibold text-indigo-900 dark:text-indigo-200 block">Thiếu hụt phụ tùng tồn kho?</span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400">Tạo đề xuất mua phụ tùng tự động qua M08 Purchasing Single-Writer</span>
              </div>
              <button
                type="button"
                onClick={handleCreatePurchaseOrder}
                disabled={isProcuring}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isProcuring ? 'Đang tạo PO...' : 'Mua Qua M08'}
              </button>
            </div>
          )}

          {/* Invariant Note */}
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Thao tác này sẽ trực tiếp gọi <code>InventoryService.postTransaction()</code> (M17 Single-Writer) để trừ tồn kho vật lý và cộng dồn chi phí vào phiếu WO.
            </span>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              <span>{loading ? 'Đang xuất kho...' : 'Xác Nhận Xuất Phụ Tùng (M17)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
