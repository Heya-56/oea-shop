const CACHE_NAME = 'oea-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/boutique.html',
  '/personnalisation.html',
  '/a-propos.html',
  '/contact.html',
  '/mentions-legales.html',
  '/politique-confidentialite.html',
  '/css/style.css',
  '/js/main.js',
  '/assets/images/logo-oea-mark-dark.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).catch(() => caches.match('/boutique.html')))
  );
});