import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SystemClockProvider } from './components/common/SystemClockProvider';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { offlineSyncService } from './services/offlineSyncService';

// Register Service Worker for PWA and offline sync capabilities
registerServiceWorker();

// Suppress benign Vite HMR WebSocket connection messages in sandbox preview (HMR disabled by container platform)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason?.message || event.reason?.toString() || '';
    if (reasonStr.includes('WebSocket') || reasonStr.includes('ws://') || reasonStr.includes('wss://')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Global override to make default toLocaleString use vi-VN (dot for thousands, comma for decimals e.g., 1.000.000,50)
try {
  const originalToLocaleString = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function(locales, options) {
    if (locales === undefined || locales === 'vi-VN') {
      const numVal = Number(this);
      if (options !== undefined) {
        return originalToLocaleString.call(this, 'vi-VN', options);
      }
      // If the number has decimal places, format with comma decimal separator (e.g. 1.000.000,50)
      if (!isNaN(numVal) && !Number.isInteger(numVal)) {
        const str = numVal.toString();
        const decimalPart = str.split('.')[1] || '';
        const fractionDigits = Math.min(Math.max(decimalPart.length, 2), 4);
        return originalToLocaleString.call(this, 'vi-VN', {
          minimumFractionDigits: fractionDigits >= 2 ? 2 : 0,
          maximumFractionDigits: 4,
        });
      }
      return originalToLocaleString.call(this, 'vi-VN');
    }
    return originalToLocaleString.call(this, locales, options);
  };
} catch (err) {
  console.warn('[NexusSync] toLocaleString override skipped:', err);
}

// Bind originalFetch to window to guarantee "Illegal invocation" never occurs
const originalFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : undefined;

// Auto-initialize default JWT token if missing on first load
if (originalFetch) {
  (async () => {
    try {
      const existingToken = localStorage.getItem('nexus_jwt');
      if (!existingToken) {
        const res = await originalFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', role: 'SUPER_ADMIN' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('nexus_jwt', data.token);
            if (data.user) {
              localStorage.setItem('nexus_user', JSON.stringify(data.user));
            }
          }
        }
      }
    } catch (err) {
      console.warn('[NexusSync] Initial auto-login check warning:', err);
    }
  })();
}

