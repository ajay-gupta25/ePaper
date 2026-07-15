const CACHE_NAME = 'epaper-shell-v1';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  // add other static assets you ship with the site
  '/content.css',
  '/read.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_PRECACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Navigation requests: serve app shell from cache first
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cached => cached || fetch(req).catch(() => {
        // fallback to cached index if fetch fails
        return caches.match('/index.html');
      }))
    );
    return;
  }

  // For other GET requests, use cache-first, then network and cache
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then(cachedResp => {
        if (cachedResp) return cachedResp;
        return fetch(req).then(networkResp => {
          // cache successful responses (ignore opaque failures)
          if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkResp;
        }).catch(() => {
          // fallback: for images you can return an offline placeholder if you add one to precache
          return caches.match('/index.html');
        });
      })
    );
  }
});
