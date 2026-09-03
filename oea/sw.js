/* ==========================================================================
   OEA Tahiti — Service Worker (désactivation d'urgence)

   Ce fichier remplace temporairement le service worker précédent, qui
   provoquait une erreur bloquante sur toutes les pages sauf l'accueil.

   Son unique rôle : se désinstaller lui-même chez CHAQUE visiteur qui a déjà
   l'ancien service worker enregistré, puis recharger la page proprement,
   sans qu'aucune manipulation ne soit nécessaire côté navigateur.

   Une version corrigée et fonctionnelle de la mise en cache pourra être
   réintroduite plus tard, une fois testée à tête reposée.
   ========================================================================== */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.registration.unregister()
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          client.navigate(client.url);
        });
      })
  );
});

/* Pas de gestionnaire "fetch" : toutes les requêtes passent directement au
   réseau, sans aucune interception, le temps que la désinstallation se fasse. */
