const CACHE_NAME = 'business-card-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/manifest.json',
];

const IMAGE_CACHE_NAME = 'business-card-images-v1';
const IMAGES_TO_CACHE = [
  '/static/images/icon-192.svg',
  '/static/images/icon-512.svg',
  '/static/images/icon-192-maskable.svg',
  '/static/images/icon-512-maskable.svg',
  '/static/images/contact-info.svg',
  '/static/images/item-location.svg',
  '/static/images/splash-1290x2796.svg',
  '/static/images/splash-1179x2556.svg',
  '/static/images/splash-1284x2778.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS_TO_CACHE)),
      caches.open(IMAGE_CACHE_NAME)
        .then(cache => cache.addAll(IMAGES_TO_CACHE))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle image requests separately
  if (event.request.destination === 'image' || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(IMAGE_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
