import React, { useState } from 'react';
import {
  Sliders,
  Calculator,
  Check,
  ArrowRight,
  TrendingUp,
  Percent,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Edit3,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers
} from 'lucide-react';
import { CategoryPricingRule } from '../../../../types/pricingManagement';
import { calculateMarkupPrice, calculateMarginPrice, calculateActualMargin, calculateActualMarkup, checkMinimumMargin } from '../utils/pricingMath';
import { CurrencyInputField } from '../../../../components/common/CurrencyInputField';
import { formatVND } from '../../../../lib/currency';

interface PricingRulesTabProps {
  categoryRules: CategoryPricingRule[];
  onUpdateRule: (updatedRule: CategoryPricingRule) => void;
}

export const PricingRulesTab: React.FC<PricingRulesTabProps> = ({
  categoryRules,
  onUpdateRule
}) => {
  // Interactive Simulator State
  const [testCost, setTestCost] = useState<number>(444444);
  const [testMarkup, setTestMarkup] = useState<number>(50);
  const [testMargin, setTestMargin] = useState<number>(30);
  const [minMarginLimit, setMinMarginLimit] = useState<number>(15);

  // Modal State for Editing / Adding Rule
  const [editingRule, setEditingRule] = useState<CategoryPricingRule | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Editing Rule
  const [formCategory, setFormCategory] = useState('');
  const [formRuleType, setFormRuleType] = useState<'MARKUP' | 'TARGET_MARGIN'>('MARKUP');
  const [formRuleValue, setFormRuleValue] = useState<number>(30);
  const [formMinMargin, setFormMinMargin] = useState<number>(15);
  const [formRoundingMode, setFormRoundingMode] = useState<'NEAREST_1000' | 'NEAREST_100' | 'EXACT'>('NEAREST_1000');
  const [previewSampleCost, setPreviewSampleCost] = useState<number>(500000);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Calculations for Sandbox
  const validTestCost = testCost > 0;
  const calculatedMarkupPrice = validTestCost ? calculateMarkupPrice(testCost, testMarkup) : 0;
  const actualMarginFromMarkup = validTestCost && calculatedMarkupPrice > 0 ? calculateActualMargin(testCost, calculatedMarkupPrice) : 0;

  const calculatedMarginPrice = validTestCost ? calculateMarginPrice(testCost, testMargin) : 0;
  const actualMarkupFromMargin = validTestCost && calculatedMarginPrice > 0 ? calculateActualMarkup(testCost, calculatedMarginPrice) : 0;

  // Open Edit Modal
  const handleOpenEdit = (rule: CategoryPricingRule) => {
    setEditingRule(rule);
    setFormCategory(rule.category);
    setFormRuleType(rule.ruleType);
    setFormRuleValue(rule.ruleValue);
    setFormMinMargin(rule.minMarginPercent);
    setFormRoundingMode(rule.roundingMode);
    setPreviewSampleCost(500000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormCategory('');
    setFormRuleType('MARKUP');
    setFormRuleValue(35);
    setFormMinMargin(15);
    setFormRoundingMode('NEAREST_1000');
    setPreviewSampleCost(500000);
    setIsAddModalOpen(true);
  };

  // Save Modal
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory.trim()) return;

    if (editingRule) {
      const updated: CategoryPricingRule = {
        ...editingRule,
        category: formCategory.trim(),
        ruleType: formRuleType,
        ruleValue: Number(formRuleValue),
        minMarginPercent: Number(formMinMargin),
        roundingMode: formRoundingMode,
        updatedBy: 'Hoàng Nam (Admin)',
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      onUpdateRule(updated);
      showToast('success', `Đã cập nhật thành công quy tắc định giá cho danh mục "${formCategory}" (${formRuleType === 'MARKUP' ? `+${formRuleValue}%` : `${formRuleValue}% Margin`})!`);
      setEditingRule(null);
    } else {
      const newRule: CategoryPricingRule = {
        id: `CR-${Date.now().toString().slice(-4)}`,
        category: formCategory.trim(),
        description: `Quy tắc định giá danh mục ${formCategory.trim()}`,
        ruleType: formRuleType,
        ruleValue: Number(formRuleValue),
        minMarginPercent: Number(formMinMargin),
        roundingMode: formRoundingMode,
        isActive: true,
        appliedProductCount: 0,
        updatedBy: 'Hoàng Nam (Admin)',
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      onUpdateRule(newRule);
      showToast('success', `Đã tạo mới quy tắc định giá cho danh mục "${formCategory}"!`);
      setIsAddModalOpen(false);
    }
  };

  // Modal live calculations
  const validModalCost = previewSampleCost > 0;
  const modalCalcPrice = !validModalCost ? 0 : (formRuleType === 'MARKUP'
    ? calculateMarkupPrice(previewSampleCost, formRuleValue, formRoundingMode)
    : calculateMarginPrice(previewSampleCost, formRuleValue, formRoundingMode));
  const modalMargin = validModalCost && modalCalcPrice > 0 ? calculateActualMargin(previewSampleCost, modalCalcPrice) : 0;
  const isBelowSafeMargin = modalMargin < formMinMargin;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-md flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
        </div>
      )}

      {/* Visual Mathematical Distinction: Markup vs Target Margin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-md border border-indigo-200 dark:border-indigo-800">
                Phương pháp 1: Markup (Thặng Dư Trên Vốn)
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Công thức: Cost × (1 + Markup%)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Thường dùng trong phân phối linh kiện IT & bán lẻ truyền thống. Giá bán được tính bằng cách cộng trực tiếp phần trăm thặng dư vào giá vốn nhập kho.
            </p>

            {/* Sandbox Calculator for Markup */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Vốn Giả Định</label>
                  <CurrencyInputField
                    value={testCost}
                    onChange={setTestCost}
                    placeholder="VD: 444.444"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ Lệ Markup (%)</label>
                  <input
                    type="number"
                    value={testMarkup}
                    onChange={(e) => setTestMarkup(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Kết quả Giá Bán:</span>
                  <div className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-base">{formatVND(calculatedMarkupPrice)}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400">Biên LN thực tế (Margin):</span>
                  <div className={`font-mono font-bold text-sm ${actualMarginFromMarkup < minMarginLimit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {actualMarginFromMarkup.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-md border border-emerald-200 dark:border-emerald-800">
                Phương pháp 2: Target Margin (Biên Lợi Nhuận Mục Tiêu)
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Công thức: Cost / (1 - Margin%)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Thường dùng trong quản trị tài chính doanh nghiệp lớn. Đảm bảo tỷ suất lợi nhuận gộp trên tổng doanh thu luôn đạt mức cam kết bất kể biến động giá vốn.
            </p>

            {/* Sandbox Calculator for Margin */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Vốn Giả Định</label>
                  <CurrencyInputField
                    value={testCost}
                    onChange={setTestCost}
                    placeholder="VD: 444.444"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Biên Mục Tiêu (%)</label>
                  <input
                    type="number"
                    value={testMargin}
                    onChange={(e) => setTestMargin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Kết quả Giá Bán:</span>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-base">{formatVND(calculatedMarginPrice)}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400">Thặng dư tương ứng (Markup):</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {actualMarkupFromMargin.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Rules Table Header & Action */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cấu Hình Quy Tắc Định Giá Theo Danh Mục Sản Phẩm (Category Rules)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tự động áp dụng cho các SKU thuộc danh mục tương ứng khi không có giá riêng biệt.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm Quy Tắc Danh Mục
        </button>
      </div>

      {/* Category Rules List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-3">Mô Tả Quy Tắc</th>
                <th className="py-3.5 px-3 text-center">Loại Định Giá</th>
                <th className="py-3.5 px-3 text-right">Giá Trị Cài Đặt</th>
                <th className="py-3.5 px-3 text-center">Ngưỡng Sàn An Toàn</th>
                <th className="py-3.5 px-3 text-center">Làm Tròn Giá</th>
                <th className="py-3.5 px-3 text-center">SKU Áp Dụng</th>
                <th className="py-3.5 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {categoryRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {rule.category}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                    {rule.description}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      rule.ruleType === 'MARKUP'
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {rule.ruleType === 'MARKUP' ? 'Markup Thặng Dư' : 'Target Margin'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {rule.ruleValue}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      ≥ {rule.minMarginPercent}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                    {rule.roundingMode}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {rule.appliedProductCount} SKUs
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleOpenEdit(rule)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Cấu Hình
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(editingRule || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                {editingRule ? `Cấu Hình Quy Tắc: ${editingRule.category}` : 'Thêm Quy Tắc Định Giá Danh Mục Mới'}
              </h3>
              <button
                onClick={() => { setEditingRule(null); setIsAddModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Danh Mục Sản Phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: RAM, SSD, CPU, VGA, Mainboard..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương Pháp Định Giá</label>
                  <select
                    value={formRuleType}
                    onChange={(e) => setFormRuleType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="MARKUP">Markup (Thặng dư trên vốn)</option>
                    <option value="TARGET_MARGIN">Target Margin (Biên mục tiêu)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formRuleType === 'MARKUP' ? 'Tỷ Lệ Markup (%)' : 'Biên Lợi Nhuận (%)'} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formRuleValue}
                    onChange={(e) => setFormRuleValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngưỡng Biên Sàn An Toàn (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMinMargin}
                    onChange={(e) => setFormMinMargin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Cảnh báo đỏ nếu margin thực tế thấp hơn ngưỡng này</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quy Tắc Làm Tròn Giá</label>
                  <select
                    value={formRoundingMode}
                    onChange={(e) => setFormRoundingMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="NEAREST_1000">Làm tròn đến 1.000₫</option>
                    <option value="NEAREST_100">Làm tròn đến 100₫</option>
                    <option value="EXACT">Giữ chính xác (Exact)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Mô Phỏng Tính Toán Thử Nghiệm:</span>
                  <div className="flex items-center gap-1.5 font-normal text-xs">
                    <span>Giá vốn mẫu:</span>
                    <input
                      type="number"
                      value={previewSampleCost}
                      step="50000"
                      onChange={(e) => setPreviewSampleCost(Number(e.target.value))}
                      className="w-24 px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-right"
                    />
                    <span>₫</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Giá bán ra:</span>
                    <strong className="text-indigo-700 dark:text-indigo-300 text-sm">{formatVND(modalCalcPrice)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 block">Biên LN thực tế:</span>
                    <strong className={isBelowSafeMargin ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {modalMargin.toFixed(2)}% {isBelowSafeMargin && '(! Dưới sàn)'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditingRule(null); setIsAddModalOpen(false); }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Lưu Quy Tắc Định Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
