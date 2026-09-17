import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, Scale, Thermometer, Boxes, 
  MapPin, CheckCircle2, ArrowRight, RefreshCw, Layers, Check, X, 
  AlertCircle, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface ProductItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  storageCondition: 'DRY' | 'COLD' | 'FROZEN' | 'BULKY' | 'QUARANTINE_ONLY' | 'HAZMAT';
  unitWeightKg: number;
  unitVolumeM3: number;
  stockPhysical?: number;
}

interface LocationOption {
  id: number;
  code: string;
  name: string;
  type: string;
  zoneType: string;
  currentWeight: number;
  maxWeightCapacity: number;
  weightUtilizationPct: number;
  barcode?: string;
  warehouseId: number;
}

interface ValidationResponse {
  isValid: boolean;
  zoneCompatibility: {
    isCompatible: boolean;
    productCondition: string;
    zoneType: string;
    status: 'COMPATIBLE' | 'WARNING' | 'REJECTED';
    message: string;
  };
  weightCapacity: {
    fits: boolean;
    currentWeight: number;
    incomingWeight: number;
    newTotalWeight: number;
    maxWeightCapacity: number;
    newUtilizationPct: number;
    status: 'SAFE' | 'WARNING_NEAR_CAPACITY' | 'BLOCKED_OVER_CAPACITY';
    message: string;
    canOverride: boolean;
  };
  overallStatus: 'APPROVED' | 'REQUIRES_CONFIRMATION' | 'BLOCKED';
  errors: string[];
  warnings: string[];
}

interface WarehouseSlottingSimulatorViewProps {
  warehouseId: number;
  warehouseName: string;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onStockUpdated?: () => void;
}

