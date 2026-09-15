import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SystemClockProvider } from './components/common/SystemClockProvider';

// Global override to make default toLocaleString use vi-VN (dot separator)
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function(locales, options) {
  if (locales === undefined) {
    return originalToLocaleString.call(this, 'vi-VN', options);
  }
  return originalToLocaleString.call(this, locales, options);
};

const originalFetch = window.fetch;

// Auto-initialize default JWT token if missing on first load
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

Object.defineProperty(window, 'fetch', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: async (...args: any[]) => {
    let [resource, config] = args;
    config = config || {};
    config.headers = config.headers || {};
    let token = localStorage.getItem('nexus_jwt');
    
    // If token is missing and calling API, try fetching default login token
    if (!token && typeof resource === 'string' && resource.startsWith('/api') && !resource.includes('/auth/login')) {
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
            localStorage.setItem('nexus_jwt', token);
          }
        }
      } catch {}
    }

    if (token) {
      if (config.headers instanceof Headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    return originalFetch(resource, config);
  }
});
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SystemClockProvider>
      <App />
    </SystemClockProvider>
  </React.StrictMode>
);
