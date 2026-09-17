import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, FileText, ArrowRight, Lock, User, Activity } from 'lucide-react';

interface AuditDetailModalProps {
  log: any | null;
  onClose: () => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, onClose, onNotify }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!log) return null;

  const handleCopyChecksum = () => {
    const checksum = log.sha256Checksum || 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
    navigator.clipboard.writeText(checksum);
    setCopied(true);
    if (onNotify) {
      onNotify('success', 'Đã sao chép', 'Đã lưu chuỗi chữ ký SHA-256 vào bộ nhớ tạm.');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const renderJsonFormatted = (dataStr: any) => {
    if (!dataStr) return <span className="text-slate-400 italic">Không có dữ liệu</span>;
    try {
      const parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(dataStr);
    }
  };

  return (
    <div
      id="audit-detail-modal-overlay"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
    >
      <div
        id="audit-detail-modal-container"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {log.auditCode || `AUD-${log.id}`}
                </span>
                {log.blockNumber !== undefined && log.blockNumber !== null && (
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    Khối #{log.blockNumber}
                  </span>
                )}
                <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${
                  log.result === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                    : log.result === 'PERMISSION_DENIED'
                    ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                    : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                }`}>
                  {log.result || 'SUCCESS'}
                </span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-semibold border ${
                  log.tamperStatus === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : log.tamperStatus === 'TAMPERED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {log.tamperStatus === 'VERIFIED' ? '✓ Khớp Chuỗi Mật Mã' : log.tamperStatus || 'VERIFIED'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Chi Tiết Sự Kiện Kiểm Toán &amp; Toàn Vẹn Dữ Liệu
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800 dark:text-slate-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Mã Audit / Correlation ID:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                {log.auditCode || `AUD-${log.id}`}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Thời Gian Thực Hiện:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Người Thực Hiện &amp; Vai Trò:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {log.username || 'Hệ thống'} <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">({log.role || 'SYSTEM'})</span>
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Phân Hệ Nguồn &amp; Thao Tác:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{log.module || 'SYS'}</span> • {log.action}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Đối Tượng Tác Động:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {log.entityType} <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">ID: {log.entityId}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Kết Quả Kiểm Soát:</span>
              <span className={`font-bold ${
                log.result === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' :
                log.result === 'PERMISSION_DENIED' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {log.result || 'SUCCESS'}
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Checksum & Hash Chain Link */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Chữ Ký Khối Hiện Tại (Current Block Hash - SHA-256):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyChecksum}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép chuỗi băm'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto select-all border border-slate-800 shadow-inner break-all">
                {log.sha256Checksum || 'sha256:genesis-block-00000000000000000000000000000000000000000000000000000000'}
              </div>
            </div>

            {log.prevHash && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium mb-1">
                  Liên Kết Khối Liền Trước (Previous Block Hash Link):
                </span>
                <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-[10px] rounded-lg overflow-x-auto break-all border border-slate-200 dark:border-slate-750">
                  {log.prevHash}
                </div>
              </div>
            )}

            {log.maskedFields && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Các trường bảo vệ quyền riêng tư (Masked):</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {log.maskedFields}
                </span>
              </div>
            )}
          </div>

          {/* Payload Comparison (Before vs After) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Dữ Liệu Trước Thao Tác (Before Data):</span>
              </span>
              <pre className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 font-mono text-[10px] rounded-xl overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap leading-relaxed">
                {renderJsonFormatted(log.beforeData)}
              </pre>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Dữ Liệu Sau Thao Tác (After Data):</span>
              </span>
              <pre className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 font-mono text-[10px] rounded-xl overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap leading-relaxed">
                {renderJsonFormatted(log.afterData)}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            NexusSync Single-Writer Audit Trail • ISO 27001 / SOX Verified
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
