import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { WorkspaceWorkItem } from '../../../../types/workspace';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { m01WorkspaceApi } from '../services/m01WorkspaceApi';

interface EntityPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: WorkspaceWorkItem | null;
  onExecuteAction: (id: string, actionType: string, endpoint: string) => Promise<void>;
  onNavigateToModule: (route: string) => void;
}

interface EntityPreviewData {
  id: string;
  entity: string;
  details?: any;
  items?: any[];
  auditTrail?: any[];
}

export const EntityPreviewDrawer: React.FC<EntityPreviewDrawerProps> = ({
  isOpen,
  onClose,
  workItem,
  onExecuteAction,
  onNavigateToModule,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<EntityPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!isOpen || !workItem) {
      setPreviewData(null);
      setError(null);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const entityParam = workItem.entity || 'GenericDoc';
        const idParam = String(workItem.entityId || workItem.businessReference || workItem.id);
        const data = await m01WorkspaceApi.getEntityPreview(entityParam, idParam);
        setPreviewData(data);
      } catch (err: any) {
        console.error('Error fetching entity preview:', err);
        setError(err.message || 'Lỗi nạp dữ liệu xem trước chứng từ');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [isOpen, workItem]);

  if (!isOpen || !workItem) return null;

  const handleActionClick = (action: { id: string; label: string; endpoint: string; variant?: string }) => {
    const isDestructive = action.variant === 'danger' || action.id.includes('reject');
    setConfirmDialog({
      isOpen: true,
      title: isDestructive ? `Xác nhận từ chối / hủy: ${action.label}` : `Xác nhận thực thi: ${action.label}`,
      message: `Bạn đang thực hiện thao tác "${action.label}" cho chứng từ ${workItem.businessReference || workItem.id}. Thao tác này sẽ ghi log kiểm toán và chuyển tiếp trạng thái xử lý quy trình.`,
      variant: isDestructive ? 'danger' : 'primary',
      confirmText: action.label,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setExecuting(true);
        try {
          await onExecuteAction(workItem.id, action.id, action.endpoint);
          onClose();
        } catch (err: any) {
          console.error('Action failed:', err);
        } finally {
          setExecuting(false);
        }
      }
    });
  };

  return (
    <>
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
              <Icons.FileSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {workItem.sourceModule}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                  workItem.priority === 'URGENT'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : workItem.priority === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  {workItem.priority}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {workItem.businessReference || workItem.id}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* Main Title & Description */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              {workItem.title}
            </h4>
            {workItem.description && (
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {workItem.description}
              </p>
            )}
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 font-mono">
            <div>
              <span className="text-[11px] text-slate-400 font-sans block">Mã chứng từ:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{workItem.businessReference || workItem.id}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-sans block">Thực thể nghiệp vụ:</span>
              <strong className="text-slate-900 dark:text-white">{workItem.entity}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-sans block">Thời hạn xử lý:</span>
              <span className={workItem.isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                {workItem.dueAt ? new Date(workItem.dueAt).toLocaleString('vi-VN') : 'Theo SLA chuẩn'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-sans block mb-1">Trạng thái:</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                workItem.status === 'APPROVED' || workItem.status === 'PROCESSED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : workItem.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  workItem.status === 'APPROVED' || workItem.status === 'PROCESSED'
                    ? 'bg-emerald-500'
                    : workItem.status === 'REJECTED'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`} />
                <span>{workItem.status}</span>
              </span>
            </div>
            {workItem.amount !== undefined && (
              <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-sans block">Giá trị giao dịch:</span>
                <strong className="text-base text-slate-900 dark:text-white font-mono tabular-nums">
                  {workItem.amount.toLocaleString('vi-VN')} {workItem.currency || 'VND'}
                </strong>
              </div>
            )}
          </div>

          {/* Entity preview payload details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Icons.Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Chi tiết phản hồi từ hệ thống (Entity Preview)</span>
              </span>
            </div>

            {loading ? (
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center gap-2 text-slate-400">
                <Icons.Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Đang truy xuất thông tin thực thể...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                {error}
              </div>
            ) : previewData ? (
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] overflow-x-auto space-y-2">
                <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span>API: /api/workspace/entity-preview</span>
                  <span>READ-ONLY</span>
                </div>
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>

          {/* Compliance & Audit Assurance Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
            <Icons.ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đảm bảo toàn vẹn Single-Writer Authority</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                Mọi hành động phê duyệt hoặc chuyển tiếp từ M01 sẽ được điều phối tới service chính thức của phân hệ chủ quản, đảm bảo không vi phạm nguyên tắc ghi dữ liệu kép.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigateToModule(workItem.targetRoute || '/')}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer"
          >
            <Icons.ExternalLink className="w-3.5 h-3.5" />
            <span>Mở phân hệ xử lý</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {workItem.actions && workItem.actions.length > 0 ? (
              workItem.actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  disabled={executing}
                  onClick={() => handleActionClick(act)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-1.5 ${
                    act.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {executing ? (
                    <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : act.variant === 'danger' ? (
                    <Icons.XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{act.label}</span>
                </button>
              ))
            ) : (
              <button
                type="button"
                disabled={executing}
                onClick={() => handleActionClick({ id: 'complete', label: 'Hoàn tất tác vụ', endpoint: `/api/workspace/work-items/${workItem.id}/action` })}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Icons.Check className="w-3.5 h-3.5" />
                <span>Xác nhận xử lý</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
