import React, { useState } from 'react';
import { Tag, Plus, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PromotionCampaign } from './types';
import { formatVND } from '../../../../lib/currency';
import { CurrencyInputField } from '../../../../components/common/CurrencyInputField';

interface PromotionsTabProps {
  promotions: PromotionCampaign[];
  onAddPromotion: (newPromo: PromotionCampaign) => void;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({
  promotions,
  onAddPromotion
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [promoPrice, setPromoPrice] = useState(599000);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-15');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const created: PromotionCampaign = {
      id: `PROMO-${Date.now().toString().slice(-4)}`,
      code: code.toUpperCase() || 'KM-FLASH-2026',
      name,
      description,
      productId: 'PROD-RAM-16',
      productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
      sku: 'RAM-16GB-DDR5',
      standardPrice: 666666,
      promoPrice: Number(promoPrice),
      discountPercent: Math.round(((666666 - Number(promoPrice)) / 666666) * 1000) / 10,
      startDate,
      endDate,
      isActive: true,
      autoRevert: true,
      minPurchaseQty: 1
    };

    onAddPromotion(created);
    setShowModal(false);
    setName('');
    setCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Governance Banner on Promotion Pricing */}
      <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
        <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">Quy tắc chuẩn hóa Chương trình Khuyến Mãi (Promotion Pricing):</p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Không được sửa giá chuẩn khi chạy khuyến mãi.</strong> Giá bán chuẩn (Standard Retail: 666.666 ₫) vẫn được bảo toàn nguyên vẹn. Chiến dịch chỉ áp dụng giá giảm trong khung ngày có hiệu lực. Khi hết thời hạn, hệ thống tự động hoàn nguyên về giá chuẩn mà không cần can thiệp thủ công.
          </p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Danh Sách Chiến Dịch Khuyến Mãi Đang Kích Hoạt & Lên Lịch
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo Chiến Dịch Khuyến Mãi
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold rounded-md border border-amber-200 dark:border-amber-800">
                  {promo.code}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{promo.name}</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đang hiệu lực
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{promo.description}</p>

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Sản phẩm áp dụng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{promo.productName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Giá chuẩn ban đầu:</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 line-through">{formatVND(promo.standardPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-900 dark:text-white font-semibold">Giá khuyến mãi (Promo Price):</span>
                <span className="font-mono font-bold text-base text-rose-600 dark:text-rose-400">{formatVND(promo.promoPrice)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Mức giảm:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">-{promo.discountPercent}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{promo.startDate} → {promo.endDate}</span>
              </div>
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto-Revert sau {promo.endDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Tạo Chiến Dịch Khuyến Mãi Mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Khuyến Mãi *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: BACK-TO-SCHOOL-2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm uppercase font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Khuyến mãi mùa tựu trường"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Khuyến Mãi (₫) *</label>
                  <CurrencyInputField
                    required
                    value={promoPrice}
                    onChange={setPromoPrice}
                    placeholder="VD: 599.000"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Giá chuẩn: 666.666 ₫</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đơn vị áp dụng</label>
                  <input
                    type="text"
                    disabled
                    value="Cây (PCS)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Từ Ngày *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đến Ngày *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô Tả Chiến Dịch</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  placeholder="Ghi chú đối tượng áp dụng và giới hạn ngân sách..."
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
                  Kích Hoạt Khuyến Mãi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
