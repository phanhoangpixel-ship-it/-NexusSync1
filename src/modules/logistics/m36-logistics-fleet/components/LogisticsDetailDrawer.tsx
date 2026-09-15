import React from 'react';
import {
  X,
  Navigation,
  Truck,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  FileCheck,
  Printer,
  Smartphone,
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { TransportOrder, formatVND } from './types';

interface LogisticsDetailDrawerProps {
  order: TransportOrder | null;
  onClose: () => void;
  onAssign: (order: TransportOrder) => void;
  onPod: (order: TransportOrder) => void;
  onPrint: (type: 'ORDER' | 'POD', order: TransportOrder) => void;
  onOpenDriverApp: (order: TransportOrder) => void;
}

export const LogisticsDetailDrawer: React.FC<LogisticsDetailDrawerProps> = ({
  order,
  onClose,
  onAssign,
  onPod,
  onPrint,
  onOpenDriverApp,
}) => {
  if (!order) return null;

  const isCompleted = order.status === 'POD_CONFIRMED' || order.status === 'COMPLETED' || order.status === 'DELIVERED';
  const isInTransit = order.status === 'IN_TRANSIT' || order.status === 'DISPATCHED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* DRAWER BODY */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {order.orderCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isInTransit
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs mt-0.5">
                  {order.customerName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DRAWER SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* LỘ TRÌNH VẬN CHUYỂN */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Lộ Trình &amp; Địa Điểm Giao Hàng</span>
              </h4>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 ring-4 ring-blue-100 dark:ring-blue-950"></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Kho Xuất Phát:</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.originAddress}</p>
                  </div>
                </div>

                {order.stops && order.stops.length > 0 && (
                  <div className="pl-6 border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-1 py-1 space-y-1">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      Điểm Dừng Phụ ({order.stops.length}):
                    </span>
                    {order.stops.map((stop, idx) => (
                      <p key={idx} className="text-slate-600 dark:text-slate-400">
                        • {stop}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 ring-4 ring-rose-100 dark:ring-rose-950"></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm Giao Đích:</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.destinationAddress}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Ngày Kế Hoạch:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">{order.plannedDate}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Thời gian ETA:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">{order.eta || 'Theo lịch trình'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG SỐ TẢI TRỌNG & PHƯƠNG TIỆN */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Phương Tiện Vận Tải &amp; Tài Xế Phụ Trách</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Xe Giao Hàng:</span>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {order.vehiclePlate || 'Chưa phân công'}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{order.vehicleType || 'Xe tải thùng kín'}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tài Xế:</span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {order.driverName || 'Chưa gán'}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{order.driverPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Trọng Lượng Hàng:</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {order.weightKg.toLocaleString('vi-VN')} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Thể Tích Kiện:</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.volumeCbm} m³</span>
                </div>
              </div>
            </div>

            {/* CHI PHÍ & TỔNG CƯỚC PHÍ */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cơ Cấu Chi Phí &amp; Cước Vận Chuyển</span>
              </h4>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Cước Vận Chuyển Hợp Đồng:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatVND(order.freightCost)}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Dự Toán Chi Phí Nhiên Liệu (Dầu Diesel):</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatVND(order.fuelCost)}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Ước Tính Phí BOT Cao Tốc (VETC/ePass):</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatVND(order.tollCost || 85000)}
                  </span>
                </div>
              </div>
            </div>

            {/* PHẢ HỆ DOANH NGHIỆP & LIÊN KẾT PHÂN HỆ (ENTERPRISE DATA GRAPH) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Liên Kết Phân Hệ &amp; Phả Hệ Nguồn Gốc (Data Lineage)</span>
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">M17 • Kho Vận (WMS Export)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        PXK-2026-0819 • Kho Tổng WH-MAIN
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold text-[10px]">
                    ĐÃ XUẤT KHO
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">M13 • Đơn Bán Hàng (Sales Order)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        SO-2026-1049 • Viettel Telecom
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-bold text-[10px]">
                    ĐÃ CHỐT ĐƠN
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">M31 • Hóa Đơn &amp; Kế Toán (AR/AP)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        INV-2026-9921 • Bút toán cước TK 641
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold text-[10px]">
                    TỰ ĐỘNG HẠCH TOÁN
                  </span>
                </div>
              </div>
            </div>

            {/* POD RESULT (IF AVAILABLE) */}
            {order.pod && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Biên Bản Bàn Giao POD Điện Tử</span>
                </h4>

                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">
                      Người Ký Nhận: {order.pod.receiverName}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 rounded text-[10px] font-bold">
                      {order.pod.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Thời gian ký: <strong className="font-mono">{order.pod.deliveredAt}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] italic">
                    &quot;{order.pod.notes || 'Không có ghi chú thêm.'}&quot;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ACTION FOOTER BAR */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPrint('ORDER', order)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-300 dark:border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Điều Xe</span>
              </button>
              {order.pod && (
                <button
                  onClick={() => onPrint('POD', order)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-300 dark:border-slate-700"
                >
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>In POD</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenDriverApp(order)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-200 dark:border-indigo-800"
              >
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Mở Driver PWA</span>
              </button>
              {!order.vehiclePlate && (
                <button
                  onClick={() => onAssign(order)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <Truck className="w-4 h-4" />
                  <span>Gán Xe &amp; Tài Xế</span>
                </button>
              )}
              {order.vehiclePlate && !order.pod && (
                <button
                  onClick={() => onPod(order)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Ký Nghiệm Thu POD</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
