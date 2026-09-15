import React from 'react';
import { ShoppingCart, Plus, RefreshCw, Download, FileText, Receipt, Sparkles } from 'lucide-react';

interface M13WorkspaceHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateOrder: () => void;
  onOpenQuotationImport: () => void;
  onExportCSV: () => void;
}

export const M13WorkspaceHeader: React.FC<M13WorkspaceHeaderProps> = ({
  loading,
  onRefresh,
  onOpenCreateOrder,
  onOpenQuotationImport,
  onExportCSV,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
            M13 • SALES ORDERS & VAT INVOICING (O2C)
          </span>
          <span className="text-xs text-slate-400">Order-to-Cash Suite • Bán Hàng B2B, Hóa Đơn VAT Điện Tử Chuẩn NĐ 123 & Quyết Toán GL</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight mt-1">Đơn Bán Hàng, Hóa Đơn VAT Điện Tử & Chu Trình O2C</h2>
        <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
          Quản lý trọn vòng đời đơn hàng B2B: Nhập báo giá CRM (M12), giữ chỗ tồn kho (M17), phát hành trực tiếp <strong>Hóa đơn VAT điện tử (e-Invoice)</strong> có mã CQT & ký số HSM, và điều phối xuất kho WMS (M24).
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenQuotationImport}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Nhập Báo Giá CRM</span>
        </button>

        <button
          type="button"
          onClick={onOpenCreateOrder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Đơn Hàng Mới</span>
        </button>
      </div>
    </div>
  );
};
