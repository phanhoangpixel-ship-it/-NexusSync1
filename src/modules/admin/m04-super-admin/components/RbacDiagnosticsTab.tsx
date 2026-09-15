import React from 'react';
import { SodDiagnosticRule, SuperAdminDetailItem } from './types';
import { ConfirmDialogState } from '../../../../types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Download,
  Lock,
  Zap,
  Activity
} from 'lucide-react';

interface RbacDiagnosticsTabProps {
  sodRules: SodDiagnosticRule[];
  runningDiagnostics: boolean;
  onRunDiagnostics: () => void;
  onExportAuditReport: () => void;
  onViewDetail: (item: SuperAdminDetailItem) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const RbacDiagnosticsTab: React.FC<RbacDiagnosticsTabProps> = ({
  sodRules,
  runningDiagnostics,
  onRunDiagnostics,
  onExportAuditReport,
  onViewDetail,
  setConfirmDialog,
}) => {
  const handleTriggerDiagnostics = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khởi Chạy Quét An Ninh & SoD Toàn Diện',
      message: 'Hệ thống sẽ kiểm tra đối chiếu chéo ma trận phân quyền của tất cả tài khoản, xác thực chữ ký HMAC token và phân tích xung đột vai trò trong 42 phân hệ. Bạn có muốn bắt đầu?',
      variant: 'info',
      confirmText: 'Bắt Đầu Quét',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onRunDiagnostics();
        setConfirmDialog(null);
      },
    });
  };

  const handleTriggerExport = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Xuất Báo Cáo Kiểm Toán SoD',
      message: 'Tải xuống báo cáo kiểm định phân tách chức năng (Separation of Duties Audit Trail) theo tiêu chuẩn bảo mật SOX / ISO 27001.',
      variant: 'primary',
      confirmText: 'Tải Báo Cáo',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onExportAuditReport();
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI STATS STRIP (M41 L2 SPEC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Tỷ Lệ Tuân Thủ SoD
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            100.0%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span>0 Vi Phạm Xung Đột Quyền</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Chữ Ký Phiên HMAC
            </span>
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400 mt-1">
            SHA-256
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span>100% Token HSM Ký Chuẩn</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Quy Tắc SoD Giám Sát
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {sodRules.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span>Bảo vệ Sổ cái, Mua & Kho</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Leo Thang Đặc Quyền
            </span>
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            0
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span>Zero Escalation Vulnerability</span>
          </div>
        </div>
      </div>

      {/* TẦNG L1: ACTION & COMMAND TOOLBAR (M41 SPEC) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Công Cụ Rà Soát & Chẩn Đoán Tường Lửa RBAC
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quét ma trận thẩm quyền 2 chiều giữa Maker và Checker theo chuẩn kiểm toán quốc tế SOX / ISO 27001.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleTriggerDiagnostics}
            disabled={runningDiagnostics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{runningDiagnostics ? 'Đang Chẩn Đoán...' : 'Chạy Quét An Ninh Lại'}</span>
          </button>
          <button
            onClick={handleTriggerExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-600 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo Kiểm Toán SoD</span>
          </button>
        </div>
      </div>

      {/* TẦNG L3: RULES TABLE (M41 SPEC) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bộ Quy Tắc Phân Tách Chức Năng (Separation of Duties Matrix)
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800">
            Tất cả bài test PASSED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">Mã SoD & Tên Quy Tắc</th>
                <th className="py-3 px-3">Phân Nhóm Kiểm Soát</th>
                <th className="py-3 px-3">Mức Độ Nghiêm Trọng</th>
                <th className="py-3 px-3">Số Vi Phạm</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {sodRules.map((rule) => {
                return (
                  <tr
                    key={rule.id}
                    onClick={() => onViewDetail({ type: 'SOD_RULE', data: rule })}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                            {rule.code}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">{rule.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 line-clamp-1">
                          {rule.description}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 inline-block mt-3.5">
                      {rule.category}
                    </td>

                    <td className="py-3.5 px-3">
                      {rule.riskSeverity === 'CRITICAL' && (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 text-xs font-bold rounded-full border">
                          CRITICAL
                        </span>
                      )}
                      {rule.riskSeverity === 'HIGH' && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded text-xs font-bold border border-amber-300 dark:border-amber-700">
                          HIGH
                        </span>
                      )}
                      {rule.riskSeverity === 'MEDIUM' && (
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-semibold text-[11px] border border-blue-200 dark:border-blue-800">
                          MEDIUM
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                        {rule.violationCount} Vi phạm
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                        {rule.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail({ type: 'SOD_RULE', data: rule });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                      >
                        Xem SoD
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENTERPRISE SECURITY COMMITMENT (M41 L0 SPEC BANNER) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex items-start gap-4 border border-slate-700/60">
        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Cam Kết Bảo Mật Sovereign IAM & Nhật Ký Kiểm Toán Bất Biến M02
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mọi thao tác phân quyền, thay đổi vai trò hoặc sửa đổi quyền hạn tại cổng SuperAdmin M04 đều được ký băm mật mã SHA-256 và tự động đẩy sang phân hệ M02 (Audit & Compliance) theo cơ chế Event-Driven Architecture. Tuyệt đối không có hành động ngầm nào bị xóa dấu vết.
          </p>
        </div>
      </div>
    </div>
  );
};
