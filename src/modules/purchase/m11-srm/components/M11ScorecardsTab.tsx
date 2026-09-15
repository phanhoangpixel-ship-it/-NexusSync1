import React, { useState, useMemo } from 'react';
import { ScorecardItem, SupplierItem } from './m11Types';
import { Award, Search, RefreshCw, Plus, Filter, ArrowUpRight, Star, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M11ScorecardsTabProps {
  scorecards: ScorecardItem[];
  suppliers: SupplierItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectScorecard: (sc: ScorecardItem) => void;
  onOpenNewScorecard: (supplierId?: number) => void;
}

export const M11ScorecardsTab: React.FC<M11ScorecardsTabProps> = ({
  scorecards,
  suppliers,
  loading,
  onRefresh,
  onSelectScorecard,
  onOpenNewScorecard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredScorecards = useMemo(() => {
    return scorecards.filter((sc) => {
      const matchSearch =
        (sc.id && sc.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sc.supplierName && sc.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sc.supplierCode && sc.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sc.period && sc.period.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || sc.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [scorecards, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredScorecards.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedScorecards = filteredScorecards.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SC, Tên NCC, Kỳ đánh giá..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Phân hạng:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ({scorecards.length})</option>
              <option value="EXCELLENT">Xuất sắc (Tier A)</option>
              <option value="GOOD">Đạt chuẩn (Tier B)</option>
              <option value="WARNING">Cần cải thiện (Tier C)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewScorecard()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chấm Điểm Kỳ Mới</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Mục Thẻ Điểm Hiệu Suất Nhà Cung Cấp (Vendor Scorecards)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-bold">
            {filteredScorecards.length} Hồ Sơ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50/80 dark:bg-slate-800/80">
                <th className="py-2.5 px-3.5">Mã Thẻ Điểm</th>
                <th className="py-2.5 px-3.5">Nhà Cung Cấp</th>
                <th className="py-2.5 px-3.5">Kỳ Đánh Giá</th>
                <th className="py-2.5 px-3.5 text-center">Tỷ Lệ OTIF (35%)</th>
                <th className="py-2.5 px-3.5 text-center">Chất Lượng GR (35%)</th>
                <th className="py-2.5 px-3.5 text-center">Tuân Thủ (15%)</th>
                <th className="py-2.5 px-3.5">Xếp Hạng &amp; Phân Hạng</th>
                <th className="py-2.5 px-3.5 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Đang đồng bộ dữ liệu Scorecards từ M09 SRM...</span>
                  </td>
                </tr>
              ) : paginatedScorecards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    Không tìm thấy thẻ điểm nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                paginatedScorecards.map((sc) => {
                  const isExcellent = sc.status === 'EXCELLENT' || (sc.compositeScore && sc.compositeScore >= 90);
                  const isGood = sc.status === 'GOOD' || (sc.compositeScore && sc.compositeScore >= 75 && sc.compositeScore < 90);

                  return (
                    <tr
                      key={sc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => onSelectScorecard(sc)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {sc.id}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {sc.supplierName}
                        </div>
                        {sc.supplierCode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {sc.supplierCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {sc.period || 'Q3/2026'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {sc.otifRate}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {sc.qualityScore}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                        {sc.complianceScore}
                      </td>
                      <td className="py-3 px-3.5 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-slate-900 dark:text-white">
                            {sc.overallRating || '4.5 / 5.0'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                            isExcellent
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isGood
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isExcellent ? 'TIER A (Chiến lược)' : isGood ? 'TIER B (Ưu tiên)' : 'TIER C (Theo dõi)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectScorecard(sc)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          Xem 360°
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        {filteredScorecards.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredScorecards.length}
              startIndex={startIndex}
              endIndex={Math.min(startIndex + pageSize, filteredScorecards.length)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
