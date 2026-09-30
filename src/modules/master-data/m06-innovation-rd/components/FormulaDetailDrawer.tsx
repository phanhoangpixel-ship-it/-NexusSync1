import React from "react";
import {
  X,
  FlaskConical,
  Layers,
  Scale,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Printer,
  Sparkles,
  Leaf,
  FileCheck,
  Cpu,
  TrendingDown,
} from "lucide-react";
import { StatusBadge } from "../../../../components/common/StatusBadge";

export interface FormulaIngredient {
  sku: string;
  name: string;
  percentage: number; // Tỷ lệ %
  quantity: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  costSharePercent: number;
  casNumber?: string;
  isEcoCompliant: boolean;
}

export interface FormulaDetails {
  id: string | number;
  formulaCode: string;
  formulaName: string;
  targetSku: string;
  version: string;
  category: string;
  targetYieldPercent: number;
  targetUnitCost: number;
  estimatedCost: number;
  status: "DRAFT" | "TESTING" | "APPROVED" | "SCALED_TO_MES";
  ecoScore: number;
  leadResearcher: string;
  ingredients: FormulaIngredient[];
  labSpecs?: {
    phLevel?: string;
    viscosity?: string;
    tensileStrength?: string;
    meltingPoint?: string;
  };
}

export interface FormulaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formula: FormulaDetails | null;
  onTransferToMes?: (formulaId: string | number) => void;
  onPrintFormula?: (formula: FormulaDetails) => void;
}

export const FormulaDetailDrawer: React.FC<FormulaDetailDrawerProps> = ({
  isOpen,
  onClose,
  formula,
  onTransferToMes,
  onPrintFormula,
}) => {
  if (!isOpen || !formula) return null;

  const defaultIngredients: FormulaIngredient[] = formula.ingredients || [
    {
      sku: "NVL-POLY-A1",
      name: "Polymer Base Nhựa Nguyên Sinh Sinh Học (Bio-Resin)",
      percentage: 65,
      quantity: 650,
      uom: "Kg",
      unitCost: 45000,
      totalCost: 29250000,
      costSharePercent: 58.2,
      casNumber: "9002-88-4",
      isEcoCompliant: true,
    },
    {
      sku: "NVL-STAB-UV",
      name: "Chất Ổn Định UV Quang Học Cấp Thực Phẩm",
      percentage: 15,
      quantity: 150,
      uom: "Kg",
      unitCost: 82000,
      totalCost: 12300000,
      costSharePercent: 24.5,
      casNumber: "3896-11-5",
      isEcoCompliant: true,
    },
    {
      sku: "NVL-PIGMENT-BL",
      name: "Hạt Màu Titan Dioxide Không Chì Nano",
      percentage: 20,
      quantity: 200,
      uom: "Kg",
      unitCost: 43500,
      totalCost: 8700000,
      costSharePercent: 17.3,
      casNumber: "13463-67-7",
      isEcoCompliant: true,
    },
  ];

  const totalCostBatch = defaultIngredients.reduce((acc, i) => acc + i.totalCost, 0);

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
            <div className="p-2 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {formula.formulaCode}
                </h2>
                <StatusBadge
                  variant={
                    formula.status === "SCALED_TO_MES"
                      ? "success"
                      : formula.status === "APPROVED"
                      ? "purple"
                      : formula.status === "TESTING"
                      ? "info"
                      : "warning"
                  }
                  label={formula.status}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hồ sơ Nghiên cứu & Định mức Công thức Sản phẩm M06 (R&D Recipe)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* Main Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên Công thức & Dòng sản phẩm
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {formula.formulaName}
                </div>
                <div className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                  SKU Đích: {formula.targetSku} (Version {formula.version || "v2.1"})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hiệu suất Thu hồi (Yield)
                </span>
                <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formula.targetYieldPercent || 98.5}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Chi phí Đích / Unit</span>
                <div className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {(formula.targetUnitCost || 48500).toLocaleString("vi-VN")} ₫
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Chi phí Dự toán</span>
                <div className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                  {(formula.estimatedCost || 50250).toLocaleString("vi-VN")} ₫
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Eco-Score (ESG)</span>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>{formula.ecoScore || 94}/100</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Trưởng nhóm R&D</span>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {formula.leadResearcher || "TS. Lê Viết Dũng"}
                </div>
              </div>
            </div>
          </div>

          {/* Ingredient BOM Explosion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Cơ Cấu Thành Phần & Định Mức NVL (Recipe BOM)</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Tổng mẻ: 1,000 Kg
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Thành Phần & Mã CAS</th>
                    <th className="p-2.5 text-right">Tỷ Lệ %</th>
                    <th className="p-2.5 text-right">Khối Lượng</th>
                    <th className="p-2.5 text-right">Đơn Giá NVL</th>
                    <th className="p-2.5 text-right">Thành Tiền (VNĐ)</th>
                    <th className="p-2.5 text-center">Tuân Thủ Eco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {defaultIngredients.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {item.sku} {item.casNumber ? `| CAS: ${item.casNumber}` : ""}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
                        {item.percentage}%
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {item.quantity} {item.uom}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {item.unitCost.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {item.totalCost.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>REACH/FDA</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">Tổng Mẻ Thử Nghiệm</td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-purple-600">100%</td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">1,000 Kg</td>
                    <td className="p-2.5 text-right text-slate-500">-</td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400 text-sm">
                      {totalCostBatch.toLocaleString("vi-VN")} ₫
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Lab Test Specs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Chỉ Tiêu Hóa Lý & Tiêu Chuẩn Thử Nghiệm Phòng Lab</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Độ pH Tiêu Chuẩn</span>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {formula.labSpecs?.phLevel || "6.8 - 7.2 (Trung tính)"}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Độ Nhớt (Viscosity)</span>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {formula.labSpecs?.viscosity || "2,400 cP @ 25°C"}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Độ Bền Kéo (Tensile)</span>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {formula.labSpecs?.tensileStrength || "42.5 MPa (ASTM D638)"}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Điểm Nóng Chảy</span>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {formula.labSpecs?.meltingPoint || "165°C - 172°C"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <button
            onClick={() => onPrintFormula && onPrintFormula(formula)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Công Thức Kỹ Thuật</span>
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
                if (onTransferToMes) onTransferToMes(formula.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Chuyển Sang MES Master BOM (M25)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
