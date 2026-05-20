/* Service Worker — Açaí Control PWA */
const CACHE = 'acai-control-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Instalación: precachear los archivos de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

// Activación: borrar versiones viejas de la caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first para la app, red directa para la sincronización
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // La sincronización (jsonblob.com) siempre va a la red, nunca a caché
  if (url.hostname.indexOf('jsonblob.com') !== -1) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // guardar copia en caché para uso offline
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // si falla la red y es una navegación, devolver la app
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
