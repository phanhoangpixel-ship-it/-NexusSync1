import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Database,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  HardDrive,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialogState } from '../../../../types';
import ConfirmDialog from '../../../../components/common/ConfirmDialog';

export interface ServerBackupItem {
  backupId: string;
  backupName: string;
  scope: string;
  note?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  fileSizeBytes: number;
  itemCounts: {
    configs: number;
    currencies: number;
    sequences: number;
    fiscal: number;
    taxes: number;
    flags: number;
  };
  checksumSha256: string;
  createdAt: string;
  createdBy: string;
}

interface SystemConfigBackupUtilityProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  currentUser?: any;
}

export const SystemConfigBackupUtility: React.FC<SystemConfigBackupUtilityProps> = ({
  isOpen,
  onClose,
  onNotify,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'trigger' | 'history'>('trigger');
  const [backupName, setBackupName] = useState('');
  const [backupNote, setBackupNote] = useState('');
  const [backupScope, setBackupScope] = useState<'FULL' | 'FINANCE_TAX' | 'LOGISTICS_SEQUENCES' | 'FEATURE_FLAGS'>('FULL');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [serverBackups, setServerBackups] = useState<ServerBackupItem[]>([]);
  const [lastCreatedBackup, setLastCreatedBackup] = useState<ServerBackupItem | null>(null);
  
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Initialize backup name with default timestamp
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN');
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setBackupName(`Bản Sao Lưu Cấu Hình Hệ Thống [${dateStr} ${timeStr}]`);
      setBackupNote('');
      fetchServerBackups();
    }
  }, [isOpen]);

  const fetchServerBackups = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/settings/backup/list');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setServerBackups(json.data);
      }
    } catch (err: any) {
      console.error('Lỗi nạp danh sách bản sao lưu server:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopyChecksum = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Rule #19: Confirm before triggering server backup
  const requestTriggerBackup = () => {
    if (!backupName.trim()) {
      onNotify('warning', 'Thiếu Tên Bản Sao Lưu', 'Vui lòng nhập tên nhận diện cho bản sao lưu trên máy chủ.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Kích Hoạt Sao Lưu Cấu Hình Server',
      message: `Hệ thống sẽ tổng hợp toàn bộ tham số, tỷ giá, chuỗi số chứng từ, kỳ kế toán và cờ tính năng (${backupScope}) để đóng gói và lưu trữ an toàn vào máy chủ trung tâm với chữ ký SHA-256. Bạn có muốn tiếp tục?`,
      confirmLabel: 'Kích Hoạt Sao Lưu',
      cancelLabel: 'Bỏ Qua',
      variant: 'primary',
      onConfirm: executeServerBackup,
    });
  };

  const executeServerBackup = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/settings/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupName: backupName.trim(),
          note: backupNote.trim() || 'Sao lưu cấu hình từ bảng điều khiển M03',
          scope: backupScope,
        }),
      });

      const json = await res.json();
      if (json.success && json.backup) {
        setLastCreatedBackup(json.backup);
        onNotify(
          'success',
          'Sao Lưu Máy Chủ Thành Công',
          `Đã tạo bản sao lưu [${json.backup.backupId}] an toàn trên máy chủ.`
        );
        fetchServerBackups();
      } else {
        throw new Error(json.error || 'Máy chủ không phản hồi thành công.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi Sao Lưu Máy Chủ', err.message || 'Không thể hoàn tất sao lưu lên server.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Delete server backup with Rule #19 confirm dialog
  const requestDeleteBackup = (backup: ServerBackupItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Điểm Sao Lưu Trên Máy Chủ',
      message: `CẢNH BÁO: Bạn đang yêu cầu xóa vĩnh viễn bản sao lưu [${backup.backupName}] (${backup.backupId}). Hành động này sẽ được ghi vào sổ kiểm toán bảo mật và không thể hoàn tác. Bạn có chắc chắn?`,
      confirmLabel: 'Xác Nhận Xóa Vĩnh Viễn',
      cancelLabel: 'Bỏ Qua',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/settings/backup/${backup.backupId}`, {
            method: 'DELETE',
          });
          const json = await res.json();
          if (json.success) {
            onNotify('success', 'Đã Xóa Bản Sao Lưu', `Đã xóa điểm sao lưu [${backup.backupId}] khỏi máy chủ.`);
            fetchServerBackups();
            if (lastCreatedBackup?.backupId === backup.backupId) {
              setLastCreatedBackup(null);
            }
          } else {
            throw new Error(json.error || 'Lỗi khi xóa bản sao lưu');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi Xóa Bản Sao Lưu', err.message);
        }
      },
    });
  };

  const handleDownloadBackup = (backupId: string, backupName: string) => {
    const link = document.createElement('a');
    link.href = `/api/settings/backup/download/${backupId}`;
    link.download = `NexusSync_${backupId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Đang Tải Tệp Sao Lưu', `Đang tải tệp tin JSON của bản sao lưu [${backupId}]...`);
  };

  if (!isOpen) return null;

  return (
    <div
      id="system-config-backup-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto"
    >
      <div
        id="system-config-backup-modal-container"
        className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Tiện Ích Sao Lưu Cấu Hình Máy Chủ (Server Backup Utility)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  M03 • SHA-256
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kích hoạt sao lưu toàn diện tham số ERP lên máy chủ trung tâm, quản lý điểm phục hồi và trích xuất snapshot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-all cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('trigger')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'trigger'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Kích Hoạt Sao Lưu Mới</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchServerBackups();
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Kho Bản Sao Lưu Trên Server</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {serverBackups.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'trigger' ? (
            <div className="space-y-6">
              {/* Form trigger section */}
              <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Tên Nhận Diện Bản Sao Lưu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={backupName}
                      onChange={(e) => setBackupName(e.target.value)}
                      placeholder="Nhập tên bản sao lưu..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Phạm Vi Đóng Gói (Backup Scope)
                    </label>
                    <select
                      value={backupScope}
                      onChange={(e) => setBackupScope(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100"
                    >
                      <option value="FULL">TOÀN BỘ (Full ERP Parameters, FX, VAT, Fiscal, Flags)</option>
                      <option value="FINANCE_TAX">TÀI CHÍNH & THUẾ (Currencies, Tax Rates, Fiscal Periods)</option>
                      <option value="LOGISTICS_SEQUENCES">KHO VẬN & CHỨNG TỪ (Doc Sequences, Warehouse Config)</option>
                      <option value="FEATURE_FLAGS">TÍNH NĂNG & THÔNG BÁO (Feature Flags & Templates)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Ghi Chú Lý Do Sao Lưu (Audit Trail Note)
                  </label>
                  <textarea
                    rows={2}
                    value={backupNote}
                    onChange={(e) => setBackupNote(e.target.value)}
                    placeholder="Mô tả mục đích sao lưu: e.g. Trước nâng cấp phần mềm, đóng sổ năm tài chính, kiểm toán độc lập..."
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Pre-flight status card */}
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Vị trí lưu trữ: <strong className="text-indigo-700 dark:text-indigo-300">NexusSync Central Repository (/server/backups)</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      Mã hóa: <strong>AES-256 + SHA-256</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={requestTriggerBackup}
                    disabled={isExecuting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Đóng Gói & Đẩy Lên Máy Chủ...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        <span>Kích Hoạt Sao Lưu Lên Server Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Display Result of Last Created Backup */}
              {lastCreatedBackup && (
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        Bản Sao Lưu Máy Chủ Vừa Tạo Thành Công
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                      {lastCreatedBackup.backupId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-slate-500 text-[11px] block">Tên bản sao:</span>
                      <strong className="text-slate-800 dark:text-slate-100 truncate block">{lastCreatedBackup.backupName}</strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-slate-500 text-[11px] block">Dung lượng:</span>
                      <strong className="text-slate-800 dark:text-slate-100 font-mono block">
                        {formatFileSize(lastCreatedBackup.fileSizeBytes)}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-slate-500 text-[11px] block">Thực thể lưu trữ:</span>
                      <strong className="text-slate-800 dark:text-slate-100 font-mono block">
                        {lastCreatedBackup.itemCounts.configs +
                          lastCreatedBackup.itemCounts.currencies +
                          lastCreatedBackup.itemCounts.sequences +
                          lastCreatedBackup.itemCounts.fiscal +
                          lastCreatedBackup.itemCounts.taxes +
                          lastCreatedBackup.itemCounts.flags}{' '}
                        mục
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-slate-500 text-[11px] block">Thời gian:</span>
                      <strong className="text-slate-800 dark:text-slate-100 font-mono text-[11px] block">
                        {new Date(lastCreatedBackup.createdAt).toLocaleTimeString('vi-VN')}
                      </strong>
                    </div>
                  </div>

                  {/* Checksum display */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900 text-xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <FileCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-500 shrink-0 font-medium">Chữ ký SHA-256:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 truncate text-[11px]">
                        {lastCreatedBackup.checksumSha256}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyChecksum(lastCreatedBackup.checksumSha256)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Sao chép chuỗi SHA-256"
                    >
                      {copiedHash === lastCreatedBackup.checksumSha256 ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Chép
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions for created backup */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadBackup(lastCreatedBackup.backupId, lastCreatedBackup.backupName)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Bản JSON Về Máy Ngay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History of server backups */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Danh Sách Điểm Sao Lưu Trên Máy Chủ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Các snapshot cấu hình được lưu trữ an toàn trong phân vùng máy chủ trung tâm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchServerBackups}
                  disabled={isLoadingHistory}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {serverBackups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                  <Server className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-medium">Chưa có bản sao lưu nào được lưu trên máy chủ.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('trigger')}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Kích hoạt sao lưu đầu tiên
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Mã Bản Sao Lưu</th>
                        <th className="py-2.5 px-3">Tên & Mô Tả</th>
                        <th className="py-2.5 px-3">Phạm Vi</th>
                        <th className="py-2.5 px-3 text-right">Dung Lượng</th>
                        <th className="py-2.5 px-3">Chữ Ký SHA-256</th>
                        <th className="py-2.5 px-3">Thời Gian & Người Tạo</th>
                        <th className="py-2.5 px-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {serverBackups.map((bkp) => (
                        <tr
                          key={bkp.backupId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                            {bkp.backupId}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <strong className="text-slate-800 dark:text-slate-100 block font-semibold">
                              {bkp.backupName}
                            </strong>
                            {bkp.note && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                                {bkp.note}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {bkp.scope}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {formatFileSize(bkp.fileSizeBytes)}
                          </td>
                          <td className="py-2.5 px-3 max-w-[140px]">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                {bkp.checksumSha256.slice(0, 10)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyChecksum(bkp.checksumSha256)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title="Chép mã SHA-256"
                              >
                                {copiedHash === bkp.checksumSha256 ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                            <span className="font-mono text-slate-700 dark:text-slate-300 block">
                              {new Date(bkp.createdAt).toLocaleString('vi-VN')}
                            </span>
                            <span className="text-slate-500 text-[10px] block">Bởi: {bkp.createdBy}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDownloadBackup(bkp.backupId, bkp.backupName)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                                title="Tải tệp JSON của bản sao lưu này"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteBackup(bkp)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Xóa bản sao lưu khỏi máy chủ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Đảm bảo toàn vẹn dữ liệu chuẩn Enterprise ERP (Anti-tamper SHA-256)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Đóng Tiện Ích
          </button>
        </div>
      </div>

      {/* ConfirmDialog strictly obeying Rule #19 */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