export const WarehouseSlottingSimulatorView: React.FC<WarehouseSlottingSimulatorViewProps> = ({
  warehouseId,
  warehouseName,
  onNotify,
  onStockUpdated
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ'
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [pRes, lRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch(`/api/warehouse-locations?warehouseId=${warehouseId}`, { headers })
      ]);

      if (pRes.ok) {
        const pList: any[] = await pRes.json();
        const mappedProducts: ProductItem[] = pList.map(p => ({
          id: p.id,
          sku: p.sku || p.code,
          name: p.name,
          category: p.category || 'Mặt hàng',
          storageCondition: (p.storageCondition || (p.category?.toLowerCase().includes('lạnh') || p.name?.toLowerCase().includes('vac') || p.name?.toLowerCase().includes('huyết') ? 'COLD' : 'DRY')) as any,
          unitWeightKg: p.unitWeightKg || (p.sku?.includes('BULK') ? 25.0 : 1.25),
          unitVolumeM3: p.unitVolumeM3 || 0.005,
          stockPhysical: p.stockPhysical || 100
        }));
        setProducts(mappedProducts);
        if (mappedProducts.length > 0 && !selectedProductId) {
          setSelectedProductId(mappedProducts[0].id);
        }
      }

      if (lRes.ok) {
        const lList: any[] = await lRes.json();
        const binsOnly = lList.filter(l => l.type === 'BIN' || l.type === 'RACK');
        setLocations(binsOnly);
        if (binsOnly.length > 0 && !selectedLocationId) {
          setSelectedLocationId(binsOnly[0].id);
        }
      }
    } catch (err: any) {
      onNotify('error', 'Lỗi nạp dữ liệu', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, onNotify, selectedProductId, selectedLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run validation whenever product, location, or quantity changes
  useEffect(() => {
    if (!selectedProductId || !selectedLocationId || quantity <= 0) {
      setValidationResult(null);
      return;
    }

    const runValidation = async () => {
      setIsValidating(true);
      try {
        const token = localStorage.getItem('nexus_jwt') || '';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const res = await fetch('/api/warehouse-locations/validate-placement', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            locationId: Number(selectedLocationId),
            productId: Number(selectedProductId),
            quantity: Number(quantity)
          })
        });

        if (res.ok) {
          const data: ValidationResponse = await res.json();
          setValidationResult(data);
        }
      } catch (err) {
        // ignore background validation errors
      } finally {
        setIsValidating(false);
      }
    };

    const timer = setTimeout(runValidation, 150);
    return () => clearTimeout(timer);
  }, [selectedProductId, selectedLocationId, quantity]);

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
  const selectedLocation = locations.find(l => l.id === Number(selectedLocationId));

  const handleCommitPlacement = async () => {
    if (!validationResult || !validationResult.isValid) {
      onNotify('error', 'Không thể xếp hàng', 'Vui lòng giải quyết các lỗi ràng buộc không gian trước khi xếp hàng.');
      return;
    }

    const executeAssign = async () => {
      setIsCommitting(true);
      try {
        const token = localStorage.getItem('nexus_jwt') || '';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const res = await fetch('/api/warehouse-locations/assign-stock', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            locationId: Number(selectedLocationId),
            productId: Number(selectedProductId),
            quantity: Number(quantity),
            operator: 'WMS_SLOTTING_PLANNER'
          })
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || 'Lỗi khi gán hàng vào vị trí');
        }

        const data = await res.json();
        onNotify('success', 'Xếp hàng thành công', `Đã phân bổ ${quantity} đơn vị sản phẩm vào ô ${selectedLocation?.code}. Tải trọng mới: ${data.newWeight} kg.`);
        
        // Refresh local data & notify parent
        loadData();
        if (onStockUpdated) onStockUpdated();
      } catch (err: any) {
        onNotify('error', 'Lỗi xếp hàng', err.message);
      } finally {
        setIsCommitting(false);
      }
    };

    if (validationResult.overallStatus === 'REQUIRES_CONFIRMATION') {
      setConfirmDialog({
        isOpen: true,
        title: 'Xác Nhận Xếp Hàng (Có Cảnh Báo Tải Trọng / Vị Trí)',
        message: validationResult.warnings.join('\n') + '\n\nBạn có chắc chắn muốn ghi nhận việc xếp hàng vào vị trí này không?',
        variant: 'warning',
        confirmText: 'Vẫn Tiếp Tục Xếp Hàng',
        onConfirm: executeAssign
      });
    } else {
      executeAssign();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Guide */}
      <div className="p-4 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-slate-900/10 dark:from-indigo-950/40 dark:to-slate-900/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Bộ Mô Phỏng & Kiểm Tra An Toàn Xếp Hàng (WMS Slotting & Constraint Engine)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động đối chiếu tương thích nhiệt độ/khu vực (Zone Compatibility) và chặn vượt tải trọng kết cấu (Weight Limit Hard Block).
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm Mới Dữ Liệu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selection Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              1. Thiết Lập Tham Số Phân Bổ
            </h5>

            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Chọn Sản Phẩm Cần Xếp Kho <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} ({p.storageCondition} • {p.unitWeightKg} kg/đv)
                  </option>
                ))}
              </select>
            </div>

            {/* Product Quick Details */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đặc tính bảo quản:</span>
                  <span className={`font-bold ${selectedProduct.storageCondition === 'COLD' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {selectedProduct.storageCondition === 'COLD' ? '❄️ Yêu cầu Kho Lạnh (2-8°C)' : selectedProduct.storageCondition === 'BULKY' ? '📦 Hàng Cồng Kềnh / Tải Nặng' : '☀️ Hàng Khô / Phòng Thường'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trọng lượng đơn vị:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProduct.unitWeightKg} kg / unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thể tích đơn vị:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProduct.unitVolumeM3} m³</span>
                </div>
              </div>
            )}

            {/* Target Location Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Chọn Vị Trí Ô Kệ Mục Tiêu (Target Bin) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    [{loc.code}] {loc.name} (Zone: {loc.zoneType} • Hiện tại: {loc.currentWeight}/{loc.maxWeightCapacity} kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Location Quick Details */}
            {selectedLocation && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đặc tính Zone:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLocation.zoneType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tải trọng hiện tại:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLocation.currentWeight} / {selectedLocation.maxWeightCapacity} kg ({selectedLocation.weightUtilizationPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sức chứa còn lại:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {(selectedLocation.maxWeightCapacity - selectedLocation.currentWeight).toLocaleString()} kg
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Số Lượng Cần Xếp (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              {selectedProduct && (
                <div className="text-[11px] text-slate-500 font-mono text-right">
                  Tổng tải trọng dự kiến: <span className="font-bold text-slate-800 dark:text-slate-200">{(quantity * selectedProduct.unitWeightKg).toFixed(1)} kg</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Engine Validation Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. Kết Quả Thẩm Định An Toàn Tự Động (AI & Engine Guard)
              </h5>
              {isValidating && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono animate-pulse">
                  Đang tính toán tải trọng...
                </span>
              )}
            </div>

            {validationResult ? (
              <div className="space-y-4">
                {/* 1. Zone Compatibility Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  validationResult.zoneCompatibility.status === 'REJECTED'
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : validationResult.zoneCompatibility.status === 'WARNING'
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {validationResult.zoneCompatibility.status === 'REJECTED' ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : validationResult.zoneCompatibility.status === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>KIỂM TRA TƯƠNG THÍCH ĐIỀU KIỆN BẢO QUẢN (ZONE COMPATIBILITY)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/60 dark:bg-slate-900/60 uppercase">
                          {validationResult.zoneCompatibility.status}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {validationResult.zoneCompatibility.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Weight Capacity Card & Progress Gauge */}
                <div className={`p-4 rounded-xl border transition-all ${
                  validationResult.weightCapacity.status === 'BLOCKED_OVER_CAPACITY'
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : validationResult.weightCapacity.status === 'WARNING_NEAR_CAPACITY'
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <Scale className={`w-5 h-5 shrink-0 mt-0.5 ${
                      validationResult.weightCapacity.status === 'BLOCKED_OVER_CAPACITY' ? 'text-rose-600' : validationResult.weightCapacity.status === 'WARNING_NEAR_CAPACITY' ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                    <div className="space-y-2.5 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs uppercase">
                          KIỂM SOÁT TẢI TRỌNG KẾT CẤU (WEIGHT CAPACITY CHECK)
                        </span>
                        <span className="font-mono font-bold text-xs tabular-nums">
                          {validationResult.weightCapacity.newUtilizationPct}% Tải Trọng
                        </span>
                      </div>

                      {/* Visual Load Bar */}
                      <div className="w-full h-3 bg-white/80 dark:bg-slate-900/80 rounded-full overflow-hidden border border-black/10">
                        <div
                          className={`h-full transition-all ${
                            validationResult.weightCapacity.status === 'BLOCKED_OVER_CAPACITY'
                              ? 'bg-rose-600'
                              : validationResult.weightCapacity.status === 'WARNING_NEAR_CAPACITY'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, validationResult.weightCapacity.newUtilizationPct)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                        <div>
                          <span className="text-slate-500 block">Tải cũ:</span>
                          <span className="font-bold">{validationResult.weightCapacity.currentWeight} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Tải cộng thêm:</span>
                          <span className="font-bold">+{validationResult.weightCapacity.incomingWeight} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Tổng tải mới / Tối đa:</span>
                          <span className="font-bold">{validationResult.weightCapacity.newTotalWeight} / {validationResult.weightCapacity.maxWeightCapacity} kg</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed pt-1">
                        {validationResult.weightCapacity.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Verdict & Action Button */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Trạng Thái Thẩm Định: {validationResult.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400">ĐỦ ĐIỀU KIỆN XẾP HÀNG</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">BỊ CHẶN BỞI HỆ THỐNG AN TOÀN</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {validationResult.isValid ? 'Sản phẩm và vị trí thỏa mãn toàn bộ tiêu chuẩn an toàn.' : 'Vui lòng chọn vị trí khác hoặc giảm bớt số lượng.'}
                    </div>
                  </div>

                  <button
                    onClick={handleCommitPlacement}
                    disabled={!validationResult.isValid || isCommitting}
                    className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-all ${
                      validationResult.isValid
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isCommitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang Cập Nhật Kho...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Xác Nhận Xếp Hàng Vào Ô Kệ
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Vui lòng chọn sản phẩm và vị trí ô kệ để bắt đầu mô phỏng an toàn.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
