/* ===== DineTogether Service Worker v2 ===== */
const CACHE_NAME = 'dinetogether-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

/* Install: pre-cache static shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

/* Activate: remove old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: network-first for API/images, cache-first for static */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip cross-origin non-image requests
  if (url.origin !== location.origin && !url.hostname.includes('unsplash') && !url.hostname.includes('fonts')) {
    return;
  }

  // Cache-first for fonts and images
  if (url.hostname.includes('fonts') || url.hostname.includes('unsplash') || url.hostname.includes('ui-avatars')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for app shell
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
