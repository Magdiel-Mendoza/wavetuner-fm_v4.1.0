// ═══════════════════════════════════════════════════════════════
// WaveTuner FM — Service Worker v4.5.0
// ═══════════════════════════════════════════════════════════════
const CACHE_NAME = 'wtfm-v450';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: cachear archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: red primero, cache como fallback
// Los streams de audio NO se cachean (son infinitos)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // No interceptar streams de audio ni APIs externas
  if (
    url.includes('radio-browser.info') ||
    url.includes('stream') ||
    url.includes('.mp3') ||
    url.includes('.aac') ||
    url.includes('.m3u') ||
    url.includes('.pls') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    return; // dejar pasar sin interceptar
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia en cache si es un recurso propio
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: servir desde cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
