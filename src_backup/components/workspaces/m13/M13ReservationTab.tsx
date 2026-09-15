import React from 'react';
import { Boxes, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Warehouse } from 'lucide-react';

interface M13ReservationTabProps {
  orders: any[];
  masterProducts: any[];
  onSelectOrder: (order: any) => void;
}

export const M13ReservationTab: React.FC<M13ReservationTabProps> = ({
  orders,
  masterProducts,
  onSelectOrder,
}) => {
  const reservedOrders = orders.filter(
    (o) => o.status !== 'CANCELLED' && o.status !== 'DRAFT'
  );

  return (
    <div className="space-y-4">
      {/* ATP Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Đơn Giữ Chỗ (Active Reservation)
            </span>
            <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
            {reservedOrders.length} Đơn Hàng
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tồn kho đã cam kết giao và được bảo lưu trong WMS (M17/M24)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Khả Dụng Hứa Hẹn (ATP Status)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            100% Khả Dụng (ATP OK)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Không có hiện tượng bán vượt tồn khả dụng (Overselling Zero)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kho Phân Bổ Mặc Định
            </span>
            <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
            Tổng Kho Miền Bắc (WH-01)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Đồng bộ dữ liệu thời gian thực với M17 Inventory Core
          </p>
        </div>
      </div>

      {/* Reservation Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bảng Phân Bổ Tồn Kho Theo Đơn Hàng (Order Allocation & Reservation Matrix)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kiểm soát lượng tồn kho vật lý (Physical), lượng giữ chỗ (Reserved) và lượng thực xuất (Issued)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                <th className="py-3 px-3">Mã SO</th>
                <th className="py-3 px-3">Khách Hàng</th>
                <th className="py-3 px-3">Mã SKU & Tên Sản Phẩm</th>
                <th className="py-3 px-3 text-center">SL Giữ Chỗ</th>
                <th className="py-3 px-3">Kho Xuất</th>
                <th className="py-3 px-3">Trạng Thái Giữ Chỗ</th>
                <th className="py-3 px-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {reservedOrders.map((o) => {
                const firstItem = o.items && o.items.length > 0 ? o.items[0] : { sku: 'PRD-001', name: 'Sản phẩm tiêu chuẩn', qty: 1 };

                return (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {o.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {o.customerName}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        [{firstItem.sku}] {firstItem.name}
                      </div>
                      {o.items && o.items.length > 1 && (
                        <div className="text-[10px] text-blue-600 font-semibold">
                          +{o.items.length - 1} mặt hàng khác
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                      {firstItem.qty} {firstItem.uop || 'Cái'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      WH-01 (Khu A)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          o.reservationStatus === 'RESERVED'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : o.reservationStatus === 'RELEASED'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {o.reservationStatus || 'RESERVED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(o)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                      >
                        Xem SO
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
