const CACHE_NAME = 'harcirah-takip-v1';
const urlsToCache = [
  '/konteyner-harcirah/',
  '/konteyner-harcirah/index.html',
  '/konteyner-harcirah/manifest.json',
  '/konteyner-harcirah/icon-192.png',
  '/konteyner-harcirah/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'no-cors' })))
        .catch(err => console.log('Cache addAll error (non-critical):', err));
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return caches.match('/konteyner-harcirah/') || caches.match('/konteyner-harcirah/index.html');
      });
    })
  );
});
