/**
 * Service Worker Registration & Lifecycle Manager for NexusSync ERP
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  // Immediately purge any legacy static caches that may interfere with module bundling
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.includes('static') || key.includes('v1') || key.includes('nexus-static')) {
          caches.delete(key).catch(() => {});
        }
      });
    }).catch(() => {});
  }

  // In Vite development mode (local & container preview), Service Workers can intercept
  // or delay dynamic ESM module compilation, causing "Failed to fetch dynamically imported module".
  // We automatically unregister all active Service Workers in development to ensure 100% Vite dev performance.
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          console.info('[SW] Dev mode: Unregistered active service worker for pristine Vite ESM loading:', registration.scope);
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service workers not supported or running in server context.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

      // Force check for newest version
      registration.update().catch(() => {});

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW] New content is available; please refresh.');
            } else {
              console.log('[SW] Content is cached for offline use.');
            }
          }
        });
      });
    } catch (error: any) {
      console.warn('[SW] Service Worker registration notice (may occur in sandboxed iframes):', error?.message || error);
    }
  });

  // Re-broadcast controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Service Worker controller changed.');
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
