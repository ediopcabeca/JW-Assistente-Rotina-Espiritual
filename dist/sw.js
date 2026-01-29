// sw.js - update: 2026-01-28 12:40
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        return caches.delete(key);
      }));
    }).then(() => {
      return self.registration.unregister();
    })
  );
});