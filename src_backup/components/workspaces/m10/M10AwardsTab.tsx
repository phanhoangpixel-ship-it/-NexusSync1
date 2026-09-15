import React, { useState, useMemo } from 'react';
import { AwardItem, RFQItem, BidItem, MasterSupplierOption } from './m10Types';
import { CheckCircle, Search, RefreshCw, Download, CheckCircle2, Building, ShoppingBag, ArrowRight } from 'lucide-react';
import { PaginationControl } from '../../common/PaginationControl';

interface M10AwardsTabProps {
  awards: AwardItem[];
  loading: boolean;
  isSubmitting: boolean;
  rfqs?: RFQItem[];
  bids?: BidItem[];
  suppliers?: MasterSupplierOption[];
  onRefresh: () => void;
  onCreateAward: (e: React.FormEvent) => void;
  onGeneratePo?: (awardId: number) => Promise<void>;
  awardRfqId: string;
  setAwardRfqId: (val: string) => void;
  awardBidId: string;
  setAwardBidId: (val: string) => void;
  awardSupplierId: string;
  setAwardSupplierId: (val: string) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10AwardsTab: React.FC<M10AwardsTabProps> = ({
  awards,
  loading,
  isSubmitting,
  rfqs = [],
  bids = [],
  suppliers = [],
  onRefresh,
  onCreateAward,
  onGeneratePo,
  awardRfqId,
  setAwardRfqId,
  awardBidId,
  setAwardBidId,
  awardSupplierId,
  setAwardSupplierId,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generatingPoId, setGeneratingPoId] = useState<number | null>(null);

  const filteredAwards = useMemo(() => {
    return awards.filter(a => {
      return (a.awardNo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (a.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        String(a.rfqId).includes(searchTerm);
    });
  }, [awards, searchTerm]);

  const totalPages = Math.ceil(filteredAwards.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAwards = filteredAwards.slice(startIndex, startIndex + pageSize);

  // Filter bids matching selected awardRfqId
  const availableBidsForSelectedRfq = useMemo(() => {
    if (!awardRfqId) return bids;
    return bids.filter(b => String(b.rfqId) === String(awardRfqId));
  }, [bids, awardRfqId]);

  const handleSelectBid = (selectedBidId: string) => {
    setAwardBidId(selectedBidId);
    const foundBid = bids.find(b => String(b.id) === selectedBidId);
    if (foundBid) {
      if (foundBid.supplierId) {
        setAwardSupplierId(String(foundBid.supplierId));
      }
      if (foundBid.rfqId && !awardRfqId) {
        setAwardRfqId(String(foundBid.rfqId));
      }
    }
  };

  const handleTriggerGeneratePo = async (awardId: number) => {
    if (!onGeneratePo) return;
    setGeneratingPoId(awardId);
    try {
      await onGeneratePo(awardId);
    } finally {
      setGeneratingPoId(null);
    }
  };

  const handleExportAwardsCSV = () => {
    if (awards.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Chưa có quyết định trao thầu nào để xuất.');
      return;
    }
    const csvHeader = "Mã Quyết Định,RFQ ID,Nhà Cung Cấp Thắng Thầu,Tổng Giá Trị (VND),Trạng Thái,Mã PO M08\n";
    const csvRows = awards.map(a =>
      `"${a.awardNo ?? ''}","RFQ-${a.rfqId}","${a.supplierName ?? ''}","${a.totalAmount ?? 0}","${a.status ?? ''}","${a.poCode ?? ''}"`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sourcing_awards_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Đã tải danh sách quyết định trao thầu.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Awards Table (2 Cols) */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {/* L1 Command Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Danh sách Quyết định Trao thầu (Awards)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị {filteredAwards.length} / {awards.length} quyết định đã phê duyệt
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Tìm mã award, NCC..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 w-44"
                />
              </div>

              <button
                type="button"
                onClick={handleExportAwardsCSV}
                title="Xuất CSV"
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Tải lại dữ liệu"
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* L2 Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3">Mã Quyết định</th>
                  <th className="p-3">Gói RFQ</th>
                  <th className="p-3">Nhà cung cấp thắng thầu</th>
                  <th className="p-3 text-right">Tổng giá trị trúng thầu</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-center">Liên kết M08 PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {loading && awards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      <span>Đang tải danh sách quyết định trao thầu...</span>
                    </td>
                  </tr>
                ) : paginatedAwards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Chưa có quyết định trao thầu nào được phê duyệt.
                    </td>
                  </tr>
                ) : (
                  paginatedAwards.map(a => (
                    <tr
                      key={a.id}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors border-l-4 border-l-indigo-600"
                    >
                      <td className="p-3 font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                        {a.awardNo}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px] font-bold">
                          RFQ-{a.rfqId}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.supplierName || `Supplier #${a.supplierId}`}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {Number(a.totalAmount ?? 0).toLocaleString()} VND
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700">
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {a.poCode ? (
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/purchase', moduleId: 'M08' } }));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                            title="Nhấp để mở Đơn Hàng Mua M08"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{a.poCode}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={generatingPoId === a.id}
                            onClick={() => handleTriggerGeneratePo(a.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            title="Khởi tạo trực tiếp Đơn Hàng Mua M08 từ hồ sơ trúng thầu"
                          >
                            {generatingPoId === a.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            <span>Khởi tạo M08 PO</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* L4 Pagination */}
          {filteredAwards.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredAwards.length}
                startIndex={startIndex}
                endIndex={Math.min(startIndex + pageSize, filteredAwards.length)}
                onPageChange={setCurrentPage}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Award Approval Form (1 Col) */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Phê Duyệt Trao Thầu (Award Approval)
            </h3>
          </div>

          <form onSubmit={onCreateAward} className="space-y-3.5">
            {/* RFQ Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Chọn Gói RFQ <span className="text-rose-500">*</span>
              </label>
              {rfqs.length > 0 ? (
                <select
                  value={awardRfqId}
                  onChange={e => setAwardRfqId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn Gói RFQ --</option>
                  {rfqs.map(r => (
                    <option key={r.id} value={r.dbId || r.id.replace('RFQ-', '')}>
                      {r.id} - {r.title} ({r.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={awardRfqId}
                  onChange={e => setAwardRfqId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="1"
                  required
                />
              )}
            </div>

            {/* Bid Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Hồ Sơ Chào Giá (Bid) Thắng Thầu <span className="text-rose-500">*</span>
              </label>
              {availableBidsForSelectedRfq.length > 0 ? (
                <select
                  value={awardBidId}
                  onChange={e => handleSelectBid(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn Hồ Sơ Bid Thắng Thầu --</option>
                  {availableBidsForSelectedRfq.map(b => (
                    <option key={b.id} value={b.id}>
                      Bid #{b.id} - {b.supplierName || `Supplier #${b.supplierId}`} ({Number(b.totalValue || 0).toLocaleString()} VND)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={awardBidId}
                  onChange={e => setAwardBidId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="1"
                  required
                />
              )}
            </div>

            {/* Supplier Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Nhà Cung Cấp Thắng Thầu <span className="text-rose-500">*</span>
              </label>
              {suppliers.length > 0 ? (
                <select
                  value={awardSupplierId}
                  onChange={e => setAwardSupplierId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
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
                  value={awardSupplierId}
                  onChange={e => setAwardSupplierId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="1"
                  required
                />
              )}
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Phê duyệt trao thầu sẽ tự động phát sinh sự kiện outbox <code className="font-mono font-bold">SOURCING_AWARD_APPROVED</code> và cho phép khởi tạo Đơn hàng mua M08 PO với đầy đủ phả hệ dòng hàng.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Phê duyệt &amp; Phát hành Trao thầu</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
