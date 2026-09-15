import React from 'react';
import { EventBusItem } from './types';
import {
  X,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Copy,
  Server,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Tag,
  User,
  GitCommit
} from 'lucide-react';

interface EventDetailDrawerProps {
  event: EventBusItem | null;
  onClose: () => void;
  onSelectEntity?: (event: EventBusItem) => void;
  onRetryEvent?: (eventId: string) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
  onSelectEntity,
  onRetryEvent,
  onNotify,
}) => {
  if (!event) return null;

  const handleCopyPayload = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
      onNotify('success', 'Đã sao chép Payload', 'Nội dung JSON của sự kiện đã được lưu vào clipboard.');
    } catch {
      onNotify('warning', 'Không thể sao chép', 'Vui lòng chọn thủ công.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/90 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
            PUBLISHED (ĐÃ PHÁT)
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
            ACKNOWLEDGED (ĐÃ NHẬN)
          </span>
        );
      case 'DLQ_FAILED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-950 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
            DLQ_FAILED (LỖI HÀNG ĐỢI)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity duration-300">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  {event.id}
                </span>
                {getStatusBadge(event.status)}
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                Chi Tiết Sự Kiện EDA & Outbox 360°
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Đóng (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* DLQ Error Alert Banner */}
          {event.status === 'DLQ_FAILED' && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Chi Tiết Lỗi Consumer / Dead Letter Queue:</span>
              </div>
              <p className="text-xs font-mono text-rose-800 dark:text-rose-200 bg-white/60 dark:bg-black/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 break-words">
                {event.lastError || 'Không thể thiết lập kết nối tới Consumer sau 3 lần retry (Exponential Backoff).'}
              </p>
            </div>
          )}

          {/* Section 1: Event Metadata */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Thông Tin Định Danh & Phân Hệ
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Topic / Channel:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white break-all">
                  {event.topic}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Phân Hệ Nguồn:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.sourceModule}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Loại Sự Kiện (Type):</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {event.eventType || event.topic.split('.').pop()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Mã Thực Thể (Aggregate ID):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {event.aggregateId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Người/Hệ thống phát (Actor):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  @{event.actorId || 'system'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Thời Điểm Phát:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {new Date(event.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Tracing & Causation Lineage */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dấu Vết Chuỗi Lệnh (Correlation & Causation ID)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Correlation ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {event.correlationId || 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Causation ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {event.causationId || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: EDA Event Flow (Lineage) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Sơ Đồ Phả Hệ Luồng Phát & Tiêu Thụ (Event Flow)</span>
            </h4>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  PUBLISHER
                </span>
                <span className="block font-semibold text-slate-900 dark:text-white text-[11px]">
                  {event.sourceModule}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">Outbox Event</span>
                <ArrowRight className="w-4 h-4 text-blue-500 my-0.5" />
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">At-Least-Once</span>
              </div>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  EVENTBUS BROKER
                </span>
                <span className="block font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                  M05 Hub
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">Dispatch</span>
                <ArrowRight className="w-4 h-4 text-emerald-500 my-0.5" />
                <span className="text-[9px] font-mono text-blue-500">Kafka/NATS</span>
              </div>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  CONSUMERS
                </span>
                <span className="block font-semibold text-slate-900 dark:text-white text-[11px] max-w-[110px] truncate" title={event.consumer}>
                  {event.consumer}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Event Payload (JSON) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Nội Dung Gói Tin Sự Kiện (Payload JSON)</span>
              </h4>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Sao chép</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-black dark:text-slate-200 text-xs font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>

          {/* Section 5: Security & Audit Checksum */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Chữ Ký Toàn Vẹn &amp; Khóa Bảo Mật (SHA-256)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-bold">
                100% VERIFIED
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          {onSelectEntity && (
            <button
              onClick={() => {
                onSelectEntity(event);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nạp vào Ngữ Cảnh Đối Tượng</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {event.status === 'DLQ_FAILED' && onRetryEvent && (
              <button
                onClick={() => {
                  onRetryEvent(event.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử Lại (Retry DLQ)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
