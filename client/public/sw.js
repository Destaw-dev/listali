// Service Worker for ListaLi PWA
const CACHE_NAME = 'listali-v1';
const RUNTIME_CACHE = 'listali-runtime';

// Assets to cache on install (exclude / - it redirects to /he and caching it breaks redirects)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Never intercept navigation: redirects (e.g. / -> /he) must be followed by the browser
  if (event.request.mode === 'navigate') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline fallback for non-navigation requests only
            if (event.request.destination === 'document') {
              return caches.match('/he');
            }
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'רשימות קניות';
  const options = {
    body: data.body || 'יש לך התראה חדשה',
    icon: data.icon || '/icon-192.svg',
    badge: data.badge || '/icon-192.svg',
    data: data.data || {},
    tag: data.tag || 'default',
    renotify: data.renotify !== undefined ? data.renotify : (data.tag && data.tag !== 'default'),
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    ...(data.image && { image: data.image }),
    ...(data.actions && Array.isArray(data.actions) && data.actions.length > 0 && { actions: data.actions })
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action; // Action button clicked, if any
  
  // Determine URL to open based on action or default
  let urlToOpen = '/';
  
  if (action) {
    // Handle action button clicks
    if (action === 'open-list' && data.listId) {
      urlToOpen = `/${data.locale || 'he'}/groups/${data.groupId}/lists/${data.listId}`;
    } else if (action === 'open-group' && data.groupId) {
      urlToOpen = `/${data.locale || 'he'}/groups/${data.groupId}`;
    } else if (action === 'open-dashboard') {
      urlToOpen = `/${data.locale || 'he'}/dashboard`;
    } else if (data.url) {
      urlToOpen = data.url;
    }
  } else if (data.url) {
    urlToOpen = data.url;
  }

  try {
    const absoluteUrl = new URL(urlToOpen, self.location.origin).href;
    urlToOpen = absoluteUrl;
  } catch (e) {
    urlToOpen = new URL('/', self.location.origin).href;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Compare URLs (normalize for comparison)
        const clientUrl = new URL(client.url).pathname;
        const targetUrl = new URL(urlToOpen).pathname;
        
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
