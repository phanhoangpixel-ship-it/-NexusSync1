import React, { useState } from 'react';
import {
  Layers,
  Network,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Activity,
  Zap,
  Building2,
  Warehouse,
  Factory,
  Truck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface SupplyChainNetworkTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const SupplyChainNetworkTab: React.FC<SupplyChainNetworkTabProps> = ({ onNotify }) => {
  const [selectedNetworkNode, setSelectedNetworkNode] = useState<string>('node-wh');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const networkNodes = [
    {
      id: 'node-supp',
      name: 'Nhà Cung Cấp Cấp 1 (Tier-1)',
      type: 'SUPPLIER',
      icon: Building2,
      status: 'STABLE',
      statusLabel: 'Ổn Định (98.2%)',
      inventoryValue: '1.240.000.000 ₫',
      leadTime: '7 ngày',
      bottleneck: 'Không có tắc nghẽn đáng kể',
      details: 'Liên kết 8 nhà cung ứng chiến lược theo hợp đồng dài hạn tại M08 Strategic Sourcing.',
    },
    {
      id: 'node-wh',
      name: 'Kho Trung Tâm WMS (Hub)',
      type: 'WAREHOUSE',
      icon: Warehouse,
      status: 'WARNING',
      statusLabel: 'Nguy Cơ Nghẽn (74.8%)',
      inventoryValue: '4.850.000.000 ₫',
      leadTime: '2 ngày',
      bottleneck: 'Sức chứa kho khu vực Zone-B đạt đỉnh',
      details: 'Kho nhận nguyên vật liệu và điều phối trung chuyển sang các xưởng lắp ráp M25.',
    },
    {
      id: 'node-mfg',
      name: 'Xưởng Lắp Ráp MES (Plant)',
      type: 'MANUFACTURING',
      icon: Factory,
      status: 'STABLE',
      statusLabel: 'Bình Thường (OEE 86%)',
      inventoryValue: '2.100.000.000 ₫',
      leadTime: '3 ngày',
      bottleneck: 'Chờ cấp phôi linh kiện điện tử',
      details: 'Đang triển khai 12 Lệnh sản xuất MO theo kế hoạch điều phối từ M26 MRP.',
    },
    {
      id: 'node-dc',
      name: 'Trung Tâm Phân Phối (DC)',
      type: 'DISTRIBUTION',
      icon: Truck,
      status: 'CRITICAL',
      statusLabel: 'Thiếu Hụt Cục Bộ',
      inventoryValue: '980.000.000 ₫',
      leadTime: '1 ngày',
      bottleneck: 'Mặt hàng Laptop Business 14 dưới mức an toàn',
      details: 'Nhu cầu đột biến từ đơn hàng bán SO M13 vượt 35% so với dự báo tiêu thụ ban đầu.',
    },
  ];

  const currentNodeInfo = networkNodes.find((n) => n.id === selectedNetworkNode) || networkNodes[1];

  const handleBullwhipSmoothing = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Tối ưu hóa san bằng nhu cầu (Demand Smoothing)?',
      message:
        'Hệ thống sẽ kích hoạt thuật toán giảm thiểu hiệu ứng Roi Da (Bullwhip Effect), tái phân bổ lại ngưỡng tồn an toàn động (Dynamic Safety Stock) và điều chỉnh quy mô lô đặt hàng (Lot-sizing) trên toàn mạng lưới.',
      variant: 'primary',
      onConfirm: async () => {
        onNotify(
          'success',
          'Đã thực thi làm mượt nhu cầu',
          'Hệ số khuếch đại biến thiên nhu cầu (Bullwhip Ratio) đã được san phẳng từ 1.84x xuống còn 1.12x.'
        );
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: NETWORK TOPOLOGY BANNER (M25 COMPLIANT)                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                NETWORK TOPOLOGY &amp; BULLWHIP MITIGATION
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                VULNERABILITY: 28.4 / 100 (LOW RISK)
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
              Mô Phỏng Mạng Lưới Chuỗi Cung Ứng &amp; Kiểm Soát Hiệu Ứng Roi Da
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Giám sát dòng thông tin và dòng vật tư từ NCC Tier-1 qua Kho WMS, Xưởng MES đến các DC Phân phối.
            </p>
          </div>
        </div>

        <button
          onClick={handleBullwhipSmoothing}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>Tối Ưu San Bằng Nhu Cầu</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* NETWORK NODES GRID                                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {networkNodes.map((node) => {
          const isSelected = selectedNetworkNode === node.id;
          const NodeIcon = node.icon;
          const isCritical = node.status === 'CRITICAL';
          const isWarning = node.status === 'WARNING';

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNetworkNode(node.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-600">
                  {node.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCritical
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
                      : isWarning
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  {node.statusLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <NodeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{node.name}</h4>
              </div>

              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Giá trị tồn:</span>
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{node.inventoryValue}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Lead-time:</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400">{node.leadTime}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SELECTED NODE DEEP DIVE                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chi Tiết Nút Mạng Lưới: {currentNodeInfo.name}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentNodeInfo.details}</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
            ID: {currentNodeInfo.id}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Điểm Nghẽn / Rủi Ro</span>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{currentNodeInfo.bottleneck}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Cơ Chế San Bằng Nhu Cầu</span>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Dynamic Safety Stock &amp; Periodic Review</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Tích Hợp Liên Module</span>
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span>Thẩm quyền M25 MES &amp; M08 Sourcing</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
