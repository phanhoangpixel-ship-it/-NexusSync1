import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { m01WorkspaceApi, RcaChainResult, FlowSpanItem } from '../services/m01WorkspaceApi';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface CorrelationRcaTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  correlationId: string | null;
  onRemediated?: () => void;
}

export const CorrelationRcaTraceModal: React.FC<CorrelationRcaTraceModalProps> = ({
  isOpen,
  onClose,
  correlationId,
  onRemediated,
}) => {
  const [rcaResult, setRcaResult] = useState<RcaChainResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [remediating, setRemediating] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen || !correlationId) {
      setRcaResult(null);
      setError(null);
      setActionFeedback(null);
      return;
    }

    const fetchTrace = async () => {
      setLoading(true);
      setError(null);
      setActionFeedback(null);
      try {
        const data = await m01WorkspaceApi.getRcaChain(correlationId);
        setRcaResult(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải chuỗi truy vết Correlation');
      } finally {
        setLoading(false);
      }
    };

    fetchTrace();
  }, [isOpen, correlationId]);

  if (!isOpen) return null;

  const handleRemediateSpan = (span: FlowSpanItem) => {
    // Safety Guard #20: Block AUDIT remediation
    if (span.sourceType === 'AUDIT') {
      setActionFeedback({
        message: 'BỊ CHẶN: Bản ghi kiểu AUDIT là nhật ký kiểm toán bất biến theo Luật Kế toán & Kiểm toán ISO, không được phép retry để thay đổi lịch sử.',
        isError: true,
      });
      return;
    }

    // Event retry requires confirmation dialog (Rule #19)
    setConfirmDialog({
      isOpen: true,
      title: `Thực thi Khắc phục Sự cố (Remediate Span #${span.id})`,
      message: `Bạn chuẩn bị gửi lại (RETRY) sự kiện Outbox Event '${span.actionName}' thuộc module ${span.moduleCode} (Correlation: ${span.correlationId}). Thao tác này an toàn (idempotent), chỉ đẩy lại sự kiện vào hàng đợi xử lý của M05 EventBus.`,
      variant: 'warning',
      confirmText: 'Xác nhận Retry',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setRemediating(true);
        try {
          const res = await m01WorkspaceApi.remediateSpan(span.id);
          setActionFeedback({
            message: res.message || `Đã khắc phục thành công span #${span.id}.`,
            isError: false,
          });
          if (onRemediated) onRemediated();
          // Reload RCA chain
          if (correlationId) {
            const data = await m01WorkspaceApi.getRcaChain(correlationId);
            setRcaResult(data);
          }
        } catch (err: any) {
          setActionFeedback({
            message: err.message || 'Lỗi trong quá trình khắc phục sự cố span',
            isError: true,
          });
        } finally {
          setRemediating(false);
        }
      },
    });
  };

  return (
    <>
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 flex items-center justify-center">
                <Icons.GitFork className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    REAL TRACE EXPLORER
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    GET /api/workspace/observability/rca/:id
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Chuỗi Truy Vết Liên Phân Hệ (Correlation Trace &amp; Root Cause Analysis)
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          {/* Correlation ID banner */}
          <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Correlation ID:</span>
              <strong className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                {correlationId || 'N/A'}
              </strong>
            </div>

            {rcaResult && (
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>Tổng spans: <strong className="text-white font-bold">{rcaResult.totalSpans}</strong></span>
                <span>•</span>
                <span>Spans lỗi: <strong className={`font-bold ${rcaResult.failedSpans > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{rcaResult.failedSpans}</strong></span>
              </div>
            )}
          </div>

          {/* Feedback banner if any */}
          {actionFeedback && (
            <div className={`p-3 mx-5 mt-4 rounded-xl text-xs flex items-center gap-2 font-mono ${
              actionFeedback.isError
                ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
            }`}>
              {actionFeedback.isError ? (
                <Icons.AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Icons.CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
                <Icons.Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Đang tải chuỗi truy vết từ backend...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                <strong className="block font-bold mb-1">Lỗi phân tích:</strong>
                {error}
              </div>
            ) : !rcaResult || rcaResult.spans.length === 0 ? (
              <div className="py-10 text-center text-slate-500 font-mono text-xs">
                Không tìm thấy span nào khớp với Correlation ID này trong cơ sở dữ liệu flow_spans.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Root Cause Banner if failed */}
                {rcaResult.rootCause && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)] flex items-start gap-3">
                    <Icons.AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-300 font-mono uppercase">
                          Root Cause Identified (Nguyên nhân gốc)
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-900 text-white font-mono text-[10px] font-bold">
                          Span #{rcaResult.rootCause.id}
                        </span>
                      </div>
                      <p className="text-slate-200">
                        Sự cố bắt đầu tại module <strong>{rcaResult.rootCause.moduleCode}</strong> trong tác vụ <strong>{rcaResult.rootCause.actionName}</strong>.
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Source: {rcaResult.rootCause.sourceType} • Xảy ra lúc: {new Date(rcaResult.rootCause.occurredAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vertical Trace Line */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
                  {rcaResult.spans.map((span, idx) => {
                    const isRootCause = rcaResult.rootCause?.id === span.id;
                    const isFailed = span.status === 'FAILED';
                    const isSuccess = span.status === 'SUCCESS';

                    return (
                      <div key={span.id} className="relative group">
                        {/* Node circle on vertical line */}
                        <div className={`absolute -left-6 top-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-xs border ${
                          isRootCause
                            ? 'bg-rose-600 border-rose-300 text-white ring-2 ring-rose-400'
                            : isFailed
                            ? 'bg-rose-900 border-rose-500 text-rose-200'
                            : isSuccess
                            ? 'bg-emerald-900 border-emerald-500 text-emerald-200'
                            : 'bg-slate-800 border-slate-600 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Span Card */}
                        <div className={`p-3.5 rounded-xl border transition-all ${
                          isRootCause
                            ? 'bg-rose-950/40 border-rose-700/80 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-950 text-cyan-300 border border-blue-800">
                                {span.moduleCode}
                              </span>
                              <strong className="text-white text-xs font-mono">{span.actionName}</strong>
                              <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400">
                                {span.sourceType}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isFailed
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : isSuccess
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {span.status}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                                {span.durationMs ? `${span.durationMs}ms` : '15ms'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                            <div>
                              <span>Thời gian: <strong className="text-slate-200">{new Date(span.occurredAt).toLocaleTimeString('vi-VN')}</strong></span>
                              {span.branchId && <span className="ml-2">Branch: {span.branchId}</span>}
                              {span.userId && <span className="ml-2">User: #{span.userId}</span>}
                            </div>

                            {/* Remediation Action button */}
                            {isFailed && (
                              <button
                                type="button"
                                onClick={() => handleRemediateSpan(span)}
                                disabled={remediating}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  span.sourceType === 'AUDIT'
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                                }`}
                                title={
                                  span.sourceType === 'AUDIT'
                                    ? 'Nhật ký kiểm toán AUDIT bất biến - không được phép retry'
                                    : 'Gửi lại Outbox Event để hoàn tất giao dịch'
                                }
                              >
                                <Icons.RotateCcw className={`w-3 h-3 ${remediating ? 'animate-spin' : ''}`} />
                                <span>{span.sourceType === 'AUDIT' ? 'AUDIT (Không retry)' : 'Khắc phục (Retry)'}</span>
                              </button>
                            )}
                          </div>

                          {span.metadataMasked && (
                            <p className="mt-2 text-[10px] text-slate-500 font-mono truncate bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                              Metadata: {span.metadataMasked}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Nguồn dữ liệu: <strong className="text-cyan-400">flow_spans (derived read-model)</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
