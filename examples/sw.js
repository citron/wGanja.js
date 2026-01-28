// Service Worker for CoffeeShop - Offline Support
const CACHE_NAME = 'coffeeshop-v1';
const urlsToCache = [
  '/examples/coffeeshop.html',
  '/examples/coffeeshop.js',
  '/examples/coffeeshop.css',
  '/ganja.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js',
  'https://cdn.jsdelivr.net/npm/katex@0.10.0/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.10.0/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.10.0/dist/contrib/auto-render.min.js',
  'https://fonts.googleapis.com/css?family=Encode+Sans+Condensed',
  'https://enkimute.github.io/ganja.js/images/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.log('Service Worker: Cache failed for some resources', err);
            // Continue even if some resources fail to cache
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network failed, try to return cached version
          return caches.match(event.request);
        });
      })
  );
});
