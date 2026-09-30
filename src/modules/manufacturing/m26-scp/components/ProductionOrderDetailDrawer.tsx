import React from "react";
import {
  X,
  Factory,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  ShieldCheck,
  Send,
  Printer,
  ChevronRight,
  TrendingUp,
  Cpu,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "../../../../components/common/StatusBadge";

export interface ProductionOrderDetails {
  id: string | number;
  orderCode: string;
  productName: string;
  sku: string;
  plannedQty: number;
  completedQty?: number;
  uom: string;
  startDate: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PLANNED" | "RELEASED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  workCenter?: string;
  bomVersion?: string;
  supervisor?: string;
  components?: Array<{
    sku: string;
    name: string;
    requiredQty: number;
    allocatedQty: number;
    availableQty: number;
    uom: string;
    isShortage: boolean;
  }>;
  operations?: Array<{
    step: number;
    workCenter: string;
    description: string;
    setupTime: string;
    runTime: string;
    status: "PENDING" | "RUNNING" | "DONE";
  }>;
}

export interface ProductionOrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrderDetails | null;
  onReleaseOrder?: (orderId: string | number) => void;
  onPrintTraveler?: (order: ProductionOrderDetails) => void;
}

export const ProductionOrderDetailDrawer: React.FC<ProductionOrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onReleaseOrder,
  onPrintTraveler,
}) => {
  if (!isOpen || !order) return null;

  const defaultComponents = order.components || [
    {
      sku: "NVL-ALU-6061",
      name: "Nhôm Tấm Hợp Kim 6061-T6 (Dày 5mm)",
      requiredQty: order.plannedQty * 1.2,
      allocatedQty: order.plannedQty * 1.2,
      availableQty: 450,
      uom: "Kg",
      isShortage: false,
    },
    {
      sku: "PK-BOLT-M8",
      name: "Bu Lông Inox 304 M8x25mm",
      requiredQty: order.plannedQty * 4,
      allocatedQty: order.plannedQty * 4,
      availableQty: 1200,
      uom: "Cái",
      isShortage: false,
    },
    {
      sku: "BTP-ELEC-BOARD",
      name: "Mạch Điều Khiển Trung Tâm MCU-V3",
      requiredQty: order.plannedQty,
      allocatedQty: order.plannedQty,
      availableQty: 80,
      uom: "Bộ",
      isShortage: 80 < order.plannedQty,
    },
  ];

  const defaultOperations = order.operations || [
    {
      step: 10,
      workCenter: "WC-CNC-01",
      description: "Gia công phay biên dạng & khoan lỗ định vị CNC 5 trục",
      setupTime: "30 phút",
      runTime: `${order.plannedQty * 12} phút`,
      status: "DONE",
    },
    {
      step: 20,
      workCenter: "WC-SURF-02",
      description: "Xử lý bề mặt mạ Anodizing chống oxy hóa chuẩn quân sự",
      setupTime: "15 phút",
      runTime: `${order.plannedQty * 8} phút`,
      status: "RUNNING",
    },
    {
      step: 30,
      workCenter: "WC-ASSY-LINE",
      description: "Lắp ráp cụm cơ điện tử & test QC chức năng (M39 Gate)",
      setupTime: "20 phút",
      runTime: `${order.plannedQty * 15} phút`,
      status: "PENDING",
    },
  ];

  const hasShortage = defaultComponents.some((c) => c.isShortage);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {order.orderCode}
                </h2>
                <StatusBadge
                  variant={
                    order.status === "COMPLETED"
                      ? "success"
                      : order.status === "IN_PROGRESS"
                      ? "info"
                      : order.status === "RELEASED"
                      ? "purple"
                      : "warning"
                  }
                  label={order.status}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lệnh Sản Xuất & Điều Phối Công Đoạn Xưởng (MES / SCP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* Main Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sản phẩm hoàn thiện
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {order.productName}
                </div>
                <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  SKU: {order.sku}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Số lượng kế hoạch
                </span>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {order.plannedQty.toLocaleString("vi-VN")} {order.uom}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">BOM Version</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {order.bomVersion || "BOM-REV-2.4"}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Ngày Bắt Đầu</span>
                <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {order.startDate || "28/08/2026"}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Hạn Hoàn Thành</span>
                <div className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                  {order.dueDate || "05/09/2026"}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Quản Đốc</span>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {order.supervisor || "Kỹ sư Trưởng"}
                </div>
              </div>
            </div>
          </div>

          {/* Shortage Warning */}
          {hasShortage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold">Cảnh Báo Thiếu Hụt NVL Cấp 2</div>
                <div className="text-[11px] opacity-90">
                  Một số linh kiện chưa đủ tồn khả dụng, cần tạo PR khẩn cấp tới Module M08 Mua hàng.
                </div>
              </div>
            </div>
          )}

          {/* BOM Material Allocation Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Định mức Nguyên Vật Liệu (BOM Allocation)</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {defaultComponents.length} linh kiện
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Mã & Tên Linh Kiện</th>
                    <th className="p-2.5 text-right">Nhu Cầu</th>
                    <th className="p-2.5 text-right">Tồn Khả Dụng</th>
                    <th className="p-2.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {defaultComponents.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {c.sku}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                        {c.requiredQty.toLocaleString("vi-VN")} {c.uom}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {c.availableQty.toLocaleString("vi-VN")} {c.uom}
                      </td>
                      <td className="p-2.5 text-center">
                        {c.isShortage ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            Thiếu Hàng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            Khả Dụng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Work Centers & Operations Routing */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Tiến Trình Công Đoạn & Máy Sản Xuất (Routing)</span>
            </h3>
            <div className="space-y-2">
              {defaultOperations.map((op) => (
                <div
                  key={op.step}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold flex items-center justify-center text-xs">
                      {op.step}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {op.description}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Máy / Trạm: <strong className="text-blue-600 dark:text-blue-400">{op.workCenter}</strong> | Setup: {op.setupTime} | Chạy: {op.runTime}
                      </div>
                    </div>
                  </div>
                  <div>
                    <StatusBadge
                      variant={
                        op.status === "DONE"
                          ? "success"
                          : op.status === "RUNNING"
                          ? "info"
                          : "neutral"
                      }
                      label={op.status === "DONE" ? "Hoàn thành" : op.status === "RUNNING" ? "Đang chạy" : "Chờ xử lý"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <button
            onClick={() => onPrintTraveler && onPrintTraveler(order)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Lệnh (Job Traveler)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                if (onReleaseOrder) onReleaseOrder(order.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Phát Hành Lệnh Vào Phân Xưởng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
