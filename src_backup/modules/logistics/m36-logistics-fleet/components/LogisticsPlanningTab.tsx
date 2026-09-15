import React, { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  ArrowUpRight,
  Truck,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  FileCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { TransportOrder, formatVND, renderTransportStatusBadge } from './types';

interface LogisticsPlanningTabProps {
  orders: TransportOrder[];
  onOpenNewOrderModal: () => void;
  onOpenAssignModal: (order: TransportOrder) => void;
  onOpenPodModal: (order: TransportOrder) => void;
  onOpenPrintModal: (type: 'ORDER' | 'POD', order: TransportOrder) => void;
  onSelectOrder: (order: TransportOrder) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const LogisticsPlanningTab: React.FC<LogisticsPlanningTabProps> = ({
  orders,
  onOpenNewOrderModal,
  onOpenAssignModal,
  onOpenPodModal,
  onOpenPrintModal,
  onSelectOrder,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.orderCode.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.originAddress.toLowerCase().includes(term) ||
      o.destinationAddress.toLowerCase().includes(term) ||
      (o.vehiclePlate && o.vehiclePlate.toLowerCase().includes(term)) ||
      (o.driverName && o.driverName.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* COMMAND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã lệnh, khách hàng, điểm đi, điểm đến, xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PLANNED">PLANNED - Chờ điều xe</option>
              <option value="ASSIGNED">ASSIGNED - Đã gán xế</option>
              <option value="IN_TRANSIT">IN_TRANSIT - Đang chạy</option>
              <option value="DELIVERED">DELIVERED - Đã ký POD</option>
              <option value="FAILED">FAILED - Thất bại</option>
            </select>
          </div>

          <button
            onClick={onOpenNewOrderModal}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Lệnh Mới</span>
          </button>
        </div>
      </div>

      {/* ORDERS MASTER DATA GRID */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">Mã Lệnh Transport</th>
                <th className="py-3 px-4">Khách Hàng (SO Ref)</th>
                <th className="py-3 px-4">Tải Trọng / Thể Tích</th>
                <th className="py-3 px-4">Lộ Trình Đi &amp; Đến</th>
                <th className="py-3 px-4">Xe &amp; Tài Xế</th>
                <th className="py-3 px-4 text-right">Cước Phí (Freight)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy lệnh vận chuyển nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 font-bold">
                      <button
                        onClick={() => onSelectOrder(o)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        {o.orderCode}
                      </button>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        Kế hoạch: {o.plannedDate}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {o.customerName}
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="font-semibold">{o.weightKg?.toLocaleString('vi-VN')} kg</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{o.volumeCbm} m³</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{o.originAddress}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{o.destinationAddress}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {o.vehiclePlate && o.vehiclePlate !== 'Chưa gán' ? (
                        <div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{o.vehiclePlate}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {o.driverName} ({o.driverPhone || 'N/A'})
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân công</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatVND(o.freightCost)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {renderTransportStatusBadge(o.status)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {o.status === 'PLANNED' && (
                          <button
                            onClick={() => onOpenAssignModal(o)}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                          >
                            Gán xe &amp; xế
                          </button>
                        )}
                        {o.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => onOpenPodModal(o)}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                          >
                            Ký POD
                          </button>
                        )}
                        <button
                          onClick={() => onOpenPrintModal('ORDER', o)}
                          title="In phiếu điều xe"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
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
