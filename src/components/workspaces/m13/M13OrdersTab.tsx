import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileText,
  Receipt,
  DollarSign,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  UserCheck,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { safeNumber } from '../../../utils/salesOrderDataNormalizer';

interface M13OrdersTabProps {
  orders: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  onSelectOrder: (order: any) => void;
  onOpenCreateOrderModal: () => void;
  onOpenQuotationImportModal: () => void;
  onOpenPaymentModal: (order: any) => void;
  onOpenVatModal: (order: any) => void;
  onDownloadVatPdf: (order: any) => void;
  onCancelOrder: (order: any) => void;
  // Quick Create Form props
  newCustomer: string;
  setNewCustomer: (v: string) => void;
  newTaxCode: string;
  setNewTaxCode: (v: string) => void;
  newEmail: string;
  setNewEmail: (v: string) => void;
  newAmount: string;
  setNewAmount: (v: string) => void;
  newSku: string;
  setNewSku: (v: string) => void;
  newQty: string;
  setNewQty: (v: string) => void;
  onCreateOrderQuick: (e: React.FormEvent) => void;
  masterProducts: any[];
  masterCustomers?: any[];
}

export const M13OrdersTab: React.FC<M13OrdersTabProps> = ({
  orders,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onSelectOrder,
  onOpenCreateOrderModal,
  onOpenQuotationImportModal,
  onOpenPaymentModal,
  onOpenVatModal,
  onDownloadVatPdf,
  onCancelOrder,
  newCustomer,
  setNewCustomer,
  newTaxCode,
  setNewTaxCode,
  newEmail,
  setNewEmail,
  newAmount,
  setNewAmount,
  newSku,
  setNewSku,
  newQty,
  setNewQty,
  onCreateOrderQuick,
  masterProducts,
  masterCustomers = []
}) => {
  const [selectedM07CustId, setSelectedM07CustId] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.taxCode && o.taxCode.includes(searchQuery));
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'POS_VAT'
        ? o.sourceModule === 'M16_POS'
        : o.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectM07Customer = (cIdStr: string) => {
    setSelectedM07CustId(cIdStr);
    if (!cIdStr) return;
    const found = masterCustomers.find(c => String(c.customerId || c.id) === cIdStr);
    if (found) {
      setNewCustomer(found.customerName || found.name);
      setNewTaxCode(found.taxCode ?? '');
      setNewEmail(found.billingEmail ?? found.email ?? '');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Table Column (2 Cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search & Actions Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã SO, Tên khách hàng hoặc Mã số thuế..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono tabular-nums"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={onOpenQuotationImportModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nhập Báo Giá CRM</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateOrderModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo SO Multi-Line</span>
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'ALL', label: 'TẤT CẢ' },
              { key: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN (CONFIRMED)' },
              { key: 'INVOICED', label: 'ĐÃ XUẤT HĐ (INVOICED)' },
              { key: 'POS_VAT', label: 'POS CẦN HĐ VAT' },
              { key: 'DRAFT', label: 'BẢN NHÁP' },
              { key: 'FULFILLED', label: 'ĐÃ GIAO HÀNG' },
              { key: 'CANCELLED', label: 'ĐÃ HỦY' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono tabular-nums font-bold transition-all cursor-pointer ${
                  statusFilter === st.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Master Table Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                  <th className="py-3 px-3">Mã SO</th>
                  <th className="py-3 px-3">Khách Hàng & MST</th>
                  <th className="py-3 px-3">Ngày & Kênh</th>
                  <th className="py-3 px-3 text-right">Tổng Giá Trị</th>
                  <th className="py-3 px-3">Trạng Thái SO / VAT</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => {
                    const isIssued = o.vatStatus === 'ISSUED';
                    const isPos = o.sourceModule === 'M16_POS';
                    const hasValidTax = Boolean(o.taxCode && o.taxCode.length >= 10);

                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        {/* Order ID */}
                        <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(o)}
                            className="hover:underline text-left cursor-pointer flex items-center gap-1"
                          >
                            <span>{o.id}</span>
                            {isPos && (
                              <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold font-mono">
                                POS
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Customer & Tax Code */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {o.customerName}
                            </span>
                            {hasValidTax && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" />
                                <span>M07</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            MST: {o.taxCode || 'Chưa cung cấp'}
                          </div>
                        </td>

                        {/* Date & Source */}
                        <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                          <div>{o.orderDate}</div>
                          <div className="text-[10px] text-slate-400">
                            {isPos ? 'Bán lẻ POS M16' : 'Hợp đồng B2B'}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {o.totalAmount}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            VAT {o.taxRate ?? 10}%
                          </div>
                        </td>

                        {/* Status SO / VAT */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                o.status === 'CONFIRMED'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                  : o.status === 'INVOICED'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                  : o.status === 'CANCELLED'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {o.status}
                            </span>
                            {isIssued && (
                              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Receipt className="w-3 h-3" />
                                <span>HĐ: {o.vatInvoiceNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onSelectOrder(o)}
                              title="Xem Hồ sơ 360°"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isIssued && o.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => onOpenVatModal(o)}
                                title="Xuất Hóa Đơn Điện Tử VAT"
                                className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Xuất VAT</span>
                              </button>
                            )}

                            {isIssued && (
                              <button
                                type="button"
                                onClick={() => onDownloadVatPdf(o)}
                                title="Tải PDF Hóa Đơn VAT"
                                className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {o.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentModal(o)}
                                title="Thu Tiền / Quyết Toán GL"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {o.status !== 'CANCELLED' && !isIssued && (
                              <button
                                type="button"
                                onClick={() => onCancelOrder(o)}
                                title="Hủy Đơn Hàng"
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
            <span>
              Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn hàng
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Quick Single-Line Order Form + Compliance Shield */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Plus className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tạo Đơn Hàng Nhanh (Đồng Bộ M07)
            </h4>
          </div>

          <form onSubmit={onCreateOrderQuick} className="space-y-3">
            {/* Quick Customer Master Select */}
            {masterCustomers.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chọn Khách Hàng Master (M07)
                </label>
                <select
                  value={selectedM07CustId}
                  onChange={(e) => handleSelectM07Customer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                >
                  <option value="">-- Chọn khách hàng hoặc nhập mới bên dưới --</option>
                  {masterCustomers.map((c) => (
                    <option key={c.customerId || c.id} value={String(c.customerId || c.id)}>
                      [{c.customerCode || c.code || 'CUST'}] {c.customerName || c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tên Khách Hàng / Đơn Vị Mua
              </label>
              <input
                type="text"
                placeholder="VD: Công ty Cổ phần Tập đoàn Hòa Phát"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mã Số Thuế (MST)
                </label>
                <input
                  type="text"
                  placeholder="0108765432"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Nhận HĐ VAT
                </label>
                <input
                  type="email"
                  placeholder="ketoan@enterprise.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chọn Sản Phẩm Master (M07)
              </label>
              <select
                value={newSku}
                onChange={(e) => {
                  setNewSku(e.target.value);
                  const selected = (masterProducts || []).find((p) => p.sku === e.target.value);
                  if (selected) {
                    const price = selected.retailPrice ?? selected.wholesalePrice ?? selected.costPrice ?? selected.price ?? 0;
                    const cleanQty = Number(newQty) || 1;
                    const subtotal = price * cleanQty;
                    const tax = Math.round(subtotal * 0.1);
                    setNewAmount(`${(subtotal + tax).toLocaleString('vi-VN')} VND`);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(masterProducts || []).map((p) => {
                  const price = p.retailPrice ?? p.wholesalePrice ?? p.costPrice ?? p.price ?? 0;
                  return (
                    <option key={p.sku} value={p.sku}>
                      [{p.sku}] {p.name} - {Number(price).toLocaleString('vi-VN')} VND
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Số Lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewQty(val);
                    const selected = (masterProducts || []).find((p) => p.sku === newSku);
                    if (selected) {
                      const price = selected.retailPrice ?? selected.wholesalePrice ?? selected.costPrice ?? selected.price ?? 0;
                      const cleanQty = Number(val) || 1;
                      const subtotal = price * cleanQty;
                      const tax = Math.round(subtotal * 0.1);
                      setNewAmount(`${(subtotal + tax).toLocaleString('vi-VN')} VND`);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tổng Giá Trị Đơn Hàng
                </label>
                <input
                  type="text"
                  placeholder="100.000.000 VND"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-600 dark:text-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Xác Nhận & Tạo Đơn Hàng M13</span>
            </button>
          </form>
        </div>

        {/* M13 Compliance & Invariant Shield */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Quy Trình O2C & Đồng Bộ M07 / M16</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hệ thống M13 kiểm soát toàn vẹn dữ liệu khách hàng theo hồ sơ M07, tự động kiểm tra hạn mức tín dụng công nợ, phân bổ giữ chỗ kho WMS (M17) và phát hành HĐĐT VAT NĐ 123.
          </p>
        </div>
      </div>
    </div>
  );
};
