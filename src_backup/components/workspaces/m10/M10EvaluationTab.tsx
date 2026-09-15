import React, { useState, useMemo } from 'react';
import { EvaluationItem, RFQItem, BidItem } from './m10Types';
import { Award, Search, RefreshCw, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { PaginationControl } from '../../common/PaginationControl';

interface M10EvaluationTabProps {
  evaluations: EvaluationItem[];
  rfqs?: RFQItem[];
  bids?: BidItem[];
  loading: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
  onCreateEvaluation: (e: React.FormEvent) => void;
  evalRfqId: string;
  setEvalRfqId: (val: string) => void;
  evalBidId: string;
  setEvalBidId: (val: string) => void;
  scorePrice: string;
  setScorePrice: (val: string) => void;
  scoreQuality: string;
  setScoreQuality: (val: string) => void;
  scoreDelivery: string;
  setScoreDelivery: (val: string) => void;
  scoreWarranty: string;
  setScoreWarranty: (val: string) => void;
}

export const M10EvaluationTab: React.FC<M10EvaluationTabProps> = ({
  evaluations,
  rfqs = [],
  bids = [],
  loading,
  isSubmitting,
  onRefresh,
  onCreateEvaluation,
  evalRfqId,
  setEvalRfqId,
  evalBidId,
  setEvalBidId,
  scorePrice,
  setScorePrice,
  scoreQuality,
  setScoreQuality,
  scoreDelivery,
  setScoreDelivery,
  scoreWarranty,
  setScoreWarranty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableBidsForRfq = useMemo(() => {
    if (!evalRfqId) return bids;
    return bids.filter(b => String(b.rfqId) === evalRfqId || b.rfqCode === evalRfqId);
  }, [bids, evalRfqId]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      return String(e.id).includes(searchTerm) ||
        String(e.rfqId).includes(searchTerm) ||
        String(e.bidId).includes(searchTerm);
    });
  }, [evaluations, searchTerm]);

  const totalPages = Math.ceil(filteredEvaluations.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvaluations = filteredEvaluations.slice(startIndex, startIndex + pageSize);

  // Live estimated weighted score calculation
  const calculatedEstimatedScore = useMemo(() => {
    const p = (Number(scorePrice) || 0) * 0.40;
    const q = (Number(scoreQuality) || 0) * 0.30;
    const d = (Number(scoreDelivery) || 0) * 0.20;
    const w = (Number(scoreWarranty) || 0) * 0.10;
    return (p + q + d + w).toFixed(2);
  }, [scorePrice, scoreQuality, scoreDelivery, scoreWarranty]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Evaluations Table (2 Cols) */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {/* L1 Command Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hội đồng Chấm thầu (Bid Evaluations)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị {filteredEvaluations.length} / {evaluations.length} kết quả chấm thầu
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
                  placeholder="Tìm RFQ, Bid ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 w-44"
                />
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
                  <th className="p-3">ID Đánh giá</th>
                  <th className="p-3">RFQ ID</th>
                  <th className="p-3">Bid ID</th>
                  <th className="p-3 text-right">Điểm tổng (Server Score)</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {paginatedEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-mono tabular-nums">
                      Chưa có kết quả chấm thầu nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedEvaluations.map(e => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-l-blue-500"
                    >
                      <td className="p-3 font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                        EVAL-{e.id}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px] font-bold">
                          RFQ-{e.rfqId}
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[11px] font-bold">
                          BID-{e.bidId}
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-blue-700 dark:text-blue-300 text-sm">
                        {Number(e.totalScore ?? 0).toFixed(2)} / 100
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700">
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* L4 Pagination */}
          {filteredEvaluations.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredEvaluations.length}
                startIndex={startIndex}
                endIndex={Math.min(startIndex + pageSize, filteredEvaluations.length)}
                onPageChange={setCurrentPage}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Form (1 Col) */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Chấm Điểm &amp; Đánh Giá (Authoritative)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Trọng số: Giá 40%, CL 30%, GH 20%, BH 10%</p>
            </div>
          </div>

          <form onSubmit={onCreateEvaluation} className="space-y-3.5">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Gói thầu RFQ <span className="text-rose-500">*</span>
                </label>
                {rfqs.length > 0 ? (
                  <select
                    value={evalRfqId}
                    onChange={e => {
                      setEvalRfqId(e.target.value);
                      setEvalBidId('');
                    }}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn Gói thầu RFQ --</option>
                    {rfqs.map(r => (
                      <option key={r.id} value={String(r.dbId || r.id)}>
                        {r.id}: {r.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={evalRfqId}
                    onChange={e => setEvalRfqId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-slate-900 dark:text-white"
                    placeholder="Nhập ID RFQ"
                    required
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Hồ sơ Chào giá (Bid) <span className="text-rose-500">*</span>
                </label>
                {availableBidsForRfq.length > 0 ? (
                  <select
                    value={evalBidId}
                    onChange={e => setEvalBidId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn Bid Cần Chấm --</option>
                    {availableBidsForRfq.map(b => (
                      <option key={b.id} value={String(b.dbId || b.id)}>
                        BID-{b.id}: {b.supplierName || 'NCC'} - {Number(b.unitPrice ?? 0).toLocaleString()} VND
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={evalBidId}
                    onChange={e => setEvalBidId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-slate-900 dark:text-white"
                    placeholder="Nhập ID Bid"
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Giá (40%)
                </label>
                <input
                  type="number"
                  value={scorePrice}
                  onChange={e => setScorePrice(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Chất lượng (30%)
                </label>
                <input
                  type="number"
                  value={scoreQuality}
                  onChange={e => setScoreQuality(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Giao hàng (20%)
                </label>
                <input
                  type="number"
                  value={scoreDelivery}
                  onChange={e => setScoreDelivery(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Bảo hành (10%)
                </label>
                <input
                  type="number"
                  value={scoreWarranty}
                  onChange={e => setScoreWarranty(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Điểm dự kiến tạm tính:</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-sm text-blue-700 dark:text-blue-300">
                {calculatedEstimatedScore} / 100
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              <span>Chấm điểm &amp; Lưu kết quả</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
