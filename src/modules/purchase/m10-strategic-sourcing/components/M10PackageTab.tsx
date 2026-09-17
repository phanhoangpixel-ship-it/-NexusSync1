import React, { useState, useMemo } from 'react';
import { SourcingPackageItem } from './m10Types';
import { Layers, Plus, Search, Filter, RefreshCw, Calendar, DollarSign, Building, FileText, CheckCircle, Clock } from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M10PackageTabProps {
  packages: SourcingPackageItem[];
  loading: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
  onCreatePackage: (e: React.FormEvent) => void;
  pkgTitle: string;
  setPkgTitle: (val: string) => void;
  pkgCategory: string;
  setPkgCategory: (val: string) => void;
  pkgBudget: string;
  setPkgBudget: (val: string) => void;
  pkgCostCenter: string;
  setPkgCostCenter: (val: string) => void;
  pkgDeadline: string;
  setPkgDeadline: (val: string) => void;
  pkgDescription: string;
  setPkgDescription: (val: string) => void;
  onSelectPackageForRfq?: (pkg: SourcingPackageItem) => void;
}

export const M10PackageTab: React.FC<M10PackageTabProps> = ({
  packages,
  loading,
  isSubmitting,
  onRefresh,
  onCreatePackage,
  pkgTitle,
  setPkgTitle,
  pkgCategory,
  setPkgCategory,
  pkgBudget,
  setPkgBudget,
  pkgCostCenter,
  setPkgCostCenter,
  pkgDeadline,
  setPkgDeadline,
  pkgDescription,
  setPkgDescription,
  onSelectPackageForRfq,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filteredPackages = useMemo(() => {
    return packages.filter(p => {
      const matchSearch = (p.packageCode?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (p.costCenter?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [packages, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPackages.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPackages = filteredPackages.slice(startIndex, startIndex + pageSize);

  const categories = ['Direct Materials', 'IT & Technology', 'Logistics', 'MRO & Services', 'CapEx Machinery'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN_BIDDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Đang Mời Thầu</span>;
      case 'EVALUATING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Đang Đánh Giá</span>;
      case 'AWARDED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Đã Trao Thầu</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Đã Hủy</span>;
      case 'DRAFT':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Dự Thảo (DRAFT)</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sourcing Packages Directory (2 Cols) */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gói Thầu Mua Sắm Chiến Lược (Sourcing Packages)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị {filteredPackages.length} / {packages.length} gói thầu mua sắm
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
                  placeholder="Tìm mã PKG, tên gói..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30 w-36 sm:w-44"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="ALL">Tất cả ngành hàng</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Mã Gói Thầu</th>
                  <th className="px-3 py-2.5">Tên Gói Thầu</th>
                  <th className="px-3 py-2.5">Ngành Hàng & Cost Center</th>
                  <th className="px-3 py-2.5 text-right">Ngân Sách Dự Toán</th>
                  <th className="px-3 py-2.5 text-center">RFQ Liên Kết</th>
                  <th className="px-3 py-2.5 text-center">Trạng Thái</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                {paginatedPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                      Chưa có gói thầu mua sắm nào phù hợp tiêu chí.
                    </td>
                  </tr>
                ) : (
                  paginatedPackages.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
                          {pkg.packageCode}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white max-w-xs truncate" title={pkg.title}>
                        <div>{pkg.title}</div>
                        {pkg.submissionDeadline && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Hạn nộp: {new Date(pkg.submissionDeadline).toISOString().split('T')[0]}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{pkg.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{pkg.costCenter}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {Number(pkg.estimatedBudget || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono tabular-nums">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-[11px]">
                          {pkg.rfqCount || 0} RFQ
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {getStatusBadge(pkg.status)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {onSelectPackageForRfq && (
                          <button
                            onClick={() => onSelectPackageForRfq(pkg)}
                            className="px-2 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/80 rounded transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Tạo RFQ cho gói thầu này"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tạo RFQ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={filteredPackages.length}
            />
          </div>
        </div>
      </div>

      {/* Create Sourcing Package Form (1 Col) */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Khởi tạo Gói Thầu Mua Sắm (PKG)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chuẩn hóa mã PKG-YYYY-XXXX & Idempotency Guard
              </p>
            </div>
          </div>

          <form onSubmit={onCreatePackage} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Tên Gói Thầu Mua Sắm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pkgTitle}
                onChange={e => setPkgTitle(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="VD: Mua sắm máy móc sản xuất giai đoạn 2"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Ngành Hàng Mua Sắm (Category)
              </label>
              <select
                value={pkgCategory}
                onChange={e => setPkgCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Ngân Sách Dự Toán (Estimated Budget - VND)
              </label>
              <input
                type="number"
                value={pkgBudget}
                onChange={e => setPkgBudget(e.target.value)}
                className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="VD: 500000000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Trung Tâm Chi Phí (Cost Center)
              </label>
              <input
                type="text"
                value={pkgCostCenter}
                onChange={e => setPkgCostCenter(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="CC-PROCUREMENT"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Hạn Chót Nộp Hồ Sơ Gói Thầu
              </label>
              <input
                type="date"
                value={pkgDeadline}
                onChange={e => setPkgDeadline(e.target.value)}
                className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Ghi Chú & Mô Tả Yêu Cầu Kỹ Thuật
              </label>
              <textarea
                value={pkgDescription}
                onChange={e => setPkgDescription(e.target.value)}
                rows={2}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="Mô tả phạm vi gói thầu, tiêu chuẩn chất lượng..."
              />
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
              Mã chứng từ sẽ tự động sinh theo định dạng <span className="font-mono font-bold">PKG-YYYY-XXXX</span>. Giao dịch được bảo vệ bằng cơ chế <span className="font-bold">Idempotency Key</span> chống tạo trùng lặp.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pkgTitle}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Khởi tạo Gói Thầu (PKG)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
