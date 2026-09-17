import React, { useState, useMemo } from 'react';
import { RFQItem, MasterProductOption, SourcingPackageItem } from './m10Types';
import { Layers, Search, Filter, RefreshCw, Send, Plus, Trash2, Eye, Calendar, Tag, Users, Zap } from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M10RfqTabProps {
  rfqs: RFQItem[];
  products?: MasterProductOption[];
  packages?: SourcingPackageItem[];
  suppliers?: Array<{ id: number; code: string; name: string; isEligible?: boolean; ineligibilityReason?: string; performanceTier?: string }>;
  loading: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
  onSelectRfq: (rfq: RFQItem) => void;
  onCancelRfq: (rfqId: string) => void;
  onOpenReverseAuction?: (rfq: RFQItem) => void;
  onCreateRfq: (e: React.FormEvent) => void;
  newRfqTitle: string;
  setNewRfqTitle: (val: string) => void;
  newRfqPackageId: string;
  setNewRfqPackageId: (val: string) => void;
  newRfqDeadline: string;
  setNewRfqDeadline: (val: string) => void;
  newRfqProductId: string;
  setNewRfqProductId: (val: string) => void;
  newRfqQuantity: string;
  setNewRfqQuantity: (val: string) => void;
  selectedSuppliersToInvite: number[];
  setSelectedSuppliersToInvite: React.Dispatch<React.SetStateAction<number[]>>;
}

