/**
 * Service Worker Registration & Lifecycle Manager for NexusSync ERP
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[SW] Service workers not supported or running in server context.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

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
