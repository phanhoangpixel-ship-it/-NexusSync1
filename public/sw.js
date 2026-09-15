/**
 * NexusSync ERP — Enterprise Service Worker with Offline Sync & Request Replay
 * Complies with PWA standards, IndexedDB persistence, and Background Sync API
 */

const CACHE_VERSION = 'nexus-erp-v2.0.0';
const API_CACHE_NAME = `nexus-api-${CACHE_VERSION}`;

// Only precache static branding icons, NEVER application HTML or Vite dev bundles
const PRECACHE_ASSETS = [
  '/icon.svg',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

const DB_NAME = 'NexusSync_OfflineDB';
const DB_VERSION = 1;
const QUEUE_STORE_NAME = 'sync_queue';
const AUDIT_STORE_NAME = 'sync_audit_log';

// BroadcastChannel for instant client notifications
let syncChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel('nexus-offline-sync');
  }
} catch (e) {
  // BroadcastChannel not available in environment
}

function broadcastMessage(message) {
  if (syncChannel) {
    try {
      syncChannel.postMessage(message);
    } catch (err) {
      console.warn('[SW] BroadcastChannel error:', err);
    }
  }
  // Fallback to client.postMessage
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Open IndexedDB in Service Worker
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        const queueStore = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(AUDIT_STORE_NAME)) {
        const auditStore = db.createObjectStore(AUDIT_STORE_NAME, { keyPath: 'id' });
        auditStore.createIndex('replayedAt', 'replayedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save request to offline queue in IndexedDB
async function enqueueOfflineRequest(requestData) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE_NAME);
    const putReq = store.put(requestData);
    putReq.onsuccess = () => {
      broadcastMessage({
        type: 'QUEUE_ITEM_ADDED',
        item: requestData
      });
      resolve(requestData.id);
    };
    putReq.onerror = () => reject(putReq.error);
  });
}

// Read all pending requests from IndexedDB
async function getPendingRequests() {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE_NAME, 'readonly');
    const store = tx.objectStore(QUEUE_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const pending = all.filter((item) => item.status === 'pending' || item.status === 'failed');
      pending.sort((a, b) => a.timestamp - b.timestamp);
      resolve(pending);
    };
    req.onerror = () => reject(req.error);
  });
}

