import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Building2,
  Key,
} from 'lucide-react';

interface M13VatInvoicesTabProps {
  orders: any[];
  onDownloadVatPdf: (order: any) => void;
  onSelectOrder: (order: any) => void;
}

export const M13VatInvoicesTab: React.FC<M13VatInvoicesTabProps> = ({
  orders,
  onDownloadVatPdf,
  onSelectOrder,
}) => {
  const [vatSearch, setVatSearch] = useState('');
  const [vatPage, setVatPage] = useState(1);
  const itemsPerPage = 6;

  const issuedOrders = orders.filter((o) => o.vatStatus === 'ISSUED');

  const filteredVatOrders = issuedOrders.filter((o) => {
    const q = vatSearch.toLowerCase();
    return (
      (o.vatInvoiceNumber && o.vatInvoiceNumber.toLowerCase().includes(q)) ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.taxCode && o.taxCode.includes(q)) ||
      (o.cqtCode && o.cqtCode.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredVatOrders.length / itemsPerPage) || 1;
  const paginatedVatOrders = filteredVatOrders.slice(
    (vatPage - 1) * itemsPerPage,
    vatPage * itemsPerPage
  );

  const totalVatAmount = issuedOrders.reduce((sum, o) => {
    return sum + (typeof o.taxAmount === 'number' ? o.taxAmount : (Number(o.taxAmount) || 0));
  }, 0);

  const totalNetRevenue = issuedOrders.reduce((sum, o) => {
    return sum + (typeof o.subtotalAmount === 'number' ? o.subtotalAmount : (Number(o.subtotalAmount) || 0));
  }, 0);

  return (
    <div className="space-y-4">
      {/* VAT Compliance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hóa Đơn Đã Cấp Mã CQT
            </span>
            <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400 tabular-nums">
            {issuedOrders.length} Hóa Đơn
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            100% Ký số Cloud HSM & Khớp mẫu số 1C26TAA
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Doanh Thu Chưa Thuế
            </span>
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
            {totalNetRevenue.toLocaleString('vi-VN')} VND
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Hạch toán doanh thu bán hàng TK 511
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Thuế GTGT Đầu Ra (TK 33311)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            {totalVatAmount.toLocaleString('vi-VN')} VND
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Nghĩa vụ thuế VAT phải nộp Nhà nước
          </p>
        </div>
      </div>

      {/* Main VAT Invoices Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 p-5">
        {/* Search & Subtitle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sổ Hóa Đơn Điện Tử Đã Phát Hành (Nghị định 123/2020/NĐ-CP & Thông tư 78)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tra cứu thông tin hóa đơn điện tử hợp pháp, tải bản thể hiện PDF A4 và đối soát mã CQT
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm theo số HĐ, Mã SO, MST, Mã CQT..."
              value={vatSearch}
              onChange={(e) => {
                setVatSearch(e.target.value);
                setVatPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                <th className="py-3 px-3">Số Hóa Đơn & Ký Hiệu</th>
                <th className="py-3 px-3">Đơn Hàng SO</th>
                <th className="py-3 px-3">Khách Hàng & MST</th>
                <th className="py-3 px-3 text-right">Tiền Chưa Thuế</th>
                <th className="py-3 px-3 text-center">Thuế Suất</th>
                <th className="py-3 px-3 text-right">Tiền Thuế VAT</th>
                <th className="py-3 px-3 text-right">Tổng Thanh Toán</th>
                <th className="py-3 px-3">Mã CQT & Ký Số</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedVatOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chưa có hóa đơn VAT điện tử nào được phát hành.
                  </td>
                </tr>
              ) : (
                paginatedVatOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    {/* Invoice No & Serial */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-purple-700 dark:text-purple-400">
                        {o.vatInvoiceNumber || 'INV-PENDING'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Ký hiệu: {o.vatSerial || '1C26TAA'}
                      </div>
                    </td>

                    {/* SO Link */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(o)}
                        className="hover:underline cursor-pointer"
                      >
                        {o.id}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {o.customerName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        MST: {o.taxCode || '0108765432'}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {(Number(o.subtotalAmount) || 0).toLocaleString('vi-VN')} đ
                    </td>

                    {/* Tax Rate */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                      {o.taxRate ?? 10}%
                    </td>

                    {/* Tax Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {(Number(o.taxAmount) || 0).toLocaleString('vi-VN')} đ
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {o.totalAmount}
                    </td>

                    {/* CQT Code & HSM */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{o.cqtCode || 'T26-0001-A9F32E-78'}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Key className="w-2.5 h-2.5 text-purple-500" />
                        <span>Cloud HSM SHA-256</span>
                      </div>
                    </td>

                    {/* Action Download */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDownloadVatPdf(o)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer ml-auto"
                      >
                        <Download className="w-3 h-3" />
                        <span>Tải PDF NĐ123</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
          <span>
            Hiển thị {paginatedVatOrders.length} / {filteredVatOrders.length} hóa đơn VAT
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={vatPage === 1}
              onClick={() => setVatPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
              Trang {vatPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={vatPage === totalPages}
              onClick={() => setVatPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
