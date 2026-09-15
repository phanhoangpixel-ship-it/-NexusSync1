import React, { useState } from 'react';
import { EventSubscriber } from './types';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface EventSubscribersTabProps {
  subscribers: EventSubscriber[];
  onRestartConsumer?: (consumerId: string) => void;
  onResetOffset?: (consumerId: string) => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export const EventSubscribersTab: React.FC<EventSubscribersTabProps> = ({
  subscribers,
  onRestartConsumer,
  onResetOffset,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ConfirmDialog State cho Rule #19
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    action: () => {}
  });

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchSearch =
      searchTerm === '' ||
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || sub.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const totalSubscribers = subscribers.length;
  const healthyCount = subscribers.filter((s) => s.status === 'HEALTHY').length;
  const degradedCount = subscribers.filter((s) => s.status === 'DEGRADED').length;
  const totalLag = subscribers.reduce((acc, s) => acc + (s.lag ?? 0), 0);

  const handleOpenRestartConfirm = (sub: EventSubscriber) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác Nhận Khởi Động Lại Consumer',
      message: `Bạn có chắc chắn muốn gửi lệnh Restart tới dịch vụ Consumer "${sub.name}"? Dịch vụ sẽ tái kết nối và đồng bộ lại offset.`,
      variant: 'warning',
      action: () => {
        if (onRestartConsumer) {
          onRestartConsumer(sub.id);
        } else {
          onNotify('success', 'Đã gửi lệnh Restart', `Consumer ${sub.name} đã được kích hoạt khởi động lại.`);
        }
      }
    });
  };

  const handleOpenResetOffsetConfirm = (sub: EventSubscriber) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác Nhận Đặt Lại Offset (Reset Consumer Lag)',
      message: `Bạn có chắc chắn muốn đặt lại Offset của "${sub.name}" về bản tin mới nhất (LATEST)? Các tin chưa đọc trong Lag (${sub.lag} msgs) có thể bị bỏ qua.`,
      variant: 'danger',
      action: () => {
        if (onResetOffset) {
          onResetOffset(sub.id);
        } else {
          onNotify('info', 'Đã đặt lại Offset', `Offset của ${sub.name} đã được đưa về mốc thời gian hiện tại.`);
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: SUBSCRIBERS HEALTH & PERFORMANCE KPI STRIP                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tổng Số Người Đăng Ký (Consumers)
          </span>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
            {totalSubscribers}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Active Listeners trên Bus
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Trạng Thái Khỏe Mạnh (Healthy)
          </span>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {healthyCount} / {totalSubscribers}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Phản hồi tức thì &lt; 50ms
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chậm Tiến Độ (Degraded / Lagging)
          </span>
          <div className={`font-mono tabular-nums font-bold text-2xl ${
            degradedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          }`}>
            {degradedCount}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {degradedCount > 0 ? 'Có độ trễ xử lý bản tin' : 'Không có Consumer trễ'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tổng Độ Trễ Bản Tin (Consumer Lag)
          </span>
          <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
            {totalLag} msgs
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Tích lũy trên toàn bộ Subscribers
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên Subscriber, topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="HEALTHY">HEALTHY (Khỏe mạnh)</option>
            <option value="DEGRADED">DEGRADED (Chậm trễ)</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Kiểm Tra Lại Healthcheck</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* L3: CONSUMERS MATRIX GRID                                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSubscribers.map((sub) => {
          const isHealthy = sub.status === 'HEALTHY';

          return (
            <div
              key={sub.id}
              className={`p-4.5 rounded-xl bg-white dark:bg-slate-800 border transition-all shadow-2xs space-y-3.5 ${
                isHealthy
                  ? 'border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500'
                  : 'border-amber-300 dark:border-amber-700 border-l-4 border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {sub.id}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      isHealthy
                        ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {sub.name}
                  </h4>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  <Server className="w-4 h-4" />
                </div>
              </div>

              {/* Topic Filter */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                  Topic Subscription Regex:
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                  {sub.topic}
                </span>
              </div>

              {/* Stats & Lag */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Độ Trễ Bản Tin:</span>
                  <span className={`font-mono tabular-nums font-bold ${
                    (sub.lag ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {sub.lag ?? 0} messages
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tình Trạng:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {isHealthy ? 'Sẵn Sàng Tiếp Nhận' : 'Cần Tăng Tốc Xử Lý'}
                  </span>
                </div>
              </div>

              {/* Action Buttons with Rule #19 ConfirmDialog */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenRestartConfirm(sub)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Khởi động lại Pod Consumer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart Consumer</span>
                </button>

                {(sub.lag ?? 0) > 0 && (
                  <button
                    onClick={() => handleOpenResetOffsetConfirm(sub)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/80 dark:hover:bg-amber-900 rounded-lg border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer flex items-center gap-1"
                    title="Đặt lại offset về mốc mới nhất"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Reset Offset</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 COMPLIANCE)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
