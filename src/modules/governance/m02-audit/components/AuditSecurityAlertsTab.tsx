import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  Lock,
  User,
  Activity,
  Check,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface AuditSecurityAlertsTabProps {
  logs: any[];
  onOpenDetailModal: (log: any) => void;
  onRequestResolveIncident: (incident: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AuditSecurityAlertsTab: React.FC<AuditSecurityAlertsTabProps> = ({
  logs,
  onOpenDetailModal,
  onRequestResolveIncident,
  onNotify
}) => {
  const alertLogs = logs.filter(l => l.result === 'PERMISSION_DENIED' || l.result === 'FAILED');
  const deniedCount = logs.filter(l => l.result === 'PERMISSION_DENIED').length;
  const failedCount = logs.filter(l => l.result === 'FAILED').length;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Sự Kiện Rủi Ro
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 tabular-nums">
              {alertLogs.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Cảnh báo ghi nhận</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Yêu cầu rà soát bảo mật &amp; phân quyền
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Truy Cập Bị Từ Chối (Denied)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
              {deniedCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Vi phạm chính sách RBAC</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cố gắng thao tác vượt quá quyền hạn
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lỗi Thực Thi / Thất Bại
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 tabular-nums">
              {failedCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Giao dịch bị chặn</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Do validation dữ liệu hoặc xung đột kho/sổ cái
          </p>
        </div>
      </div>

      {/* Security Incidents Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Sách Sự Cố An Toàn Thông Tin &amp; Truy Cập Bất Thường
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Các bản ghi phát sinh lỗi quyền truy cập hoặc thất bại trong giao dịch cần được giám sát viên kiểm tra.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 rounded-md text-[11px] font-bold">
            {alertLogs.length} Cảnh Báo
          </span>
        </div>

        {alertLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Hệ Thống An Toàn Tuyệt Đối
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Không ghi nhận bất kỳ sự cố an toàn thông tin hay vi phạm quyền truy cập nào.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Audit</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Người Dùng</th>
                  <th className="py-3 px-4">Phân Hệ</th>
                  <th className="py-3 px-4">Hành Động Cố Gắng</th>
                  <th className="py-3 px-4">Mức Độ</th>
                  <th className="py-3 px-4 text-right">Xử Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {alertLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/15 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {log.auditCode || `AUD-${log.id}`}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.username || 'unknown'}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {log.role || 'USER'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {log.module || 'SYS'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.action} trên {log.entityType} ({log.entityId})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.result === 'PERMISSION_DENIED'
                          ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                          : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetailModal(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-600"
                        title="Xem chi tiết kỹ thuật"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestResolveIncident(log)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Đánh dấu đã rà soát sự cố (Rule #19 Confirmed)"
                      >
                        <Check className="w-3 h-3" />
                        <span>Đã Xử Lý</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
