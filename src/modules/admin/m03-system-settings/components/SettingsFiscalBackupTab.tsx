import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Database,
  Clock,
  Sparkles,
  FileCode,
  Server,
} from 'lucide-react';
import { FiscalPeriod } from './types';
import ConfirmDialog, { ConfirmDialogProps } from '../../../../components/common/ConfirmDialog';
import { SystemConfigBackupUtility } from './SystemConfigBackupUtility';

interface SettingsFiscalBackupTabProps {
  onNotify?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  currentUser?: any;
}

export const SettingsFiscalBackupTab: React.FC<SettingsFiscalBackupTabProps> = ({
  onNotify,
  currentUser,
}) => {
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [activeSection, setActiveSection] = useState<'FISCAL' | 'BACKUP'>('FISCAL');

  // Date Check Tester
  const [testDate, setTestDate] = useState('2026-09-15');
  const [testResult, setTestResult] = useState<{ canPost: boolean; message: string; period?: FiscalPeriod } | null>(null);
  const [testingDate, setTestingDate] = useState(false);

  // Backup & Restore
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [serverBackupModalOpen, setServerBackupModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps['dialog'] | null>(null);

  const fetchPeriods = async (year: number) => {
    setLoadingPeriods(true);
    try {
      const res = await fetch(`/api/settings/fiscal-periods?year=${year}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPeriods(json.data);
      }
    } catch (err) {
      console.error('Error fetching fiscal periods:', err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPeriods(fiscalYear);
  }, [fiscalYear]);

  const handleStatusChange = (period: FiscalPeriod, newStatus: 'OPEN' | 'LOCKED' | 'CLOSED') => {
    const isDangerous = newStatus === 'CLOSED';
    setConfirmDialog({
      isOpen: true,
      title: `${newStatus === 'CLOSED' ? 'Đóng Sổ Vĩnh Viễn' : newStatus === 'LOCKED' ? 'Khóa Tạm Thời' : 'Mở Lại'} Kỳ ${period.periodNumber}/${period.fiscalYear}`,
      message: isDangerous
        ? `CẢNH BÁO: Khi Đóng sổ kỳ kế toán ${period.periodNumber}/${period.fiscalYear}, mọi thao tác ghi sổ Nợ/Có (M30), xuất kho (M17), và xuất hóa đơn (M31) thuộc khoảng ngày ${period.startDate} đến ${period.endDate} sẽ bị CẤM TUYỆT ĐỐI. Bạn có chắc chắn?`
        : `Bạn có muốn chuyển trạng thái kỳ ${period.periodNumber}/${period.fiscalYear} sang "${newStatus}"?`,
      confirmLabel: isDangerous ? 'Xác nhận Đóng Sổ' : 'Xác nhận',
      cancelLabel: 'Bỏ qua',
      variant: isDangerous ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/settings/fiscal-periods/${period.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newStatus,
              closedBy: currentUser?.name || 'Administrator',
            }),
          });
          const json = await res.json();
          if (json.success) {
            onNotify?.({
              type: 'success',
              title: 'Cập Nhật Kỳ Kế Toán',
              message: json.message || `Đã chuyển kỳ ${period.periodNumber} sang ${newStatus}.`,
            });
            fetchPeriods(fiscalYear);
          } else {
            throw new Error(json.error || 'Cập nhật thất bại');
          }
        } catch (err: any) {
          onNotify?.({
            type: 'error',
            title: 'Lỗi Cập Nhật Kỳ Kế Toán',
            message: err.message,
          });
        }
      },
    });
  };

  const handleTestDateCheck = async () => {
    if (!testDate) return;
    setTestingDate(true);
    try {
      const res = await fetch(`/api/settings/fiscal-periods/check-open?date=${testDate}`);
      const json = await res.json();
      if (json.success) {
        setTestResult(json.data);
      } else {
        throw new Error(json.error || 'Kiểm tra thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Kiểm Tra',
        message: err.message,
      });
    } finally {
      setTestingDate(false);
    }
  };

  const handleDownloadSnapshot = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/settings/backup/snapshot');
      const json = await res.json();
      if (json.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `nexussync_settings_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        onNotify?.({
          type: 'success',
          title: 'Xuất Sao Lưu Thành Công',
          message: 'Bản sao lưu cấu hình toàn hệ thống đã được tải về máy.',
        });
      } else {
        throw new Error(json.error || 'Tải sao lưu thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Sao Lưu',
        message: err.message,
      });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleRestoreSubmit = () => {
    if (!restoreJson.trim()) {
      onNotify?.({
        type: 'warning',
        title: 'Chưa Nhập Dữ Liệu',
        message: 'Vui lòng dán nội dung JSON bản sao lưu hợp lệ.',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Khôi Phục Cấu Hình Từ Bản Sao Lưu',
      message: 'CẢNH BÁO NGUY HIỂM: Quá trình khôi phục sẽ ghi đè toàn bộ tham số cấu hình, tỷ giá, mẫu số và kỳ kế toán hiện tại. Thao tác này sẽ được ghi vào Sổ cái Kiểm toán SHA-256 bất biến. Bạn có chắc chắn muốn tiến hành?',
      confirmLabel: 'Xác nhận Khôi Phục',
      cancelLabel: 'Hủy bỏ',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const parsed = JSON.parse(restoreJson);
          const res = await fetch('/api/settings/backup/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              snapshot: parsed,
              restoredBy: currentUser?.name || 'Administrator',
            }),
          });
          const json = await res.json();
          if (json.success) {
            onNotify?.({
              type: 'success',
              title: 'Khôi Phục Thành Công',
              message: json.message || 'Đã phục hồi cấu hình hệ thống từ bản sao lưu.',
            });
            setRestoreModalOpen(false);
            setRestoreJson('');
            fetchPeriods(fiscalYear);
          } else {
            throw new Error(json.error || 'Khôi phục thất bại');
          }
        } catch (err: any) {
          onNotify?.({
            type: 'error',
            title: 'Lỗi Khôi Phục',
            message: err.message || 'Dữ liệu JSON không đúng định dạng.',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION SELECTOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('FISCAL')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'FISCAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kỳ Kế Toán & Khóa Sổ Tài Chính (Fiscal Period Control)</span>
          </button>
          <button
            onClick={() => setActiveSection('BACKUP')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'BACKUP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sao Lưu & Phục Hồi Tham Số (Backup & Disaster Recovery)</span>
          </button>
        </div>

        {activeSection === 'FISCAL' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Năm tài chính:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSnapshot}
              disabled={downloadingBackup}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Bản Snapshot (.json)</span>
            </button>
            <button
              onClick={() => setRestoreModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Phục Hồi Cấu Hình</span>
            </button>
          </div>
        )}
      </div>

      {/* FISCAL PERIODS SECTION */}
      {activeSection === 'FISCAL' && (
        <div className="space-y-6">
          {/* REAL-TIME POSTING DATE VALIDATION TESTER */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Công Cụ Kiểm Tra Quyền Ghi Sổ Chứng Từ (Posting Date Guard Tester)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Nhập ngày phát sinh chứng từ để kiểm tra xem kỳ kế toán tương ứng có đang mở để cho phép hạch toán hay không.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTestDateCheck}
                disabled={testingDate}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Kiểm Tra
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
                testResult.canPost
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.canPost ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-semibold">{testResult.message}</span>
                {testResult.period && (
                  <span className="font-mono text-[11px] opacity-80">
                    (Kỳ {testResult.period.periodNumber}: {testResult.period.startDate} → {testResult.period.endDate})
                  </span>
                )}
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-xs hover:underline font-semibold"
              >
                Đóng
              </button>
            </div>
          )}

          {/* FISCAL PERIODS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Danh Sách 12 Kỳ Kế Toán Năm {fiscalYear}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kiểm soát khóa sổ tài chính ngăn chặn ghi đè số liệu lịch sử sau khi lập báo cáo tài chính định kỳ (M30/M34).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Kỳ Kế Toán</th>
                    <th className="py-3 px-4">Ngày Bắt Đầu</th>
                    <th className="py-3 px-4">Ngày Kết Thúc</th>
                    <th className="py-3 px-4 text-center">Trạng Thái Sổ Sách</th>
                    <th className="py-3 px-4">Người Đóng Sổ</th>
                    <th className="py-3 px-4">Thời Gian Đóng</th>
                    <th className="py-3 px-4 text-right">Hành Động Khóa / Mở Sổ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {periods.map((p) => {
                    const isOpen = p.status === 'OPEN';
                    const isLocked = p.status === 'LOCKED';
                    const isClosed = p.status === 'CLOSED';

                    return (
                      <tr
                        key={p.periodNumber}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                            Tháng {p.periodNumber} / {p.fiscalYear}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {p.startDate}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {p.endDate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                : isLocked
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <Unlock className="w-3 h-3" /> Đang Mở Ghi Sổ
                              </>
                            ) : isLocked ? (
                              <>
                                <Lock className="w-3 h-3" /> Khóa Tạm Thời
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3 h-3" /> Đã Đóng Sổ Vĩnh Viễn
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {p.closedBy || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {p.closedAt ? new Date(p.closedAt).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {isOpen && (
                            <>
                              <button
                                onClick={() => handleStatusChange(p, 'LOCKED')}
                                className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded transition-colors"
                              >
                                Khóa Tạm
                              </button>
                              <button
                                onClick={() => handleStatusChange(p, 'CLOSED')}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded transition-colors"
                              >
                                Đóng Sổ
                              </button>
                            </>
                          )}
                          {isLocked && (
                            <>
                              <button
                                onClick={() => handleStatusChange(p, 'OPEN')}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded transition-colors"
                              >
                                Mở Lại Sổ
                              </button>
                              <button
                                onClick={() => handleStatusChange(p, 'CLOSED')}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded transition-colors"
                              >
                                Đóng Sổ
                              </button>
                            </>
                          )}
                          {isClosed && (
                            <button
                              onClick={() => handleStatusChange(p, 'OPEN')}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                            >
                              Mở Lại Kỳ (CFO Reopen)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BACKUP & RESTORE SECTION */}
      {activeSection === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BACKUP CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Xuất Sao Lưu Cấu Hình Toàn Hệ Thống (JSON Snapshot)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tải về bản snapshot chứa tất cả tham số toàn cục, tỷ giá ngoại tệ, mẫu số chứng từ, biểu thuế và kỳ kế toán.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Trạng thái bảo vệ:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn mã hóa SHA-256
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lịch sao lưu tự động:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">00:00 Hàng ngày (Daily)</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleDownloadSnapshot}
                disabled={downloadingBackup}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Xuống Tệp JSON Bản Sao Lưu Ngay</span>
              </button>
              <button
                type="button"
                onClick={() => setServerBackupModalOpen(true)}
                className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Server className="w-4 h-4" />
                <span>Mở Tiện Ích Sao Lưu Máy Chủ (Server Backup Utility)</span>
              </button>
            </div>
          </div>

          {/* RESTORE CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Phục Hồi Cấu Hình Hệ Thống (Snapshot Restore)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nạp lại cấu hình tham số từ tệp sao lưu JSON đã xuất trước đó khi có sự cố môi trường.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Lưu Ý Bảo Mật Cấp Cao
              </div>
              <p className="text-[11px] leading-relaxed">
                Quá trình này sẽ khôi phục lại các tham số và biểu thuế. Thao tác được phân quyền riêng cho Quản trị viên Tối cao và được ghi nhận vào Nhật ký Kiểm toán SHA-256.
              </p>
            </div>

            <button
              onClick={() => setRestoreModalOpen(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Mở Hộp Thoại Nạp Dữ Liệu Phục Hồi</span>
            </button>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-rose-500" />
              Phục Hồi Cấu Hình Hệ Thống Từ Dữ Liệu JSON
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dán nội dung JSON của bản sao lưu vào đây:
              </label>
              <textarea
                rows={10}
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                placeholder='{ "exportTimestamp": "...", "system_configs": [...], "currencies": [...] }'
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRestoreSubmit}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Tiến Hành Phục Hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVER BACKUP UTILITY MODAL */}
      <SystemConfigBackupUtility
        isOpen={serverBackupModalOpen}
        onClose={() => setServerBackupModalOpen(false)}
        onNotify={(type, title, message) =>
          onNotify?.({
            type: type === 'danger' ? 'error' : type,
            title,
            message,
          })
        }
        currentUser={currentUser}
      />

      {/* CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