export const M10RfqTab: React.FC<M10RfqTabProps> = ({
  rfqs,
  products = [],
  packages = [],
  suppliers = [],
  loading,
  isSubmitting,
  onRefresh,
  onSelectRfq,
  onCancelRfq,
  onOpenReverseAuction,
  onCreateRfq,
  newRfqTitle,
  setNewRfqTitle,
  newRfqPackageId,
  setNewRfqPackageId,
  newRfqDeadline,
  setNewRfqDeadline,
  newRfqProductId,
  setNewRfqProductId,
  newRfqQuantity,
  setNewRfqQuantity,
  selectedSuppliersToInvite,
  setSelectedSuppliersToInvite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRfqs = useMemo(() => {
    return rfqs.filter(r => {
      const matchSearch = (r.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (r.packageCode?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (r.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRfqs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRfqs = filteredRfqs.slice(startIndex, startIndex + pageSize);

  const toggleSupplierSelection = (id: number) => {
    setSelectedSuppliersToInvite(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* RFQ Directory (2 Cols) */}
      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          {/* L1 Command Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Danh mục Yêu Cầu Báo Giá Thầu (RFQ Engine)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hiển thị {filteredRfqs.length} / {rfqs.length} RFQ (Chuẩn hóa RFQ-YYYY-XXXX)
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
                  placeholder="Tìm mã RFQ, PKG, tiêu đề..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30 w-36 sm:w-48"
                />
              </div>

              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="OPEN_BIDDING">Đang chào giá</option>
                  <option value="EVALUATING">Đang chấm điểm</option>
                  <option value="AWARDED">Đã trao thầu</option>
                  <option value="CLOSED">Đã đóng thầu</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* L2 Data Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider font-mono">
                  <th className="p-3">Mã RFQ</th>
                  <th className="p-3">Gói Thầu & Tiêu Đề</th>
                  <th className="p-3">Hạn chót</th>
                  <th className="p-3 text-center">Hồ Sơ Bids</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {paginatedRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-mono tabular-nums">
                      Không tìm thấy yêu cầu báo giá RFQ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedRfqs.map(r => {
                    const isOpen = r.status === 'OPEN_BIDDING';
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 ${
                          isOpen ? 'border-l-emerald-500' : 'border-l-slate-400'
                        }`}
                      >
                        <td className="p-3 font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                          {r.id}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {r.packageCode && (
                              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                {r.packageCode}
                              </span>
                            )}
                            {r.category && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                                <Tag className="w-3 h-3 text-slate-400" />
                                {r.category}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {r.deadline || '—'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums">
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {r.bidsCount ?? 0} Bids
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                              Vòng {r.currentRound || 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold border ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                              : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {onOpenReverseAuction && (
                            <button
                              type="button"
                              onClick={() => onOpenReverseAuction(r)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-200 rounded-lg text-xs font-bold transition-all border border-amber-300 dark:border-amber-700 inline-flex items-center gap-1 cursor-pointer"
                              title="Đấu thầu ngược & Lịch sử giảm giá đa vòng"
                            >
                              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Vòng {r.currentRound || 1}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectRfq(r)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-200 rounded-lg text-xs font-bold transition-all border border-purple-300 dark:border-purple-700 inline-flex items-center gap-1 cursor-pointer"
                            title="Xem chi tiết & Mời thầu"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCancelRfq(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center cursor-pointer"
                            title="Huỷ RFQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* L3 Pagination Control */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={filteredRfqs.length}
            />
          </div>
        </div>
      </div>

      {/* Create RFQ Form (1 Col) */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Khởi tạo Yêu cầu Báo giá (RFQ)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tự sinh mã RFQ-YYYY-XXXX & Multi-Supplier Engine
              </p>
            </div>
          </div>

          <form onSubmit={onCreateRfq} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Tiêu đề Yêu cầu Báo giá <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newRfqTitle}
                onChange={e => setNewRfqTitle(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="VD: Chào giá cung ứng thép cuộn Q3"
                required
              />
            </div>

            {/* Sourcing Package Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Gắn với Gói Thầu Mua Sắm (Sourcing Package)
              </label>
              <select
                value={newRfqPackageId}
                onChange={e => setNewRfqPackageId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
              >
                <option value="">-- Không gắn gói thầu (Độc lập) --</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    [{pkg.packageCode}] {pkg.title} ({pkg.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Hạn chót nộp hồ sơ
              </label>
              <input
                type="date"
                value={newRfqDeadline}
                onChange={e => setNewRfqDeadline(e.target.value)}
                className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Sản phẩm Mục tiêu (Item Master)
              </label>
              {products.length > 0 ? (
                <select
                  value={newRfqProductId}
                  onChange={e => setNewRfqProductId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                >
                  <option value="">-- Gói thầu tổng hợp (Không chọn cụ thể) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={newRfqProductId}
                  onChange={e => setNewRfqProductId(e.target.value)}
                  className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                  placeholder="ID sản phẩm từ Item Master"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Số lượng mục tiêu
              </label>
              <input
                type="number"
                value={newRfqQuantity}
                onChange={e => setNewRfqQuantity(e.target.value)}
                className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                placeholder="VD: 500"
              />
            </div>

            {/* Multi-Supplier Invitation Option */}
            {suppliers.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    Mời Ngay Các Nhà Cung Cấp Đạt Chuẩn M09
                  </span>
                  <span className="font-mono text-[10px] text-purple-600 font-bold">
                    Đã chọn: {selectedSuppliersToInvite.length}
                  </span>
                </label>
                <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                  {suppliers.map(sup => {
                    const isEligible = sup.isEligible !== false;
                    const isSelected = selectedSuppliersToInvite.includes(sup.id);
                    return (
                      <label 
                        key={sup.id} 
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                          !isEligible 
                            ? 'opacity-50 cursor-not-allowed bg-rose-50/50 dark:bg-rose-950/20' 
                            : isSelected 
                              ? 'bg-purple-100/70 dark:bg-purple-950/60 font-semibold' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!isEligible}
                          checked={isSelected}
                          onChange={() => toggleSupplierSelection(sup.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="truncate grow">
                          {isEligible ? '✓ ' : '⛔ '}
                          {sup.name} ({sup.code})
                          {!isEligible && ` [${sup.ineligibilityReason || 'Không đủ ĐK'}]`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] text-purple-900 dark:text-purple-200 leading-relaxed">
              Mã chứng từ sẽ tự động sinh theo định dạng <span className="font-mono font-bold">RFQ-YYYY-XXXX</span>. Hệ thống kích hoạt bộ lọc kiểm tra <span className="font-bold">idempotencyKey</span> chống lặp giao dịch.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newRfqTitle}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Phát hành RFQ Đa Nhà Cung Cấp</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
