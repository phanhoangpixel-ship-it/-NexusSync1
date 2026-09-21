import React, { useState, useEffect } from 'react';
import { PackageOpen, ShieldCheck, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface MaterialRequisitionModalProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const MaterialRequisitionModal: React.FC<MaterialRequisitionModalProps> = ({
  isOpen,
  project,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [productId, setProductId] = useState('1');
  const [warehouseId, setWarehouseId] = useState('1');
  const [quantity, setQuantity] = useState('2');
  const [notes, setNotes] = useState('Xuất vật tư phục vụ thử nghiệm phòng Lab R&D');
  const [operatorName, setOperatorName] = useState('Kỹ sư Quản lý Vật tư Lab');
  const [submitting, setSubmitting] = useState(false);

  const [productsList, setProductsList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [loadingMasterData, setLoadingMasterData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchMasterData = async () => {
        setLoadingMasterData(true);
        try {
          const [prodRes, whRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/warehouses'),
          ]);

          if (prodRes.ok) {
            const prods = await prodRes.json();
            if (Array.isArray(prods) && prods.length > 0) {
              setProductsList(prods);
              setProductId(String(prods[0].id));
            }
          }

          if (whRes.ok) {
            const whs = await whRes.json();
            if (Array.isArray(whs) && whs.length > 0) {
              setWarehousesList(whs);
              setWarehouseId(String(whs[0].id));
            }
          }
        } catch (err) {
          console.error('Error fetching master data for requisition', err);
        } finally {
          setLoadingMasterData(false);
        }
      };

      fetchMasterData();
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const selectedProduct = productsList.find((p) => String(p.id) === String(productId));
  const selectedWarehouse = warehousesList.find((w) => String(w.id) === String(warehouseId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !warehouseId || Number(quantity) <= 0) {
      onNotify('warning', 'Dữ liệu không hợp lệ', 'Số lượng xuất kho phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rd/projects/${project.id}/material-requisition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(productId),
          warehouseId: Number(warehouseId),
          quantity: Number(quantity),
          notes,
          operatorName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Xuất kho vật tư R&D thành công', data.message || 'Đã tạo phiếu xuất kho M17 OUTBOUND_ISSUE.');
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi xuất kho', err.error || 'Thao tác xuất kho thất bại.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Xuất Vật Tư Thử Nghiệm (M17 Authority)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* M17 Inventory Single Writer Warning */}
        <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <span className="font-bold">M17 Single-Writer Authority: </span>
            Hành động này gọi trực tiếp <code>InventoryService.postTransaction(OUTBOUND_ISSUE)</code>. Thẻ kho, số dư tồn khả dụng và sổ cái kho M17 được cập nhật tự động.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Đề Tài R&amp;D Thụ Hưởng
            </label>
            <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg font-semibold text-slate-800 dark:text-slate-200">
              [{project.projectCode || `RD-${project.id}`}] {project.title}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Mặt Hàng Vật Tư (M07) *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
              >
                {productsList.length > 0 ? (
                  productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">[PRD-001] Laptop Business 14 (Silicon Chipset)</option>
                    <option value="2">[SKU-002] Photoresist EUV v2</option>
                    <option value="3">[SKU-003] Khí SiH4 Tinh Khiết</option>
                    <option value="4">[SKU-004] Hạt Nhựa Sinh Học PLA</option>
                    <option value="5">[SKU-005] Xúc Tác Sinh Học BioCat</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Kho Xuất Vật Tư (M17) *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
              >
                {warehousesList.length > 0 ? (
                  warehousesList.map((w) => (
                    <option key={w.id} value={w.id}>
                      [{w.code}] {w.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">[WH-MAIN] Kho Tổng Trung Tâm</option>
                    <option value="2">[WH-SOUTH] Kho Chi Nhánh Miền Nam</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Product Quick Info Card */}
          {selectedProduct && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500">Đơn vị: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedProduct.baseUnit || 'Cái/Chiếc'}</span>
              </div>
              <div>
                <span className="text-slate-500">Giá vốn M42: </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {(Number(selectedProduct.costPrice) || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Số Lượng Xuất Thử Nghiệm *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Kỹ Sư Lab Đề Xuất *
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Ghi Chú Mục Đích Xuất Kho
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              {submitting ? 'Đang xuất kho...' : 'Xác Nhận Xuất Kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
