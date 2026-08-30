/* ==========================================================================
   OEA — Service Worker (PWA)
   Stratégie volontairement prudente pour un site e-commerce :
   - Met en cache uniquement les fichiers statiques du même domaine (HTML, CSS,
     JS, icônes) pour permettre l'installation et un chargement plus rapide.
   - Ne met JAMAIS en cache les appels vers Airtable/le Worker Cloudflare,
     Stripe Checkout ou Web3Forms : ces requêtes passent toujours en direct
     sur le réseau pour garantir des prix et un paiement toujours à jour.
   ========================================================================== */

var CACHE_NAME = 'oea-shell-v1';

var ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/boutique.html',
  '/panier.html',
  '/a-propos.html',
  '/contact.html',
  '/css/style.css',
  '/js/main.js',
  '/js/cart.js',
  '/js/cart-page.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/images/logo-oea-mark-dark.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(ASSETS_TO_CACHE); })
      .catch(function () { /* installation silencieuse même si un fichier manque */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  /* Laisse passer sans interception :
     - toute requête vers un autre domaine (Airtable/Worker, Stripe, Web3Forms, polices, images stock)
     - toute requête non-GET (POST vers le Worker de paiement, formulaires) */
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  /* Stale-while-revalidate pour les fichiers statiques du site */
  event.respondWith(
    caches.match(request).then(function (cached) {
      var networkFetch = fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
          }
          return response;
        })
        .catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
