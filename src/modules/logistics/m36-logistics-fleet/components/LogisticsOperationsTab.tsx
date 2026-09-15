import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  FileCheck,
  Printer,
  Smartphone,
  Navigation,
} from 'lucide-react';
import {
  DeliveryOrder,
  TransportOrder,
  formatNumber,
} from './types';

interface LogisticsOperationsTabProps {
  deliveryOrders: DeliveryOrder[];
  orders: TransportOrder[];
  onDispatchDO: (doItem: DeliveryOrder) => void;
  onConfirmPOD: (doItem: DeliveryOrder) => void;
  onOpenPrintModal: (type: 'ORDER' | 'POD', order: TransportOrder) => void;
  onOpenExceptionModal: () => void;
  onOpenDriverAppSimulator: (order: TransportOrder) => void;
}

export const LogisticsOperationsTab: React.FC<LogisticsOperationsTabProps> = ({
  deliveryOrders,
  orders,
  onDispatchDO,
  onConfirmPOD,
  onOpenPrintModal,
  onOpenExceptionModal,
  onOpenDriverAppSimulator,
}) => {
  const [doStatusFilter, setDoStatusFilter] = useState<'ALL' | 'READY_TO_DISPATCH' | 'IN_TRANSIT' | 'POD_CONFIRMED'>('ALL');

  const readyCount = deliveryOrders.filter((d) => d.status === 'READY_TO_DISPATCH').length;
  const inTransitCount = deliveryOrders.filter((d) => d.status === 'IN_TRANSIT').length;
  const podConfirmedCount = deliveryOrders.filter((d) => d.status === 'POD_CONFIRMED').length;

  const ordersWithPod = orders.filter((o) => o.pod);
  const sampleActiveOrder = orders.find((o) => o.status === 'IN_TRANSIT') || orders[0];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Vận Hành Giao Hàng &amp; Bằng Chứng Giao Hàng (DO &amp; POD)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Chuỗi Kho Vận M17 - M36 - M13
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý Đơn Giao Hàng (DO) liên kết Đơn bán hàng (SO M13) &amp; Phiếu xuất kho (PXK M17), điều phối lộ trình và ký nhận điện tử
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sampleActiveOrder && (
            <button
              onClick={() => onOpenDriverAppSimulator(sampleActiveOrder)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Mô Phỏng Driver App</span>
            </button>
          )}
          <button
            onClick={onOpenExceptionModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Ghi Nhận Ngoại Lệ</span>
          </button>
        </div>
      </div>

      {/* DO METRICS & PIPELINE SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng Đơn DO
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {deliveryOrders.length}
          </p>
          <span className="text-[11px] text-slate-400">Đơn hàng trong kỳ</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Sẵn Sàng Xuất Bến
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {readyCount}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">Đã đóng gói &amp; xuất kho</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Đang Vận Chuyển
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {inTransitCount}
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400">Trên lộ trình giao</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Đã Ký Nhận POD
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {podConfirmedCount}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Sẵn sàng xuất HĐ GTGT</span>
        </div>
      </div>

      {/* DELIVERY ORDERS TABLE (LINKED SO & PXK) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Theo Dõi Đơn Giao Hàng DO (Delivery Orders)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(['ALL', 'READY_TO_DISPATCH', 'IN_TRANSIT', 'POD_CONFIRMED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDoStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  doStatusFilter === tab
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab === 'ALL' && 'Tất Cả'}
                {tab === 'READY_TO_DISPATCH' && 'Sẵn Sàng Xuất'}
                {tab === 'IN_TRANSIT' && 'Đang Giao Hàng'}
                {tab === 'POD_CONFIRMED' && 'Đã Ký POD'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">Mã Đơn DO</th>
                <th className="py-3 px-4">Đơn Bán (SO Ref)</th>
                <th className="py-3 px-4">Xuất Kho (PXK Ref)</th>
                <th className="py-3 px-4">Khách Hàng &amp; Nơi Giao</th>
                <th className="py-3 px-4">Phương Tiện &amp; Tài Xế</th>
                <th className="py-3 px-4 text-right">Kiện / Trọng Lượng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Hành Động Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
              {deliveryOrders
                .filter((d) => doStatusFilter === 'ALL' || d.status === doStatusFilter)
                .map((doItem) => (
                  <tr
                    key={doItem.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                        {doItem.doCode}
                      </span>
                      {doItem.dispatchedAt && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Xuất: {doItem.dispatchedAt}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
                        {doItem.soCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px]">
                        {doItem.stockExportCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {doItem.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{doItem.shippingAddress}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{doItem.driverName}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {doItem.vehiclePlate}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="font-semibold text-slate-900 dark:text-white">{doItem.itemsCount} kiện</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doItem.weightKg.toLocaleString('vi-VN')} kg
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {doItem.status === 'READY_TO_DISPATCH' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-700 inline-block">
                          Sẵn Sàng Xuất
                        </span>
                      )}
                      {doItem.status === 'IN_TRANSIT' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-700 inline-flex items-center gap-1 animate-pulse">
                          <Truck className="w-3 h-3" /> Đang Vận Chuyển
                        </span>
                      )}
                      {doItem.status === 'POD_CONFIRMED' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã Ký POD
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {doItem.status === 'READY_TO_DISPATCH' && (
                          <button
                            onClick={() => onDispatchDO(doItem)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Khởi Hành</span>
                          </button>
                        )}
                        {doItem.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => onConfirmPOD(doItem)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ký Nhận POD</span>
                          </button>
                        )}
                        {doItem.status === 'POD_CONFIRMED' && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            {doItem.receiverName || 'Đã giao'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTERED POD TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
          <span>Danh Sách Biên Bản Giao Hàng POD Đã Nghiệm Thu</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Chữ ký điện tử &amp; hình ảnh</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">Mã Đơn Vận</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Người Nhận Ký</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Trạng Thái POD</th>
                <th className="py-3 px-4 text-center">Bản In POD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
              {ordersWithPod.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Chưa có biên bản POD nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                ordersWithPod.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {o.orderCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {o.customerName}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {o.pod?.receiverName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {o.pod?.deliveredAt}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                        {o.pod?.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenPrintModal('POD', o)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all border border-slate-300 dark:border-slate-600"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>In POD</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
