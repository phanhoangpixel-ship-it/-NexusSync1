import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import React, { useState, useMemo } from 'react';
import { CommissionPlan, CommissionRule } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  Plus,
  Percent,
  Layers,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Info,
  Search,
  Filter,
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { CalculationBasisBadge } from './M14Badges';

interface PlanRuleManagerTabProps {
  plans: CommissionPlan[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const PlanRuleManagerTab: React.FC<PlanRuleManagerTabProps> = ({
  plans,
  onRefresh,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [basisFilter, setBasisFilter] = useState<'ALL' | 'GROSS_MARGIN' | 'ORDER_CONFIRMED' | 'INVOICE_ISSUED' | 'PAYMENT_COLLECTED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanBasis, setNewPlanBasis] = useState<'ORDER_CONFIRMED' | 'INVOICE_ISSUED' | 'PAYMENT_COLLECTED' | 'GROSS_MARGIN'>('GROSS_MARGIN');
  const [newPlanFreq, setNewPlanFreq] = useState('MONTHLY');
  const [tierMin, setTierMin] = useState<number>(0);
  const [tierMax, setTierMax] = useState<number>(1000000000);
  const [tierRate, setTierRate] = useState<number>(5.0);
  const [tierAccel, setTierAccel] = useState<number>(1.2);
  const [tierFixed, setTierFixed] = useState<number>(0);

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'FLAT_RATE' | 'TIERED_AMOUNT' | 'TIERED_PERCENT' | 'MARGIN_PERCENT' | 'ACCELERATOR'>('MARGIN_PERCENT');
  const [newRuleMin, setNewRuleMin] = useState<number>(0);
  const [newRuleMax, setNewRuleMax] = useState<number>(100000000);
  const [newRuleRate, setNewRuleRate] = useState<number>(8.0);
  const [newRuleFixed, setNewRuleFixed] = useState<number>(0);
  const [newRuleAccel, setNewRuleAccel] = useState<number>(1.15);

  // Tab 1 KPI Metrics
  const metrics = useMemo(() => {
    const planList = plans || [];
    const totalPlans = planList.length;
    const marginPlans = planList.filter((p) => p.calculationBasis === 'GROSS_MARGIN').length;
    const activePlans = planList.filter((p) => p.status === 'ACTIVE').length;
    const totalRules = planList.reduce((acc, p) => acc + (p.rules?.length || 0), 0);

    return { totalPlans, marginPlans, activePlans, totalRules };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return (plans || []).filter((p) => {
      const matchSearch =
        (p.planCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchBasis = basisFilter === 'ALL' || p.calculationBasis === basisFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchBasis && matchStatus;
    });
  }, [plans, searchQuery, basisFilter, statusFilter]);

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên kế hoạch hoa hồng');
      return;
    }

    try {
      const payload = {
        name: newPlanName.trim(),
        description: newPlanDesc,
        calculationBasis: newPlanBasis,
        payoutFrequency: newPlanFreq,
        status: 'ACTIVE',
        rules: [
          {
            ruleName: `Tier 1 (Cơ bản)`,
            ruleType: newPlanBasis === 'GROSS_MARGIN' ? 'MARGIN_PERCENT' : 'TIERED_AMOUNT',
            minThreshold: tierMin,
            maxThreshold: tierMax || null,
            ratePercent: tierRate,
            fixedAmount: tierFixed,
            acceleratorMultiplier: tierAccel,
            priorityOrder: 1,
          }
        ]
      };

      const res = await fetch('/api/commission/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Thành công', `Đã tạo kế hoạch hoa hồng: ${newPlanName}`);
        setShowNewPlanModal(false);
        setNewPlanName('');
        setNewPlanDesc('');
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi tạo kế hoạch', data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleAddRule = async () => {
    if (!selectedPlanId || !newRuleName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn kế hoạch và nhập tên quy tắc');
      return;
    }

    try {
      const payload = {
        planId: selectedPlanId,
        ruleName: newRuleName.trim(),
        ruleType: newRuleType,
        minThreshold: newRuleMin,
        maxThreshold: newRuleMax || null,
        ratePercent: newRuleRate,
        fixedAmount: newRuleFixed,
        acceleratorMultiplier: newRuleAccel,
        priorityOrder: 2,
      };

      const res = await fetch('/api/commission/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Thành công', `Đã thêm quy tắc hoa hồng cho kế hoạch`);
        setShowAddRuleModal(false);
        setNewRuleName('');
        onRefresh();
      } else {
        onNotify('danger', 'Lỗi thêm quy tắc', data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* L2: 4-Card KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Kế Hoạch Hoa Hồng
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
            {metrics.totalPlans}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {metrics.totalRules} tầng bậc & ma trận thưởng
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Theo Gross Margin (M42)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.marginPlans}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Tính trực tiếp từ COGS M42
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chính Sách Đang Hoạt Động
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400 mt-1">
            {metrics.activePlans}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Sẵn sàng tích lũy theo đơn hàng
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quy Tắc Tầng Bậc (Rules)
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            {metrics.totalRules}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Bao gồm hệ số Accelerator & Quota
          </div>
        </div>
      </div>

      {/* L3: Workspace Control Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Kế Hoạch & Tầng Bậc Tính Hoa Hồng (Plans & Rule Matrix)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hỗ trợ cơ chế tính trên Doanh số xuất hóa đơn (Revenue) và Lợi nhuận gộp thực tế (Gross Margin - M42 COGS)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Kế Hoạch Mới</span>
            </button>
          </div>
        </div>

        {/* L3: Search & Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã kế hoạch, tên chính sách, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setBasisFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setBasisFilter('GROSS_MARGIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'GROSS_MARGIN'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Gross Margin M42
            </button>
            <button
              type="button"
              onClick={() => setBasisFilter('ORDER_CONFIRMED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                basisFilter === 'ORDER_CONFIRMED'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              Doanh Số
            </button>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPlans.length}</span> chính sách
          </div>
        </div>

        {/* Plans Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.length === 0 ? (
            <div className="col-span-full p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Không tìm thấy kế hoạch hoa hồng nào khớp với bộ lọc.
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const isActive = plan.status === 'ACTIVE';
              const isMargin = plan.calculationBasis === 'GROSS_MARGIN';

              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-xl border transition-all duration-150 ease-in-out hover:shadow-md flex flex-col justify-between bg-white dark:bg-slate-800 ${
                    isActive
                      ? isMargin
                        ? 'border-l-4 border-l-emerald-600 border-slate-200 dark:border-slate-700 bg-emerald-50/10'
                        : 'border-l-4 border-l-indigo-600 border-slate-200 dark:border-slate-700 bg-indigo-50/10'
                      : 'border-l-4 border-l-slate-400 border-slate-200 dark:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 inline-block tabular-nums mb-1">
                          {plan.planCode}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {plan.name}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                      }`}>
                        {isActive ? 'ĐANG ÁP DỤNG' : 'TẠM DỪNG'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {plan.description || 'Chính sách hoa hồng kinh doanh tiêu chuẩn áp dụng cho đội ngũ bán hàng'}
                    </p>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Cơ sở tính:</span>
                        <CalculationBasisBadge basis={plan.calculationBasis} />
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Kỳ quyết toán:</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{plan.payoutFrequency}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Số lượng tầng bậc:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{plan.rules?.length || 0} tầng</span>
                      </div>
                    </div>

                    {/* Rules List Preview */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        Tầng bậc & Ma trận tỷ lệ thưởng (%):
                      </div>
                      {plan.rules && plan.rules.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {plan.rules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <span className="truncate max-w-[140px] text-[11px] font-medium">{rule.ruleName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
                                  {rule.ratePercent}%
                                </span>
                                {rule.acceleratorMultiplier > 1 && (
                                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700">
                                    x{rule.acceleratorMultiplier}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Chưa có quy tắc chi tiết</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      M14 Plan Matrix
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setShowAddRuleModal(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm Tầng Bậc</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: New Plan */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Thiết Lập Kế Hoạch Hoa Hồng Mới
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Cấu hình kế hoạch phân bổ hoa hồng theo doanh số hoặc biên lợi nhuận gộp (M42 COGS)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Kế Hoạch Hoa Hồng *
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="VD: Kế hoạch Hoa hồng Lợi nhuận Gộp Q3/2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Phạm vi áp dụng
                </label>
                <textarea
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Áp dụng cho toàn bộ khối Sales Enterprise & Khách hàng phân phối..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cơ sở tính toán *
                  </label>
                  <select
                    value={newPlanBasis}
                    onChange={(e: any) => setNewPlanBasis(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="GROSS_MARGIN">Lợi nhuận gộp (M42 Margin)</option>
                    <option value="ORDER_CONFIRMED">Đơn hàng xác nhận (Order Confirmed)</option>
                    <option value="INVOICE_ISSUED">Hóa đơn xuất (Invoice Issued)</option>
                    <option value="PAYMENT_COLLECTED">Thực thu tiền mặt/CK (Payment Collected)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỳ quyết toán
                  </label>
                  <select
                    value={newPlanFreq}
                    onChange={(e) => setNewPlanFreq(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="MONTHLY">Hàng tháng (Monthly)</option>
                    <option value="QUARTERLY">Hàng quý (Quarterly)</option>
                    <option value="TRANSACTIONAL">Theo từng đơn (Transactional)</option>
                  </select>
                </div>
              </div>

              {/* Baseline Tier Settings */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Cấu hình Tầng bậc Khởi tạo (Tier 1)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Tỷ lệ hoa hồng (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tierRate}
                      onChange={(e) => setTierRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Hệ số Vượt chỉ tiêu (Accel)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={tierAccel}
                      onChange={(e) => setTierAccel(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowNewPlanModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Tạo Kế Hoạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Thêm Tầng Bậc / Quy Tắc Mới
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Thêm tầng thưởng theo ngưỡng doanh số hoặc biên lợi nhuận
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Tầng bậc *</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="VD: Tier 2 (Biên LN > 30% hoặc Doanh số > 1 Tỷ)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại quy tắc</label>
                  <select
                    value={newRuleType}
                    onChange={(e: any) => setNewRuleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="MARGIN_PERCENT">Biên LN % (Margin %)</option>
                    <option value="TIERED_AMOUNT">Ngưỡng Doanh số (VND)</option>
                    <option value="ACCELERATOR">Hệ số Quota Thưởng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ lệ thưởng (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRuleRate}
                    onChange={(e) => setNewRuleRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngưỡng tối thiểu</label>
                  <input
                    type="number"
                    value={newRuleMin}
                    onChange={(e) => setNewRuleMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngưỡng tối đa</label>
                  <input
                    type="number"
                    value={newRuleMax}
                    onChange={(e) => setNewRuleMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hệ số thưởng gia tốc (Accelerator)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newRuleAccel}
                  onChange={(e) => setNewRuleAccel(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Lưu Quy Tắc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
