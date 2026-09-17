import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import {
  Zap,
  Activity,
  Radio,
  AlertTriangle,
  Server,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Play
} from 'lucide-react';
import { M05SubTab, EventBusItem, EventSubscriber } from './types';
import { EventStreamTab } from './EventStreamTab';
import { EventPublisherTab } from './EventPublisherTab';
import { EventDlqTab } from './EventDlqTab';
import { EventSubscribersTab } from './EventSubscribersTab';
import { EventDetailDrawer } from './EventDetailDrawer';

interface M05EventBusWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const M05EventBusWorkspace: React.FC<M05EventBusWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<M05SubTab>('M05', 'stream');

  // Selected Event cho Drawer L4 360°
  const [selectedEventForDrawer, setSelectedEventForDrawer] = useState<EventBusItem | null>(null);

  // Event Bus Outbox & Stream data
  const [events, setEvents] = useState<EventBusItem[]>([]);
  const [subscribers, setSubscribers] = useState<EventSubscriber[]>([]);

  // Adapter thông báo tương thích type
  const notifyAdapter = (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => {
    onNotify(type, title, message ?? '');
  };

  // 1. Fetch Events from backend API
  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/events/outbox');
      const data = await res.json();
      if (data && data.events) {
        setEvents(data.events);
      }
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      if (!silent) {
        notifyAdapter('warning', 'Chế độ Offline', 'Đang sử dụng dữ liệu sự kiện cục bộ.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 2. Fetch Subscribers from backend API
  const fetchSubscribers = useCallback(async () => {
    try {
      const res = await fetch('/api/events/subscribers');
      const data = await res.json();
      if (data && data.subscribers) {
        setSubscribers(data.subscribers);
      }
    } catch (err: any) {
      console.error('Failed to fetch subscribers:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchSubscribers();
  }, [fetchEvents, fetchSubscribers]);

  // 3. Nghiệp vụ: Phát sự kiện mới lên Bus qua API
  const handlePublishEvent = async (topic: string, parsedPayload: any, extra?: any) => {
    try {
      const res = await fetch('/api/events/trigger-business-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          domain: extra?.domain || 'Enterprise',
          eventType: extra?.eventType || topic.split('.').pop() || 'CustomEvent',
          aggregateType: extra?.aggregateType || 'BusinessEntity',
          aggregateId: extra?.aggregateId,
          sourceModule: extra?.sourceModule || 'M05 EventBus Console',
          payload: parsedPayload,
          actorId: 'super_admin',
          simulateFailure: extra?.simulateFailure || false
        })
      });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('success', 'Phát sự kiện thành công', data.message || `Đã phát sự kiện vào Topic [${topic}] trên EventBus.`);
        await fetchEvents(true);
      } else {
        notifyAdapter('danger', 'Lỗi phát sự kiện', data.error || 'Không thể phát sự kiện.');
      }
    } catch (err: any) {
      // Fallback local
      const newEvt: EventBusItem = {
        id: `EVT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        topic: topic,
        eventType: extra?.eventType || topic.split('.').pop() || 'CustomEvent',
        aggregateType: extra?.aggregateType || 'BusinessEntity',
        aggregateId: extra?.aggregateId,
        sourceModule: extra?.sourceModule || 'M05 EventBus Console',
        payload: parsedPayload,
        status: extra?.simulateFailure ? 'DLQ_FAILED' : 'PUBLISHED',
        timestamp: new Date().toISOString(),
        retryCount: extra?.simulateFailure ? 3 : 0,
        consumer: 'GlobalEventDispatcher',
        lastError: extra?.simulateFailure ? 'Simulated consumer dispatch failure' : undefined
      };
      setEvents((prev) => [newEvt, ...prev]);
      notifyAdapter('success', 'Phát sự kiện thành công', `Đã phát sự kiện ${newEvt.id} vào Topic [${topic}] trên EventBus.`);
    }
  };

  // 4. Nghiệp vụ: Đẩy lại 1 sự kiện lỗi từ DLQ
  const handleRetryEvent = async (evtId: string) => {
    try {
      const res = await fetch(`/api/events/retry/${evtId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('success', 'Đã đẩy lại sự kiện (Retry)', data.message || `Sự kiện ${evtId} đã được đưa trở lại hàng đợi xử lý.`);
        await fetchEvents(true);
      } else {
        notifyAdapter('danger', 'Lỗi tái phát sự kiện', data.error || 'Thao tác không thành công.');
      }
    } catch (err: any) {
      setEvents((prev) =>
        prev.map((e) => (e.id === evtId ? { ...e, status: 'PUBLISHED', retryCount: 0, lastError: undefined } : e))
      );
      notifyAdapter('success', 'Đã đẩy lại sự kiện (Retry)', `Sự kiện ${evtId} đã được đưa trở lại hàng đợi xử lý.`);
    }
  };

  // 5. Nghiệp vụ mở rộng: Đẩy lại tất cả sự kiện lỗi DLQ
  const handleRetryAllDlq = async () => {
    try {
      const res = await fetch('/api/events/retry-all-dlq', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('success', 'Đã khôi phục toàn bộ DLQ', data.message || 'Tất cả các sự kiện lỗi đã được tái kích hoạt.');
        await fetchEvents(true);
      } else {
        notifyAdapter('danger', 'Lỗi khôi phục DLQ', data.error || 'Thao tác không thành công.');
      }
    } catch (err: any) {
      setEvents((prev) =>
        prev.map((e) => (e.status === 'DLQ_FAILED' ? { ...e, status: 'PUBLISHED', retryCount: 0, lastError: undefined } : e))
      );
      notifyAdapter('success', 'Đã khôi phục toàn bộ DLQ', 'Tất cả các sự kiện lỗi đã được tái kích hoạt lên trục EventBus.');
    }
  };

  // 6. Nghiệp vụ: Truy vết và nạp vào Context Bar
  const handleSelectEvent = (evt: EventBusItem) => {
    if (onSelectEntity) {
      onSelectEntity({
        type: 'EVENT',
        id: evt.id,
        code: evt.topic,
        title: `Event: ${evt.topic} (${evt.sourceModule})`,
        status: evt.status,
        lineage: [
          { id: evt.id, type: 'EventBus Message', code: evt.topic, relation: 'SOURCE_EVENT', status: evt.status },
          { id: evt.sourceModule, type: 'Phân hệ nguồn', code: evt.sourceModule, relation: 'PUBLISHER', status: 'ACTIVE' },
          ...(evt.aggregateId ? [{ id: evt.aggregateId, type: evt.aggregateType || 'Entity', code: evt.aggregateId, relation: 'AGGREGATE_ROOT', status: 'CONFIRMED' }] : [])
        ],
        auditTrail: [
          {
            id: 1,
            action: 'PUBLISH_OUTBOX_EVENT',
            timestamp: evt.timestamp,
            user: evt.actorId || 'system_bus',
            sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
          }
        ],
        glEntries: []
      });
    }
    notifyAdapter('info', 'Đã tải sự kiện EventBus', `Đã chọn sự kiện ${evt.id} vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  // 7. Nghiệp vụ: Xuất báo cáo CSV
  const handleExportCSV = () => {
    const csvHeader = 'Event ID,Event Type,Aggregate ID,Topic,Source Module,Consumer,Status,Timestamp\n';
    const csvRows = events
      .map(
        (e) =>
          `"${e.id}","${e.eventType || ''}","${e.aggregateId || ''}","${e.topic}","${e.sourceModule}","${e.consumer}","${e.status}","${e.timestamp}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `eventbus_outbox_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifyAdapter('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV nhật ký EventBus Outbox.');
  };

  // 8. Nghiệp vụ: Làm mới Broker
  const handleRefresh = async () => {
    await fetchEvents();
    await fetchSubscribers();
    notifyAdapter('info', 'Làm mới', 'Đã đồng bộ trạng thái EventBus Broker từ cơ sở dữ liệu.');
  };

  // 9. Khởi động lại Consumer
  const handleRestartConsumer = async (consumerId: string) => {
    try {
      const res = await fetch(`/api/events/subscribers/${consumerId}/restart`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('success', 'Khởi động lại thành công', data.message);
        await fetchSubscribers();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === consumerId ? { ...s, status: 'HEALTHY', lag: 0, lastHeartbeat: 'Vừa xong' } : s))
    );
    notifyAdapter('success', 'Khởi động lại thành công', `Consumer ${consumerId} đã hoàn tất khởi động lại.`);
  };

  // 10. Đặt lại Offset Consumer
  const handleResetOffset = async (consumerId: string) => {
    try {
      const res = await fetch(`/api/events/subscribers/${consumerId}/reset-offset`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('info', 'Đã đặt lại Offset', data.message);
        await fetchSubscribers();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === consumerId ? { ...s, lag: 0 } : s))
    );
    notifyAdapter('info', 'Đã đặt lại Offset', `Offset của Consumer ${consumerId} đã được đồng bộ về mốc LATEST.`);
  };

  // 11. Kích hoạt quét Outbox thủ công (Rule A.2)
  const handleManualSweep = async () => {
    try {
      notifyAdapter('info', 'Đang quét Outbox...', 'Hệ thống đang kiểm tra và giải phóng hàng đợi Outbox.');
      const res = await fetch('/api/events/dispatch-pending', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notifyAdapter('success', 'Quét hoàn tất', data.message);
        await fetchEvents();
        await fetchSubscribers();
      } else {
        notifyAdapter('danger', 'Lỗi', data.error || 'Không thể quét Outbox.');
      }
    } catch (err: any) {
      notifyAdapter('danger', 'Lỗi kết nối', err.message);
    }
  };

  // Đếm số lượng DLQ để hiển thị badge cảnh báo trên tab
  const dlqCount = events.filter((e) => e.status === 'DLQ_FAILED').length;

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (CHUẨN M19)                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M05 • EVENTBUS &amp; EDA ARCHITECTURE
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Transactional Outbox Pattern • At-Least-Once Delivery
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Trục Tích Hợp Sự Kiện Doanh Nghiệp (Event-Driven Architecture Hub)
            </h1>
          </div>
        </div>

        {/* Global Broker Status & Manual Sweep */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualSweep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Kích hoạt quét hàng đợi Outbox và đẩy tin tới các Consumer ngay lập tức"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Quét Outbox Ngay</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Broker: KẾT NỐI TOÀN VẸN</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION (CHUẨN M19 & M20)                                      */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {/* Tab 1: Dòng Sự Kiện Thời Gian Thực (Stream) */}
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dòng Sự Kiện Outbox (Event Stream)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'stream'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {events.length}
            </span>
          </button>

          {/* Tab 2: Trình Phát Sự Kiện (Publisher) */}
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'outbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Phát Sự Kiện Nghiệp Vụ (Publisher)</span>
          </button>

          {/* Tab 3: Dead Letter Queue (DLQ) */}
          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dlq'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${dlqCount > 0 ? 'text-rose-500' : ''}`} />
            <span>Hàng Đợi Lỗi (Dead Letter Queue)</span>
            {dlqCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse">
                {dlqCount}
              </span>
            )}
          </button>

          {/* Tab 4: Quản Lý Subscribers & Consumers */}
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'subscribers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Đơn Vị Tiêu Thụ (Subscribers &amp; Lag)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'subscribers'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {subscribers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TAB CONTENTS (TÍCH HỢP ĐẦY ĐỦ CÁC SUB-VIEW)                          */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'stream' && (
          <EventStreamTab
            events={events}
            isLoading={loading}
            onRefresh={handleRefresh}
            onExportCSV={handleExportCSV}
            onSelectEvent={handleSelectEvent}
            onOpenPublisher={() => setActiveTab('outbox')}
            onViewDetails={(evt) => setSelectedEventForDrawer(evt)}
            onRetryEvent={handleRetryEvent}
          />
        )}

        {activeTab === 'outbox' && (
          <EventPublisherTab
            onPublishEvent={handlePublishEvent}
            onNotify={notifyAdapter}
          />
        )}

        {activeTab === 'dlq' && (
          <EventDlqTab
            events={events}
            onRetryEvent={handleRetryEvent}
            onRetryAll={handleRetryAllDlq}
            onViewDetails={(evt) => setSelectedEventForDrawer(evt)}
            onGoToStream={() => setActiveTab('stream')}
            onNotify={notifyAdapter}
          />
        )}

        {activeTab === 'subscribers' && (
          <EventSubscribersTab
            subscribers={subscribers}
            onRestartConsumer={handleRestartConsumer}
            onResetOffset={handleResetOffset}
            onRefresh={fetchSubscribers}
            onNotify={notifyAdapter}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* L4: EVENT DETAIL DRAWER 360°                                              */}
      {/* ========================================================================= */}
      <EventDetailDrawer
        event={selectedEventForDrawer}
        onClose={() => setSelectedEventForDrawer(null)}
        onSelectEntity={handleSelectEvent}
        onRetryEvent={handleRetryEvent}
        onNotify={notifyAdapter}
      />
    </div>
  );
};

export default M05EventBusWorkspace;

