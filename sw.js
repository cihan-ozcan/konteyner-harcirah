const CACHE_NAME = 'harcirah-takip-v3';
const STATIC_CACHE = [
  '/konteyner-harcirah/manifest.json',
  '/konteyner-harcirah/icon-192.png',
  '/konteyner-harcirah/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install — sadece statik dosyaları cache'le
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE.map(url => new Request(url, { mode: 'no-cors' })))
        .catch(err => console.log('Cache error (non-critical):', err));
    })
  );
  self.skipWaiting();
});

// Activate — eski cache'leri sil, hemen devral
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — HTML için her zaman network önce, statikler için cache önce
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('/');

  if (isHTML) {
    // HTML: network'ten al, başarısız olursa cache'ten sun
    event.respondWith(
      fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Statik dosyalar: cache varsa cache'ten, yoksa network'ten al
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
  }
});
