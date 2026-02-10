// Service Worker for Listali PWA
const CACHE_NAME = 'listali-v2';
const STATIC_CACHE = 'listali-static-v2';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon.svg',
  '/apple-touch-icon.svg',
];

function isStaticAsset(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  if (pathname.startsWith('/_next/static/')) {
    return true;
  }
  
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.json'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

function isApiCall(url) {
  const urlObj = new URL(url);
  return urlObj.pathname.startsWith('/api/');
}

// function isHtmlRequest(request) {
//   // Check request mode
//   if (request.mode === 'navigate') {
//     return true;
//   }
  
//   // Check destination
//   if (request.destination === 'document') {
//     return true;
//   }
  
//   // Check Accept header
//   const acceptHeader = request.headers.get('Accept');
//   if (acceptHeader && acceptHeader.includes('text/html')) {
//     return true;
//   }
  
//   // Check URL path (Next.js routes without file extensions)
//   const urlObj = new URL(request.url);
//   const pathname = urlObj.pathname;
  
//   // If it's not a static asset and not an API call, it's likely HTML
//   if (!isStaticAsset(request.url) && !isApiCall(request.url)) {
//     // Exclude known static paths
//     if (!pathname.startsWith('/_next/') && 
//         !pathname.includes('.') && 
//         pathname !== '/') {
//       return true;
//     }
//   }
  
//   return false;
// }

function isHtmlRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    return;
  }

  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  if (request.mode === 'navigate') {
    return;
  }

  if (isApiCall(request.url)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network error - please check your connection' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request).catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }
  

  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              cache.put(request, responseToCache);
            }
            return response;
          }).catch(() => {
            return cachedResponse || new Response('Asset not available offline', { status: 404 });
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic' && isStaticAsset(request.url)) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Network error', { status: 503 });
        });
      })
  );
});

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;
  
  let urlToOpen = '/';
  
  if (action) {
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
  } catch {
    urlToOpen = new URL('/', self.location.origin).href;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url).pathname;
        const targetUrl = new URL(urlToOpen).pathname;
        
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
