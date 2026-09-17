import React, { useState, useMemo } from 'react';
import { AuditLogRecord } from './types';
import { INITIAL_AUDIT_LOGS } from './mockData';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  FileCheck2,
  Clock,
  User,
  Globe,
  Tag,
  Key,
} from 'lucide-react';

interface RbacAuditTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const RbacAuditTab: React.FC<RbacAuditTabProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.actorUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.targetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAction = actionFilter === 'ALL' || l.actionType === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã Log', 'Người Thực Hiện', 'Hành Động', 'Đối Tượng', 'Giá Trị Cũ', 'Giá Trị Mới', 'Lý Do', 'IP', 'Thời Gian', 'SHA256 Checksum'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `${l.actorName} (${l.actorUsername})`,
      l.actionType,
      l.targetCode,
      `"${l.oldValue}"`,
      `"${l.newValue}"`,
      `"${l.reason}"`,
      l.ipAddress,
      l.timestamp,
      l.sha256Checksum,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AUDIT_TRAIL_RBAC_M04_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('success', 'Xuất dữ liệu thành công', `Đã xuất ${filteredLogs.length} dòng nhật ký kiểm toán.`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sổ Nhật Ký Kiểm Toán Phân Quyền Bất Biến (Immutable Audit Trail)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Ghi vết 100% mọi thay đổi phân quyền, thăng cấp vai trò, mở khóa tài khoản với mã băm mật mã SHA-256 liên kết M02.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Xuất File CSV Kiểm Toán</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm mã kiểm toán, người thực hiện, đối tượng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">Tất cả loại hành động</option>
              <option value="ROLE_PERM_UPDATE">Cập Nhật Quyền Vai Trò</option>
              <option value="USER_STATUS_CHANGE">Đổi Trạng Thái Người Dùng</option>
              <option value="RLS_POLICY_ENFORCE">Thiết Lập Chính Sách RLS</option>
              <option value="DELEGATION_GRANT">Cấp Ủy Quyền Ký Duyệt</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-36">Mã Bút Toán</th>
                <th className="py-3 px-4 w-44">Người Thực Hiện</th>
                <th className="py-3 px-4 w-40">Hành Động</th>
                <th className="py-3 px-4">Thay Đổi (Trước → Sau)</th>
                <th className="py-3 px-4 w-44">Thời Gian &amp; IP</th>
                <th className="py-3 px-4 w-28 text-center">Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {log.id}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{log.actorUsername}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] inline-block ${
                        log.actionType === 'ROLE_PERM_UPDATE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.actionType === 'USER_STATUS_CHANGE'
                          ? 'bg-amber-100 text-amber-800'
                          : log.actionType === 'RLS_POLICY_ENFORCE'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.actionType}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Target: {log.targetCode}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-400">
                        Cũ: <span className="line-through text-rose-500 font-mono">{log.oldValue}</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        Mới: {log.newValue}
                      </div>
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        Lý do: {log.reason}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Globe className="w-3 h-3" />
                      <span>{log.ipAddress}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                      title={`SHA256: ${log.sha256Checksum}`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      HỢP LỆ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
