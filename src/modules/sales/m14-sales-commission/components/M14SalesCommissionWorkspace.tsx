import React, { useState, useEffect, useMemo } from 'react';
import {
  M14SalesCommissionWorkspaceProps,
  CommissionPlan,
  CommissionCalculationRecord,
  ClawbackItem,
  CommissionDisputeRecord,
  CommissionPayoutBatch,
  SalesQuotaRecord,
} from './types';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import {
  Percent,
  TrendingUp,
  RotateCcw,
  Scale,
  CreditCard,
  Target,
  RefreshCw,
  Award,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Layers,
  ShieldCheck,
  Radio,
  FileText
} from 'lucide-react';
import { PlanRuleManagerTab } from './PlanRuleManagerTab';
import { CalculationLedgerTab } from './CalculationLedgerTab';
import { ClawbackManagerTab } from './ClawbackManagerTab';
import { DisputeResolutionTab } from './DisputeResolutionTab';
import { PayoutPayrollTab } from './PayoutPayrollTab';
import { QuotaAcceleratorTab } from './QuotaAcceleratorTab';

export const M14SalesCommissionWorkspace: React.FC<M14SalesCommissionWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'plans' | 'calculations' | 'clawback' | 'disputes' | 'payouts' | 'quotas'>('M14', 'plans');
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Live Data States
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [calculations, setCalculations] = useState<CommissionCalculationRecord[]>([]);
  const [clawbacks, setClawbacks] = useState<ClawbackItem[]>([]);
  const [disputes, setDisputes] = useState<CommissionDisputeRecord[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayoutBatch[]>([]);
  const [quotas, setQuotas] = useState<SalesQuotaRecord[]>([]);

  // Cross-tab interaction for dispute submission
  const [disputeCalcTarget, setDisputeCalcTarget] = useState<CommissionCalculationRecord | null>(null);

  // QA Certification State (Phase 12)
  const [showQaModal, setShowQaModal] = useState<boolean>(false);
  const [runningQa, setRunningQa] = useState<boolean>(false);
  const [qaResults, setQaResults] = useState<any>(null);

  const handleRunQaCertification = async () => {
    setRunningQa(true);
    try {
      const res = await fetch('/api/commission/qa-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setQaResults(data.data);
        onNotify('success', 'Xác Nhận QA 19/19 Hoàn Tất', `Đã niêm phong bất biến module M14 (${data.data.sealCode})`);
      } else {
        onNotify('danger', 'Lỗi kiểm thử QA', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống QA', err.message);
    } finally {
      setRunningQa(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, calcsRes, clawRes, dispRes, payRes, qtaRes] = await Promise.all([
        fetch('/api/commission/plans'),
        fetch('/api/commission/calculations'),
        fetch('/api/commission/clawbacks'),
        fetch('/api/commission/disputes'),
        fetch('/api/commission/payouts'),
        fetch('/api/commission/quotas'),
      ]);

      const [plansData, calcsData, clawData, dispData, payData, qtaData] = await Promise.all([
        plansRes.json(),
        calcsRes.json(),
        clawRes.json(),
        dispRes.json(),
        payRes.json(),
        qtaRes.json(),
      ]);

      if (plansData.success && Array.isArray(plansData.data)) setPlans(plansData.data);
      if (calcsData.success && Array.isArray(calcsData.data)) setCalculations(calcsData.data);
      if (clawData.success && Array.isArray(clawData.data)) setClawbacks(clawData.data);
      if (dispData.success && Array.isArray(dispData.data)) setDisputes(dispData.data);
      if (payData.success && Array.isArray(payData.data)) setPayouts(payData.data);
      if (qtaData.success && Array.isArray(qtaData.data)) setQuotas(qtaData.data);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải dữ liệu M14', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const calcList = calculations || [];
    const clawList = clawbacks || [];
    const dispList = disputes || [];
    const payList = payouts || [];

    const totalAccrued = calcList
      .filter((c) => c.status === 'ACCRUED' || c.status === 'ELIGIBLE' || c.status === 'SETTLED')
      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

    const marginBasedCount = calcList.filter((c) => c.calculationBasis === 'GROSS_MARGIN').length;

    const totalClawback = clawList.reduce((acc, c) => acc + Math.abs(c.commissionAmount || 0), 0);

    const openDisputesCount = dispList.filter((d) => d.status === 'OPEN').length;

    const pendingPayoutsAmount = payList
      .filter((p) => p.status === 'DRAFT' || p.status === 'APPROVED')
      .reduce((acc, p) => acc + (p.totalNetAmount || 0), 0);

    return {
      totalAccrued,
      marginBasedCount,
      totalClawback,
      openDisputesCount,
      pendingPayoutsAmount,
    };
  }, [calculations, clawbacks, disputes, payouts]);

  const handleSubscribeEvents = async () => {
    try {
      const res = await fetch('/api/commission/subscribe-events', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'EventBus M05 Đã Kết Nối', data.message);
      } else {
        onNotify('danger', 'Lỗi kết nối EventBus', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleOpenDisputeModal = (calc: CommissionCalculationRecord) => {
    setDisputeCalcTarget(calc);
    setActiveTab('disputes');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* L0: Top Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              M14 — SALES COMMISSION & INCENTIVE ENGINE (CHÍNH DANH)
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              Động Cơ Hoa Hồng & Động Lực Kinh Doanh
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Quản lý toàn diện chính sách hoa hồng theo Doanh thu & Biên Lợi Nhuận Gộp (M42 COGS), Tự động khấu trừ thu hồi RMA (M15), Xử lý khiếu nại minh bạch và Tích hợp chi trả qua Bảng lương M28 HR & Sổ cái M30 GL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowQaModal(true);
                if (!qaResults) handleRunQaCertification();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-xl text-xs font-bold text-amber-200 transition-colors shadow-xs cursor-pointer"
              title="Kiểm thử toàn diện 19/19 kịch bản & Niêm phong bất biến Pha 12"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Chứng Nhận QA 19/19 (Pha 12)</span>
            </button>
            <button
              onClick={handleSubscribeEvents}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/40 rounded-xl text-xs font-semibold text-indigo-100 transition-colors shadow-xs cursor-pointer"
              title="Đăng ký lắng nghe sự kiện tự động từ M05 EventBus"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>EventBus M05</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Global Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tổng Hoa Hồng Đã Tính</span>
            <span className="text-sm sm:text-base font-extrabold text-white font-mono tabular-nums">
              {metrics.totalAccrued.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tính Theo Margin M42</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono tabular-nums">
              {metrics.marginBasedCount} bút toán
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Khấu Trừ Thu Hồi RMA</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-400 font-mono tabular-nums">
              -{metrics.totalClawback.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Khiếu Nại Cần Xử Lý</span>
            <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono tabular-nums">
              {metrics.openDisputesCount} phiếu mở
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Quyết Toán Chờ Chi</span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-300 font-mono tabular-nums">
              {metrics.pendingPayoutsAmount.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
      </div>

      {/* L1: Subtabs Navigation Bar (Segmented pill bar matching M15 layout) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Kế Hoạch & Tầng Bậc (Plans & Rules)</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'plans' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calculations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'calculations'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sổ Nhật Ký Tính Toán (Ledger)</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'calculations' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {calculations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('clawback')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'clawback'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thu Hồi RMA (Clawbacks)</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'clawback' ? 'bg-rose-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {clawbacks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Khiếu Nại & Phân Xử (Disputes)</span>
          {metrics.openDisputesCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-amber-200 text-amber-900 font-extrabold">
              {metrics.openDisputesCount}
            </span>
          ) : (
            <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'disputes' ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              {disputes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Quyết Toán & Lương M28 (Payouts)</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'payouts' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {payouts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quotas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'quotas'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Chỉ Tiêu & Accelerator (Quotas)</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${activeTab === 'quotas' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {quotas.length}
          </span>
        </button>
      </div>

      {/* L3 Panels */}
      {activeTab === 'plans' && (
        <PlanRuleManagerTab
          plans={plans}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {activeTab === 'calculations' && (
        <CalculationLedgerTab
          calculations={calculations}
          plans={plans}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
          onOpenDispute={handleOpenDisputeModal}
        />
      )}

      {activeTab === 'clawback' && (
        <ClawbackManagerTab
          clawbacks={clawbacks}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {activeTab === 'disputes' && (
        <DisputeResolutionTab
          disputes={disputes}
          calculations={calculations}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
          activeDisputeModalCalc={disputeCalcTarget}
          onCloseDisputeModal={() => setDisputeCalcTarget(null)}
        />
      )}

      {activeTab === 'payouts' && (
        <PayoutPayrollTab
          payouts={payouts}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {activeTab === 'quotas' && (
        <QuotaAcceleratorTab
          quotas={quotas}
          onRefresh={fetchData}
          onNotify={onNotify}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Phase 12: QA Certification & Invariance Lock Modal */}
      {showQaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-400/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Chứng Nhận QA 19/19 & Niêm Phong Bất Biến (Pha 12)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kiểm thử tự động trên live database, xác thực Single-Writer & Đóng băng phạm vi Module M14
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQaModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {runningQa && (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Đang kích hoạt 19 kịch bản kiểm thử trên live database...
                  </p>
                  <p className="text-xs text-slate-400">
                    Kiểm tra M14 ↔ M42 COGS, M05 EventBus, M15 Clawback, M28 Split, M30 GL
                  </p>
                </div>
              )}

              {!runningQa && qaResults && (
                <div className="space-y-4">
                  {/* Seal Badge Banner */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span className="font-bold text-sm tracking-wide">CHỨNG NHẬN ĐẠT 19/19 KỊCH BẢN KIỂM THỬ</span>
                      </div>
                      <p className="text-xs text-emerald-100 font-mono">
                        Mã niêm phong: {qaResults.sealCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider text-white">
                        FROZEN & IMMUTABLE
                      </span>
                      <p className="text-[10px] text-emerald-100 mt-1">{new Date(qaResults.sealedTimestamp).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Scenarios List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Chi tiết 19 Kịch Bản Đã Xác Minh Live:
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {qaResults.scenarios.map((sc: any) => (
                        <div
                          key={sc.id}
                          className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {sc.code}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{sc.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
                                {sc.domainAuthority}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{sc.details}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-mono text-[11px]">{sc.latencyMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tuân thủ nghiêm ngặt Governance Rule 16 (Frozen Scope Protection)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunQaCertification}
                  disabled={runningQa}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {runningQa ? 'Đang Chạy...' : 'Chạy Lại Kiểm Thử'}
                </button>
                <button
                  onClick={() => setShowQaModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default M14SalesCommissionWorkspace;
