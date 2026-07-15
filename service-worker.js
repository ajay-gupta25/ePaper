const CACHE_NAME = 'epaper-shell-v1';
const ASSETS_TO_PRECACHE = [
  './',
  './index.html',
  // add other static assets you ship with the site (relative paths so SW works under /repo/ too)
  './content.css',
  './read.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_PRECACHE).catch(err => {
        // log and continue: some assets may fail (e.g. 404) but SW should still install
        console.warn('Precache failed:', err);
        return Promise.resolve();
      });
    })
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

  // Navigation requests: try network first (so live updates work), fallback to cached app-shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(networkResp => {
        // successful network navigation -> update cache and return
        caches.open(CACHE_NAME).then(cache => cache.put(new Request('./index.html'), networkResp.clone()));
        return networkResp;
      }).catch(() => {
        // network failed -> serve cached app-shell
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For other GET requests, use cache-first, then network and cache
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then(cachedResp => {
        if (cachedResp) return cachedResp;
        return fetch(req).then(networkResp => {
          // cache successful responses (allow opaque cross-origin responses)
          if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkResp;
        }).catch(() => {
          // fallback: return app-shell for unknown requests when offline
          return caches.match('./index.html');
        });
      })
    );
  }
});
