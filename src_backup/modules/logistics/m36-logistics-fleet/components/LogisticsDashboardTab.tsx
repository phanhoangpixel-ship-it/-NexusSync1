import React from 'react';
import {
  Navigation,
  Truck,
  CheckCircle2,
  Gauge,
  Fuel,
  ChevronRight,
  AlertTriangle,
  Wrench,
  FileCheck,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react';
import {
  LogisticsKPIs,
  TransportOrder,
  DeliveryException,
  MaintenanceRecord,
  formatVND,
  renderTransportStatusBadge,
} from './types';

interface LogisticsDashboardTabProps {
  kpis: LogisticsKPIs;
  orders: TransportOrder[];
  exceptions: DeliveryException[];
  maintenanceRecords: MaintenanceRecord[];
  onNavigateToPlanning: () => void;
  onOpenAssignModal: (order: TransportOrder) => void;
  onOpenPodModal: (order: TransportOrder) => void;
  onOpenPrintModal: (type: 'ORDER' | 'POD', order: TransportOrder) => void;
  onOpenExceptionModal: () => void;
  onOpenMaintenanceModal: () => void;
  onSelectOrder: (order: TransportOrder) => void;
}

export const LogisticsDashboardTab: React.FC<LogisticsDashboardTabProps> = ({
  kpis,
  orders,
  exceptions,
  maintenanceRecords,
  onNavigateToPlanning,
  onOpenAssignModal,
  onOpenPodModal,
  onOpenPrintModal,
  onOpenExceptionModal,
  onOpenMaintenanceModal,
  onSelectOrder,
}) => {
  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC CARDS STRIP                                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Trips Hôm Nay</span>
            <Navigation className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {kpis.totalOrders}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Lệnh đã lập kế hoạch</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>In Transit</span>
            <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {kpis.inTransitOrders}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Xe đang lăn bánh</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Đã Ký POD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {kpis.deliveredOrders}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Hoàn tất nghiệm thu</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Đội Xe Sẵn Sàng</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {kpis.activeVehicles}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">/ {kpis.totalVehicles}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Phương tiện sẵn sàng</div>
        </div>

        {/* Card 5 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Tỷ Lệ SLA OTD</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {kpis.onTimeRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Đạt mục tiêu vận tải</div>
        </div>

        {/* Card 6 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Nhiên Liệu Dầu</span>
            <Fuel className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white truncate">
            {formatVND(kpis.totalFuelCost)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Chi phí phát sinh</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD SPLIT PANELS                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Dispatch Action Board */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Bảng Theo Dõi Chuyến Xe Đang Chạy (In-Transit Dispatch Monitor)</span>
            </h2>
            <button
              onClick={onNavigateToPlanning}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div
                  onClick={() => onSelectOrder(o)}
                  className="cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      {o.orderCode}
                    </span>
                    {renderTransportStatusBadge(o.status)}
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1">
                    {o.customerName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Kho đi: {o.originAddress}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 inline" />
                    <span>Đến: {o.destinationAddress}</span>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {o.vehiclePlate !== 'Chưa gán' ? o.vehiclePlate : 'Chưa gán xe'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {o.driverName || 'Chưa gán tài xế'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (o.status === 'PLANNED') onOpenAssignModal(o);
                      else if (o.status === 'IN_TRANSIT') onOpenPodModal(o);
                      else onOpenPrintModal('ORDER', o);
                    }}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                  >
                    {o.status === 'PLANNED'
                      ? 'Điều vận xe'
                      : o.status === 'IN_TRANSIT'
                      ? 'Nghiệm thu POD'
                      : 'Xem chứng từ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Fleet Health & Exception Sidebar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Cảnh Báo Ngoại Lệ &amp; Bảo Dưỡng</span>
          </h2>

          <div className="space-y-3 text-xs">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                  <span className="font-mono">{ex.orderCode}</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded uppercase font-bold">
                    {ex.type}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-[11px]">{ex.note}</div>
                <div className="text-[10px] text-slate-400 font-mono">{ex.reportedAt}</div>
              </div>
            ))}

            {maintenanceRecords.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
                  <span className="font-mono">Bảo dưỡng {m.vehiclePlate}</span>
                  <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded uppercase font-bold">
                    {m.status}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-[11px]">{m.serviceType}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Dự kiến: {formatVND(m.estimatedCost)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <button
              onClick={onOpenExceptionModal}
              className="flex-1 py-2 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold rounded-lg text-center cursor-pointer transition-all"
            >
              + Báo Ngoại Lệ
            </button>
            <button
              onClick={onOpenMaintenanceModal}
              className="flex-1 py-2 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 text-xs font-semibold rounded-lg text-center cursor-pointer transition-all"
            >
              + Đăng Ký Bảo Trì
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
