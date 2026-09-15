import React from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OfflineSyncStatusWidgetProps {
  onOpenSyncCenter: () => void;
}

export const OfflineSyncStatusWidget: React.FC<OfflineSyncStatusWidgetProps> = ({
  onOpenSyncCenter
}) => {
  const { isOnline, isSyncing, queueCount } = useOfflineSync();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Primary Connection Indicator */}
      {isOnline ? (
        <button
          type="button"
          onClick={onOpenSyncCenter}
          id="header-online-status-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[11px] font-medium transition hover:bg-emerald-900/60 cursor-pointer shadow-2xs"
          title="Kết nối máy chủ ERP ổn định. Nhấn để mở Trung tâm Đồng bộ Ngoại tuyến"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold whitespace-nowrap">Online</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenSyncCenter}
          id="header-offline-status-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-800 text-rose-300 text-[11px] font-bold animate-pulse transition hover:bg-rose-900 cursor-pointer shadow-2xs"
          title="Mất kết nối máy chủ! Dữ liệu được đệm an toàn vào IndexedDB. Nhấn để xem hàng đợi"
        >
          <CloudOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-[11px] whitespace-nowrap font-mono">Offline</span>
        </button>
      )}

      {/* Sync Queue Badge */}
      {isSyncing ? (
        <button
          type="button"
          onClick={onOpenSyncCenter}
          id="header-syncing-badge"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/90 border border-blue-700 text-blue-300 text-[11px] font-mono font-semibold transition hover:bg-blue-900/80 cursor-pointer shadow-xs animate-pulse"
          title="Đang phát lại các yêu cầu offline lên máy chủ ERP..."
        >
          <RefreshCw className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
          <span className="whitespace-nowrap">Đang đồng bộ</span>
        </button>
      ) : queueCount > 0 ? (
        <button
          type="button"
          onClick={onOpenSyncCenter}
          id="header-offline-queue-badge"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-750 text-amber-300 text-[11px] font-mono font-bold transition hover:bg-amber-900/80 cursor-pointer shadow-xs"
          title={`${queueCount} yêu cầu đang chờ kết nối mạng để phát lại. Nhấn để quản lý`}
        >
          <Cloud className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="tabular-nums whitespace-nowrap">Chờ đồng bộ: {queueCount}</span>
        </button>
      ) : null}
    </div>
  );
};
