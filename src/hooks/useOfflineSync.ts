import { useState, useEffect, useCallback } from 'react';
import {
  offlineSyncService,
  QueuedOfflineRequest,
  SyncAuditItem
} from '../services/offlineSyncService';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  pendingItems: QueuedOfflineRequest[];
  lastSyncedAt: Date | null;
  syncNow: () => Promise<{ replayed: number; failed: number; total: number }>;
  retryItem: (id: string) => Promise<boolean>;
  deleteItem: (id: string) => Promise<void>;
  purgeQueue: () => Promise<void>;
  getAuditHistory: () => Promise<SyncAuditItem[]>;
  clearAuditHistory: () => Promise<void>;
  checkConnectivity: () => Promise<boolean>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [state, setState] = useState(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queueCount: 0,
    pendingItems: [] as QueuedOfflineRequest[],
    lastSyncedAt: null as Date | null
  }));

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const syncNow = useCallback(() => {
    return offlineSyncService.replayQueue();
  }, []);

  const retryItem = useCallback((id: string) => {
    return offlineSyncService.retrySingleRequest(id);
  }, []);

  const deleteItem = useCallback((id: string) => {
    return offlineSyncService.deleteQueuedRequest(id);
  }, []);

  const purgeQueue = useCallback(() => {
    return offlineSyncService.purgeQueue();
  }, []);

  const getAuditHistory = useCallback(() => {
    return offlineSyncService.getAuditHistory();
  }, []);

  const clearAuditHistory = useCallback(() => {
    return offlineSyncService.clearAuditHistory();
  }, []);

  const checkConnectivity = useCallback(() => {
    return offlineSyncService.checkServerConnectivity();
  }, []);

  return {
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    queueCount: state.queueCount,
    pendingItems: state.pendingItems,
    lastSyncedAt: state.lastSyncedAt,
    syncNow,
    retryItem,
    deleteItem,
    purgeQueue,
    getAuditHistory,
    clearAuditHistory,
    checkConnectivity
  };
}
