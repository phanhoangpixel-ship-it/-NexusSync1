import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Package,
  Receipt,
  CheckCircle2,
  Clock,
  Briefcase,
  Cpu,
  Truck,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ProjectMaster } from '../../../../types/m35Types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { ConfirmDialogState } from '../../../../types';

interface ProjectJobCostingTabProps {
  currentProject: ProjectMaster;
  onSyncToM30?: () => void;
  onProjectUpdated?: () => void;
}

interface CostLedgerItem {
  id: number;
  costType: string;
  description: string;
  amount: number;
  sourceModule: string;
  date: string;
  referenceNo?: string;
  glAccountDebit?: string;
  glAccountCredit?: string;
}

interface JobCostData {
  projectId: string;
  projectCode: string;
  projectName: string;
  totalBudget: number;
  totalActualCost: number;
  variance: number;
  isUnderBudget: boolean;
  burnRatePct: number;
  breakdown: {
    labor: { amount: number; percentage: number; totalHours?: number; source: string; glAccount: string };
    material: { amount: number; percentage: number; source: string; glAccount: string };
    overhead: { amount: number; percentage: number; source: string; glAccount: string };
    equipment: { amount: number; percentage: number; source: string; glAccount: string };
    subcontract: { amount: number; percentage: number; source: string; glAccount: string };
  };
  costLedger: CostLedgerItem[];
}

interface MarginData {
  projectId: string;
  projectCode: string;
  projectName: string;
  contractNo: string;
  financials: {
    contractValueVND: number;
    totalBudgetVND: number;
    actualCostVND: number;
    billedAmountVND: number;
    unbilledAmountVND: number;
    grossProfitVND: number;
    grossMarginPct: number;
    billedProfitVND: number;
    billedMarginPct: number;
    pocPercent: number;
    pocRevenueVND: number;
    pocMarginVND: number;
    pocMarginPct: number;
    billingStatus: string;
    financialHealth: 'HEALTHY' | 'MODERATE' | 'AT_RISK';
  };
}

