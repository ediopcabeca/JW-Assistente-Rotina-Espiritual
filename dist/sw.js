// sw.js - v1.7.2 (Authenticated Push-to-Fetch)
const CACHE_NAME = 'jw-assistant-v12';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Função auxiliar para pegar o token do IndexedDB
function getToken() {
  return new Promise((resolve) => {
    const request = indexedDB.open("JWAssistantDB", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("auth")) return resolve(null);
      const tx = db.transaction("auth", "readonly");
      const store = tx.objectStore("auth");
      const getReq = store.get("token");
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    getToken().then(token => {
      if (!token) {
        console.warn("[SW] Token não encontrado no IndexedDB.");
        return self.registration.showNotification('Lembrete JW', {
          body: 'Você tem uma atividade agendada! (Abra o app para ver)',
          icon: '/icon.png',
          requireInteraction: true
        });
      }

      return fetch('/api/push_fetch.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            return self.registration.showNotification(data.title, {
              body: data.body,
              icon: '/icon.png',
              badge: '/icon.png',
              vibrate: [200, 100, 200],
              requireInteraction: true
            });
          }
        });
    }).catch(err => {
      console.error("[SW] Falha ao processar push:", err);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});