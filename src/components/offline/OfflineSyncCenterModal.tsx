import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { offlineSyncService, QueuedOfflineRequest, SyncAuditItem } from '../../services/offlineSyncService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Eye,
  Activity,
  Play,
  Server,
  Database,
  ArrowUpRight,
  Clock,
  Code
} from 'lucide-react';

interface OfflineSyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const OfflineSyncCenterModal: React.FC<OfflineSyncCenterModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  const {
    isOnline,
    isSyncing,
    queueCount,
    pendingItems,
    lastSyncedAt,
    syncNow,
    retryItem,
    deleteItem,
    purgeQueue,
    getAuditHistory,
    clearAuditHistory,
    checkConnectivity
  } = useOfflineSync();

  const [activeTab, setActiveTab] = useState<'pending' | 'audit'>('pending');
  const [auditList, setAuditList] = useState<SyncAuditItem[]>([]);
  const [selectedPayload, setSelectedPayload] = useState<{ title: string; json: string } | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [swActive, setSwActive] = useState(false);

  // Confirm dialog state for Rule #19 compliance
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Load audit history
  const loadAudit = async () => {
    const list = await getAuditHistory();
    setAuditList(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadAudit();
      testPing();
      setSwActive(typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !!navigator.serviceWorker.controller);
    }
  }, [isOpen]);

  const testPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const ok = await checkConnectivity();
      const duration = Math.round(performance.now() - start);
      setPingLatency(ok ? duration : null);
    } catch {
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDialog?.isOpen && !selectedPayload) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmDialog, selectedPayload, onClose]);

  if (!isOpen) return null;

  const handleSyncClick = async () => {
    try {
      const result = await syncNow();
      await loadAudit();
      if (onNotify) {
        if (result.replayed > 0) {
          onNotify(`Đã phát lại thành công ${result.replayed} yêu cầu lên máy chủ ERP!`, 'success');
        } else if (result.failed > 0) {
          onNotify(`Có ${result.failed} yêu cầu chưa thể phát lại, đã lưu vào hàng đợi lỗi.`, 'warning');
        } else {
          onNotify('Hàng đợi trống hoặc không có yêu cầu cần phát lại.', 'info');
        }
      }
    } catch (err: any) {
      if (onNotify) onNotify(err?.message || 'Lỗi khi phát lại hàng đợi', 'error');
    }
  };

  // Test action: Simulates a real offline transaction
  const handleSimulateOfflineAction = async () => {
    try {
      const mockPayload = {
        orderNumber: `SO-OFFLINE-${Date.now().toString().slice(-4)}`,
        customerId: 'CUST-001',
        totalAmount: 15400000,
        warehouseId: 'WH-MAIN',
        notes: 'Đơn hàng được lập trong trạng thái mất kết nối mạng',
        createdAt: new Date().toISOString()
      };

      await offlineSyncService.enqueueRequest(
        '/api/sales/orders',
        'POST',
        { 'Content-Type': 'application/json' },
        mockPayload
      );

      if (onNotify) {
        onNotify('Đã tạo một giao dịch đơn hàng mẫu lưu vào hàng đợi offline IndexedDB!', 'success');
      }
    } catch (e: any) {
      if (onNotify) onNotify('Không thể tạo yêu cầu mẫu: ' + e?.message, 'error');
    }
  };

  const handlePurgeAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xoá toàn bộ hàng đợi ngoại tuyến',
      message: 'Hành động này sẽ huỷ bỏ tất cả các yêu cầu đang chờ phát lại trên thiết bị. Dữ liệu chưa đồng bộ lên máy chủ sẽ bị mất vĩnh viễn.',
      variant: 'danger',
      onConfirm: async () => {
        await purgeQueue();
        setConfirmDialog(null);
        if (onNotify) onNotify('Đã xoá sạch hàng đợi ngoại tuyến.', 'info');
      }
    });
  };

  const handleDeleteSingle = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xoá yêu cầu khỏi hàng đợi',
      message: `Bạn có chắc muốn xoá yêu cầu "${name}"? Thao tác này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: async () => {
        await deleteItem(id);
        setConfirmDialog(null);
        if (onNotify) onNotify('Đã xoá yêu cầu khỏi hàng đợi.', 'info');
      }
    });
  };

  const handleClearAudit = async () => {
    await clearAuditHistory();
    setAuditList([]);
    if (onNotify) onNotify('Đã xoá toàn bộ nhật ký đồng bộ.', 'info');
  };

  const failedCount = pendingItems.filter((i) => i.status === 'failed').length;

  return (
    <div
      id="offline-sync-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs shrink-0">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Trung tâm Đồng bộ Ngoại tuyến (Offline Sync Center)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  Service Worker + IndexedDB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảo toàn dữ liệu nghiệp vụ ERP khi mất kết nối mạng và tự động phát lại (Replay) theo cơ chế hàng đợi FIFO.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Đóng cửa sổ (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= NETWORK & STORAGE DIAGNOSTIC BAR ================= */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Trạng thái mạng:</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold font-mono text-[11px]">
                  <CloudOff className="w-3 h-3" />
                  OFFLINE
                </span>
              )}
            </div>

            {/* Ping check */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Máy chủ ERP:</span>
              <span className="font-mono text-slate-200">
                {pingLatency !== null ? `${pingLatency} ms` : isPinging ? 'Đang kiểm tra...' : 'Không phản hồi'}
              </span>
              <button
                type="button"
                onClick={testPing}
                disabled={isPinging}
                className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Kiểm tra độ trễ mạng thực tế tới máy chủ"
              >
                {isPinging ? '...' : 'Ping'}
              </button>
            </div>

            {/* Service Worker status */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Service Worker:</span>
              <span className={`font-mono font-semibold ${swActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {swActive ? 'Đang hoạt động' : 'Đã đăng ký (Chờ kích hoạt)'}
              </span>
            </div>

            {/* Storage status */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lưu trữ:</span>
              <span className="font-mono text-indigo-300 font-semibold">IndexedDB (Bền vững)</span>
            </div>
          </div>

          {/* Last sync time */}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>Lần đồng bộ gần nhất:</span>
            <span className="text-slate-200 font-semibold">
              {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('vi-VN') : 'Chưa có'}
            </span>
          </div>
        </div>

        {/* ================= 4 KPI SUMMARY CARDS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          {/* Card 1: Pending */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Chờ phát lại</span>
              <Cloud className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
              {pendingItems.filter((i) => i.status === 'pending').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Sẽ tự phát lại khi có mạng</p>
          </div>

          {/* Card 2: Syncing */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Đang đồng bộ</span>
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-300 mt-1">
              {isSyncing ? pendingItems.filter((i) => i.status === 'syncing').length || 1 : 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Gửi tuần tự FIFO</p>
          </div>

          {/* Card 3: Completed */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Đã hoàn tất</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-300 mt-1">
              {auditList.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lưu vết trong nhật ký</p>
          </div>

          {/* Card 4: Failed / Conflicts */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lỗi / Cần chú ý</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">
              {failedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Có thể bấm thử lại</p>
          </div>
        </div>

        {/* ================= ACTION TOOLBAR & TABS ================= */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hàng đợi đang chờ</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-950 text-blue-200 border border-blue-800">
                {pendingItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                loadAudit();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nhật ký đã đồng bộ (Audit Trail)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-200 border border-emerald-800">
                {auditList.length}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Simulate button */}
            <button
              type="button"
              onClick={handleSimulateOfflineAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-xs"
              title="Thử nghiệm tạo một yêu cầu offline vào hàng đợi IndexedDB để quan sát cơ chế phát lại"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tạo đơn hàng thử nghiệm</span>
            </button>

            {/* Clear audit button */}
            {activeTab === 'audit' && auditList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAudit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Xoá lịch sử</span>
              </button>
            )}

            {/* Purge pending queue */}
            {activeTab === 'pending' && pendingItems.length > 0 && (
              <button
                type="button"
                onClick={handlePurgeAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800 text-xs font-medium transition cursor-pointer"
                title="Huỷ bỏ tất cả các yêu cầu đang đợi"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Xoá hàng đợi</span>
              </button>
            )}

            {/* Primary Sync Now button */}
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing || pendingItems.length === 0}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isSyncing || pendingItems.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-900/30'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang phát lại...' : 'Đồng bộ ngay (Sync Now)'}</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN CONTENT TABLE AREA ================= */}
        <div className="flex-1 overflow-y-auto min-h-[300px] p-6 bg-slate-900">
          {activeTab === 'pending' ? (
            pendingItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">Hàng đợi đồng bộ đang trống</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Mọi thao tác nghiệp vụ đã được ghi nhận đầy đủ lên máy chủ ERP. Khi mất mạng, các thao tác tạo mới hoặc cập nhật sẽ tự động lưu vào đây.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateOfflineAction}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer"
                >
                  Thử nghiệm tạo yêu cầu offline
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-2.5 px-3">Mã Yêu Cầu & Thời Gian</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3">Phân hệ / Thao tác</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 text-center">Thử lại</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                    {pendingItems.map((item) => {
                      const methodColor =
                        item.method === 'POST'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : item.method === 'PUT' || item.method === 'PATCH'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800';

                      const statusBadge =
                        item.status === 'syncing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-semibold animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang phát
                          </span>
                        ) : item.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" /> Lỗi ({item.retryCount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                            <Clock className="w-2.5 h-2.5" /> Chờ phát lại
                          </span>
                        );

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* ID & Time */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white tracking-tight">{item.id}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                              {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </div>
                          </td>

                          {/* Method */}
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${methodColor}`}>
                              {item.method}
                            </span>
                          </td>

                          {/* Endpoint */}
                          <td className="py-3 px-3">
                            <div className="font-sans font-medium text-slate-200 text-xs">
                              {item.endpointName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {item.url}
                            </div>
                            {item.lastError && (
                              <div className="text-[11px] text-rose-400 mt-1 font-sans">
                                ⚠ {item.lastError}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">{statusBadge}</td>

                          {/* Retries */}
                          <td className="py-3 px-3 text-center tabular-nums text-slate-300">
                            {item.retryCount || 0}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect Payload */}
                              {item.body && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPayload({
                                      title: `Dữ liệu Payload: ${item.endpointName}`,
                                      json: item.body || ''
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                                  title="Xem nội dung chi tiết payload gửi đi"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Retry Single */}
                              <button
                                type="button"
                                onClick={() => retryItem(item.id)}
                                disabled={item.status === 'syncing'}
                                className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 transition cursor-pointer"
                                title="Phát lại yêu cầu này ngay"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Single */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSingle(item.id, item.endpointName)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition cursor-pointer"
                                title="Xoá yêu cầu khỏi hàng đợi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ================= AUDIT TRAIL TAB ================= */
            auditList.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                <Clock className="w-10 h-10 text-slate-600 mb-2" />
                <h3 className="text-sm font-semibold text-slate-300">Chưa có bản ghi đồng bộ nào</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Khi các yêu cầu offline được phát lại thành công, lịch sử chi tiết sẽ hiển thị tại đây để phục vụ kiểm toán và truy vết.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-2.5 px-3">Mã Yêu Cầu</th>
                      <th className="py-2.5 px-3">Thời gian Replay</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3">Phân hệ / Thao tác</th>
                      <th className="py-2.5 px-3 text-center">HTTP Status</th>
                      <th className="py-2.5 px-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                    {auditList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{item.id}</td>
                        <td className="py-3 px-3 text-slate-300 tabular-nums">
                          {item.replayedAt ? new Date(item.replayedAt).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            {item.method}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-200">
                          {item.endpointName}
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                            {item.url}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            HTTP {item.responseStatus || 200} OK
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {item.body && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPayload({
                                  title: `Dữ liệu Replay: ${item.endpointName}`,
                                  json: item.body || ''
                                })
                              }
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center gap-1"
                              title="Xem dữ liệu đã đồng bộ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Payload</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Cơ chế đệm bảo toàn giao dịch: Tự động ghi vào IndexedDB khi không có mạng</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* ================= PAYLOAD INSPECTOR MODAL ================= */}
      {selectedPayload && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">{selectedPayload.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap">
              {(() => {
                try {
                  const parsed = JSON.parse(selectedPayload.json);
                  return JSON.stringify(parsed, null, 2);
                } catch {
                  return selectedPayload.json;
                }
              })()}
            </div>
            <div className="mt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule #19 Compliant ConfirmDialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText="Xác nhận"
          cancelText="Huỷ bỏ"
        />
      )}
    </div>
  );
};
