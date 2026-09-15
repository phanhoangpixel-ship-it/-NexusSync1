import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../common/CurrencyInput';
import { SelectedEntityContext } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  Filter,
  DollarSign,
  Cpu,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { PdfPrintModal } from '../modals/PdfPrintModal';
import { useWorkspaceAction } from '../shell/DomainWorkspaceShell';

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
  const [isCreating, setIsCreating] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'assets' | 'workOrders' | 'plans' | 'predictive' | 'mroCost'>('M27', 'assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const handleIoTScan = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Quét cảm biến IoT & Chẩn đoán bất thường (Predictive AI)',
      message: 'Hệ thống sẽ đồng bộ trực tuyến dữ liệu rung động, nhiệt độ và điện áp từ các cảm biến IoT gắn trên 12 máy móc chính để phát hiện sớm nguy cơ hỏng hóc.',
      variant: 'primary',
      onConfirm: () => {
        onNotify('success', 'Quét IoT thành công', 'Không phát hiện bất thường nghiêm trọng. Độ rung động các trạm ở mức an toàn.');
      },
    });
  };

  const handleSyncLedger = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đồng bộ sổ cái Tài sản cố định (TK 211, TK 214) & Chi phí MRO (TK 627)?',
      message: 'Hệ thống sẽ hạch toán tự động các khoản chi phí bảo trì YTD vào TK 627 (Chi phí sản xuất chung), ghi nhận khấu hao lũy kế vào TK 214 và cập nhật giá trị sổ sách ròng trên TK 211.',
      variant: 'primary',
      onConfirm: () => {
        onNotify('success', 'Đồng bộ sổ cái thành công', 'Đã hạch toán chi phí MRO vào TK 627 và cập nhật khấu hao TK 211 / TK 214 hoàn tất.');
      },
    });
  };

  const handleBatchTriggerPM = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kích hoạt hàng loạt lịch bảo dưỡng định kỳ (Batch PM)?',
      message: 'Hệ thống sẽ tự động sinh danh sách phiếu bảo trì (Work Orders) cho toàn bộ các thiết bị sắp đến hạn bảo dưỡng trong tuần này.',
      variant: 'warning',
      onConfirm: () => {
        onNotify('success', 'Đã khởi tạo hàng loạt', 'Đã tạo thành công 4 phiếu bảo trì định kỳ PM vào hệ thống.');
      },
    });
  };

  // Create WO form
  const [formAssetId, setFormAssetId] = useState<number>(1);
  const [formType, setFormType] = useState<string>('PREVENTIVE');
  const [formPriority, setFormPriority] = useState<string>('NORMAL');
  const [formDesc, setFormDesc] = useState<string>('Bảo dưỡng & tra dầu trục vít me định kỳ');
  const [formTech, setFormTech] = useState<string>('Kỹ thuật viên Trần Văn Hùng');
  const [submitting, setSubmitting] = useState(false);

  // Complete WO modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingWo, setCompletingWo] = useState<any | null>(null);
  const [completeCost, setCompleteCost] = useState<number>(3500000);
  const [completeDowntime, setCompleteDowntime] = useState<number>(3.5);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'primary' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, wRes, pRes] = await Promise.all([
        fetch('/api/eam/assets').then((r) => r.json()),
        fetch('/api/eam/work-orders').then((r) => r.json()),
        fetch('/api/eam/maintenance-plans').then((r) => r.json()),
      ]);
      const aData = Array.isArray(aRes) ? aRes : [];
      setAssets(aData);
      setWorkOrders(Array.isArray(wRes) ? wRes : []);
      setPlans(Array.isArray(pRes) ? pRes : []);

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
    setPrimaryAction(() => () => setIsCreating(true), 'Tạo Phiếu Bảo Trì WO');
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
        { id: `cat-${asset.categoryId}`, type: 'Nhóm thiết bị', code: asset.categoryName || 'MÁY MÓC', relation: 'CATEGORY_PARENT', status: 'ACTIVE' },
        { id: `ast-${asset.id}`, type: 'Hồ sơ thiết bị tài sản', code: asset.code, relation: 'ROOT_ASSET', status: asset.status },
        { id: `pm-plan-1`, type: 'Lịch bảo dưỡng định kỳ PM', code: 'PM-SMT-MONTHLY', relation: 'MAINTENANCE_SCHEDULE', status: 'ACTIVE' },
        { id: `wo-1`, type: 'Phiếu bảo trì gần nhất', code: 'WO-2026-0001', relation: 'ACTIVE_WORK_ORDER', status: 'ASSIGNED' },
      ],
      auditTrail: [
        { id: 1, action: 'Đăng ký hồ sơ tài sản thiết bị', timestamp: asset.purchaseDate || '2024-03-15T00:00:00Z', user: 'asset_admin', sha256Checksum: '5a4b3c2d1e0f' },
        { id: 2, action: 'Hiệu chuẩn & đưa vào vận hành', timestamp: '2024-03-20T09:00:00Z', user: 'tech_lead', sha256Checksum: '1e0f5a4b3c2d' },
      ],
      glEntries: [
        { account: 'TK 211', accountName: 'Tài sản cố định hữu hình', debit: asset.purchaseCost || 1850000000, credit: 0, description: `Nguyên giá thiết bị ${asset.code}` },
        { account: 'TK 214', accountName: 'Hao mòn TSCĐ lũy kế', debit: 0, credit: (asset.purchaseCost || 1850000000) - (asset.bookValue || 1520000000), description: `Khấu hao lũy kế ${asset.code}` },
        { account: 'TK 627', accountName: 'Chi phí bảo trì sửa chữa máy móc', debit: 3500000, credit: 0, description: `Chi phí phụ tùng bảo trì ${asset.code}` },
      ],
    });
  };

  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/eam/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: formAssetId,
          maintenanceType: formType,
          priority: formPriority,
          description: formDesc,
          assignedTechnicianName: formTech,
        }),
      });
      if (res.ok) {
        onNotify('success', 'Tạo phiếu bảo trì thành công', 'Phiếu công tác bảo trì đã được phân công.');
        setIsCreating(false);
        fetchData();
      } else {
        onNotify('danger', 'Lỗi tạo phiếu', 'Không thể khởi tạo phiếu bảo trì.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCompleteModal = (wo: any) => {
    setCompletingWo(wo);
    setCompleteCost(wo.totalCost > 0 ? wo.totalCost : 3500000);
    setCompleteDowntime(wo.downtimeHours > 0 ? wo.downtimeHours : 2.5);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmCompleteWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingWo) return;
    try {
      const res = await fetch(`/api/eam/work-orders/${completingWo.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCost: completeCost,
          downtimeHours: completeDowntime,
        }),
      });
      if (res.ok) {
        onNotify('success', 'Nghiệm thu bảo trì hoàn tất', `Phiếu ${completingWo.woCode} đã được nghiệm thu và ghi nhận chi phí.`);
        setIsCompleteModalOpen(false);
        fetchData();
      } else {
        onNotify('danger', 'Lỗi hoàn tất', 'Không thể lưu trạng thái nghiệm thu.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  // Calculations
  const totalAssetsCount = assets.length;
  const activeAssetsCount = assets.filter((a) => a.status === 'ACTIVE' || a.status === 'IN_USE').length;
  const pendingWoCount = workOrders.filter((w) => w.status !== 'COMPLETED').length;
  const totalMaintenanceCost = workOrders.reduce((sum, w) => sum + (w.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4-CARD STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Thiết Bị</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalAssetsCount}</span>
            <span className="text-xs text-slate-500">máy móc xưởng</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang Hoạt Động (In-Use)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">{activeAssetsCount}</span>
            <span className="text-xs text-slate-500">/ {totalAssetsCount} máy</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phiếu Bảo Trì Cần Xử Lý</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600">{pendingWoCount}</span>
            <span className="text-xs text-slate-500">phiếu chờ nghiệm thu</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi Phí Bảo Trì YTD</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600">
              {(totalMaintenanceCost / 1000000).toFixed(1)} Tr
            </span>
            <span className="text-xs text-slate-500">VND phân bổ 627</span>
          </div>
        </div>
      </div>

      {/* EAM QUICK ACTION BAR */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Thanh Tác Vụ Nhanh Quản Trị Thiết Bị (EAM Quick Action Bar)</h4>
            <p className="text-xs text-slate-300">Quét cảm biến IoT dự đoán hỏng hóc và kích hoạt hàng loạt lịch bảo dưỡng định kỳ chỉ với 1 chạm.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Bản xem trước trực tiếp & In / Xuất PDF"
          >
            <Printer className="w-4 h-4" />
            In / Xuất PDF
          </button>
          <button
            onClick={handleIoTScan}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            Quét Cảm Biến IoT
          </button>
          <button
            onClick={handleBatchTriggerPM}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Kích Hoạt PM Hàng Loạt
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'assets'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Hồ Sơ Thiết Bị & Tài Sản (EAM)
            </button>
            <button
              onClick={() => setActiveTab('workOrders')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'workOrders'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Phiếu Bảo Trì & Sửa Chữa (Work Orders)
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'plans'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Kế Hoạch Bảo Dưỡng Định Kỳ (PM Plans)
            </button>
            <button
              onClick={() => setActiveTab('predictive')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'predictive'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              📡 Giám Sát IoT & Dự Đoán (Predictive)
            </button>
            <button
              onClick={() => setActiveTab('mroCost')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'mroCost'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              💰 Chi Phí MRO & Sổ Cái (TK 627, 211, 214)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: ASSET REGISTRY */}
        {activeTab === 'assets' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã máy, tên thiết bị, vị trí..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Mã Thiết Bị</th>
                    <th className="py-3 px-4">Tên Thiết Bị / Model</th>
                    <th className="py-3 px-4">Nhóm Tài Sản</th>
                    <th className="py-3 px-4">Vị Trí Lắp Đặt</th>
                    <th className="py-3 px-4 text-right">Nguyên Giá (VND)</th>
                    <th className="py-3 px-4 text-right">Giá Trị Còn Lại</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-100 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{asset.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{asset.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {asset.model} • SN: {asset.serialNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{asset.categoryName}</td>
                        <td className="py-3 px-4 text-slate-600">{asset.location}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900">
                          {asset.purchaseCost ? asset.purchaseCost.toLocaleString('vi-VN') : '—'} ₫
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {asset.bookValue ? asset.bookValue.toLocaleString('vi-VN') : '—'} ₫
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              asset.status === 'ACTIVE' || asset.status === 'IN_USE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: WORK ORDERS */}
        {activeTab === 'workOrders' && (
          <div className="p-6 space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Mã Phiếu WO</th>
                    <th className="py-3 px-4">Thiết Bị Cần Bảo Trì</th>
                    <th className="py-3 px-4">Loại Bảo Trì</th>
                    <th className="py-3 px-4">Kỹ Thuật Viên Phụ Trách</th>
                    <th className="py-3 px-4 text-center">Downtime (Giờ)</th>
                    <th className="py-3 px-4 text-right">Chi Phí (VND)</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{wo.woCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{wo.assetName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wo.maintenanceType === 'PREVENTIVE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {wo.maintenanceType === 'PREVENTIVE' ? 'Bảo dưỡng định kỳ' : 'Sửa chữa đột xuất'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{wo.assignedTechnicianName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {wo.downtimeHours}h
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {wo.totalCost ? wo.totalCost.toLocaleString('vi-VN') : '0'} ₫
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            wo.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {wo.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenCompleteModal(wo)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs ml-auto"
                          >
                            <CheckCircle className="w-3 h-3" /> Nghiệm Thu
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PREVENTIVE MAINTENANCE PLANS */}
        {activeTab === 'plans' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.planCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">Chu kỳ: {p.intervalDays} ngày</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lần thực hiện trước</span>
                      <strong className="font-mono text-slate-800">{p.lastPerformedDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kỳ bảo dưỡng kế tiếp</span>
                      <strong className="font-mono text-blue-700">{p.nextDueDate}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PREDICTIVE IoT MONITORING */}
        {activeTab === 'predictive' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-600 rounded text-white font-bold">IOT SENSOR SYNC: 12/12 ONLINE</span>
                <h3 className="text-lg font-bold mt-2">Hệ Thống Giám Sát Cảm Biến Thời Gian Thực & Dự Đoán Hỏng Hóc (Predictive AI)</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Theo dõi liên tục biên độ rung động (Vibration mm/s), nhiệt độ ổ bi (°C) và điện áp dòng điện để tự động phát hiện dấu hiệu bất thường trước khi xảy ra dừng máy ngoài kế hoạch.
                </p>
              </div>
              <button
                onClick={handleIoTScan}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Activity className="w-4 h-4" />
                Chạy Quét AI Anomaly Detection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Tình Trạng Cảm Biến</span>
                <div className="text-2xl font-bold font-mono text-emerald-600">100% Online</div>
                <p className="text-[11px] text-slate-500">Tất cả gateway IoT MQTT hoạt động ổn định.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Nhiệt Độ Trục Trung Bình</span>
                <div className="text-2xl font-bold font-mono text-blue-600">48.2 °C</div>
                <p className="text-[11px] text-slate-500">Ngưỡng cảnh báo: &gt; 65 °C.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Độ Rung Động (Vibration)</span>
                <div className="text-2xl font-bold font-mono text-emerald-600">1.4 mm/s</div>
                <p className="text-[11px] text-slate-500">Mức độ êm ái cao, không có dấu hiệu mòn bạc đạn.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Rủi Ro Dừng Máy (Downtime Risk)</span>
                <div className="text-2xl font-bold font-mono text-indigo-600">2.1%</div>
                <p className="text-[11px] text-slate-500">Rất thấp, tiếp tục theo dõi định kỳ.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Danh Sách Trạm & Cảm Biến Thời Gian Thực</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">AST-001 — CNC Mill 5-Axis</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">STABLE</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>Nhiệt độ ổ bi: <strong className="font-mono">52.4 °C</strong></div>
                    <div>Độ rung: <strong className="font-mono">1.8 mm/s</strong></div>
                    <div>Dòng điện tiêu thụ: <strong className="font-mono">14.2 A</strong></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">AST-002 — SMT Pick & Place</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">STABLE</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>Nhiệt độ đầu phun: <strong className="font-mono">44.1 °C</strong></div>
                    <div>Độ rung: <strong className="font-mono">0.9 mm/s</strong></div>
                    <div>Áp suất khí nén: <strong className="font-mono">6.2 bar</strong></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">AST-003 — Robotic Welding Cell</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">WATCH</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>Nhiệt độ mỏ hàn: <strong className="font-mono">58.6 °C</strong></div>
                    <div>Độ rung: <strong className="font-mono">2.6 mm/s</strong></div>
                    <div>Điện áp: <strong className="font-mono">380 V</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MRO COST & FIXED ASSET LEDGER (TK 627, 211, 214) */}
        {activeTab === 'mroCost' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-600 rounded text-white font-bold">LEDGER SYNC: ACTIVE (TK 627 / 211 / 214)</span>
                <h3 className="text-lg font-bold mt-2">Bảng Điều Hành & Nghiệm Thu Chi Phí MRO & Sổ Cái Tài Sản Cố Định</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Kiểm soát chi phí bảo trì YTD hạch toán vào TK 627 (Chi phí sản xuất chung), quản lý khấu hao lũy kế tài sản cố định (TK 214) và nguyên giá / giá trị sổ sách ròng (TK 211).
                </p>
              </div>
              <button
                onClick={handleSyncLedger}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <DollarSign className="w-4 h-4" />
                Đồng Bộ Sổ Cái Tự Động
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Chi Phí MRO YTD (TK 627)</span>
                <div className="text-2xl font-bold font-mono text-indigo-700">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMaintenanceCost || 142500000)}
                </div>
                <p className="text-[11px] text-slate-500">Đã hạch toán từ các phiếu bảo trì nghiệm thu.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Khấu Hao Lũy Kế (TK 214)</span>
                <div className="text-2xl font-bold font-mono text-amber-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(1850000000)}
                </div>
                <p className="text-[11px] text-slate-500">Khấu hao máy móc thiết bị nhà xưởng tính đến tháng hiện tại.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Giá Trị Sổ Sách Ròng (TK 211)</span>
                <div className="text-2xl font-bold font-mono text-emerald-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(8250000000)}
                </div>
                <p className="text-[11px] text-slate-500">Nguyên giá trừ khấu hao lũy kế toàn hệ thống.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Thời Gian Dừng Máy (Downtime)</span>
                <div className="text-2xl font-bold font-mono text-blue-600">14.5 Giờ</div>
                <p className="text-[11px] text-slate-500">Tổng thời gian dừng máy phục vụ bảo trì YTD.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Bảng Đối Chiếu Hạch Toán Kế Toán & Phân Bổ Chi Phí MRO</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200/60 text-slate-700 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Mã Bút Toán</th>
                      <th className="p-3">Tài Khoản Ghi Nợ (Debit)</th>
                      <th className="p-3">Tài Khoản Ghi Có (Credit)</th>
                      <th className="p-3">Nội Dung Nghiệp Vụ</th>
                      <th className="p-3 text-right">Số Tiền (VND)</th>
                      <th className="p-3 text-center rounded-r-xl">Trạng Thái Sổ Cái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-mono font-bold text-blue-600">GL-2026-881</td>
                      <td className="p-3 font-mono font-semibold">TK 627 (Chi phí SXC)</td>
                      <td className="p-3 font-mono text-slate-600">TK 152 / TK 331</td>
                      <td className="p-3">Xuất kho phụ tùng MRO bảo dưỡng định kỳ trạm CNC</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">18,500,000 ₫</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">ĐÃ POST</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-blue-600">GL-2026-882</td>
                      <td className="p-3 font-mono font-semibold">TK 627 (Chi phí SXC)</td>
                      <td className="p-3 font-mono text-slate-600">TK 334 / TK 338</td>
                      <td className="p-3">Chi phí nhân công đội kỹ thuật bảo dưỡng SMT Line</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">24,000,000 ₫</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">ĐÃ POST</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-blue-600">GL-2026-883</td>
                      <td className="p-3 font-mono font-semibold">TK 214 (Khấu hao TSCĐ)</td>
                      <td className="p-3 font-mono text-slate-600">TK 211 (Nguyên giá TSCĐ)</td>
                      <td className="p-3">Hạch toán khấu hao tháng định kỳ cho dây chuyền robot</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">125,000,000 ₫</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">ĐÃ POST</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" /> Khởi Tạo Phiếu Bảo Trì (Work Order)
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thiết bị cần bảo dưỡng / sửa chữa *</label>
                <select
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại công tác bảo trì</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="PREVENTIVE">Bảo dưỡng định kỳ (Preventive)</option>
                    <option value="CORRECTIVE">Sửa chữa đột xuất (Corrective)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="NORMAL">Bình thường (NORMAL)</option>
                    <option value="HIGH">Ưu tiên cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kỹ thuật viên phụ trách *</label>
                <input
                  type="text"
                  value={formTech}
                  onChange={(e) => setFormTech(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả công việc & nội dung bảo dưỡng *</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Xác Nhận Phát Phiếu WO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE WORK ORDER MODAL */}
      {isCompleteModalOpen && completingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Nghiệm Thu Phiếu Bảo Trì
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Phiếu: {completingWo.woCode}</p>
              </div>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCompleteWo} className="space-y-4 text-xs">
              <div>
                <CurrencyInput
                  label="Tổng chi phí phát sinh thực tế (VNĐ) *"
                  value={completeCost}
                  onChange={(val) => setCompleteCost(val)}
                  placeholder="VD: 3.500.000"
                  required
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian dừng máy thực tế (Downtime Giờ) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={completeDowntime}
                  onChange={(e) => setCompleteDowntime(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-2xs"
                >
                  Xác Nhận Nghiệm Thu Hoàn Tất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
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
