// Tidy Tribe service worker: lets the app open without internet.
const CACHE = 'tidytribe-1.05';
const SHELL = ['./', 'index.html', 'app.css?v=1.05', 'app.js?v=1.05', 'logic.js', 'store.js', 'seed.js', 'backup.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase data traffic is handled by Firebase itself.
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts.')) return;
  const cacheFirst = url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.gstatic.com';
  if (cacheFirst) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }
  if (url.origin === location.origin || url.hostname === 'fonts.googleapis.com') {
    // Network first so updates show straight away; fall back to the saved copy offline.
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))));
  }
});
