import React, { useState } from 'react';
import { Plus, CheckCircle2, DollarSign, X, Calculator, ShieldCheck, Tag, Package } from 'lucide-react';
import { PriceList, ProductPriceItem } from '../../../types/pricingManagement';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../data/enterpriseMaster';
import { PricingService } from '../../../utils/pricingCalculator';

interface AddProductPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceLists: PriceList[];
  onAddProductPrice: (newPriceItem: ProductPriceItem) => void;
}

export const AddProductPricingModal: React.FC<AddProductPricingModalProps> = ({
  isOpen,
  onClose,
  priceLists,
  onAddProductPrice
}) => {
  // Selected Inventory Product from M17
  const [selectedSku, setSelectedSku] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || '');
  
  const selectedInventoryProduct = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === selectedSku) || ENTERPRISE_MASTER_PRODUCTS[0];

  const [priceListId, setPriceListId] = useState(priceLists[0]?.id || 'PL-001');
  
  // Cost & Pricing calculation fields initialized from inventory M17 costPrice
  const [costBasis, setCostBasis] = useState<number>(selectedInventoryProduct?.costPrice || 500000);
  const [pricingMethod, setPricingMethod] = useState<'MARKUP' | 'TARGET_MARGIN' | 'FIXED'>('MARKUP');
  const [markupPercent, setMarkupPercent] = useState<number>(40);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30);
  const [fixedPrice, setFixedPrice] = useState<number>(selectedInventoryProduct?.retailPrice || 700000);
  const [minMarginPercent, setMinMarginPercent] = useState<number>(15);

  if (!isOpen) return null;

  const selectedPriceList = priceLists.find(p => p.id === priceListId) || priceLists[0];

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // When SKU changes, auto-sync costPrice and fixedPrice from M17 inventory master
  const handleSkuChange = (skuVal: string) => {
    setSelectedSku(skuVal);
    const prod = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === skuVal);
    if (prod) {
      setCostBasis(prod.costPrice);
      setFixedPrice(prod.retailPrice);
    }
  };

  // Calculate price dynamically
  let finalPrice = 0;
  if (costBasis > 0) {
    if (pricingMethod === 'MARKUP') {
      finalPrice = PricingService.calculateMarkupPrice(costBasis, markupPercent, 'NEAREST_1000');
    } else if (pricingMethod === 'TARGET_MARGIN') {
      finalPrice = PricingService.calculateMarginPrice(costBasis, targetMarginPercent, 'NEAREST_1000');
    } else {
      finalPrice = fixedPrice;
    }
  } else {
    finalPrice = fixedPrice;
  }

  const actualMargin = (costBasis > 0 && finalPrice > 0) ? PricingService.calculateActualMargin(costBasis, finalPrice) : 0;
  const isBelowMin = costBasis > 0 ? actualMargin < minMarginPercent : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryProduct || costBasis <= 0) return;

    const newItem: ProductPriceItem = {
      id: `PR-${Date.now().toString().slice(-6)}`,
      priceListId: selectedPriceList.id,
      priceListCode: selectedPriceList.code,
      priceListName: selectedPriceList.name,
      productId: `PROD-${selectedInventoryProduct.sku}`,
      productName: selectedInventoryProduct.name,
      sku: selectedInventoryProduct.sku,
      category: selectedInventoryProduct.category,
      uom: selectedInventoryProduct.unit,
      costBasis: Number(costBasis),
      ruleApplied: pricingMethod === 'MARKUP' ? 'MARKUP' : pricingMethod === 'TARGET_MARGIN' ? 'MARGIN' : 'MANUAL',
      markupPercent: pricingMethod === 'MARKUP' ? markupPercent : undefined,
      targetMarginPercent: pricingMethod === 'TARGET_MARGIN' ? targetMarginPercent : undefined,
      calculatedPrice: finalPrice,
      finalPrice: finalPrice,
      actualMarginPercent: actualMargin,
      minMarginPercent: minMarginPercent,
      isBelowMinMargin: isBelowMin,
      isOverride: false,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '2026-12-31',
      status: 'ACTIVE',
      approvalStatus: 'ACTIVE'
    };

    onAddProductPrice(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start mb-4 border-b pb-3">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
              <Package className="w-3 h-3" /> M17 Inventory Master Sync
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Khai Báo Sản Phẩm & Giá Mới (Đồng Bộ Từ Kho M17)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Chọn sản phẩm từ danh mục tồn kho M17 */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Chọn Sản Phẩm Từ Kho M17 (Bắt buộc phải có trong kho) *
              </label>
              <select
                value={selectedSku}
                onChange={(e) => handleSkuChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
              >
                {ENTERPRISE_MASTER_PRODUCTS.map(prod => (
                  <option key={prod.sku} value={prod.sku}>
                    [{prod.sku}] {prod.name} — Tồn kho: {prod.stock} {prod.unit} (Danh mục: {prod.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedInventoryProduct && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Đơn Vị Tính:</span>
                  <strong className="text-slate-800">{selectedInventoryProduct.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tồn Kho Khả Dụng:</span>
                  <strong className="text-emerald-700">{selectedInventoryProduct.stock} {selectedInventoryProduct.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Giá Vốn Kho M17:</span>
                  <strong className="text-indigo-700">{formatVND(selectedInventoryProduct.costPrice)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Chọn Bảng Giá & Khai báo Giá Vốn */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Áp Dụng Vào Bảng Giá *</label>
              <select
                value={priceListId}
                onChange={(e) => setPriceListId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs font-medium"
              >
                {priceLists.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.name} ({pl.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giá Vốn Đồng Bộ (Cost Basis - ₫) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={costBasis !== undefined && costBasis !== null ? Number(costBasis).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setCostBasis(raw ? Number(raw) : 0);
                }}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold text-slate-900 bg-amber-50/50 text-right"
              />
              <span className="text-[10px] text-slate-500">Tự động đồng bộ từ kho M17</span>
            </div>
          </div>

          {/* Phương thức định giá bán */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-semibold text-slate-800">
              Khai Báo Công Thức & Giá Bán (Selling Price Configuration)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPricingMethod('MARKUP')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                  pricingMethod === 'MARKUP'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Markup (+%)
              </button>
              <button
                type="button"
                onClick={() => setPricingMethod('TARGET_MARGIN')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                  pricingMethod === 'TARGET_MARGIN'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Biên LN Mục Tiêu
              </button>
              <button
                type="button"
                onClick={() => setPricingMethod('FIXED')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                  pricingMethod === 'FIXED'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Giá Bán Cố Định
              </button>
            </div>

            {pricingMethod === 'MARKUP' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block font-medium text-slate-600 mb-1">Tỷ lệ thặng dư (Markup %):</label>
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="text-xs text-slate-500 pt-4">
                  = Giá vốn + ({markupPercent}% × Giá vốn)
                </div>
              </div>
            )}

            {pricingMethod === 'TARGET_MARGIN' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block font-medium text-slate-600 mb-1">Biên Lợi Nhuận Mong Muốn (Margin %):</label>
                  <input
                    type="number"
                    value={targetMarginPercent}
                    onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="text-xs text-slate-500 pt-4">
                  = Giá vốn ÷ (1 - {targetMarginPercent}%)
                </div>
              </div>
            )}

            {pricingMethod === 'FIXED' && (
              <div>
                <label className="block font-medium text-slate-600 mb-1">Giá Bán Niêm Yết (VNĐ):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fixedPrice !== undefined && fixedPrice !== null ? Number(fixedPrice).toLocaleString('vi-VN') : '0'}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setFixedPrice(raw ? Number(raw) : 0);
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono font-bold text-indigo-700 text-right"
                />
              </div>
            )}
          </div>

          {/* Kết quả tính toán giá bán & Margin */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 grid grid-cols-2 gap-3 items-center">
            <div>
              <span className="text-[11px] text-slate-500 block">Giá Bán Niêm Yết Đề Xuất:</span>
              <span className="text-base font-bold text-indigo-900 font-mono">
                {formatVND(finalPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Biên Lợi Nhuận Thực Tế:</span>
              <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                isBelowMin ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {actualMargin.toFixed(2)}% {isBelowMin ? '(Dưới sàn 15%)' : '(Đạt chuẩn)'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu & Kích Hoạt Giá Sản Phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

