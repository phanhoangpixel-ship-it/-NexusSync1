/**
 * NexusSync ERP — Authoritative Offline Synchronization Engine
 * Manages persistent IndexedDB queue, background sync replay, idempotency, and audit trail.
 */

export interface QueuedOfflineRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  clientRequestId: string;
  endpointName: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
  replayedAt?: number;
  origin?: 'CLIENT_INTERCEPTOR' | 'SERVICE_WORKER';
}

export interface SyncAuditItem extends QueuedOfflineRequest {
  replayedAt: number;
  responseStatus?: number;
}

export type SyncStateListener = (state: {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  pendingItems: QueuedOfflineRequest[];
  lastSyncedAt: Date | null;
}) => void;

class OfflineSyncService {
  private dbName = 'NexusSync_OfflineDB';
  private dbVersion = 1;
  private queueStore = 'sync_queue';
  private auditStore = 'sync_audit_log';
  private db: IDBDatabase | null = null;
  private listeners: Set<SyncStateListener> = new Set();
  private isSyncing = false;
  private lastSyncedAt: Date | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
      this.initBroadcastChannel();
      this.initNetworkListeners();
    }
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.queueStore)) {
          const qStore = db.createObjectStore(this.queueStore, { keyPath: 'id' });
          qStore.createIndex('status', 'status', { unique: false });
          qStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.auditStore)) {
          const aStore = db.createObjectStore(this.auditStore, { keyPath: 'id' });
          aStore.createIndex('replayedAt', 'replayedAt', { unique: false });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        this.notifyState();
        resolve(req.result);
      };

      req.onerror = () => {
        console.error('[OfflineSyncService] IndexedDB init error:', req.error);
        reject(req.error);
      };
    });
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('nexus-offline-sync');
        this.broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'SYNC_COMPLETED' || data?.type === 'ITEM_REPLAYED' || data?.type === 'QUEUE_ITEM_ADDED') {
            this.notifyState();
          }
        };
      }
    } catch (e) {
      // BroadcastChannel unavailable
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[OfflineSyncService] Network online detected. Triggering queue verification & replay...');
      this.notifyState();
      // Wait 1.5s for DNS and socket stabilization then replay
      setTimeout(() => this.replayQueue(), 1500);
    });

    window.addEventListener('offline', () => {
      console.warn('[OfflineSyncService] Network offline detected. Activating client queue buffer...');
      this.notifyState();
    });

    // Periodic check every 25 seconds if online and items exist
    this.heartbeatTimer = setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        const pending = await this.getPendingRequests();
        if (pending.length > 0) {
          this.replayQueue();
        }
      }
    }, 25000);
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    this.notifyState();
    return () => this.listeners.delete(listener);
  }

  private async notifyState() {
    const pending = await this.getPendingRequests();
    const state = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      queueCount: pending.length,
      pendingItems: pending,
      lastSyncedAt: this.lastSyncedAt
    };

    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('[OfflineSyncService] Listener error:', err);
      }
    });
  }

  /**
   * Enqueue a failed or offline mutation request into IndexedDB
   */
  public async enqueueRequest(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: Record<string, string>,
    body: any
  ): Promise<QueuedOfflineRequest> {
    const db = await this.initDB();

    // Friendly display name
    let cleanUrl = url;
    try {
      if (url.startsWith('http')) {
        cleanUrl = new URL(url).pathname;
      }
    } catch {}

    const parts = cleanUrl.replace(/^\/api\//, '').split('/');
    const domain = (parts[0] || 'ERP').toUpperCase();
    const action = parts[1] ? parts[1].replace(/[-_]/g, ' ') : method;

    const queueItem: QueuedOfflineRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url,
      method,
      headers,
      body: typeof body === 'string' ? body : body ? JSON.stringify(body) : null,
      timestamp: Date.now(),
      clientRequestId: `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      endpointName: `[${domain}] ${action}`,
      status: 'pending',
      retryCount: 0,
      origin: 'CLIENT_INTERCEPTOR'
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.queueStore, 'readwrite');
      const store = tx.objectStore(this.queueStore);
      const req = store.put(queueItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Notify Service Worker
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_ITEM_ADDED',
        item: queueItem
      });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'QUEUE_ITEM_ADDED',
        item: queueItem
      });
    }

    this.notifyState();
    return queueItem;
  }

  /**
   * Get all pending and failed requests in FIFO order
   */
  public async getPendingRequests(): Promise<QueuedOfflineRequest[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.queueStore, 'readonly');
        const store = tx.objectStore(this.queueStore);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: QueuedOfflineRequest[] = req.result || [];
          const filtered = list.filter((it) => it.status === 'pending' || it.status === 'failed');
          filtered.sort((a, b) => a.timestamp - b.timestamp);
          resolve(filtered);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Get audit log history of completed synced items
   */
  public async getAuditHistory(limit = 50): Promise<SyncAuditItem[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.auditStore, 'readonly');
        const store = tx.objectStore(this.auditStore);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: SyncAuditItem[] = req.result || [];
          list.sort((a, b) => (b.replayedAt || 0) - (a.replayedAt || 0));
          resolve(list.slice(0, limit));
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Replay all pending queued requests to the backend server
   */
  public async replayQueue(): Promise<{ replayed: number; failed: number; total: number }> {
    if (this.isSyncing) {
      console.log('[OfflineSyncService] Replay already in progress, skipping duplicate cycle.');
      return { replayed: 0, failed: 0, total: 0 };
    }

    const pending = await this.getPendingRequests();
    if (pending.length === 0) {
      return { replayed: 0, failed: 0, total: 0 };
    }

    // Verify genuine network reachability via health ping
    const isReachable = await this.checkServerConnectivity();
    if (!isReachable) {
      console.warn('[OfflineSyncService] Backend health check failed. Replay deferred until network recovery.');
      return { replayed: 0, failed: 0, total: pending.length };
    }

    this.isSyncing = true;
    this.notifyState();

    let replayed = 0;
    let failed = 0;
    const db = await this.initDB();

    for (const item of pending) {
      item.status = 'syncing';
      await this.updateItem(item);
      this.notifyState();

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(item.headers || {})
        };

        // Ensure current fresh auth token is present
        const currentToken = localStorage.getItem('nexus_jwt');
        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }

        headers['X-Nexus-Offline-Sync'] = 'true';
        headers['X-Nexus-Replayed-At'] = new Date().toISOString();
        if (item.clientRequestId) {
          headers['X-Idempotency-Key'] = item.clientRequestId;
        }

        const res = await window.fetch(item.url, {
          method: item.method,
          headers,
          body: ['GET', 'HEAD'].includes(item.method) ? undefined : item.body
        });

        if (res.ok || (res.status >= 200 && res.status < 300)) {
          // Success: move from queue to audit log
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction([this.queueStore, this.auditStore], 'readwrite');
            tx.objectStore(this.queueStore).delete(item.id);
            tx.objectStore(this.auditStore).put({
              ...item,
              status: 'completed',
              replayedAt: Date.now(),
              responseStatus: res.status
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          replayed++;
        } else {
          // Server returned HTTP error (4xx / 5xx)
          const errText = await res.text().catch(() => res.statusText);
          item.status = 'failed';
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = `HTTP ${res.status}: ${errText.slice(0, 150)}`;
          await this.updateItem(item);
          failed++;
        }
      } catch (networkErr: any) {
        // Socket or network error
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = networkErr?.message || 'Lỗi mạng khi phát lại yêu cầu';
        await this.updateItem(item);
        failed++;
        break; // Stop replay loop if network disconnected
      }
    }

    this.isSyncing = false;
    this.lastSyncedAt = new Date();
    this.notifyState();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'SYNC_COMPLETED',
        replayed,
        failed,
        remaining: pending.length - replayed
      });
    }

    // Trigger workspace refresh event so active tables reflect new authoritative records
    if (replayed > 0) {
      window.dispatchEvent(
        new CustomEvent('nexus-offline-synced', {
          detail: { replayedCount: replayed }
        })
      );
    }

    return { replayed, failed, total: pending.length };
  }

  /**
   * Retry an individual queued request
   */
  public async retrySingleRequest(id: string): Promise<boolean> {
    const pending = await this.getPendingRequests();
    const item = pending.find((q) => q.id === id);
    if (!item) return false;

    item.status = 'syncing';
    await this.updateItem(item);
    this.notifyState();

    try {
      const headers = { ...(item.headers || {}) };
      const currentToken = localStorage.getItem('nexus_jwt');
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      headers['X-Nexus-Offline-Sync'] = 'true';

      const res = await window.fetch(item.url, {
        method: item.method,
        headers,
        body: ['GET', 'HEAD'].includes(item.method) ? undefined : item.body
      });

      if (res.ok || (res.status >= 200 && res.status < 300)) {
        const db = await this.initDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([this.queueStore, this.auditStore], 'readwrite');
          tx.objectStore(this.queueStore).delete(item.id);
          tx.objectStore(this.auditStore).put({
            ...item,
            status: 'completed',
            replayedAt: Date.now(),
            responseStatus: res.status
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        this.notifyState();
        return true;
      } else {
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = `HTTP ${res.status}: ${res.statusText}`;
        await this.updateItem(item);
        this.notifyState();
        return false;
      }
    } catch (e: any) {
      item.status = 'failed';
      item.lastError = e?.message || 'Lỗi mạng khi thử lại';
      await this.updateItem(item);
      this.notifyState();
      return false;
    }
  }

  /**
   * Delete a single queued request
   */
  public async deleteQueuedRequest(id: string): Promise<void> {
    const db = await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.queueStore, 'readwrite');
      tx.objectStore(this.queueStore).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notifyState();
  }

  /**
   * Clear all replayed audit log records
   */
  public async clearAuditHistory(): Promise<void> {
    const db = await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.auditStore, 'readwrite');
      tx.objectStore(this.auditStore).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Purge entire offline queue
   */
  public async purgeQueue(): Promise<void> {
    const db = await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.queueStore, 'readwrite');
      tx.objectStore(this.queueStore).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notifyState();
  }

  private async updateItem(item: QueuedOfflineRequest): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.queueStore, 'readwrite');
      const store = tx.objectStore(this.queueStore);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Ping backend health endpoint to verify actual connection
   */
  public async checkServerConnectivity(): Promise<boolean> {
    if (!navigator.onLine) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await window.fetch('/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
