import React, { useState } from 'react';
import { EventBusItem } from './types';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Inbox,
  Search,
  Eye,
  FileCode,
  ShieldAlert,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface EventDlqTabProps {
  events: EventBusItem[];
  onRetryEvent: (eventId: string) => void;
  onRetryAll: () => void;
  onViewDetails: (event: EventBusItem) => void;
  onGoToStream: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export const EventDlqTab: React.FC<EventDlqTabProps> = ({
  events,
  onRetryEvent,
  onRetryAll,
  onViewDetails,
  onGoToStream,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý ConfirmDialog cho Rule #19
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    actionType: 'SINGLE' | 'ALL';
    targetEventId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    actionType: 'SINGLE'
  });

  const dlqEvents = events.filter((e) => e.status === 'DLQ_FAILED');

  const filteredDlqEvents = dlqEvents.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.id.toLowerCase().includes(term) ||
      e.topic.toLowerCase().includes(term) ||
      e.sourceModule.toLowerCase().includes(term) ||
      e.consumer.toLowerCase().includes(term)
    );
  });

  const handleOpenConfirmSingle = (eventId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác Nhận Thử Lại Sự Kiện Lỗi (Retry DLQ)',
      message: `Bạn có chắc chắn muốn đẩy lại sự kiện "${eventId}" vào trục EventBus để các Consumer tiếp nhận lại từ đầu?`,
      variant: 'warning',
      actionType: 'SINGLE',
      targetEventId: eventId
    });
  };

  const handleOpenConfirmAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác Nhận Đẩy Lại Toàn Bộ Sự Kiện DLQ',
      message: `Hành động này sẽ tái kích hoạt toàn bộ ${dlqEvents.length} sự kiện lỗi trong Dead Letter Queue lên trục xử lý chính. Tiếp tục?`,
      variant: 'danger',
      actionType: 'ALL'
    });
  };

  const handleConfirmAction = () => {
    if (confirmConfig.actionType === 'SINGLE' && confirmConfig.targetEventId) {
      onRetryEvent(confirmConfig.targetEventId);
    } else if (confirmConfig.actionType === 'ALL') {
      onRetryAll();
    }
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: DLQ STATUS & HEALTH KPI STRIP                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sự Kiện Lỗi Hàng Đợi (DLQ)
          </span>
          <div className={`font-mono tabular-nums font-bold text-2xl ${
            dlqEvents.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
          }`}>
            {dlqEvents.length}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {dlqEvents.length > 0 ? 'Cần can thiệp khôi phục' : 'Hàng đợi sạch sẽ'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cấp Độ Nghiêm Trọng
          </span>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
            <ShieldAlert className="w-4 h-4" />
            <span>{dlqEvents.length > 0 ? 'Cần Xử Lý (Warning)' : 'An Toàn (Clean)'}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Consumer Rejected Handshake
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Số Lần Thử Lại Tối Đa
          </span>
          <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white">
            3 Lần / Event
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Exponential Backoff Policy
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chính Sách Khắc Phục
          </span>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
            <RotateCcw className="w-4 h-4" />
            <span>Manual &amp; Auto Re-Drive</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Bảo toàn nguyên trạng Payload
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã sự kiện, topic lỗi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {dlqEvents.length > 0 && (
            <button
              onClick={handleOpenConfirmAll}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đẩy Lại Tất Cả DLQ ({dlqEvents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DLQ DATA GRID & EMPTY STATE                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Sách Sự Kiện Rơi Vào Hàng Đợi Lỗi (Dead Letter Queue)
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            {dlqEvents.length} Sự Kiện Chờ Tái Xử Lý
          </span>
        </div>

        {filteredDlqEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Dead Letter Queue Đang Trống
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Không có sự kiện nào bị từ chối hoặc thất bại trong quá trình phân phối. Mọi bản tin EDA đều được xử lý mượt mà.
              </p>
            </div>
            <button
              onClick={onGoToStream}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Xem Dòng Sự Kiện Trực Tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredDlqEvents.map((e) => (
              <div
                key={e.id}
                className="p-4 hover:bg-rose-50/20 dark:hover:bg-rose-950/15 transition-colors border-l-4 border-rose-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                      {e.id}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                      {e.topic}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nguồn: <strong className="text-slate-700 dark:text-slate-300">{e.sourceModule}</strong>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                      Đã Thử Lại {e.retryCount ?? 0} Lần
                    </span>
                  </div>

                  {/* Payload Preview */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 max-h-24 overflow-y-auto">
                    {JSON.stringify(e.payload)}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Thời điểm ghi nhận: {new Date(e.timestamp).toLocaleString('vi-VN')}</span>
                    <span>•</span>
                    <span>Consumer đích: {e.consumer}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onViewDetails(e)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi Tiết</span>
                  </button>

                  <button
                    onClick={() => handleOpenConfirmSingle(e.id)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đẩy Lại (Retry DLQ)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 COMPLIANCE)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
