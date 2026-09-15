import React, { useState } from 'react';
import { SupplierItem, PriceLockItem } from './m11Types';
import { X, FileText, Building2, Calendar, DollarSign, Percent, ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface M11NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierItem[];
  preSelectedSupplierId?: number;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M11NewContractModal: React.FC<M11NewContractModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  preSelectedSupplierId,
  onSuccess,
  onNotify,
}) => {
  const defaultStartDate = new Date().toISOString().slice(0, 10);
  const defaultEndDate = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [supplierId, setSupplierId] = useState<number>(preSelectedSupplierId || (suppliers[0]?.id || 1));
  const [title, setTitle] = useState<string>('');
  const [contractType, setContractType] = useState<'FRAMEWORK_BPA' | 'PRICE_LOCK' | 'SERVICE_SLA' | 'LONG_TERM_SUPPLY'>('FRAMEWORK_BPA');
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [committedValue, setCommittedValue] = useState<number>(2000000000);
  const [discountRate, setDiscountRate] = useState<number>(5);
  const [paymentTerms, setPaymentTerms] = useState<string>('NET30');
  const [slaTargetOtif, setSlaTargetOtif] = useState<number>(95);
  const [slaTargetQuality, setSlaTargetQuality] = useState<number>(98);
  const [autoRenewalNoticeDays, setAutoRenewalNoticeDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>('Hợp đồng nguyên tắc & thỏa thuận khung giá ký kết điện tử SRM');
  
  // Price Locks
  const [priceLocks, setPriceLocks] = useState<PriceLockItem[]>([
    { itemCode: 'RAW-MAT-01', itemName: 'Nguyên phụ liệu cơ bản', lockedPrice: 250000, unit: 'Kg' }
  ]);

  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddPriceLock = () => {
    setPriceLocks([
      ...priceLocks,
      { itemCode: '', itemName: '', lockedPrice: 0, unit: 'Cái' }
    ]);
  };

  const handleRemovePriceLock = (index: number) => {
    setPriceLocks(priceLocks.filter((_, i) => i !== index));
  };

  const handlePriceLockChange = (index: number, field: keyof PriceLockItem, value: any) => {
    const updated = [...priceLocks];
    updated[index] = { ...updated[index], [field]: value };
    setPriceLocks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSup = suppliers.find(s => s.id === supplierId);
    if (!title.trim() || !selectedSup) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên hợp đồng và chọn nhà cung cấp.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/purchase/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          supplier: selectedSup.name,
          supplierId: selectedSup.id,
          supplierCode: selectedSup.code,
          contractType,
          startDate,
          endDate,
          committedValue: Number(committedValue) || 1000000000,
          discountRate: Number(discountRate) || 0,
          paymentTerms,
          slaTargetOtif: Number(slaTargetOtif) || 95,
          slaTargetQuality: Number(slaTargetQuality) || 98,
          autoRenewalNoticeDays: Number(autoRenewalNoticeDays) || 30,
          priceLocks: priceLocks.filter(p => p.itemName && p.itemName.trim() !== ''),
          notes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      onNotify('success', 'Tạo hợp đồng thành công', data.message || `Đã ký kết hợp đồng khung mới thành công.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating framework agreement:', err);
      onNotify('danger', 'Lỗi tạo hợp đồng', err.message || 'Không thể tạo hợp đồng khung.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ký kết Hợp đồng Khung mới (Framework Agreement / BPA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thiết lập cam kết cung ứng dài hạn, khóa giá nguyên liệu & ràng buộc SLA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              1. Thông tin pháp lý & Nhà cung cấp
            </h4>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Đối tác Nhà cung cấp (M09) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name} ({s.performanceTier || 'Tier 2'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phân loại thỏa thuận <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="FRAMEWORK_BPA">Thỏa thuận khung cung ứng (BPA)</option>
                  <option value="PRICE_LOCK">Thỏa thuận cố định đơn giá trần (Price Lock)</option>
                  <option value="SERVICE_SLA">Hợp đồng dịch vụ & Cam kết SLA</option>
                  <option value="LONG_TERM_SUPPLY">Hợp đồng đối tác chiến lược dài hạn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tiêu đề Hợp đồng khung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Hợp đồng nguyên tắc cung ứng Linh kiện Quang học & Cảm biến 2026-2027"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Section 2: Period & Commercial Terms */}
          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              2. Thời hạn hiệu lực & Điều khoản thương mại
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ngày bắt đầu hiệu lực
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ngày kết thúc (End Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ngân sách cam kết (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={committedValue !== undefined && committedValue !== null ? Number(committedValue).toLocaleString('vi-VN') : '0'}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setCommittedValue(raw ? Number(raw) : 0);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chiết khấu thương mại (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Điều khoản thanh toán
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="NET15">NET15 (15 ngày sau hóa đơn)</option>
                  <option value="NET30">NET30 (30 ngày chuẩn)</option>
                  <option value="NET45">NET45 (45 ngày theo kỳ)</option>
                  <option value="NET60">NET60 (60 ngày đối tác lớn)</option>
                  <option value="LC_CONFIRMED">Thư tín dụng L/C không hủy ngang</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mục tiêu OTIF tối thiểu (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={slaTargetOtif}
                  onChange={(e) => setSlaTargetOtif(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mục tiêu Chất lượng IQC (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={slaTargetQuality}
                  onChange={(e) => setSlaTargetQuality(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cảnh báo gia hạn trước (Ngày)
                </label>
                <input
                  type="number"
                  min="7"
                  max="180"
                  value={autoRenewalNoticeDays}
                  onChange={(e) => setAutoRenewalNoticeDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Price Locks */}
          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                3. Bảng cam kết Khóa Đơn giá trần (Price Locks)
              </h4>
              <button
                type="button"
                onClick={handleAddPriceLock}
                className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm mã hàng khóa giá
              </button>
            </div>

            <div className="space-y-2">
              {priceLocks.map((pl, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                  <input
                    type="text"
                    placeholder="Mã SKU (Vd: RAW-WAF-01)"
                    value={pl.itemCode}
                    onChange={(e) => handlePriceLockChange(idx, 'itemCode', e.target.value)}
                    className="w-1/4 rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Tên mặt hàng / vật tư"
                    value={pl.itemName}
                    onChange={(e) => handlePriceLockChange(idx, 'itemName', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Đơn giá cố định"
                    value={pl.lockedPrice !== undefined && pl.lockedPrice !== null && pl.lockedPrice !== 0 ? Number(pl.lockedPrice).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      handlePriceLockChange(idx, 'lockedPrice', raw ? Number(raw) : 0);
                    }}
                    className="w-1/4 rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-right dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="ĐVT (Kg, Tấm)"
                    value={pl.unit}
                    onChange={(e) => handlePriceLockChange(idx, 'unit', e.target.value)}
                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                  {priceLocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePriceLock(idx)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ghi chú & Điều khoản bảo đảm thực hiện hợp đồng
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Đang tạo hợp đồng...' : 'Ký kết Hợp đồng Khung'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