// Update request status in IndexedDB
async function updateRequestInDB(item) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Move completed request to audit store
async function moveToAuditStore(item) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([QUEUE_STORE_NAME, AUDIT_STORE_NAME], 'readwrite');
    tx.objectStore(QUEUE_STORE_NAME).delete(item.id);
    tx.objectStore(AUDIT_STORE_NAME).put({
      ...item,
      status: 'completed',
      replayedAt: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Replay queued requests sequentially
async function replayQueuedRequests() {
  const pending = await getPendingRequests();
  if (!pending.length) {
    return { replayed: 0, failed: 0 };
  }

  broadcastMessage({
    type: 'SYNC_STARTED',
    count: pending.length
  });

  let replayedCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    item.status = 'syncing';
    await updateRequestInDB(item);

    try {
      const headers = { ...(item.headers || {}) };
      headers['X-Nexus-Offline-Sync'] = 'true';
      headers['X-Nexus-Replayed-At'] = new Date().toISOString();
      if (item.clientRequestId) {
        headers['X-Idempotency-Key'] = item.clientRequestId;
      }

      const response = await fetch(item.url, {
        method: item.method,
        headers,
        body: ['GET', 'HEAD'].includes(item.method) ? undefined : item.body
      });

      if (response.ok || (response.status >= 200 && response.status < 300)) {
        await moveToAuditStore(item);
        replayedCount++;
        broadcastMessage({
          type: 'ITEM_REPLAYED',
          itemId: item.id,
          replayedCount
        });
      } else {
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = `HTTP ${response.status}: ${response.statusText}`;
        await updateRequestInDB(item);
        failedCount++;
      }
    } catch (err) {
      item.status = 'failed';
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = err?.message || 'Network unreachable during replay';
      await updateRequestInDB(item);
      failedCount++;
      break; // Stop replay loop if network disconnected again
    }
  }

  broadcastMessage({
    type: 'SYNC_COMPLETED',
    replayed: replayedCount,
    failed: failedCount,
    remaining: pending.length - replayedCount
  });

  return { replayed: replayedCount, failed: failedCount };
}

// 1. INSTALL LIFECYCLE
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. ACTIVATE LIFECYCLE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            // Delete all previous caches including any static asset caches
            if (key !== API_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// 3. FETCH INTERCEPTION & OFFLINE QUEUEING
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Exclude non-http(s) and dev websockets
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('/@vite/') || url.pathname.includes('hmr')) return;

  // STRICT RULE: Only intercept /api/ requests!
  // All HTML, JS modules, TSX files, fonts, and assets MUST pass through directly to avoid white screens
  if (!url.pathname.startsWith('/api/')) {
    return;
  }

  const isApiRequest = true;

  // CASE A: API MUTATION REQUESTS (POST, PUT, PATCH, DELETE)
  if (isApiRequest && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    // Exempt login from offline queue
    if (url.pathname.includes('/auth/login')) {
      return;
    }

    event.respondWith(
      (async () => {
        // Clone request before network attempt
        const clonedRequest = request.clone();

        try {
          // Attempt network request first
          const response = await fetch(request);
          return response;
        } catch (error) {
          // Network failure! Intercept & queue for background replay
          try {
            const bodyText = await clonedRequest.text();
            const headersObj = {};
            clonedRequest.headers.forEach((value, key) => {
              headersObj[key] = value;
            });

            // Extract endpoint description
            const segments = url.pathname.replace(/^\/api\//, '').split('/');
            const cleanDomain = segments[0] ? segments[0].toUpperCase() : 'ERP';
            const cleanAction = segments[1] ? segments[1].replace(/[-_]/g, ' ') : request.method;

            const queueItem = {
              id: `sw_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              url: request.url,
              method: request.method,
              headers: headersObj,
              body: bodyText,
              timestamp: Date.now(),
              clientRequestId: `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              endpointName: `[${cleanDomain}] ${cleanAction}`,
              status: 'pending',
              retryCount: 0,
              origin: 'SERVICE_WORKER'
            };

            await enqueueOfflineRequest(queueItem);

            // Register Background Sync if supported
            if ('sync' in self.registration) {
              try {
                await self.registration.sync.register('nexus-sync-replay');
              } catch (syncErr) {
                // Background Sync registration ignored if permission denied
              }
            }

            // Return clean synthetic 202 Accepted Response
            const syntheticResponse = {
              success: true,
              offline: true,
              queued: true,
              syncId: queueItem.id,
              message: 'Hệ thống đang offline. Dữ liệu đã được lưu vào hàng đợi đồng bộ an toàn của NexusSync ERP.',
              timestamp: new Date().toISOString()
            };

            return new Response(JSON.stringify(syntheticResponse), {
              status: 202,
              statusText: 'Accepted (Queued Offline)',
              headers: {
                'Content-Type': 'application/json',
                'X-Nexus-Offline-Queued': 'true'
              }
            });
          } catch (queueErr) {
            console.error('[SW] Failed to queue offline request:', queueErr);
            return new Response(
              JSON.stringify({
                success: false,
                error: 'OFFLINE_QUEUE_ERROR',
                message: 'Không thể ghi nhận giao dịch offline vào bộ nhớ cục bộ.'
              }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      })()
    );
    return;
  }

  // CASE B: API GET REQUESTS (Network-First with Cache Fallback)
  if (isApiRequest && request.method === 'GET') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (networkError) {
          // Network failed, lookup from API cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Append header indicating cached offline response
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.set('X-Nexus-Served-From-Cache', 'true');
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: `${cachedResponse.statusText} (Offline Cache)`,
              headers: newHeaders
            });
          }

          // If no cache, return empty array for collection endpoints or graceful fallback
          return new Response(
            JSON.stringify({
              offline: true,
              cached: false,
              message: 'Mất kết nối máy chủ và chưa có bản ghi đệm.',
              data: []
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      })()
    );
    return;
  }
});

// 4. BACKGROUND SYNC EVENT
self.addEventListener('sync', (event) => {
  if (event.tag === 'nexus-sync-replay') {
    event.waitUntil(replayQueuedRequests());
  }
});

// 5. MESSAGE EVENT (Direct instructions from UI)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'REPLAY_NOW') {
    event.waitUntil(replayQueuedRequests());
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CHECK_QUEUE') {
    getPendingRequests().then((pending) => {
      event.source?.postMessage({
        type: 'QUEUE_STATUS',
        count: pending.length,
        items: pending
      });
    });
  }
});
