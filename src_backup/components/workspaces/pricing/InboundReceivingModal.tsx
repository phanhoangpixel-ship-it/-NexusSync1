import React, { useState } from 'react';
import { Package, ArrowRight, CheckCircle2, DollarSign, X, TrendingUp, RefreshCw } from 'lucide-react';
import { PricingService } from '../../../utils/pricingCalculator';

interface InboundReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNewInboundCost: (params: {
    productId: string;
    newCost: number;
    receiptCode: string;
    supplier: string;
  }) => void;
}

export const InboundReceivingModal: React.FC<InboundReceivingModalProps> = ({
  isOpen,
  onClose,
  onApplyNewInboundCost
}) => {
  const [productId, setProductId] = useState('PROD-RAM-16');
  const [receiptCode, setReceiptCode] = useState('GR-2026-08-30-01');
  const [supplier, setSupplier] = useState('Kingston Technology Asia Pacific');
  const [currentCost, setCurrentCost] = useState<number>(444444);
  const [newCost, setNewCost] = useState<number>(480000); // Cost increases
  const [markupPercent, setMarkupPercent] = useState<number>(50);

  if (!isOpen) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const oldSellingPrice = PricingService.calculateMarkupPrice(currentCost, markupPercent);
  const newCalculatedSellingPrice = PricingService.calculateMarkupPrice(newCost, markupPercent);
  const costDelta = newCost - currentCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyNewInboundCost({
      productId,
      newCost: Number(newCost),
      receiptCode,
      supplier
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start mb-4 border-b pb-3">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded">
              COSTING ENGINE → PRICING SYNC
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Đồng Bộ Giá Vốn Nhập Kho Mới (Inbound Receipt Sync)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Mô phỏng sự kiện phiếu nhập kho được nghiệm thu từ Phân hệ Mua Hàng & Costing Engine. Động cơ định giá M41 sẽ tự động điều chỉnh giá bán đề xuất hoặc phát cảnh báo xói mòn biên lợi nhuận.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã Phiếu Nhập Kho</label>
              <input
                type="text"
                required
                value={receiptCode}
                onChange={(e) => setReceiptCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sản Phẩm Tiếp Nhận</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                if (e.target.value === 'PROD-RAM-16') {
                  setCurrentCost(444444);
                  setNewCost(480000);
                } else if (e.target.value === 'PROD-SSD-1TB') {
                  setCurrentCost(1200000);
                  setNewCost(1250000);
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-xs font-medium"
            >
              <option value="PROD-RAM-16">PROD-RAM-16: RAM DDR5 16GB Kingston Fury</option>
              <option value="PROD-SSD-1TB">PROD-SSD-1TB: SSD NVMe Samsung 990 Pro 1TB</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá Vốn Cũ (Cost Basis)</label>
              <input
                type="text"
                disabled
                value={currentCost.toLocaleString('vi-VN')}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono bg-slate-50 text-slate-500 text-right"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá Vốn Nhập Mới (₫) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={newCost !== undefined && newCost !== null ? Number(newCost).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setNewCost(raw ? Number(raw) : 0);
                }}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold text-indigo-700 text-right"
              />
            </div>
          </div>

          {/* Impact preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Đánh Giá Tác Động Lên Giá Bán (Markup +{markupPercent}%):</span>
              <span className={`font-mono ${costDelta > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {costDelta > 0 ? `+${formatVND(costDelta)} giá vốn` : 'Giảm giá vốn'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t text-xs">
              <div>
                <span className="text-slate-400 block">Giá bán trước đây:</span>
                <span className="font-mono text-slate-700">{formatVND(oldSellingPrice)}</span>
              </div>
              <div>
                <span className="text-indigo-600 font-semibold block">Giá bán mới đề xuất:</span>
                <span className="font-mono font-bold text-indigo-900">{formatVND(newCalculatedSellingPrice)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cập Nhật & Tạo Đề Xuất Giá Mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
