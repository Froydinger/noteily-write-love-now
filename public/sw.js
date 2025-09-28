// Aggressive cache busting service worker
const CACHE_NAME = 'noteily-v' + Date.now(); // Force new cache on every update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Force immediate activation
self.addEventListener('install', (event) => {
  console.log('SW: Installing with aggressive cache busting');
  self.skipWaiting(); // Force immediate activation
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching core files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Immediately claim all clients and delete old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating and cleaning old caches');
  
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Delete all old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  
  // Notify all clients about the update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'CACHE_UPDATED', cacheName: CACHE_NAME });
    });
  });
});

// Network-first strategy with aggressive cache invalidation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Always try network first for HTML files
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other resources, use cache-first but with short expiration
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available and fresh (within 5 minutes)
        if (response) {
          const cachedDate = response.headers.get('date');
          if (cachedDate) {
            const age = Date.now() - new Date(cachedDate).getTime();
            if (age < 5 * 60 * 1000) { // 5 minutes
              return response;
            }
          }
        }
        
        // Fetch from network and update cache
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Return stale cache as last resort
          return response || new Response('Network error', { status: 503 });
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received skip waiting message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('SW: Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});