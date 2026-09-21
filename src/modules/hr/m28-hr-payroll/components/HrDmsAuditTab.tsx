import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  Search,
  RefreshCw,
  Copy,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HrDmsAuditTabProps {
  onOpenSealModal: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const HrDmsAuditTab: React.FC<HrDmsAuditTabProps> = ({
  onOpenSealModal,
  onRefresh,
  onNotify,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/audit-logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching HR audit logs:', err);
      onNotify('danger', 'Lỗi tải nhật ký kiểm toán', 'Không thể kết nối máy chủ Audit M02.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    onNotify('info', 'Đã sao chép SHA-256', 'Mã băm mật mã đã được sao chép vào clipboard.');
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.performedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sha256Hash?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-purple-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>DMS M29 &amp; Sổ Kiểm Toán M02 Bất Biến</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Hồ Sơ Điện Tử &amp; Mã Hóa Chữ Ký Số Nhân Sự</h3>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Mỗi hành động phê duyệt đơn phép, chốt kỳ tính lương và hạch toán sổ cái GL đều được tạo chuỗi băm SHA-256 bất biến, đảm bảo tính toàn vẹn và chống chối bỏ theo chuẩn kiểm toán nội bộ doanh nghiệp.
            </p>
          </div>

          <button
            onClick={onOpenSealModal}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Niêm Phong Hồ Sơ M28</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã log, hành động, chứng từ, người thực hiện..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => {
              fetchAuditLogs();
              onRefresh();
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            title="Tải lại nhật ký"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Mã kiểm toán</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng chứng từ</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Mã băm SHA-256</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Không có bản ghi nhật ký kiểm toán nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {log.id}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-200">
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {log.entityCode}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {log.performedBy}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {log.timestamp}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 max-w-[180px]">
                        <span className="truncate" title={log.sha256Hash}>
                          {log.sha256Hash?.slice(0, 16)}...
                        </span>
                        <button
                          onClick={() => copyHash(log.sha256Hash)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Sao chép toàn bộ mã SHA-256"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SEALED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
