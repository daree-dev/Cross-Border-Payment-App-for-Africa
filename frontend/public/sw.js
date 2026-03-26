/* AfriPay Service Worker */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `afripay-static-${CACHE_VERSION}`;
const API_CACHE = `afripay-api-${CACHE_VERSION}`;

// Assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard',
  '/send',
  '/receive',
  '/history',
  '/offline.html',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/wallet/balance',
  '/api/payments/history',
  '/api/auth/me',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Cache what we can; don't fail install if some assets are missing
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api')) return;

  // API requests: network-first, fall back to cache
  if (url.pathname.startsWith('/api')) {
    const isCacheable = API_ROUTES.some((r) => url.pathname.startsWith(r));
    if (!isCacheable) return;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: network-first, fall back to index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((r) => r || caches.match('/offline.html'))
      )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// ─── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'AfriPay', body: 'You have a new notification', icon: '/icons/icon-192x192.png' };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'afripay-notification',
      data: data.url ? { url: data.url } : {},
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// ─── Notification Click ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-payments') {
    event.waitUntil(syncPendingPayments());
  }
});

async function syncPendingPayments() {
  try {
    const cache = await caches.open('afripay-pending');
    const keys = await cache.keys();
    for (const request of keys) {
      const body = await cache.match(request).then((r) => r?.json());
      if (!body) continue;
      try {
        await fetch('/api/payments/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.token}` },
          body: JSON.stringify(body.payload),
        });
        await cache.delete(request);
      } catch {}
    }
  } catch {}
}
