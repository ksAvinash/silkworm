/* Silkworm service worker: network-first for pages (so deploys show up
   immediately), cache-first for hashed static assets, offline fallback to
   the app shell. Registered relative to the deploy base path, so the scope
   works both locally and under GitHub Pages' /silkworm prefix. */
const CACHE = 'silkworm-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([self.registration.scope]))
      .catch(() => Promise.resolve()),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first, cached copy when offline, app shell as last resort.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(self.registration.scope)),
        ),
    );
    return;
  }

  // Hashed build assets and images: cache first.
  const isStaticAsset =
    url.pathname.includes('/_next/static/') || /\.(png|svg|ico|webmanifest|woff2)$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
