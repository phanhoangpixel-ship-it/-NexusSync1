import React, { useState, useEffect } from 'react';
import { SelectedEntityContext } from '../../../../types/index';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import {
  Wrench,
  Plus,
  Cpu,
  RefreshCw,
  Activity,
  CheckCircle2,
  Printer,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PdfPrintModal } from '../../../../components/modals/PdfPrintModal';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';

import { AssetRegistryTab } from './AssetRegistryTab';
import { WorkOrdersTab } from './WorkOrdersTab';
import { PreventivePlansTab } from './PreventivePlansTab';
import { PredictiveIotTab } from './PredictiveIotTab';
import { MroCostLedgerTab } from './MroCostLedgerTab';
import { EamDmsAuditTab } from './EamDmsAuditTab';

import { CreateAssetModal } from './CreateAssetModal';
import { CreateWorkOrderModal } from './CreateWorkOrderModal';

interface AssetMaintenanceWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  currentUser?: any;
}

export const AssetMaintenanceWorkspace: React.FC<AssetMaintenanceWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  currentUser,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'assets' | 'workOrders' | 'plans' | 'predictive' | 'mroCost' | 'dmsAudit'
  >('M27', 'assets');

  const [assets, setAssets] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [reliability, setReliability] = useState<any>({
    mtbfHours: 720,
    mttrHours: 2.8,
    availabilityPercent: 99.6,
    totalDowntimeHours: 12.5,
    criticalityBreakdown: { A: 0, B: 0, C: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [isCreateWoModalOpen, setIsCreateWoModalOpen] = useState(false);
  const [selectedAssetForWo, setSelectedAssetForWo] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, wRes, pRes, relRes] = await Promise.all([
        fetch('/api/eam/assets').then((r) => r.json()),
        fetch('/api/eam/work-orders').then((r) => r.json()),
        fetch('/api/eam/maintenance-schedules').then((r) => r.json()),
        fetch('/api/eam/analytics/reliability').then((r) => r.json()).catch(() => null),
      ]);
      const aData = Array.isArray(aRes) ? aRes : [];
      setAssets(aData);
      setWorkOrders(Array.isArray(wRes) ? wRes : []);
      setPlans(Array.isArray(pRes) ? pRes : []);
      if (relRes && relRes.success) {
        setReliability(relRes);
      }

      if (aData.length > 0 && !selectedAsset) {
        handleSelectAsset(aData[0]);
      }
    } catch (err) {
      console.error('Error fetching EAM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPrimaryAction(() => () => setIsCreateWoModalOpen(true), 'Phát Phiếu Bảo Trì WO');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  const handleSelectAsset = (asset: any) => {
    setSelectedAsset(asset);
    onSelectEntity({
      type: 'EAM_ASSET',
      id: asset.id,
      code: asset.code,
      title: `Thiết bị: ${asset.name} — ${asset.model || 'Model'} (${asset.status})`,
      status: asset.status,
      lineage: [
        {
          id: `cat-${asset.categoryId || 1}`,
          type: 'Nhóm thiết bị',
          code: asset.categoryName || 'MÁY MÓC',
          relation: 'CATEGORY_PARENT',
          status: 'ACTIVE',
        },
        {
          id: `ast-${asset.id}`,
          type: 'Hồ sơ thiết bị tài sản',
          code: asset.code,
          relation: 'ROOT_ASSET',
          status: asset.status,
        },
        {
          id: `pm-plan-1`,
          type: 'Lịch bảo dưỡng định kỳ PM',
          code: 'PM-PREVENTIVE-30D',
          relation: 'MAINTENANCE_SCHEDULE',
          status: 'ACTIVE',
        },
        {
          id: `wo-active`,
          type: 'Phiếu bảo trì công tác',
          code: 'WO-ACTIVE',
          relation: 'ACTIVE_WORK_ORDER',
          status: 'IN_PROGRESS',
        },
      ],
      auditTrail: [
        {
          id: 1,
          action: 'Đăng ký hồ sơ tài sản thiết bị vào sổ cái EAM',
          timestamp: asset.purchaseDate || '2024-03-15T00:00:00Z',
          user: asset.responsibleEmployeeName || 'asset_admin',
          sha256Checksum: '5a4b3c2d1e0f9876543210fedcba',
        },
        {
          id: 2,
          action: 'Kiểm định kỹ thuật & gắn cảm biến IoT Edge',
          timestamp: '2024-03-20T09:00:00Z',
          user: 'KTV Trưởng Trần Văn Hùng',
          sha256Checksum: '1e0f5a4b3c2d9988776655443322',
        },
      ],
      glEntries: [
        {
          account: 'TK 211',
          accountName: 'Tài sản cố định hữu hình',
          debit: asset.purchaseCost || 1850000000,
          credit: 0,
          description: `Nguyên giá thiết bị ${asset.code}`,
        },
        {
          account: 'TK 214',
          accountName: 'Hao mòn TSCĐ lũy kế',
          debit: 0,
          credit: (asset.purchaseCost || 1850000000) - (asset.bookValue || 1520000000),
          description: `Khấu hao lũy kế ${asset.code}`,
        },
        {
          account: 'TK 627',
          accountName: 'Chi phí bảo trì sửa chữa máy móc',
          debit: 3500000,
          credit: 0,
          description: `Chi phí phụ tùng bảo trì ${asset.code}`,
        },
      ],
    });
  };

  const handleOpenCreateWoForAsset = (asset?: any) => {
    setSelectedAssetForWo(asset || null);
    setIsCreateWoModalOpen(true);
  };

  // KPI Calculations
  const totalAssetsCount = assets.length;
  const activeAssetsCount = assets.filter((a) => a.status === 'ACTIVE' || a.status === 'IN_USE').length;
  const pendingWoCount = workOrders.filter((w) => w.status !== 'COMPLETED').length;
  const totalMaintenanceCost = workOrders.reduce((sum, w) => sum + (w.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4-CARD STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Thiết Bị (EAM)
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalAssetsCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">máy móc xưởng</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đang Hoạt Động (In-Use)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {activeAssetsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ {totalAssetsCount} máy</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Phiếu Bảo Trì Cần Xử Lý
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {pendingWoCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">phiếu chờ nghiệm thu</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chi Phí MRO Đã Hạch Toán
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {(totalMaintenanceCost / 1000000).toFixed(1)} Tr
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">VND phân bổ TK 627</span>
          </div>
        </div>
      </div>

      {/* RELIABILITY & OEE ANALYTICS STRIP */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Chỉ Số Độ Tin Cậy &amp; Sẵn Sàng (RAMS / OEE)</h4>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">ISO 55000</span>
            </div>
            <p className="text-[11px] text-slate-300">Tính toán tự động từ hồ sơ vận hành và lịch sử bảo dưỡng WO</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">MTBF (Thời gian chạy)</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{reliability?.mtbfHours || 720}h</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">MTTR (Thời gian sửa)</span>
            <span className="text-sm font-mono font-bold text-amber-400">{reliability?.mttrHours || 2.8}h</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Độ Khả Dụng (Availability)</span>
            <span className="text-sm font-mono font-bold text-blue-400">{reliability?.availabilityPercent || 99.6}%</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Trọng Yếu Tier A/B/C</span>
            <div className="text-xs font-mono font-bold flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-rose-400" title="Tier A: Cực kỳ quan trọng">{reliability?.criticalityBreakdown?.A || 0}A</span>
              <span className="text-slate-500">/</span>
              <span className="text-amber-400" title="Tier B: Quan trọng">{reliability?.criticalityBreakdown?.B || 0}B</span>
              <span className="text-slate-500">/</span>
              <span className="text-blue-400" title="Tier C: Tiêu chuẩn">{reliability?.criticalityBreakdown?.C || 0}C</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-3 bg-slate-50/70 dark:bg-slate-900/60 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'assets'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Hồ Sơ Thiết Bị &amp; Tài Sản (EAM)
            </button>
            <button
              onClick={() => setActiveTab('workOrders')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'workOrders'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Phiếu Bảo Trì (Work Orders)
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Kế Hoạch Bảo Dưỡng (PM Plans)
            </button>
            <button
              onClick={() => setActiveTab('predictive')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'predictive'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              📡 Cảm Biến IoT &amp; AI Dự Đoán
            </button>
            <button
              onClick={() => setActiveTab('mroCost')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'mroCost'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              💰 Sổ Chi Phí MRO &amp; Sổ Cái (TK 627/211/214)
            </button>
            <button
              onClick={() => setActiveTab('dmsAudit')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dmsAudit'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              🛡️ Hồ Sơ DMS &amp; Audit Trail
            </button>
          </div>

          <div className="flex items-center gap-2 pl-4">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="In / Xuất Báo Cáo PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          {activeTab === 'assets' && (
            <AssetRegistryTab
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={handleSelectAsset}
              onOpenCreateModal={() => setIsCreateAssetModalOpen(true)}
              onOpenCreateWoModal={handleOpenCreateWoForAsset}
              onRefreshData={fetchData}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'workOrders' && (
            <WorkOrdersTab
              workOrders={workOrders}
              onOpenCreateModal={() => setIsCreateWoModalOpen(true)}
              onRefreshData={fetchData}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'plans' && (
            <PreventivePlansTab
              plans={plans}
              assets={assets}
              onRefreshData={fetchData}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'predictive' && (
            <PredictiveIotTab
              onOpenCreateWoModal={handleOpenCreateWoForAsset}
              onNotify={onNotify}
            />
          )}

          {activeTab === 'mroCost' && (
            <MroCostLedgerTab onNotify={onNotify} />
          )}

          {activeTab === 'dmsAudit' && (
            <EamDmsAuditTab onNotify={onNotify} />
          )}
        </div>
      </div>

      {/* CREATE ASSET MODAL */}
      <CreateAssetModal
        isOpen={isCreateAssetModalOpen}
        onClose={() => setIsCreateAssetModalOpen(false)}
        onSuccess={fetchData}
        onNotify={onNotify}
      />

      {/* CREATE WORK ORDER MODAL */}
      <CreateWorkOrderModal
        isOpen={isCreateWoModalOpen}
        onClose={() => {
          setIsCreateWoModalOpen(false);
          setSelectedAssetForWo(null);
        }}
        assets={assets}
        initialAssetId={selectedAssetForWo?.id}
        onSuccess={fetchData}
        onNotify={onNotify}
      />

      {/* MODAL IN & XUẤT BÁO CÁO PDF */}
      <PdfPrintModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        module={{
          code: 'M27',
          moduleName: 'Quản Lý & Bảo Trì Thiết Bị EAM',
        }}
        currentUser={currentUser}
        onNotify={onNotify}
      />
    </div>
  );
};
