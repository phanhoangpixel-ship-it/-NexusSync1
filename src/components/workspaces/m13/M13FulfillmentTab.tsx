import React from 'react';
import {
  Truck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ArrowRight,
  Package,
  Layers,
  Send,
  Eye,
} from 'lucide-react';

interface M13FulfillmentTabProps {
  orders: any[];
  fulfillmentViewMode: 'table' | 'kanban';
  setFulfillmentViewMode: (mode: 'table' | 'kanban') => void;
  isWmsSyncing: boolean;
  wmsLastSynced: string;
  onSyncWms: () => void;
  isStagingPackingExceeded: boolean;
  stagingPackingCount: number;
  stagingPackingThreshold: number;
  onUpdateFulfillmentStatus: (orderId: string, nextStatus: string) => void;
  onSelectOrder: (order: any) => void;
}

export const M13FulfillmentTab: React.FC<M13FulfillmentTabProps> = ({
  orders,
  fulfillmentViewMode,
  setFulfillmentViewMode,
  isWmsSyncing,
  wmsLastSynced,
  onSyncWms,
  isStagingPackingExceeded,
  stagingPackingCount,
  stagingPackingThreshold,
  onUpdateFulfillmentStatus,
  onSelectOrder,
}) => {
  const stages = [
    {
      key: 'PENDING_PICKING',
      label: '1. Chờ Lấy Hàng (Picking)',
      nextKey: 'PACKING',
      nextLabel: 'Chuyển Đóng Gói (Pack)',
      icon: Package,
      color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      key: 'PACKING',
      label: '2. Đang Đóng Gói (Packing)',
      nextKey: 'STAGING',
      nextLabel: 'Chuyển Ra Cửa Xuất (Stage)',
      icon: Layers,
      color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    {
      key: 'STAGING',
      label: '3. Hàng Sẵn Sàng (Staging Dock)',
      nextKey: 'SHIPPED',
      nextLabel: 'Xuất Kho (Goods Issue)',
      icon: Boxes,
      color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    {
      key: 'SHIPPED',
      label: '4. Đã Xuất Kho (Shipped / GI)',
      nextKey: null,
      nextLabel: null,
      icon: Send,
      color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    },
  ];

  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');

  return (
    <div className="space-y-4">
      {/* Staging Queue Threshold Alert Banner */}
      {isStagingPackingExceeded && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-xs">
                Cảnh Báo Quá Tải Khu Vực Đóng Gói & Cửa Xuất (Staging Area Alert)
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Hiện có {stagingPackingCount} đơn hàng đang tập kết tại cửa xuất (vượt ngưỡng định mức {stagingPackingThreshold} đơn). Cần điều phối xe vận tải giải phóng khu vực Staging Dock.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Điều Phối Xuất Kho WMS & Tiến Độ Giao Hàng (Fulfillment Pipeline)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Lần đồng bộ WMS cuối: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{wmsLastSynced}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFulfillmentViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                fulfillmentViewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Kanban WMS
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                fulfillmentViewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Dạng Bảng
            </button>
          </div>

          <button
            type="button"
            onClick={onSyncWms}
            disabled={isWmsSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isWmsSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ WMS</span>
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {fulfillmentViewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageOrders = validOrders.filter(
              (o) => (o.fulfillmentStatus || 'PENDING_PICKING') === stage.key
            );
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                className={`p-4 rounded-2xl border ${stage.color} shadow-2xs space-y-3 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {stage.label}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${stage.badgeColor}`}>
                      {stageOrders.length}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 min-h-[220px]">
                    {stageOrders.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        Không có đơn ở giai đoạn này
                      </div>
                    ) : (
                      stageOrders.map((o) => (
                        <div
                          key={o.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => onSelectOrder(o)}
                              className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {o.id}
                            </button>
                            <span className="text-[10px] font-mono text-slate-400">
                              {o.orderDate}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {o.customerName}
                          </div>

                          <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {o.totalAmount}
                          </div>

                          {stage.nextKey && (
                            <button
                              type="button"
                              onClick={() => onUpdateFulfillmentStatus(o.id, stage.nextKey!)}
                              className="w-full mt-1 py-1.5 px-2 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 text-white text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>{stage.nextLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {fulfillmentViewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                  <th className="py-3 px-3">Mã SO</th>
                  <th className="py-3 px-3">Khách Hàng</th>
                  <th className="py-3 px-3">Tiến Độ WMS</th>
                  <th className="py-3 px-3">Địa Chỉ Giao Hàng</th>
                  <th className="py-3 px-3 text-right">Thao Tác Chuyển Bước</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {validOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {o.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {o.customerName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {o.fulfillmentStatus || 'PENDING_PICKING'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {o.address || 'Hà Nội'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {o.fulfillmentStatus !== 'SHIPPED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next =
                              o.fulfillmentStatus === 'PENDING_PICKING'
                                ? 'PACKING'
                                : o.fulfillmentStatus === 'PACKING'
                                ? 'STAGING'
                                : 'SHIPPED';
                            onUpdateFulfillmentStatus(o.id, next);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Chuyển bước kế tiếp
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          ✓ Đã hoàn tất xuất kho
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
