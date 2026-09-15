import React, { useState, useMemo } from 'react';
import { SupplierItem } from './m11Types';
import { TrendingUp, CheckCircle2, ShieldCheck, Clock, Search, Filter, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M11PerformanceTabProps {
  suppliers: SupplierItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenScorecardForSupplier: (supplierId: number) => void;
}

export const M11PerformanceTab: React.FC<M11PerformanceTabProps> = ({
  suppliers,
  loading,
  onRefresh,
  onOpenScorecardForSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase());

      const tier = s.performanceTier || 'Tier B (Ưu tiên)';
      const matchTier =
        tierFilter === 'ALL' ||
        (tierFilter === 'TIER_A' && tier.includes('Tier A')) ||
        (tierFilter === 'TIER_B' && tier.includes('Tier B')) ||
        (tierFilter === 'TIER_C' && tier.includes('Tier C'));

      return matchSearch && matchTier;
    });
  }, [suppliers, searchTerm, tierFilter]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* 3 Detailed KPI Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Chỉ Số OTIF (On-Time In-Full)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              Trọng số 35%
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Đo lường chính xác tỷ lệ đơn hàng giao đúng ngày cam kết trên đơn PO (M08) và đủ số lượng theo biên bản nhận hàng nhập kho (M10 Goods Receipt).
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">Ngưỡng đạt chuẩn (SLA):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">&ge; 95.0%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Chất Lượng Kiểm Định GR (IQC)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              Trọng số 35%
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Tỷ lệ hàng hóa đạt tiêu chuẩn kỹ thuật khi kiểm định tại kho (IQC), không phát sinh sự cố trả hàng (Rejections) hay lập biên bản bồi thường thiệt hại.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">Ngưỡng chất lượng tối thiểu:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">&ge; 98.0%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Tuân Thủ Pháp Lý &amp; Điều Khoản</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
              Trọng số 30%
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Mức độ tuân thủ điều khoản hợp đồng khung, cung cấp đầy đủ chứng chỉ CO/CQ, hóa đơn VAT hợp lệ (M16 AP) và thời gian giải quyết sự cố kỹ thuật trong 24h.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">Mục tiêu tuân thủ:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">100% Full CO/CQ</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã hoặc Tên đối tác..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Phân loại đối tác:</span>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ({suppliers.length})</option>
              <option value="TIER_A">Tier A (Chiến lược)</option>
              <option value="TIER_B">Tier B (Ưu tiên)</option>
              <option value="TIER_C">Tier C (Theo dõi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Matrix Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ma Trận Đo Lường Hiệu Suất Vận Hành Theo Từng Đối Tác (Vendor SLA Performance)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
            Real-time Metrics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50/80 dark:bg-slate-800/80">
                <th className="py-2.5 px-3.5">Mã NCC</th>
                <th className="py-2.5 px-3.5">Tên Nhà Cung Cấp</th>
                <th className="py-2.5 px-3.5 text-center">Tỷ Lệ OTIF</th>
                <th className="py-2.5 px-3.5 text-center">Chất Lượng GR</th>
                <th className="py-2.5 px-3.5 text-center">Tuân Thủ Hợp Đồng</th>
                <th className="py-2.5 px-3.5 text-center">Đơn Hàng M08 (PO)</th>
                <th className="py-2.5 px-3.5 text-right">Tổng Chi Tiêu</th>
                <th className="py-2.5 px-3.5 text-center">Phân Hạng SRM</th>
                <th className="py-2.5 px-3.5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    Đang tải ma trận hiệu suất...
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((s) => {
                  const otifVal = parseFloat(s.otifRate || '95');
                  const isTierA = s.performanceTier?.includes('Tier A');
                  const isTierB = s.performanceTier?.includes('Tier B') || !s.performanceTier;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {s.code}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {s.name}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {s.phone || s.email || 'Chưa cập nhật liên hệ'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {otifVal >= 95 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>{s.otifRate || '95.0%'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.qualityScore || '98.5%'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                        {s.complianceScore || '100%'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">{s.poCount || 0} PO</span>
                        <span className="text-[10px] text-slate-400 block">({s.completedPOCount || 0} Hoàn tất)</span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {((s.totalSpend || 0) / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr VND
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                            isTierA
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isTierB
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {s.performanceTier || 'Tier B (Ưu tiên)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenScorecardForSupplier(s.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          + Chấm Điểm
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
        {filteredSuppliers.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredSuppliers.length}
              startIndex={startIndex}
              endIndex={Math.min(startIndex + pageSize, filteredSuppliers.length)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
