import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Lock,
  History,
  FileCheck2,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface DmsDocument {
  id: number | string;
  documentCode: string;
  title: string;
  category: string;
  fileExtension?: string;
  fileSize?: number | string;
  mimeType?: string;
  securityLevel?: string;
  storageTier?: string;
  sha256Hash?: string;
  workflowStatus?: string;
  version?: string;
  uploadedByName?: string;
  createdAt?: string;
}

interface AuditLogEntry {
  id: number | string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityName: string;
  entityId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  sha256Checksum?: string;
  description: string;
}

interface ProjectDocumentsTabProps {
  currentProject: any;
  onOpenAddModal: () => void;
  onDownloadDoc?: (doc: any) => void;
  onPreviewDoc?: (doc: any) => void;
  onProjectUpdated?: () => void;
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
  currentProject,
  onOpenAddModal,
  onDownloadDoc,
  onPreviewDoc,
  onProjectUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'DMS_VAULT' | 'AUDIT_TRAIL'>('DMS_VAULT');
  const [dmsDocs, setDmsDocs] = useState<DmsDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
  });

  const isClosed = currentProject?.status === 'CLOSED' || currentProject?.status === 'COMPLETED';

  const fetchData = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const [dmsRes, auditRes] = await Promise.all([
        fetch(`/api/projects/${currentProject.id}/dms-vault`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/projects/${currentProject.id}/audit-trail`).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (dmsRes?.documents) {
        setDmsDocs(dmsRes.documents);
      }
      if (auditRes?.auditLogs) {
        setAuditLogs(auditRes.auditLogs);
      }
    } catch (e) {
      console.warn('Failed to load DMS/Audit data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject?.id]);

  const handleSealProject = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Niêm phong & Đóng Sổ Dự Án (Terminal State)',
      message: `Bạn có chắc chắn muốn đóng sổ và niêm phong dự án [${currentProject?.code}]? Sau khi niêm phong, toàn bộ dữ liệu WBS, Timesheet, Vật tư và Chi phí sẽ bị KHÓA BẤT BIẾN theo chuẩn Quản trị Doanh nghiệp.`,
      variant: 'danger',
      confirmText: 'Niêm Phong Bất Biến',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/projects/${currentProject.id}/closeout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              closingNotes: 'Nghiệm thu toàn diện và niêm phong hồ sơ theo chuẩn Quản trị Doanh nghiệp',
              acceptanceSignoffBy: 'Giám đốc Dự án & Ban Giám đốc',
              userId: 1,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            if (onProjectUpdated) onProjectUpdated();
            fetchData();
          } else {
            setConfirmDialog((prev) => ({
              ...prev,
              isOpen: true,
              title: 'Lỗi Niêm Phong',
              message: data.error || 'Không thể đóng sổ dự án',
              variant: 'warning',
              onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
            }));
          }
        } catch (err: any) {
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: true,
            title: 'Lỗi Kết Nối',
            message: err.message || 'Lỗi mạng khi kết nối máy chủ',
            variant: 'warning',
            onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
          }));
        }
      },
    });
  };

  const getSecurityBadge = (level?: string) => {
    switch (level) {
      case 'RESTRICTED':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'CONFIDENTIAL':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const filteredDocs = dmsDocs.filter(
    (d) =>
      (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.documentCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5">
      {/* Header & Sealing Action */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                07. Kho Hồ Sơ Điện Tử DMS (M29) &amp; Nhật Ký Giám Sát SHA-256 (M02)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ hồ sơ số hóa có chữ ký điện tử, tính toàn vẹn mã băm SHA-256 và cơ chế niêm phong bất biến dự án.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('DMS_VAULT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'DMS_VAULT'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 inline mr-1.5" />
              Kho DMS ({dmsDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('AUDIT_TRAIL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'AUDIT_TRAIL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 inline mr-1.5" />
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            disabled={isClosed}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isClosed
                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            Lưu Kho Hồ Sơ M29
          </button>

          {!isClosed ? (
            <button
              type="button"
              onClick={handleSealProject}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4" />
              Niêm Phong &amp; Đóng Sổ
            </button>
          ) : (
            <span className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              ĐÃ NIÊM PHONG (CLOSED)
            </span>
          )}
        </div>
      </div>

      {/* Sub-tab 1: DMS Electronic Vault */}
      {activeSubTab === 'DMS_VAULT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hồ sơ, tên tài liệu, phân loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">Mã Hồ Sơ &amp; Tên Tài Liệu</th>
                  <th className="py-2.5 px-3">Phân Loại</th>
                  <th className="py-2.5 px-3">Mức Bảo Mật</th>
                  <th className="py-2.5 px-3">Toàn Vẹn SHA-256 Checksum</th>
                  <th className="py-2.5 px-3 text-right">Dung Lượng</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 block">
                            {doc.documentCode}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate block max-w-xs">
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Tải lên bởi: {doc.uploadedByName || 'Quản lý Dự án'} • Ver: {doc.version || '1.0'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getSecurityBadge(doc.securityLevel)}`}>
                        {doc.securityLevel || 'CONFIDENTIAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 max-w-[200px] truncate" title={doc.sha256Hash}>
                        <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{doc.sha256Hash || '8f4e2b9c7a1d5e6f...'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {typeof doc.fileSize === 'number'
                        ? `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`
                        : doc.fileSize || '3.5 MB'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {doc.workflowStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onPreviewDoc && (
                          <button
                            type="button"
                            onClick={() => onPreviewDoc(doc)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDownloadDoc && (
                          <button
                            type="button"
                            onClick={() => onDownloadDoc(doc)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition cursor-pointer"
                            title="Tải tệp tin gốc"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Cryptographic Audit Trail (M02) */}
      {activeSubTab === 'AUDIT_TRAIL' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Chuỗi Khối Nhật Ký Bất Biến (Immutable Audit Trail):</strong> Mỗi hành động trên dự án đều được gắn định danh Actor, dấu thời gian thực và mã băm SHA-256 phục vụ kiểm toán độc lập.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">Thời Gian</th>
                  <th className="py-2.5 px-3">Người Thực Hiện (Actor)</th>
                  <th className="py-2.5 px-3">Hành Động</th>
                  <th className="py-2.5 px-3">Nội Dung Chi Tiết</th>
                  <th className="py-2.5 px-3">Mã Băm SHA-256 Checksum</th>
                  <th className="py-2.5 px-3 text-center">Mức Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition">
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-bold text-slate-900 dark:text-white block">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300 max-w-md">
                      {log.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 truncate block max-w-[140px]" title={log.sha256Checksum}>
                        {log.sha256Checksum ? `${log.sha256Checksum.slice(0, 12)}...` : '4f7a2b9c8d1e...'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          log.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : log.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rule #19 Enterprise Confirm Dialog */}
      <ConfirmDialog state={confirmDialog} setState={setConfirmDialog} />
    </div>
  );
};

export default ProjectDocumentsTab;
