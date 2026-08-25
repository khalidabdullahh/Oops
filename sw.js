const CACHE = "oops-phaser-v4.3.0";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./phaser.min.js",
  "./game.js",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-First Strategy: always check network first to ensure updates deliver immediately
self.addEventListener("fetch", e => {
  // Only intercept HTTP/HTTPS requests (Chrome extensions and other schemes can break)
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
