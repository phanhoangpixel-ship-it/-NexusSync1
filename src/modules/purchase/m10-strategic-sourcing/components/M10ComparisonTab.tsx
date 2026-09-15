import React, { useState, useMemo } from 'react';
import { ComparisonItem, RFQItem } from './m10Types';
import { Scale, Search, Download, Award, Building, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M10ComparisonTabProps {
  comparisonData: ComparisonItem[];
  selectedRfqId: string;
  setSelectedRfqId: (id: string) => void;
  rfqs: RFQItem[];
  onSelectForAward?: (bid: ComparisonItem) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10ComparisonTab: React.FC<M10ComparisonTabProps> = ({
  comparisonData,
  selectedRfqId,
  setSelectedRfqId,
  rfqs,
  onSelectForAward,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = useMemo(() => {
    return comparisonData.filter(c => {
      return (c.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        String(c.bidId).includes(searchTerm);
    });
  }, [comparisonData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Calculated Metrics for the selected RFQ comparison
  const topRanked = useMemo(() => {
    return comparisonData.find(c => c.ranking === 1) || null;
  }, [comparisonData]);

  const lowestPrice = useMemo(() => {
    if (comparisonData.length === 0) return 0;
    return Math.min(...comparisonData.map(c => Number(c.totalValue || 0)));
  }, [comparisonData]);

  const highestScore = useMemo(() => {
    if (comparisonData.length === 0) return 0;
    return Math.max(...comparisonData.map(c => Number(c.totalScore || 0)));
  }, [comparisonData]);

  const handleExportComparisonCSV = () => {
    if (comparisonData.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Vui lòng chọn một gói thầu có dữ liệu chào giá để xuất.');
      return;
    }
    const csvHeader = "Xếp Hạng,Nhà Cung Cấp,Mã Bid,Tổng Giá Trị (VND),Điểm Tổng Hợp (Score),Trạng Thái\n";
    const csvRows = comparisonData.map(c =>
      `"#${c.ranking}","${c.supplierName ?? ''}","BID-${c.bidId}","${c.totalValue ?? 0}","${c.totalScore ?? 0}","${c.evaluationStatus ?? ''}"`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sourcing_comparison_rfq_${selectedRfqId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Đã tải bảng so sánh chào giá về máy.');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 sm:p-6 space-y-4">
      {/* Header & RFQ Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bảng So Sánh Chào Giá &amp; Xếp Hạng (Bid Comparison Matrix)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hệ thống tính toán xếp hạng tự động dựa trên trọng số điểm kỹ thuật &amp; thương mại.
          </p>
        </div>

        {/* RFQ Selector & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Chọn RFQ:</span>
            {rfqs.length > 0 ? (
              <select
                value={selectedRfqId}
                onChange={e => { setSelectedRfqId(e.target.value); setCurrentPage(1); }}
                className="text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/30 max-w-[220px]"
              >
                <option value="">-- Chọn Gói thầu --</option>
                {rfqs.map(r => (
                  <option key={r.id} value={String(r.dbId || r.id)}>
                    {r.id}: {r.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={selectedRfqId}
                onChange={e => { setSelectedRfqId(e.target.value); setCurrentPage(1); }}
                className="w-20 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="ID"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleExportComparisonCSV}
            disabled={comparisonData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Matrix CSV</span>
          </button>
        </div>
      </div>

      {/* Quick RFQ selection pills */}
      {rfqs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            Gói thầu gần đây:
          </span>
          {rfqs.slice(0, 6).map(r => {
            const isSelected = selectedRfqId === String(r.dbId || r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRfqId(String(r.dbId || r.id))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {r.id}: {r.title.slice(0, 20)}...
              </button>
            );
          })}
        </div>
      )}

      {/* Matrix Metric Strip (When RFQ selected) */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ứng viên #1 Xếp hạng</span>
            <p className="font-bold text-xs text-amber-700 dark:text-amber-400 truncate flex items-center gap-1">
              <Award className="w-3.5 h-3.5 shrink-0" />
              {topRanked?.supplierName || '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Giá chào thấp nhất</span>
            <p className="font-mono tabular-nums font-bold text-xs text-emerald-700 dark:text-emerald-400">
              {lowestPrice > 0 ? `${lowestPrice.toLocaleString()} VND` : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Điểm cao nhất</span>
            <p className="font-mono tabular-nums font-bold text-xs text-blue-700 dark:text-blue-400">
              {highestScore > 0 ? `${highestScore.toFixed(2)} / 100` : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Số lượng Bids nộp</span>
            <p className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
              {comparisonData.length} Hồ sơ cạnh tranh
            </p>
          </div>
        </div>
      )}

      {/* Table & Search */}
      <div className="space-y-2">
        {comparisonData.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm nhà cung cấp, mã bid..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 w-56"
              />
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              {filteredData.length} BIDS IN MATRIX
            </span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                <th className="p-3 text-center">Xếp hạng</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3 font-mono tabular-nums">Mã Bid</th>
                <th className="p-3 text-right">Tổng giá trị</th>
                <th className="p-3 text-right">Điểm tổng (Score)</th>
                <th className="p-3">Trạng thái Đánh giá</th>
                {onSelectForAward && <th className="p-3 text-right">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-mono tabular-nums">
                    {selectedRfqId
                      ? 'Không tìm thấy hồ sơ chào giá nào cho RFQ này hoặc theo từ khóa tìm kiếm.'
                      : 'Vui lòng nhập hoặc chọn ID Gói thầu RFQ hợp lệ ở trên để xem ma trận so sánh chào giá.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(c => {
                  const isFirst = c.ranking === 1;
                  return (
                    <tr
                      key={c.bidId}
                      className={`transition-colors duration-150 border-l-4 ${
                        isFirst
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-l-amber-500 hover:bg-amber-50/80 dark:hover:bg-amber-950/40'
                          : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-slate-300 dark:border-l-slate-700'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          isFirst
                            ? 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-2xs'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isFirst ? '🥇 #1' : `#${c.ranking}`}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.supplierName}</span>
                          {isFirst && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                              Đề cử Trao Thầu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-purple-700 dark:text-purple-400 font-bold">
                        BID-{c.bidId}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">
                        {Number(c.totalValue ?? 0).toLocaleString()} VND
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-blue-700 dark:text-blue-300 text-sm">
                        {Number(c.totalScore ?? 0).toFixed(2)} / 100
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700">
                          {c.evaluationStatus || 'SCORED'}
                        </span>
                      </td>
                      {onSelectForAward && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectForAward(c)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chọn Trao thầu</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* L4 Pagination Control */}
        {filteredData.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredData.length}
              startIndex={startIndex}
              endIndex={Math.min(startIndex + pageSize, filteredData.length)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
