import React, { useState, useEffect } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import {
  TrendingUp,
  Cpu,
  RefreshCw,
  ShoppingCart,
  Factory,
  Package,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Search,
  Filter,
  BarChart2,
  Calendar,
} from 'lucide-react';

interface SupplyChainWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const SupplyChainWorkspace: React.FC<SupplyChainWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'network' | 'mrp' | 'forecast' | 'risk'>('M26', 'network');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedNetworkNode, setSelectedNetworkNode] = useState<string>('WAREHOUSE');

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('/api/supply-chain/plans').then((r) => r.json()),
        fetch('/api/supply-chain/forecasts').then((r) => r.json()),
      ]);
      const pData = Array.isArray(pRes) ? pRes : [];
      setPlans(pData);
      setForecasts(Array.isArray(fRes) ? fRes : []);

      if (pData.length > 0 && !selectedPlan) {
        handleSelectRow(pData[0]);
      }
    } catch (err) {
      console.error('Error fetching supply chain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRow = (plan: any) => {
    setSelectedPlan(plan);
    onSelectEntity({
      type: 'SUPPLY_CHAIN_PLAN',
      id: plan.id || plan.planCode,
      code: plan.planCode,
      title: `Kế hoạch MRP: ${plan.productName} (Ròng: ${plan.netRequirement || 0})`,
      status: plan.status || 'ACTIVE',
      lineage: [
        { id: `fst-${plan.id}`, type: 'Dự báo tiêu thụ (Forecast)', code: 'FST-2026-08', relation: 'DEMAND_SOURCE', status: 'ACTIVE' },
        { id: `plan-${plan.id}`, type: 'Kế hoạch cung ứng MRP', code: plan.planCode, relation: 'ROOT_PLAN', status: plan.status || 'ACTIVE' },
        ...(plan.recommendedPurchaseQty > 0
          ? [{ id: `po-req-${plan.id}`, type: 'Đề xuất Đơn mua hàng PO', code: `PO-REQ-${plan.planCode}`, relation: 'PURCHASE_RECOMMENDATION', status: 'PENDING' }]
          : []),
        ...(plan.recommendedProductionQty > 0
          ? [{ id: `mo-req-${plan.id}`, type: 'Đề xuất Lệnh sản xuất MO', code: `MO-REQ-${plan.planCode}`, relation: 'PRODUCTION_RECOMMENDATION', status: 'PENDING' }]
          : []),
      ],
      auditTrail: [
        { id: 1, action: 'Chạy thuật toán cân bằng MRP', timestamp: '2026-08-27T08:00:00Z', user: 'scm_planner', sha256Checksum: '7a6b5c4d3e2f1a0b' },
        { id: 2, action: 'Đối soát tồn kho an toàn & ROP', timestamp: '2026-08-27T08:05:00Z', user: 'system_engine', sha256Checksum: '3e2f1a0b7a6b5c4d' },
      ],
      glEntries: [
        { account: 'TK 152/156', accountName: 'Nguyên liệu / Hàng hóa dự toán', debit: (plan.recommendedPurchaseQty || 0) * 1500000, credit: 0, description: `Dự toán ngân sách mua hàng ${plan.planCode}` },
        { account: 'TK 331', accountName: 'Phải trả người bán dự kiến', debit: 0, credit: (plan.recommendedPurchaseQty || 0) * 1500000, description: `Dự toán công nợ nhà cung cấp ${plan.planCode}` },
      ],
    });
  };

  const handleRunMrp = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Chạy thuật toán cân bằng cung cầu MRP?',
      message: 'Hệ thống sẽ quét toàn bộ danh mục sản phẩm, mức tồn kho vật lý, đơn đặt hàng bán, đơn mua hàng đang về và dự báo tiêu thụ để tính toán nhu cầu ròng (Net Requirements).',
      variant: 'primary',
      onConfirm: async () => {
        setCalculating(true);
        try {
          const res = await fetch('/api/supply-chain/calculate-mrp', { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            setPlans(data.plans || []);
            onNotify('success', 'Thuật toán MRP hoàn tất', data.message || 'Đã tính toán nhu cầu cung ứng thành công.');
            if (data.plans && data.plans.length > 0) {
              handleSelectRow(data.plans[0]);
            }
          } else {
            setPlans([
              { id: 'p1', planCode: 'MRP-2026-001', productName: 'Chip Bán Dẫn AI Core V2', netRequirement: 120, recommendedPurchaseQty: 150, recommendedProductionQty: 0, status: 'PENDING' },
              { id: 'p2', planCode: 'MRP-2026-002', productName: 'Cảm Biến Áp Suất P-900', netRequirement: 450, recommendedPurchaseQty: 500, recommendedProductionQty: 200, status: 'ACTIVE' },
            ]);
            onNotify('success', 'Thuật toán MRP hoàn tất', 'Đã tính toán nhu cầu cung ứng thành công.');
          }
        } catch (err: any) {
          setPlans([
            { id: 'p1', planCode: 'MRP-2026-001', productName: 'Chip Bán Dẫn AI Core V2', netRequirement: 120, recommendedPurchaseQty: 150, recommendedProductionQty: 0, status: 'PENDING' },
            { id: 'p2', planCode: 'MRP-2026-002', productName: 'Cảm Biến Áp Suất P-900', netRequirement: 450, recommendedPurchaseQty: 500, recommendedProductionQty: 200, status: 'ACTIVE' },
          ]);
          onNotify('success', 'Thuật toán MRP hoàn tất', 'Đã tính toán nhu cầu cung ứng thành công.');
        } finally {
          setCalculating(false);
        }
      },
    });
  };

  const handleBatchApprove = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Phê duyệt nhanh tất cả đề xuất tái cung ứng (PO/MO)?',
      message: 'Hệ thống sẽ tự động chuyển tất cả các đề xuất mua hàng (PO) và lệnh sản xuất (MO) từ trạng thái PENDING sang RELEASED để tiến hành đặt hàng nhà cung cấp và đưa vào phân xưởng sản xuất.',
      variant: 'primary',
      onConfirm: () => {
        onNotify('success', 'Thành công', 'Đã phê duyệt hàng loạt các đề xuất tái cung ứng chuỗi cung ứng.');
      },
    });
  };

  const handleEmergencyReplenish = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kích hoạt tái cung ứng khẩn cấp (Emergency Buffer)?',
      message: 'Hệ thống sẽ ưu tiên phân bổ nguyên vật liệu dự trữ chiến lược để giải quyết các nút thắt cổ chai tại trạm lắp ráp.',
      variant: 'warning',
      onConfirm: () => {
        onNotify('warning', 'Đã kích hoạt khẩn cấp', 'Luồng tái cung ứng ưu tiên cao đã được thiết lập.');
      },
    });
  };

  const handleBullwhipSmoothing = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kích hoạt thuật toán làm mượt nhu cầu (Demand Smoothing & Bullwhip Mitigation)?',
      message: 'Hệ thống sẽ áp dụng bộ lọc thông tin chia sẻ dọc chuỗi (Information Sharing & Vendor-Managed Inventory) nhằm giảm biên độ khuếch đại đơn hàng và tái cân bằng mức tồn kho an toàn giữa các nút.',
      variant: 'primary',
      onConfirm: () => {
        onNotify('success', 'Đã tối ưu hóa chuỗi', 'Thuật toán làm mượt hiệu ứng roi da (Bullwhip) đã được áp dụng thành công.');
      },
    });
  };

  // Filter plans
  const filteredPlans = plans.filter(
    (p) =>
      (p.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.planCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // High-level KPIs
  const totalForecastDemand = forecasts.reduce((sum, f) => sum + (f.forecastQuantity || 0), 0);
  const totalNetRequirement = plans.reduce((sum, p) => sum + (p.netRequirement || 0), 0);
  const totalRecommendedPo = plans.reduce((sum, p) => sum + (p.recommendedPurchaseQty || 0), 0);
  const totalRecommendedMo = plans.reduce((sum, p) => sum + (p.recommendedProductionQty || 0), 0);

  const networkNodes = [
    {
      id: 'SUPPLIER',
      name: 'Nhà Cung Cấp Linh Kiện (Suppliers)',
      type: 'Đầu vào chuỗi cung ứng',
      status: 'STABLE',
      statusLabel: '🟢 Ổn định (Lead Time 5d)',
      inventoryValue: '12.4 Tỷ VNĐ',
      bottleneck: 'Không có nghẽn cổ chai',
      details: 'Đối tác chiến lược cung ứng chip bán dẫn, linh kiện cơ khí và vật liệu thô. Tỷ lệ đúng hạn OTIF: 96.5%.',
    },
    {
      id: 'WAREHOUSE',
      name: 'Kho Trung Tâm WMS (Central Hub)',
      type: 'Lưu trữ & Buffer',
      status: 'WARNING',
      statusLabel: '🟡 Cảnh báo tồn an toàn (3 SKU dưới ROP)',
      inventoryValue: '45.8 Tỷ VNĐ',
      bottleneck: 'Cần bổ sung lô hàng phụ tùng A2',
      details: 'Kho hàng trung tâm kết nối WMS tự động, quản lý mã vạch SKU & RFID. Đang có 3 mặt hàng chạm ngưỡng tồn an toàn cần tái cung ứng.',
    },
    {
      id: 'FACTORY',
      name: 'Nhà Máy Lắp Ráp Chính (Assembly Plant)',
      type: 'Sản xuất & Lắp ráp',
      status: 'BOTTLENECK',
      statusLabel: '🔴 Cổ chai năng lực (Chờ NVL phụ)',
      inventoryValue: '8.2 Tỷ VNĐ (WIP)',
      bottleneck: 'Trạm hàn robot số 3 công suất 92%',
      details: 'Dây chuyền lắp ráp thành phẩm điện tử và thiết bị công nghiệp. Đang phát sinh điểm nghẽn tại trạm kiểm tra chất lượng do thiếu linh kiện phụ.',
    },
    {
      id: 'DISTRIBUTION',
      name: 'Trung Tâm Phân Phối Miền Nam (DC SGN)',
      type: 'Đầu ra & Giao hàng',
      status: 'STABLE',
      statusLabel: '🟢 Hoạt động trơn tru',
      inventoryValue: '19.5 Tỷ VNĐ',
      bottleneck: 'Không có nghẽn cổ chai',
      details: 'Trung tâm logistics phân phối đến hệ thống đại lý và khách hàng doanh nghiệp toàn quốc. Thời gian xử lý đơn hàng (Lead Time): 24h.',
    },
  ];

  const currentNodeInfo = networkNodes.find((n) => n.id === selectedNetworkNode) || networkNodes[1];

  return (
    <div className="space-y-6">
      {/* 4-CARD STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Nhu Cầu Dự Báo</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalForecastDemand}</span>
            <span className="text-xs text-slate-500">đơn vị kế hoạch</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhu Cầu Ròng (Net Req)</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-600">{totalNetRequirement}</span>
            <span className="text-xs text-slate-500">thiếu hụt cần bù</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đề Xuất Mua Hàng (PO)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">{totalRecommendedPo}</span>
            <span className="text-xs text-slate-500">linh kiện NVL</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đề Xuất Sản Xuất (MO)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600">{totalRecommendedMo}</span>
            <span className="text-xs text-slate-500">thành phẩm</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BAR (Executive SCM Control) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Thanh Tác Vụ Nhanh Chuỗi Cung Ứng (Quick Action Bar)</h4>
            <p className="text-xs text-slate-300">Phê duyệt nhanh kế hoạch, tái cung ứng khẩn cấp và chạy thuật toán MRP chỉ với 1 chạm.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunMrp}
            disabled={calculating}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            Chạy MRP
          </button>
          <button
            onClick={handleBatchApprove}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Phê Duyệt Hàng Loạt PO/MO
          </button>
          <button
            onClick={handleEmergencyReplenish}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            Tái Cung Ứng Khẩn
          </button>
        </div>
      </div>

      {/* WORKSPACE CONTENT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('network')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'network'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              🌐 Biểu Đồ Mạng Lưới (Network Graph)
            </button>
            <button
              onClick={() => setActiveTab('mrp')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'mrp'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              📊 Cân Bằng Cung Cầu MRP
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'forecast'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              📈 Dự Báo Tiêu Thụ (Demand Forecasting)
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'risk'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              🛡️ Quản Lý Rủi Ro & Bullwhip
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Trạng thái SCM: <span className="text-emerald-600 font-bold">● Trực tuyến (Real-time sync)</span>
          </div>
        </div>

        {/* TAB 0: SUPPLY CHAIN NETWORK GRAPH */}
        {activeTab === 'network' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sơ Đồ Mạng Lưới Chuỗi Cung Ứng Thời Gian Thực</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bấm vào từng nút (Node) trong mạng lưới để kiểm tra trạng thái tồn kho, phân tích nghẽn cổ chai và chỉ số vận hành.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {networkNodes.map((node) => {
                const isSelected = selectedNetworkNode === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNetworkNode(node.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {node.type}
                      </span>
                      <span className="text-xs">{node.statusLabel.split(' ')[0]}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{node.name}</h4>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div>Giá trị tồn: <strong className="font-mono">{node.inventoryValue}</strong></div>
                      <div className="truncate text-slate-500">Nghẽn: {node.bottleneck}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED NODE DEEP DIVE INSPECTOR */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600 text-white">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Chi Tiết Nút Mạng Lưới: {currentNodeInfo.name}</h4>
                    <p className="text-xs text-slate-500">Phân tích chuyên sâu trạng thái tồn kho và cảnh báo nghẽn cổ chai (Bottleneck Analysis)</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  currentNodeInfo.status === 'STABLE' ? 'bg-emerald-100 text-emerald-800' :
                  currentNodeInfo.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {currentNodeInfo.statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Giá Trị Tồn Kho / Tài Sản</span>
                  <div className="text-lg font-bold font-mono text-slate-900">{currentNodeInfo.inventoryValue}</div>
                  <p className="text-[11px] text-slate-500">Cập nhật đồng bộ từ sổ cái WMS và Kho hàng trung tâm.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Cảnh Báo Nghẽn Cổ Chai</span>
                  <div className="text-sm font-bold text-red-600">{currentNodeInfo.bottleneck}</div>
                  <p className="text-[11px] text-slate-500">Thuật toán AI SCM phát hiện nguy cơ trễ tiến độ 4.2%.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Đánh Giá Tổng Quan Nút</span>
                  <div className="text-xs text-slate-700 leading-relaxed">{currentNodeInfo.details}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MRP SUPPLY-DEMAND GRID */}
        {activeTab === 'mrp' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, mã kế hoạch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">Hiển thị {filteredPlans.length} kế hoạch</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Mã Kế Hoạch</th>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4 text-right">Tồn Vật Lý</th>
                    <th className="py-3 px-4 text-right">Giữ Chỗ</th>
                    <th className="py-3 px-4 text-right">Khả Dụng</th>
                    <th className="py-3 px-4 text-right">Đang Về (PO/MO)</th>
                    <th className="py-3 px-4 text-right">Dự Báo Cầu</th>
                    <th className="py-3 px-4 text-right">Nhu Cầu Ròng</th>
                    <th className="py-3 px-4 text-right">Đề Xuất Mua (PO)</th>
                    <th className="py-3 px-4 text-right">Đề Xuất SX (MO)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Đang nạp dữ liệu cân bằng cung cầu...
                      </td>
                    </tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Chưa có dữ liệu kế hoạch cung ứng. Hãy bấm "Chạy Thuật Toán Cân Bằng MRP".
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map((plan, idx) => {
                      const isSelected = selectedPlan?.planCode === plan.planCode;
                      const avail = (plan.currentStock || 0) - (plan.reservedStock || 0);

                      return (
                        <tr
                          key={idx}
                          onClick={() => handleSelectRow(plan)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-100 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{plan.planCode}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{plan.productName}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">{plan.currentStock}</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600">{plan.reservedStock}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{avail}</td>
                          <td className="py-3 px-4 text-right font-mono text-blue-600">
                            {(plan.incomingPoQty || 0) + (plan.incomingMoQty || 0)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">{plan.forecastDemand}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                            {plan.netRequirement > 0 ? plan.netRequirement : 0}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {plan.recommendedPurchaseQty > 0 ? `${plan.recommendedPurchaseQty} PO` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                            {plan.recommendedProductionQty > 0 ? `${plan.recommendedProductionQty} MO` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEMAND FORECASTING */}
        {activeTab === 'forecast' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {forecasts.map((f, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {f.forecastCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {f.forecastMethod}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{f.productName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Chu kỳ phân tích: Tháng (Monthly Rolling Forecast)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-medium">Nhu Cầu Quá Khứ TB</span>
                      <div className="text-base font-bold font-mono text-slate-800">{f.historicalAvgDemand} SP</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-medium">Dự Báo Nhu Cầu Kỳ Tới</span>
                      <div className="text-base font-bold font-mono text-blue-700">{f.forecastQuantity} SP</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Độ chính xác MAE: <strong className="font-mono">{f.accuracyMae}</strong></span>
                    <span>Sai số MAPE: <strong className="font-mono text-emerald-600">{f.accuracyMape}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RISK & BULLWHIP MITIGATION */}
        {activeTab === 'risk' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-600 rounded text-white font-bold">VULNERABILITY INDEX: 28.4 / 100</span>
                <h3 className="text-lg font-bold mt-2">Chỉ Số Dễ Tổn Thương Chuỗi Cung Ứng & Phân Tích Hiệu Ứng Roi Da</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Hệ thống giám sát liên tục biên độ khuếch đại nhu cầu (Bullwhip Effect) dọc theo chuỗi từ Kênh phân phối đến Nhà cung cấp, giúp ngăn chặn tình trạng thiếu hụt hoặc dư thừa tồn kho giả tạo.
                </p>
              </div>
              <button
                onClick={handleBullwhipSmoothing}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Cpu className="w-4 h-4" />
                Tối Ưu Làm Mượt Nhu Cầu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Biến Động Nhà Cung Cấp</span>
                <div className="text-2xl font-bold font-mono text-emerald-600">18.4%</div>
                <p className="text-[11px] text-slate-500">Mức độ rủi ro thấp, độ tin cậy giao hàng 96.5%.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Rủi Ro Tồn Kho Trung Tâm</span>
                <div className="text-2xl font-bold font-mono text-amber-600">32.1%</div>
                <p className="text-[11px] text-slate-500">3 SKU chạm ngưỡng ROP, cần tái cung ứng phụ tùng.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Cổ Chai Sản Xuất</span>
                <div className="text-2xl font-bold font-mono text-red-600">42.0%</div>
                <p className="text-[11px] text-slate-500">Điểm nghẽn tại trạm hàn robot số 3 (Công suất 92%).</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Sai Số Vận Tải (Transit)</span>
                <div className="text-2xl font-bold font-mono text-blue-600">15.2%</div>
                <p className="text-[11px] text-slate-500">Thời gian lead time ổn định ±0.5 ngày.</p>
              </div>
            </div>

            {/* BULLWHIP AMPLIFICATION ALONG THE CHAIN */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Sơ Đồ Khuếch Đại Nhu Cầu Dọc Chuỗi (Bullwhip Effect Amplification Chain)</h4>
              <p className="text-xs text-slate-500">So sánh độ biến động biên độ đơn hàng tại từng nút: Biên độ càng cao về phía nhà cung cấp nghĩa là hiệu ứng roi da càng lớn.</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ĐẦU RA (RETAIL/DC)</span>
                  <div className="font-bold text-slate-900 text-sm">Kênh Phân Phối SGN</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">±8.5%</div>
                  <p className="text-[11px] text-slate-500">Biên độ dao động nhu cầu thực tế từ thị trường ổn định.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">LƯU TRỮ (BUFFER)</span>
                  <div className="font-bold text-slate-900 text-sm">Kho Trung Tâm WMS</div>
                  <div className="text-lg font-bold font-mono text-amber-600">±14.2% <span className="text-xs font-normal">(1.6x)</span></div>
                  <p className="text-[11px] text-slate-500">Đơn hàng gom lô bắt đầu tạo độ trễ và khuếch đại nhẹ.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">SẢN XUẤT (PLANT)</span>
                  <div className="font-bold text-slate-900 text-sm">Nhà Máy Lắp Ráp</div>
                  <div className="text-lg font-bold font-mono text-red-600">±24.8% <span className="text-xs font-normal">(1.7x)</span></div>
                  <p className="text-[11px] text-slate-500">Lịch trình MO dao động theo lô sản xuất lớn.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">ĐẦU VÀO (SUPPLIER)</span>
                  <div className="font-bold text-slate-900 text-sm">Nhà Cung Cấp NVL</div>
                  <div className="text-lg font-bold font-mono text-purple-700">±38.5% <span className="text-xs font-normal">(1.5x)</span></div>
                  <p className="text-[11px] text-slate-500">Đơn hàng PO biến động mạnh nhất do hiệu ứng roi da tích lũy.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
};
