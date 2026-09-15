import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Edit3,
  X
} from 'lucide-react';

interface SupplierTermsTabProps {
  suppliers: any[];
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  userToken?: string;
  onRefresh: () => void;
}

export const SupplierTermsTab: React.FC<SupplierTermsTabProps> = ({
  suppliers,
  onNotify,
  userToken,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exposureFilter, setExposureFilter] = useState<'ALL' | 'HIGH_EXPOSURE' | 'NORMAL'>('ALL');

  // Edit Terms Modal State
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [editPaymentTerms, setEditPaymentTerms] = useState<string>('NET 30');
  const [editCreditLimit, setEditCreditLimit] = useState<number>(1000000000);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmittingTerms, setIsSubmittingTerms] = useState(false);

  // Confirm Dialog State for Rule #19 compliance
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalLimit = 0;
    let totalSpend = 0;
    let highExposureCount = 0;

    for (const s of suppliers) {
      const limit = s.creditLimit || 500000000;
      const spend = s.totalSpend || 0;
      totalLimit += limit;
      totalSpend += spend;

      const rate = limit > 0 ? (spend / limit) * 100 : 0;
      if (rate >= 80) highExposureCount += 1;
    }

    const available = Math.max(0, totalLimit - totalSpend);
    const overallUtilization = totalLimit > 0 ? Math.round((totalSpend / totalLimit) * 100) : 0;

    return {
      totalLimit,
      totalSpend,
      available,
      overallUtilization,
      highExposureCount
    };
  }, [suppliers]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = searchTerm.trim() === '' ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const limit = s.creditLimit || 500000000;
      const spend = s.totalSpend || 0;
      const rate = limit > 0 ? (spend / limit) * 100 : 0;

      let matchExposure = true;
      if (exposureFilter === 'HIGH_EXPOSURE') {
        matchExposure = rate >= 80;
      } else if (exposureFilter === 'NORMAL') {
        matchExposure = rate < 80;
      }

      return matchSearch && matchExposure;
    });
  }, [suppliers, searchTerm, exposureFilter]);

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setEditPaymentTerms(supplier.paymentTerms || 'NET 30');
    setEditCreditLimit(supplier.creditLimit || 1000000000);
    setEditNotes(supplier.notes || '');
  };

  const handleConfirmEditTerms = () => {
    if (!editingSupplier) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Xác Nhận Điều Chỉnh Hạn Mức Tín Dụng',
      message: `Bạn có chắc chắn muốn thay đổi điều khoản thanh toán thành "${editPaymentTerms}" và hạn mức tín dụng thành "${formatCurrency(editCreditLimit)}" cho nhà cung cấp ${editingSupplier.name}? Hành động này sẽ được ghi nhận vào Outbox Events và nhật ký kiểm toán hệ thống.`,
      onConfirm: async () => {
        setIsSubmittingTerms(true);
        try {
          const res = await fetch(`/api/suppliers/${editingSupplier.id}/terms`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken || ''}`
            },
            body: JSON.stringify({
              paymentTerms: editPaymentTerms,
              creditLimit: editCreditLimit,
              notes: editNotes
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Không thể cập nhật điều khoản');

          onNotify('success', 'Thành Công', `Đã cập nhật điều khoản thanh toán & hạn mức tín dụng cho ${editingSupplier.name}`);
          setEditingSupplier(null);
          onRefresh();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        } finally {
          setIsSubmittingTerms(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng Hạn Mức Mạng Lưới
          </span>
          <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xl">
            {formatCurrency(metrics.totalLimit)}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Bảo lãnh công nợ toàn hệ thống
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Chi Tiêu Cam Kết (PO)
          </span>
          <p className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-xl">
            {formatCurrency(metrics.totalSpend)}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Tỷ lệ sử dụng hạn mức: {metrics.overallUtilization}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Hạn Mức Khả Dụng Còn Lại
          </span>
          <p className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-xl">
            {formatCurrency(metrics.available)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Dung sai đặt hàng an toàn
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Đối Tác Cận Hạn Mức (≥80%)
          </span>
          <p className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 text-xl">
            {metrics.highExposureCount} Đối Tác
          </p>
          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Cần rà soát mở rộng hạn mức
          </span>
        </div>
      </div>

      {/* Payment Terms Policy Matrix Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chính Sách Khung Điều Khoản Thanh Toán Chuẩn (Terms Policy Matrix)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Quy chuẩn công nợ và hạn mức bảo đảm theo từng nhóm phân loại đối tác cung ứng.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            TREASURY & PROCUREMENT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 hover:border-emerald-400 transition-colors">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">NET 45 / NET 60 Days</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Áp dụng cho các nhà cung cấp chiến lược (Tier A / Strategic Partners) với kim ngạch lớn, giao hàng OTIF ≥ 95% và lịch sử nghiệm thu đạt chuẩn.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 hover:border-blue-400 transition-colors">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 font-mono">NET 30 Days</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Tiêu chuẩn công nợ cơ bản cho các đối tác ưu tiên (Tier B / Preferred) sau khi biên bản nghiệm thu nhập kho GR được ký duyệt.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 hover:border-amber-400 transition-colors">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">NET 15 / COD / Advance 50%</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Áp dụng cho đối tác mới thiết lập quan hệ, nhà thầu phụ ngắn hạn hoặc các nhà cung cấp đang trong danh sách theo dõi chất lượng (Tier C).
            </p>
          </div>
        </div>
      </div>

      {/* Credit Facility & Terms Management Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        {/* Command Filter Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhà cung cấp theo mã, tên..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Mức Độ Sử Dụng:</span>
            </div>
            <select
              value={exposureFilter}
              onChange={(e) => setExposureFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="HIGH_EXPOSURE">Cận hạn mức (≥80%)</option>
              <option value="NORMAL">Hạn mức an toàn (&lt;80%)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Mã NCC</th>
                <th className="py-2.5 px-3">Tên Nhà Cung Cấp</th>
                <th className="py-2.5 px-3">Loại Hình</th>
                <th className="py-2.5 px-3">Điều Khoản</th>
                <th className="py-2.5 px-3 text-right">Hạn Mức Tín Dụng</th>
                <th className="py-2.5 px-3 text-right">Chi Tiêu Cam Kết</th>
                <th className="py-2.5 px-3 text-center w-36">Tỷ Lệ Sử Dụng</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy nhà cung cấp nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                  const limit = s.creditLimit || 500000000;
                  const spend = s.totalSpend || 0;
                  const rate = limit > 0 ? Math.min(100, Math.round((spend / limit) * 100)) : 0;
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.code || `SUP-${s.id}`}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {s.supplierType || 'Nhà sản xuất'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {s.paymentTerms || 'NET 30'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(limit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(spend)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Tỷ lệ:</span>
                            <span className={`font-bold ${rate >= 80 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {rate}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                rate >= 80 ? 'bg-rose-500' : rate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-blue-600 text-slate-700 rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Điều Chỉnh</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Terms & Credit Limit Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Điều Chỉnh Điều Khoản & Hạn Mức Tín Dụng</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Nhà Cung Cấp</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">{editingSupplier.name}</span>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{editingSupplier.code || `SUP-${editingSupplier.id}`}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Chính Sách Điều Khoản Thanh Toán *
                </label>
                <select
                  value={editPaymentTerms}
                  onChange={(e) => setEditPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                >
                  <option value="NET 15">NET 15 Days (Thanh toán sau 15 ngày)</option>
                  <option value="NET 30">NET 30 Days (Thanh toán sau 30 ngày - Tiêu chuẩn)</option>
                  <option value="NET 45">NET 45 Days (Thanh toán sau 45 ngày - Đối tác chiến lược)</option>
                  <option value="NET 60">NET 60 Days (Thanh toán sau 60 ngày - Hợp đồng dài hạn)</option>
                  <option value="COD">COD (Giao hàng thanh toán ngay)</option>
                  <option value="ADVANCE_50">Tạm ứng 50% trước sản xuất</option>
                  <option value="LC">L/C (Thư tín dụng ngân hàng)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Hạn Mức Tín Dụng Bảo Lãnh (VND) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000000"
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Bằng chữ: {formatCurrency(editCreditLimit)}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Lý Do / Căn Cứ Điều Chỉnh (Audit Trail)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ví dụ: Nâng hạn mức công nợ theo quyết định phê duyệt của Ban Giám đốc Q3/2026..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSubmittingTerms}
                  onClick={handleConfirmEditTerms}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Cập Nhật</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule #19 Centralized ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