export const ProjectJobCostingTab: React.FC<ProjectJobCostingTabProps> = ({
  currentProject,
  onSyncToM30,
  onProjectUpdated,
}) => {
  const [jobCost, setJobCost] = useState<JobCostData | null>(null);
  const [margin, setMargin] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'BREAKDOWN' | 'LEDGER' | 'MARGIN'>('BREAKDOWN');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
  });

  // Billing Modal State (M31 Delegate)
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [billingAmount, setBillingAmount] = useState<number>(500000000);
  const [billingNotes, setBillingNotes] = useState<string>('Nghiệm thu thanh toán đợt theo tiến độ WBS');
  const [billingMilestone, setBillingMilestone] = useState<string>('Giai đoạn 1: Hoàn thành thiết kế & cài đặt mẫu');
  const [billingLoading, setBillingLoading] = useState<boolean>(false);
  const [billingSuccessMsg, setBillingSuccessMsg] = useState<string | null>(null);

  // Material Issue Modal State (M17 WMS Delegate)
  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
  const [materialQty, setMaterialQty] = useState<number>(5);
  const [materialProductId, setMaterialProductId] = useState<number>(1);
  const [materialWarehouseId, setMaterialWarehouseId] = useState<number>(1);
  const [materialLoading, setMaterialLoading] = useState<boolean>(false);
  const [materialSuccessMsg, setMaterialSuccessMsg] = useState<string | null>(null);

  const fetchFinancials = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const [costRes, marginRes] = await Promise.all([
        fetch(`/api/projects/${currentProject.id}/job-cost`).then(r => r.ok ? r.json() : null),
        fetch(`/api/projects/${currentProject.id}/margin`).then(r => r.ok ? r.json() : null),
      ]);
      if (costRes) setJobCost(costRes);
      if (marginRes) setMargin(marginRes);
    } catch (err) {
      console.warn('Error fetching project financials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [currentProject?.id, currentProject?.actualCostVND]);

  // Handle Delegate Billing (M31)
  const handleExecuteBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || billingAmount <= 0) return;

    setBillingLoading(true);
    setBillingSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: billingAmount,
          notes: billingNotes,
          customerName: currentProject.client,
          taxRate: 0.10,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBillingSuccessMsg(`Đã tạo Hóa đơn VAT [${data.invoiceNumber}] và hạch toán Sổ cái M30 thành công!`);
        await fetchFinancials();
        if (onProjectUpdated) onProjectUpdated();
        setTimeout(() => {
          setShowBillingModal(false);
          setBillingSuccessMsg(null);
        }, 2000);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Lỗi Xuất Hóa Đơn M31',
          message: data.error || 'Có lỗi khi xuất hóa đơn',
          variant: 'warning',
          onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
        });
      }
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Lỗi Kết Nối M31',
        message: `Lỗi kết nối M31: ${err.message}`,
        variant: 'warning',
        onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
      });
    } finally {
      setBillingLoading(false);
    }
  };

  // Handle Material Issue (M17 WMS)
  const handleExecuteMaterialIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || materialQty <= 0) return;

    setMaterialLoading(true);
    setMaterialSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/material-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: materialProductId,
          warehouseId: materialWarehouseId,
          quantity: materialQty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMaterialSuccessMsg(`Đã xuất kho ${materialQty} vật tư cho dự án và ghi nhận giá vốn M42!`);
        await fetchFinancials();
        if (onProjectUpdated) onProjectUpdated();
        setTimeout(() => {
          setShowMaterialModal(false);
          setMaterialSuccessMsg(null);
        }, 2000);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Lỗi Xuất Kho Vật Tư M17',
          message: data.error || 'Có lỗi khi xuất kho vật tư',
          variant: 'warning',
          onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
        });
      }
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Lỗi Kết Nối WMS M17',
        message: `Lỗi kết nối WMS M17: ${err.message}`,
        variant: 'warning',
        onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
      });
    } finally {
      setMaterialLoading(false);
    }
  };

  const budget = currentProject?.budgetVND || jobCost?.totalBudget || 4000000000;
  const actualCost = currentProject?.actualCostVND || jobCost?.totalActualCost || 2000000000;
  const contractValue = currentProject?.contractValueVND || margin?.financials?.contractValueVND || 5000000000;
  const billedAmount = margin?.financials?.billedAmountVND ?? currentProject?.billedAmountVND ?? 0;
  const grossProfit = contractValue - actualCost;
  const grossMarginPct = contractValue > 0 ? Number(((grossProfit / contractValue) * 100).toFixed(1)) : 0;
  const costVariance = budget - actualCost;

  const breakdownData = jobCost?.breakdown || {
    labor: { amount: Math.round(actualCost * 0.45), percentage: 45, source: 'M28 HRM & Timesheets', glAccount: 'TK 622 / 154' },
    material: { amount: Math.round(actualCost * 0.35), percentage: 35, source: 'M17 WMS & M42 Costing', glAccount: 'TK 621 / 154' },
    equipment: { amount: Math.round(actualCost * 0.12), percentage: 12, source: 'M27 EAM & Cloud Máy Chủ', glAccount: 'TK 623 / 154' },
    subcontract: { amount: Math.round(actualCost * 0.05), percentage: 5, source: 'M10/M11 Thuê Ngoài', glAccount: 'TK 154 / 331' },
    overhead: { amount: Math.round(actualCost * 0.03), percentage: 3, source: 'M30 GL Phân Bổ Chung', glAccount: 'TK 627 / 154' },
  };

  const costBreakdownList = [
    { key: 'labor', name: '01. Chi Phí Nhân Công Trực Tiếp (Labor Cost)', icon: Briefcase, color: 'bg-blue-500', ...breakdownData.labor },
    { key: 'material', name: '02. Chi Phí Vật Tư & Bản Quyền (Direct Material)', icon: Package, color: 'bg-emerald-500', ...breakdownData.material },
    { key: 'equipment', name: '03. Chi Phí Thiết Bị & Cloud (Equipment/Infra)', icon: Cpu, color: 'bg-purple-500', ...breakdownData.equipment },
    { key: 'subcontract', name: '04. Chi Phí Thầu Phụ & Thuê Ngoài (Subcontractor)', icon: Truck, color: 'bg-amber-500', ...breakdownData.subcontract },
    { key: 'overhead', name: '05. Chi Phí Quản Lý Dự Án & Chung (Overhead)', icon: Building, color: 'bg-slate-500', ...breakdownData.overhead },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-6">
      {/* Header & Controls */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              06. Hạch Toán Chi Phí Dự Án, Giá Thành &amp; Biên Lợi Nhuận (Job Costing &amp; Margin)
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              grossMarginPct >= 25
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                : grossMarginPct >= 10
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              Biên Lợi Nhuận: {grossMarginPct}% ({grossMarginPct >= 25 ? 'LÝ TƯỞNG' : 'CẦN TỐI ƯU'})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp 5 cấu phần chi phí (M28, M17, M27, M10, M30), ủy quyền xuất hóa đơn (M31) và liên kết đồng bộ Sổ cái GL (M30).
          </p>
        </div>

        {/* Action Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBillingModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            Xuất Hóa Đơn (M31 Billing)
          </button>

          <button
            type="button"
            onClick={() => setShowMaterialModal(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            Xuất Kho Vật Tư (M17 WMS)
          </button>

          {onSyncToM30 && (
            <button
              type="button"
              onClick={onSyncToM30}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Đồng bộ M30 (GL)
            </button>
          )}

          <button
            type="button"
            onClick={fetchFinancials}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards: 4 Key Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
            Doanh Thu Hợp Đồng:
          </span>
          <span className="text-base lg:text-lg font-mono font-bold text-slate-900 dark:text-white block">
            {contractValue.toLocaleString('vi-VN')} đ
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>HĐ: {currentProject?.contractNumber || `HD-${currentProject?.code}`}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100%</span>
          </div>
        </div>

        {/* Budget vs Actual Cost */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
            Ngân Sách (BAC) / Chi Phí (AC):
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base lg:text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
              {actualCost.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ {budget.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 dark:text-slate-400">Tỷ lệ giải ngân:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {((actualCost / (budget || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Billed vs Unbilled (M31 Invoicing) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
            Đã Xuất Hóa Đơn (M31 Invoiced):
          </span>
          <span className="text-base lg:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
            {billedAmount.toLocaleString('vi-VN')} đ
          </span>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 dark:text-slate-400">Còn chưa xuất:</span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
              {Math.max(0, contractValue - billedAmount).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
            Lãi Gộp Dự Án (Gross Margin):
          </span>
          <span className={`text-base lg:text-lg font-mono font-bold block ${
            grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {grossProfit.toLocaleString('vi-VN')} đ
          </span>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 dark:text-slate-400">Tỷ suất LN gộp:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {grossMarginPct}%
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher: Breakdown vs Ledger vs Margin Analytics */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubView('BREAKDOWN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'BREAKDOWN'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          5 Cấu Phần Chi Phí (Breakdown)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('LEDGER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'LEDGER'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Sổ Nhật Ký Chi Phí (Cost Ledger)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('MARGIN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'MARGIN'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Phân Tích Tiến Độ &amp; Lợi Nhuận (POC)
        </button>
      </div>

      {/* SUBVIEW 1: 5 Cost Components */}
      {activeSubView === 'BREAKDOWN' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {costBreakdownList.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200/80 dark:border-slate-700">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Nguồn: <strong>{item.source}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{item.glAccount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                        {item.amount.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Chiếm {item.percentage}% tổng chi phí
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, item.percentage)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: Project Cost Ledger */}
      {activeSubView === 'LEDGER' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Sổ cái ghi nhận tự động từ Chấm công (M28), Xuất kho (M17), và Phân bổ GL (M30):</span>
            <span className="font-mono font-bold">{jobCost?.costLedger?.length || 4} bút toán</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Loại Chi Phí</th>
                  <th className="py-2.5 px-3">Diễn Giải Bút Toán</th>
                  <th className="py-2.5 px-3 text-center">Nguồn Phân Hệ</th>
                  <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái Sổ Cái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {(jobCost?.costLedger || [
                  { id: 1, costType: 'LABOR', description: `Tổng hợp chấm công kỹ sư dự án [${currentProject.code}]`, amount: Math.round(actualCost * 0.45), sourceModule: 'M28', date: '2026-09-01' },
                  { id: 2, costType: 'MATERIAL', description: `Xuất kho vật tư cáp mạng & server (GDN-WMS-M17)`, amount: Math.round(actualCost * 0.35), sourceModule: 'M17', date: '2026-09-05' },
                  { id: 3, costType: 'EQUIPMENT', description: `Khấu hao hạ tầng máy chủ Cloud & thiết bị đo kiểm`, amount: Math.round(actualCost * 0.12), sourceModule: 'M27', date: '2026-09-08' },
                  { id: 4, costType: 'OVERHEAD', description: `Phân bổ chi phí quản lý điều hành dự án chung`, amount: Math.round(actualCost * 0.03), sourceModule: 'M30', date: '2026-09-10' },
                ]).map((entry: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{entry.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 font-mono">
                        {entry.costType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{entry.description}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {entry.sourceModule}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {entry.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        POSTED_GL
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: Percentage of Completion (POC) & Margin Engine */}
      {activeSubView === 'MARGIN' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                Tiến Độ Hoàn Thành Chi Phí (POC):
              </span>
              <span className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 block">
                {margin?.financials?.pocPercent || ((actualCost / (budget || 1)) * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 block pt-1">
                Theo chuẩn mực kế toán VAS 15 / IFRS 15
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                Doanh Thu Ghi Nhận Theo POC:
              </span>
              <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                {(margin?.financials?.pocRevenueVND || Math.round(contractValue * (actualCost / (budget || 1)))).toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block pt-1">
                Tương ứng khối lượng công việc đã nghiệm thu
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                Lãi Thực Tế Đã Xuất HĐ:
              </span>
              <span className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400 block">
                {(margin?.financials?.billedProfitVND || (billedAmount - actualCost)).toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block pt-1">
                Đã lập hóa đơn M31 trừ đi chi phí thực tế
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BILLING MODAL (M31 DELEGATE) */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Xuất Hóa Đơn Nghiệm Thu (M31 Invoicing)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ủy quyền phân hệ M31 lập hóa đơn điện tử &amp; tự động định khoản Sổ cái M30.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {billingSuccessMsg ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {billingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleExecuteBilling} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dự án &amp; Khách hàng
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`[${currentProject.code}] ${currentProject.name} — ${currentProject.client}`}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Tiền Xuất Hóa Đơn (Trước thuế, VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="1000000"
                    step="500000"
                    required
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-2 mt-1.5">
                    {[
                      { label: '20% HĐ', val: Math.round(contractValue * 0.2) },
                      { label: '30% HĐ', val: Math.round(contractValue * 0.3) },
                      { label: '50% HĐ', val: Math.round(contractValue * 0.5) },
                      { label: 'Còn lại', val: Math.max(0, contractValue - billedAmount) },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setBillingAmount(preset.val)}
                        className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-mono text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giai Đoạn Nghiệm Thu / Milestone
                  </label>
                  <input
                    type="text"
                    value={billingMilestone}
                    onChange={(e) => setBillingMilestone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi Chú Hóa Đơn &amp; Chứng Từ Kèm Theo
                  </label>
                  <textarea
                    rows={2}
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Định khoản kế toán tự động (M30 GL):
                  </div>
                  <div>Nợ TK 131 (Phải thu KH): {(billingAmount * 1.1).toLocaleString('vi-VN')} đ</div>
                  <div>Có TK 511 (Doanh thu dự án): {billingAmount.toLocaleString('vi-VN')} đ</div>
                  <div>Có TK 3331 (Thuế GTGT 10%): {(billingAmount * 0.1).toLocaleString('vi-VN')} đ</div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBillingModal(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={billingLoading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {billingLoading ? 'Đang xuất HĐ...' : 'Phê Duyệt & Xuất Hóa Đơn M31'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MATERIAL ISSUE MODAL (M17 WMS DELEGATE) */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  Xuất Kho Vật Tư Dự Án (M17 WMS Issue)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ủy quyền ghi nhận xuất kho qua InventoryService và tính giá vốn M42.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {materialSuccessMsg ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {materialSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleExecuteMaterialIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dự Án Đích
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`[${currentProject.code}] ${currentProject.name}`}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vật Tư / Thiết Bị Cần Xuất *
                  </label>
                  <select
                    value={materialProductId}
                    onChange={(e) => setMaterialProductId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value={1}>Cáp mạng Cat6 UTP &amp; Đầu cắm RJ45 (Cuộn 305m)</option>
                    <option value={2}>Switch Cisco Catalyst 24 Port Gigabit PoE+</option>
                    <option value={3}>Bộ định tuyến Firewall FortiGate 60F</option>
                    <option value={4}>Tủ Rack 42U kèm PDU quản trị nguồn</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kho Xuất Hàng *
                    </label>
                    <select
                      value={materialWarehouseId}
                      onChange={(e) => setMaterialWarehouseId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    >
                      <option value={1}>Kho Tổng Vật Tư (Long An)</option>
                      <option value={2}>Kho Dự Án Miền Nam (HCM)</option>
                      <option value={3}>Kho Dự Án Miền Bắc (Hà Nội)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số Lượng Xuất *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={materialQty}
                      onChange={(e) => setMaterialQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Quy trình kiểm soát tồn kho (Single Writer):
                  </div>
                  <div>Ghi nhận GDN kho M17 qua InventoryService.postTransaction()</div>
                  <div>Hạch toán giá vốn TK 621 (Chi phí NVL trực tiếp) / Có TK 152 / TK 156</div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowMaterialModal(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={materialLoading}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {materialLoading ? 'Đang xuất kho...' : 'Xác Nhận Xuất Kho WMS'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Rule #19 Enterprise Confirm Dialog */}
      <ConfirmDialog state={confirmDialog} setState={setConfirmDialog} />
    </div>
  );
};
