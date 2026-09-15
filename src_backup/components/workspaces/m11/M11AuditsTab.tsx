import React, { useState, useMemo } from 'react';
import { SupplierAuditItem, SupplierItem } from './m11Types';
import { ShieldCheck, Search, Filter, Plus, CheckCircle2, AlertTriangle, XCircle, Clock, Calendar, UserCheck, FileText } from 'lucide-react';
import { PaginationControl } from '../../common/PaginationControl';

interface M11AuditsTabProps {
  audits: SupplierAuditItem[];
  suppliers: SupplierItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenNewAudit: () => void;
  onSelectAudit?: (audit: SupplierAuditItem) => void;
}

export const M11AuditsTab: React.FC<M11AuditsTabProps> = ({
  audits,
  suppliers,
  loading,
  onRefresh,
  onOpenNewAudit,
  onSelectAudit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAuditModal, setSelectedAuditModal] = useState<SupplierAuditItem | null>(null);

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      const matchSearch =
        a.auditCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.leadAuditor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || a.auditType === typeFilter;

      return matchSearch && matchType;
    });
  }, [audits, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredAudits.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAudits = filteredAudits.slice(startIndex, startIndex + pageSize);

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>ĐẠT CHUẨN (PASSED)</span>
          </span>
        );
      case 'PASSED_WITH_CONDITIONS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            <span>ĐẠT CÓ ĐIỀU KIỆN</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            <span>ĐÃ LÊN LỊCH</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Clock className="w-3 h-3" />
            <span>ĐANG THỰC HIỆN</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>KHÔNG ĐẠT (FAILED)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner & Actions */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã đợt, Tên NCC, Chuyên gia..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Loại kiểm toán:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ({audits.length})</option>
              <option value="FACTORY_CAPACITY">Năng lực nhà xưởng</option>
              <option value="ESG_ENVIRONMENT">Tiêu chuẩn ESG &amp; Môi trường</option>
              <option value="QUALITY_ISO">Chất lượng &amp; ISO</option>
              <option value="SECURITY_SLA">An toàn &amp; Bảo mật SLA</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenNewAudit}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Mở Đợt Kiểm Toán Xưởng</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chương Trình Kiểm Toán Xưởng &amp; Đánh Giá Năng Lực NCC (Supplier Audits)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 font-bold">
            {filteredAudits.length} Đợt Kiểm Tra
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50/80 dark:bg-slate-800/80">
                <th className="py-2.5 px-3.5">Mã Đợt Audit</th>
                <th className="py-2.5 px-3.5">Nhà Cung Cấp</th>
                <th className="py-2.5 px-3.5">Loại Kiểm Toán</th>
                <th className="py-2.5 px-3.5">Trưởng Đoàn / Kiểm Toán Viên</th>
                <th className="py-2.5 px-3.5">Ngày Thực Hiện</th>
                <th className="py-2.5 px-3.5 text-center">Điểm Đánh Giá</th>
                <th className="py-2.5 px-3.5 text-center">Vấn Đề Phát Hiện</th>
                <th className="py-2.5 px-3.5 text-center">Kết Luận</th>
                <th className="py-2.5 px-3.5 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    Đang tải danh sách kiểm toán...
                  </td>
                </tr>
              ) : paginatedAudits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                    Không tìm thấy đợt kiểm toán nào.
                  </td>
                </tr>
              ) : (
                paginatedAudits.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAuditModal(a)}
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {a.auditCode}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        {a.supplierName}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {a.supplierCode}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {a.auditType === 'FACTORY_CAPACITY'
                          ? 'Năng lực nhà xưởng'
                          : a.auditType === 'ESG_ENVIRONMENT'
                          ? 'ESG & Môi trường'
                          : a.auditType === 'QUALITY_ISO'
                          ? 'Chất lượng ISO'
                          : 'Bảo mật & SLA'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {a.leadAuditor}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {a.auditDate}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {a.score > 0 ? `${a.score} / 100` : '--'}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      {a.findingsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {a.findingsCount} điểm ({a.criticalIssues} nghiêm trọng)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0 lỗi</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {getResultBadge(a.result)}
                    </td>
                    <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedAuditModal(a)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Biên Bản
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        {filteredAudits.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredAudits.length}
              startIndex={startIndex}
              endIndex={Math.min(startIndex + pageSize, filteredAudits.length)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {selectedAuditModal.auditCode}
                </span>
                <h3 className="text-base font-bold mt-1">{selectedAuditModal.supplierName}</h3>
                <p className="text-xs text-slate-300">{selectedAuditModal.auditType}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Trưởng đoàn kiểm toán</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedAuditModal.leadAuditor}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày thực hiện</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedAuditModal.auditDate}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-200">Kết Luận Thanh Tra &amp; Điểm Số</span>
                  {getResultBadge(selectedAuditModal.result)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-purple-700 dark:text-purple-300">
                    {selectedAuditModal.score}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">/ 100 điểm chuẩn hóa ISO/ESG</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Khuyến nghị &amp; Biện pháp khắc phục (CAPA):</span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedAuditModal.recommendations ||
                    'Nhà xưởng đạt tiêu chuẩn 5S và vận hành máy móc an toàn. Đề nghị bổ sung báo cáo quan trắc môi trường quý tiếp theo và huấn luyện an toàn lao động định kỳ cho nhân công mới.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
