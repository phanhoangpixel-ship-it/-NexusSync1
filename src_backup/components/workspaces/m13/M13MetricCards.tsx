import React from 'react';
import { ShoppingCart, DollarSign, Receipt, Boxes } from 'lucide-react';

interface M13MetricCardsProps {
  totalOrders: number;
  totalRevenue: number;
  vatIssuedCount: number;
  vatComplianceRate: string;
  reservedCount: number;
}

export const M13MetricCards: React.FC<M13MetricCardsProps> = ({
  totalOrders,
  totalRevenue,
  vatIssuedCount,
  vatComplianceRate,
  reservedCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Orders */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng Đơn Hàng SO
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalOrders}
          </span>
          <span className="text-xs text-blue-600 font-semibold">Đơn B2B & POS</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tổng số chứng từ bán hàng toàn hệ thống
        </p>
      </div>

      {/* 2. Total Revenue */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Doanh Thu Đơn Hàng
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            {(totalRevenue / 1000000000).toFixed(2)} Tỷ
          </span>
          <span className="text-xs text-slate-400">VND</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tổng giá trị đơn hàng đã xác nhận & phát hành
        </p>
      </div>

      {/* 3. VAT E-Invoicing */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Hóa Đơn VAT Điện Tử
          </span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400 tabular-nums">
            {vatIssuedCount}
          </span>
          <span className="text-xs text-purple-600 font-semibold font-mono">
            {vatComplianceRate} Tuân thủ NĐ123
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Đã ký số Cloud HSM & Cấp mã CQT
        </p>
      </div>

      {/* 4. Reserved Stock */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Giữ Chỗ Tồn Kho (ATP)
          </span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
            {reservedCount}
          </span>
          <span className="text-xs text-slate-500 font-semibold">Đơn đang giữ hàng</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Bảo đảm khả dụng giao hàng trước khi xuất WMS
        </p>
      </div>
    </div>
  );
};
