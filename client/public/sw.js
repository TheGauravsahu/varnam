const CACHE_NAME = 'varnam-client-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: Bypass caching and Service Worker interception entirely for Fastify API requests.
  // Returning immediately (without calling event.respondWith) lets the browser handle the network request naturally,
  // preventing TypeError rejections when reading POST body streams (such as during login and signup transactions).
  if (url.port === '5000' || url.pathname.includes('/api/')) {
    return;
  }

  // Network-First with Cache fallback strategy for frontend static resources and routes
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache fresh GET requests for local static assets
        if (response.status === 200 && event.request.method === 'GET' && (url.protocol === 'http:' || url.protocol === 'https:')) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is page navigation, serve our React SPA root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
