import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Percent,
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Globe,
  ShieldCheck,
  Search,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { CurrencyRate, SystemTaxRate } from './types';
import ConfirmDialog, { ConfirmDialogProps } from '../../../../components/common/ConfirmDialog';

interface SettingsCurrencyTaxTabProps {
  onNotify?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  currentUser?: any;
}

export const SettingsCurrencyTaxTab: React.FC<SettingsCurrencyTaxTabProps> = ({
  onNotify,
  currentUser,
}) => {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [taxes, setTaxes] = useState<SystemTaxRate[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [syncingVcb, setSyncingVcb] = useState(false);
  const [activeSection, setActiveSection] = useState<'CURRENCY' | 'TAX'>('CURRENCY');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dialogs
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Partial<CurrencyRate> | null>(null);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Partial<SystemTaxRate> | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps['dialog'] | null>(null);

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    try {
      const res = await fetch('/api/settings/currencies');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCurrencies(json.data);
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const fetchTaxes = async () => {
    setLoadingTaxes(true);
    try {
      const res = await fetch('/api/settings/tax-rates');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTaxes(json.data);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchTaxes();
  }, []);

  const handleSyncVcb = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đồng Bộ Tỷ Giá Vietcombank Trực Tuyến',
      message: 'Hệ thống sẽ cập nhật tỷ giá Mua / Bán mới nhất từ cổng thông tin Vietcombank FX. Các chứng từ đã đóng sổ hoặc duyệt hoàn tất sẽ KHÔNG bị ảnh hưởng. Bạn có chắc chắn muốn thực hiện?',
      confirmLabel: 'Đồng bộ ngay',
      cancelLabel: 'Bỏ qua',
      variant: 'primary',
      onConfirm: async () => {
        setSyncingVcb(true);
        try {
          const res = await fetch('/api/settings/currencies/sync-vcb', { method: 'POST' });
          const json = await res.json();
          if (json.success) {
            onNotify?.({
              type: 'success',
              title: 'Đồng Bộ Thành Công',
              message: json.message || 'Đã cập nhật tỷ giá trực tuyến thành công.',
            });
            fetchCurrencies();
          } else {
            throw new Error(json.error || 'Đồng bộ thất bại');
          }
        } catch (err: any) {
          onNotify?.({
            type: 'error',
            title: 'Lỗi Đồng Bộ Tỷ Giá',
            message: err.message,
          });
        } finally {
          setSyncingVcb(false);
        }
      },
    });
  };

  const handleSaveCurrency = async () => {
    if (!editingCurrency?.currencyCode || !editingCurrency?.currencyName || !editingCurrency?.buyRate || !editingCurrency?.sellRate) {
      onNotify?.({
        type: 'warning',
        title: 'Thiếu Dữ Liệu',
        message: 'Vui lòng điền đầy đủ Mã tiền tệ, Tên tiền tệ, Giá mua và Giá bán.',
      });
      return;
    }

    try {
      const isEdit = Boolean(editingCurrency.id);
      const url = isEdit ? `/api/settings/currencies/${editingCurrency.id}` : '/api/settings/currencies';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCurrency),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.({
          type: 'success',
          title: isEdit ? 'Cập Nhật Tỷ Giá' : 'Thêm Tỷ Giá Mới',
          message: json.message || 'Đã lưu cấu hình tỷ giá thành công.',
        });
        setCurrencyModalOpen(false);
        setEditingCurrency(null);
        fetchCurrencies();
      } else {
        throw new Error(json.error || 'Thao tác thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Lưu Tỷ Giá',
        message: err.message,
      });
    }
  };

  const handleSaveTax = async () => {
    if (!editingTax?.taxCode || !editingTax?.taxName || editingTax?.ratePercentage === undefined) {
      onNotify?.({
        type: 'warning',
        title: 'Thiếu Dữ Liệu',
        message: 'Vui lòng điền đầy đủ Mã thuế, Tên biểu thuế và Thuế suất (%).',
      });
      return;
    }

    try {
      const isEdit = Boolean(editingTax.id);
      const url = isEdit ? `/api/settings/tax-rates/${editingTax.id}` : '/api/settings/tax-rates';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTax),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.({
          type: 'success',
          title: isEdit ? 'Cập Nhật Biểu Thuế' : 'Thêm Biểu Thuế',
          message: json.message || 'Đã lưu cấu hình thuế suất GTGT thành công.',
        });
        setTaxModalOpen(false);
        setEditingTax(null);
        fetchTaxes();
      } else {
        throw new Error(json.error || 'Thao tác thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Lưu Thuế Suất',
        message: err.message,
      });
    }
  };

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.currencyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.currencyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTaxes = taxes.filter(
    (t) =>
      t.taxCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taxName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION SELECTOR HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('CURRENCY')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'CURRENCY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tỷ Giá Đa Ngoại Tệ (Multi-Currency FX)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {currencies.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('TAX')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'TAX'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Biểu Thuế Suất GTGT / VAT (Tax Authority)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {taxes.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã / tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeSection === 'CURRENCY' ? (
            <>
              <button
                onClick={handleSyncVcb}
                disabled={syncingVcb}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingVcb ? 'animate-spin' : ''}`} />
                <span>Đồng bộ VCB FX</span>
              </button>
              <button
                onClick={() => {
                  setEditingCurrency({
                    currencyCode: '',
                    currencyName: '',
                    buyRate: 25000,
                    sellRate: 25500,
                    standardRate: 25250,
                    effectiveDate: new Date().toISOString().slice(0, 10),
                    source: 'Vietcombank FX',
                    isActive: true,
                    isDefault: false,
                  });
                  setCurrencyModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Ngoại Tệ</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingTax({
                  taxCode: '',
                  taxName: '',
                  ratePercentage: 10,
                  effectiveFrom: new Date().toISOString().slice(0, 10),
                  isDefault: false,
                  applicableType: 'ALL',
                  status: 'ACTIVE',
                });
                setTaxModalOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Mức Thuế</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION CONTENT: CURRENCY TABLE */}
      {activeSection === 'CURRENCY' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                Bảng Tỷ Giá Ngoại Tệ Quy Đổi Sổ Cái & Bán Hàng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quy định tỷ giá chuyển đổi khi hạch toán hóa đơn ngoại tệ (M31), thanh toán ngân hàng (M32) và đánh giá lại chênh lệch tỷ giá cuối kỳ (M30).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Đồng tiền cơ sở:</span>
              <span className="font-mono font-bold px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                VND (Đồng Việt Nam)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã Tiền Tệ</th>
                  <th className="py-3 px-4">Tên Ngoại Tệ</th>
                  <th className="py-3 px-4 text-right">Tỷ Giá Mua (Buy)</th>
                  <th className="py-3 px-4 text-right">Tỷ Giá Bán (Sell)</th>
                  <th className="py-3 px-4 text-right">Tỷ Giá Chuẩn (Mid)</th>
                  <th className="py-3 px-4">Ngày Hiệu Lực</th>
                  <th className="py-3 px-4">Nguồn Cung Cấp</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCurrencies.map((c) => (
                  <tr
                    key={c.currencyCode}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                        {c.currencyCode}
                      </span>
                      {c.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Cơ sở
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {c.currencyName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {Number(c.buyRate).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                      {Number(c.sellRate).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold">
                      {Number(c.standardRate || c.sellRate).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {c.effectiveDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.source}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {c.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingCurrency({ ...c });
                          setCurrencyModalOpen(true);
                        }}
                        disabled={c.currencyCode === 'VND'}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors disabled:opacity-30"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION CONTENT: TAX TABLE */}
      {activeSection === 'TAX' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-500" />
                Danh Mục Thuế Suất GTGT Hợp Nhất (Central Tax Engine Authority)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các phân hệ M13 (Bán hàng), M08 (Mua hàng), M31 (Hóa đơn VAT) bắt buộc tham chiếu mã thuế suất tại đây; nghiêm cấm tự nhập tỷ lệ thuế tùy ý.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Thuế suất mặc định:</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                VAT10 (10%)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã Thuế</th>
                  <th className="py-3 px-4">Tên Biểu Thuế</th>
                  <th className="py-3 px-4 text-center">Thuế Suất (%)</th>
                  <th className="py-3 px-4">Phạm Vi Áp Dụng</th>
                  <th className="py-3 px-4">Ngày Bắt Đầu Hiệu Lực</th>
                  <th className="py-3 px-4 text-center">Mặc Định</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTaxes.map((t) => (
                  <tr
                    key={t.taxCode}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                        {t.taxCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {t.taxName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {t.ratePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {t.applicableType === 'ALL'
                        ? 'Toàn bộ Hàng hóa & Dịch vụ'
                        : t.applicableType === 'GOODS'
                        ? 'Chỉ Hàng hóa hữu hình'
                        : 'Chỉ Dịch vụ'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {t.effectiveFrom}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Có
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t.status === 'ACTIVE' ? 'Kích hoạt' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingTax({ ...t });
                          setTaxModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CURRENCY */}
      {currencyModalOpen && editingCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              {editingCurrency.id ? 'Cập Nhật Tỷ Giá Ngoại Tệ' : 'Thêm Mới Ngoại Tệ'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Mã Tiền Tệ (3 Ký Tự)</label>
                <input
                  type="text"
                  maxLength={3}
                  disabled={Boolean(editingCurrency.id)}
                  value={editingCurrency.currencyCode || ''}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, currencyCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="USD, EUR, JPY..."
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Tên Ngoại Tệ</label>
                <input
                  type="text"
                  value={editingCurrency.currencyName || ''}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, currencyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Đô la Mỹ, Đồng Euro..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Giá Mua (Buy Rate)</label>
                  <input
                    type="number"
                    value={editingCurrency.buyRate || ''}
                    onChange={(e) => setEditingCurrency({ ...editingCurrency, buyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Giá Bán (Sell Rate)</label>
                  <input
                    type="number"
                    value={editingCurrency.sellRate || ''}
                    onChange={(e) => setEditingCurrency({ ...editingCurrency, sellRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Ngày Hiệu Lực Áp Dụng</label>
                <input
                  type="date"
                  value={editingCurrency.effectiveDate || ''}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Nguồn Tỷ Giá</label>
                <input
                  type="text"
                  value={editingCurrency.source || ''}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, source: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrencyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveCurrency}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Lưu Tỷ Giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TAX */}
      {taxModalOpen && editingTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              {editingTax.id ? 'Cập Nhật Mức Thuế Suất GTGT' : 'Thêm Biểu Thuế Mới'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Mã Thuế (Tax Code)</label>
                <input
                  type="text"
                  disabled={Boolean(editingTax.id)}
                  value={editingTax.taxCode || ''}
                  onChange={(e) => setEditingTax({ ...editingTax, taxCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="VAT0, VAT5, VAT8, VAT10..."
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Tên Biểu Thuế</label>
                <input
                  type="text"
                  value={editingTax.taxName || ''}
                  onChange={(e) => setEditingTax({ ...editingTax, taxName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Thuế suất tiêu chuẩn 10%..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Thuế Suất (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingTax.ratePercentage ?? 10}
                    onChange={(e) => setEditingTax({ ...editingTax, ratePercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Ngày Hiệu Lực</label>
                  <input
                    type="date"
                    value={editingTax.effectiveFrom || ''}
                    onChange={(e) => setEditingTax({ ...editingTax, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Phạm Vi Áp Dụng</label>
                <select
                  value={editingTax.applicableType || 'ALL'}
                  onChange={(e) => setEditingTax({ ...editingTax, applicableType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Toàn bộ Hàng hóa & Dịch vụ</option>
                  <option value="GOODS">Chỉ áp dụng cho Hàng hóa</option>
                  <option value="SERVICES">Chỉ áp dụng cho Dịch vụ</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTaxModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveTax}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
              >
                Lưu Biểu Thuế
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