const customFetch = async (...args: any[]) => {
    const [resource, config = {}] = args;
    const url = typeof resource === 'string' ? resource : (resource && typeof resource === 'object' && 'url' in resource ? (resource as any).url : '');
    const isInternalApi = typeof url === 'string' && (url.startsWith('/api') || (typeof window !== 'undefined' && url.startsWith(window.location.origin + '/api')));

    // Only intercept internal /api calls
    if (!isInternalApi) {
      return originalFetch(resource, config);
    }

    const method = ((config.method || 'GET') as string).toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isLogin = url.includes('/auth/login');

    let token: string | null = null;
    try {
      token = localStorage.getItem('nexus_jwt');
    } catch {
      // ignore localStorage restriction
    }

    // If token is missing and calling API, try fetching default login token
    if (!token && !isLogin && navigator.onLine) {
      try {
        const loginRes = await originalFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', role: 'SUPER_ADMIN' }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.token) {
            token = loginData.token;
            try {
              localStorage.setItem('nexus_jwt', token);
            } catch {}
          }
        }
      } catch {
        // ignore login error fallback
      }
    }

    const modifiedConfig = { ...config, method };
    if (token) {
      if (modifiedConfig.headers instanceof Headers) {
        modifiedConfig.headers.set('Authorization', `Bearer ${token}`);
      } else {
        modifiedConfig.headers = {
          ...(modifiedConfig.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    }

    // Convert headers to flat record for IndexedDB storage
    const getHeadersRecord = () => {
      const headersObj: Record<string, string> = {};
      if (modifiedConfig.headers instanceof Headers) {
        modifiedConfig.headers.forEach((v: string, k: string) => {
          headersObj[k] = v;
        });
      } else if (modifiedConfig.headers && typeof modifiedConfig.headers === 'object') {
        Object.assign(headersObj, modifiedConfig.headers);
      }
      return headersObj;
    };

    // Helper to produce synthetic 202 Accepted Response
    const createSyntheticOfflineResponse = (queueItem: any, reason: string) => {
      let parsedBody: any = null;
      try {
        if (typeof modifiedConfig.body === 'string') {
          parsedBody = JSON.parse(modifiedConfig.body);
        } else if (modifiedConfig.body) {
          parsedBody = modifiedConfig.body;
        }
      } catch {}

      const syntheticBody = {
        success: true,
        offline: true,
        queued: true,
        syncId: queueItem.id,
        message: `${reason} Thao tác đã được bảo toàn an toàn trong hàng đợi ngoại tuyến và sẽ tự động đồng bộ khi có kết nối mạng.`,
        data: parsedBody ? { ...parsedBody, id: parsedBody.id || `OFFLINE-${Date.now()}` } : { id: `OFFLINE-${Date.now()}` },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(syntheticBody), {
        status: 202,
        statusText: 'Accepted (Queued Offline)',
        headers: {
          'Content-Type': 'application/json',
          'X-Nexus-Offline-Queued': 'true',
          'X-Nexus-Sync-Id': queueItem.id
        }
      });
    };

    // 1. IF NETWORK IS DETECTED OFFLINE:
    if (!navigator.onLine && isMutation && !isLogin) {
      try {
        const queuedItem = await offlineSyncService.enqueueRequest(
          url,
          method as any,
          getHeadersRecord(),
          modifiedConfig.body
        );
        return createSyntheticOfflineResponse(queuedItem, 'Hệ thống đang hoạt động ở chế độ ngoại tuyến (Offline).');
      } catch (queueErr) {
        console.error('[Offline Queue] Failed to buffer offline mutation:', queueErr);
      }
    }

    // 2. ATTEMPT NETWORK FETCH
    try {
      const response = await originalFetch(resource, modifiedConfig);
      return response;
    } catch (networkError: any) {
      // 3. IF NETWORK FAILS (Connection dropped, DNS failure, or server unreachable):
      if (isMutation && !isLogin) {
        try {
          const queuedItem = await offlineSyncService.enqueueRequest(
            url,
            method as any,
            getHeadersRecord(),
            modifiedConfig.body
          );
          return createSyntheticOfflineResponse(queuedItem, 'Mất kết nối tới máy chủ ERP.');
        } catch (queueErr) {
          console.error('[Offline Queue] Error saving offline request:', queueErr);
        }
      }

      // If GET request fails while offline, return empty list or friendly structure instead of crashing
      if (!isMutation) {
        console.warn(`[NexusSync] Offline GET fallback for ${url}:`, networkError?.message);
        return new Response(
          JSON.stringify([]),
          {
            status: 200,
            statusText: 'OK (Offline Cache Fallback)',
            headers: { 'Content-Type': 'application/json', 'X-Nexus-Offline-Fallback': 'true' }
          }
        );
      }

      throw networkError;
    }
  };

// Safely attach customFetch to window
if (typeof window !== 'undefined') {
  try {
    window.fetch = customFetch;
  } catch {
    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        writable: true,
        enumerable: true,
        value: customFetch,
      });
    } catch (err) {
      console.warn('[NexusSync] window.fetch could not be overridden:', err);
    }
  }
}

// Protected recovery on Vite dynamic preload error (preventing infinite reload loop)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[NexusSync] Vite dynamic chunk preload error detected:', event);
  try {
    const reloadKey = 'nexus_vite_preload_last_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
      sessionStorage.setItem(reloadKey, now.toString());
      window.location.reload();
    }
  } catch {
    // ignore sessionStorage security restrictions
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <SystemClockProvider>
          <App />
        </SystemClockProvider>
      </React.StrictMode>
    );
  } catch (mountErr) {
    console.error('[NexusSync] Fatal error mounting React application root:', mountErr);
  }
}
