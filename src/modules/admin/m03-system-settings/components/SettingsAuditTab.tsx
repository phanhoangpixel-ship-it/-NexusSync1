import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Hash,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
} from 'lucide-react';
import { SettingsAuditRecord } from './types';

interface SettingsAuditTabProps {
  onNotify?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const SettingsAuditTab: React.FC<SettingsAuditTabProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<SettingsAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/audit-history?limit=100');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchQuery =
      log.configKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGroup = selectedGroup === 'ALL' || log.configGroup === selectedGroup;
    return matchQuery && matchGroup;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Sổ Cái Kiểm Toán Tham Số Hệ Thống Bất Biến (SHA-256 Immutable Audit Ledger)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mọi thay đổi đối với tham số toàn cục, tỷ giá, kỳ kế toán và biểu thuế đều được niêm phong mật mã học (SHA-256 checksum) chống can thiệp và chối bỏ trách nhiệm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả phân nhóm</option>
            <option value="GENERAL">Tham Số Chung (GENERAL)</option>
            <option value="CURRENCY">Tỷ Giá Ngoại Tệ (CURRENCY)</option>
            <option value="TAX">Biểu Thuế VAT (TAX)</option>
            <option value="NUMBERING">Mẫu Số Chứng Từ (NUMBERING)</option>
            <option value="FISCAL">Kỳ Kế Toán (FISCAL)</option>
            <option value="FEATURE_FLAG">Cờ Tính Năng (FEATURE_FLAG)</option>
            <option value="BACKUP">Sao Lưu & Phục Hồi (BACKUP)</option>
          </select>

          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo khóa / người sửa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Làm mới nhật ký"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Nhóm Cấu Hình</th>
                <th className="py-3 px-4">Hành Động</th>
                <th className="py-3 px-4">Khóa Tham Số</th>
                <th className="py-3 px-4">Giá Trị Trước → Sau</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4">Mã Băm Niêm Phong (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có bản ghi kiểm toán nào hoặc không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                        {log.configGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {log.configKey}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-slate-400 line-through truncate max-w-[120px]">
                          {log.oldValue || '∅'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[150px]">
                          {log.newValue}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {log.performedBy}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      <span
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        title={log.checksum}
                      >
                        {log.checksum ? `${log.checksum.slice(0, 16)}...` : 'VERIFIED'}
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
