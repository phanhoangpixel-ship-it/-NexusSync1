import React, { useState } from 'react';
import { Layers, Plus, TrendingDown, Percent, CheckCircle2, DollarSign, Package } from 'lucide-react';
import { QuantityPricingTier } from './types';
import { formatVND } from '../../../../lib/currency';
import { CurrencyInputField } from '../../../../components/common/CurrencyInputField';

interface QuantityPricingTabProps {
  quantityTiers: QuantityPricingTier[];
  onAddTier: (newTier: QuantityPricingTier) => void;
}

export const QuantityPricingTab: React.FC<QuantityPricingTabProps> = ({
  quantityTiers,
  onAddTier
}) => {
  const [showModal, setShowModal] = useState(false);
  const [minQty, setMinQty] = useState(10);
  const [maxQty, setMaxQty] = useState<number | ''>(49);
  const [unitPrice, setUnitPrice] = useState(640000);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const created: QuantityPricingTier = {
      id: `QT-${Date.now().toString().slice(-4)}`,
      productId: 'PROD-RAM-16',
      productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
      sku: 'RAM-16GB-DDR5',
      uom: 'Cây (PCS)',
      minQty: Number(minQty),
      maxQty: maxQty === '' ? null : Number(maxQty),
      unitPrice: Number(unitPrice),
      discountPercent: Math.round(((666666 - Number(unitPrice)) / 666666) * 1000) / 10,
      costBasis: 444444,
      actualMarginPercent: Math.round(((Number(unitPrice) - 444444) / Number(unitPrice)) * 1000) / 10,
      effectiveFrom: '2026-08-01',
      effectiveTo: '2026-12-31',
      status: 'ACTIVE'
    };
    onAddTier(created);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Bảng giá bậc thang số lượng (Volume Break Pricing):</p>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
              Tối ưu cho bán buôn B2B: Tự động kích hoạt mức giá ưu đãi khi số lượng đặt hàng trên dòng Sales Order đạt ngưỡng.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Bậc Thang Giá
        </button>
      </div>

      {/* Visual Tier Brackets Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quantityTiers.map((tier, idx) => (
          <div
            key={tier.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs relative hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                Bậc #{idx + 1}
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Giảm {tier.discountPercent}%
              </span>
            </div>

            <div className="my-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Số lượng mua:</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {tier.minQty} {tier.maxQty ? `– ${tier.maxQty}` : '+'} {tier.uom}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
              <div className="text-xs text-slate-400 dark:text-slate-400">Đơn giá bán:</div>
              <div className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-0.5">
                {formatVND(tier.unitPrice)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex justify-between items-center">
                <span>Biên LN (Margin):</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono">{tier.actualMarginPercent.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chi Tiết Bảng Giá Bậc Thang Theo Sản Phẩm</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
                <th className="py-3.5 px-3 text-center">Khoảng Số Lượng</th>
                <th className="py-3.5 px-3 text-right">Đơn Giá Áp Dụng</th>
                <th className="py-3.5 px-3 text-center">Mức Giảm</th>
                <th className="py-3.5 px-3 text-right">Giá Vốn</th>
                <th className="py-3.5 px-3 text-right">Margin Thực</th>
                <th className="py-3.5 px-3 text-center">Hiệu Lực</th>
                <th className="py-3.5 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {quantityTiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/60">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{tier.productName}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">SKU: {tier.sku}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {tier.minQty} - {tier.maxQty || 'Vô hạn'} {tier.uom}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {formatVND(tier.unitPrice)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                      -{tier.discountPercent}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                    {formatVND(tier.costBasis)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    {tier.actualMarginPercent.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {tier.effectiveFrom} → {tier.effectiveTo}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Thêm Bậc Thang Giá Số Lượng Mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Lượng Tối Thiểu *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={minQty}
                    onChange={(e) => setMinQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Lượng Tối Đa</label>
                  <input
                    type="number"
                    placeholder="Không giới hạn"
                    value={maxQty}
                    onChange={(e) => setMaxQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đơn Giá Áp Dụng (₫) *</label>
                <CurrencyInputField
                  required
                  value={unitPrice}
                  onChange={setUnitPrice}
                  placeholder="VD: 640.000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Lưu Bậc Thang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
