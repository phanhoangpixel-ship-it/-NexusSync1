import React, { useState, useMemo } from 'react';
import { BidItem, RFQItem, MasterSupplierOption } from './m10Types';
import { ShieldCheck, Search, Filter, RefreshCw, Send, DollarSign, Clock, Building } from 'lucide-react';
import { PaginationControl } from '../../common/PaginationControl';

interface M10BidsTabProps {
  bids: BidItem[];
  rfqs?: RFQItem[];
  suppliers?: MasterSupplierOption[];
  loading: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
  onCreateBid: (e: React.FormEvent) => void;
  bidRfqId: string;
  setBidRfqId: (val: string) => void;
  bidSupplierId: string;
  setBidSupplierId: (val: string) => void;
  bidUnitPrice: string;
  setBidUnitPrice: (val: string) => void;
  bidQuantity: string;
  setBidQuantity: (val: string) => void;
  bidLeadTime: string;
  setBidLeadTime: (val: string) => void;
}

export const M10BidsTab: React.FC<M10BidsTabProps> = ({
  bids,
  rfqs = [],
  suppliers = [],
  loading,
  isSubmitting,
  onRefresh,
  onCreateBid,
  bidRfqId,
  setBidRfqId,
  bidSupplierId,
  setBidSupplierId,
  bidUnitPrice,
  setBidUnitPrice,
  bidQuantity,
  setBidQuantity,
  bidLeadTime,
  setBidLeadTime,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredBids = useMemo(() => {
    return bids.filter(b => {
      const matchSearch = String(b.id).includes(searchTerm) ||
        String(b.rfqId).includes(searchTerm) ||
        (b.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bids, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredBids.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBids = filteredBids.slice(startIndex, startIndex + pageSize);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Bids Table (2 Cols) */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {/* L1 Command Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hồ sơ Chào giá Nhà cung cấp (Supplier Bids)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị {filteredBids.length} / {bids.length} hồ sơ chào thầu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Tìm mã bid, NCC, RFQ..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 w-36 sm:w-48"
                />
              </div>

              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SUBMITTED">Đã nộp hồ sơ</option>
                  <option value="ACCEPTED">Chấp thuận</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                title="Làm mới bảng"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                  <th className="p-3">ID Bid</th>
                  <th className="p-3">RFQ ID</th>
                  <th className="p-3">Nhà cung cấp</th>
                  <th className="p-3 text-right">Tổng giá trị</th>
                  <th className="p-3 text-center">Thời gian GH</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {paginatedBids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-mono tabular-nums">
                      Chưa có hồ sơ chào giá nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedBids.map(b => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-l-emerald-500"
                    >
                      <td className="p-3 font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                        BID-{b.id}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px] font-bold">
                          RFQ-{b.rfqId}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.supplierName || `Supplier #${b.supplierId}`}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {Number(b.totalValue ?? 0).toLocaleString()} VND
                      </td>
                      <td className="p-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {b.leadTimeDays ? `${b.leadTimeDays} ngày` : '3 ngày'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* L4 Pagination */}
          {filteredBids.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredBids.length}
                startIndex={startIndex}
                endIndex={Math.min(startIndex + pageSize, filteredBids.length)}
                onPageChange={setCurrentPage}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Bid Form (1 Col) */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Nộp Hồ Sơ Chào Giá (Supplier Portal)
            </h3>
          </div>

          <form onSubmit={onCreateBid} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Chọn Gói thầu (RFQ) <span className="text-rose-500">*</span>
              </label>
              {rfqs.length > 0 ? (
                <select
                  value={bidRfqId}
                  onChange={e => setBidRfqId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  required
                >
                  <option value="">-- Chọn Gói thầu RFQ --</option>
                  {rfqs.map(r => (
                    <option key={r.id} value={r.dbId || r.id.replace('RFQ-', '')}>
                      {r.id} - {r.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={bidRfqId}
                  onChange={e => setBidRfqId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  placeholder="VD: 1"
                  required
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Nhà cung cấp (Supplier) <span className="text-rose-500">*</span>
              </label>
              {suppliers.length > 0 ? (
                <select
                  value={bidSupplierId}
                  onChange={e => setBidSupplierId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  required
                >
                  <option value="">-- Chọn Nhà cung cấp --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={bidSupplierId}
                  onChange={e => setBidSupplierId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  placeholder="VD: 1"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Đơn giá (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={bidUnitPrice}
                  onChange={e => setBidUnitPrice(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  placeholder="100000"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Số lượng đáp ứng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={bidQuantity}
                  onChange={e => setBidQuantity(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Thời gian giao hàng (Ngày)
              </label>
              <input
                type="number"
                value={bidLeadTime}
                onChange={e => setBidLeadTime(e.target.value)}
                className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="3"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
              Hồ sơ chào thầu được niêm phong mật mã sha256 cho đến khi mở thầu theo đúng quy trình kiểm toán.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Gửi Hồ sơ Chào giá</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
