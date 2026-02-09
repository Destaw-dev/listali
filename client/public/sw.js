// Service Worker for ListaLi PWA
// Cache version - increment on deploy to invalidate old caches
const CACHE_NAME = 'listali-v2';
const STATIC_CACHE = 'listali-static-v2';

// Assets to cache on install (static assets only)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon.svg',
  '/apple-touch-icon.svg',
];

// Helper: Check if request is for static assets that should be cached
function isStaticAsset(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Next.js static assets
  if (pathname.startsWith('/_next/static/')) {
    return true;
  }
  
  // Static file extensions
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.json'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Helper: Check if request is for API calls (should never be cached)
function isApiCall(url) {
  const urlObj = new URL(url);
  return urlObj.pathname.startsWith('/api/');
}

// Helper: Check if request is for HTML/navigation (should never be cached)
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

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
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
            // Keep only current caches
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

// Fetch event - proper caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // NEVER cache navigation requests - let browser handle them
  if (request.mode === 'navigate') {
    return;
  }

  // NEVER cache API calls - always fetch fresh
  if (isApiCall(request.url)) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return error response for offline API calls
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

  // NEVER cache HTML requests - use NetworkOnly strategy
  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request).catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }
  

  // Cache static assets with CacheFirst strategy
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((response) => {
            // Only cache successful responses
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              cache.put(request, responseToCache);
            }
            return response;
          }).catch(() => {
            // Return cached version if available, even if stale
            return cachedResponse || new Response('Asset not available offline', { status: 404 });
          });
        });
      })
    );
    return;
  }

  // For any other requests, use NetworkFirst strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful static-like responses
        if (response && response.status === 200 && response.type === 'basic' && isStaticAsset(request.url)) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache as fallback
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Network error', { status: 503 });
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
