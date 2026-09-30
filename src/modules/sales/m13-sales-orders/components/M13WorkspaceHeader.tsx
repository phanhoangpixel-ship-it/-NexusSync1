import React from 'react';
import { ShoppingCart, Plus, RefreshCw, Download, FileText, Receipt, Sparkles, UserCheck, Truck } from 'lucide-react';

interface M13WorkspaceHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateOrder: () => void;
  onOpenQuotationImport: () => void;
  onExportCSV: () => void;
  onOpenCustomerPortal?: () => void;
  onOpenDeliveryCod?: () => void;
}

export const M13WorkspaceHeader: React.FC<M13WorkspaceHeaderProps> = ({
  loading,
  onRefresh,
  onOpenCreateOrder,
  onOpenQuotationImport,
  onExportCSV,
  onOpenCustomerPortal,
  onOpenDeliveryCod,
}) => {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
          M13 • SALES ORDERS & VAT INVOICING
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden lg:inline">
          Bán Hàng B2B & Hóa Đơn VAT Điện Tử Chuẩn NĐ 123
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
        {onOpenCustomerPortal && (
          <button
            type="button"
            onClick={onOpenCustomerPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold transition-all border border-sky-200 dark:border-sky-800 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Portal Khách Hàng B2B</span>
          </button>
        )}

        {onOpenDeliveryCod && (
          <button
            type="button"
            onClick={onOpenDeliveryCod}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-bold transition-all border border-orange-200 dark:border-orange-800 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Giao Hàng &amp; COD</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-400'}`} />
          <span>Làm mới</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenQuotationImport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Nhập Báo Giá CRM</span>
        </button>

        <button
          type="button"
          onClick={onOpenCreateOrder}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Đơn Hàng Mới</span>
        </button>
      </div>
    </div>
  );
};
