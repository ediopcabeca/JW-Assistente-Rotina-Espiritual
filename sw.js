// sw.js - v1.7.3 (iOS Resilience + Background Fallback)
const CACHE_NAME = 'jw-assistant-v13';

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

async function getToken() {
  try {
    return await new Promise((resolve) => {
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
  } catch (e) {
    return null;
  }
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
  console.log("[SW] Push recebido.");

  const showNotification = (title, body) => {
    return self.registration.showNotification(title || 'Lembrete JW', {
      body: body || 'Você tem uma atividade agendada agora!',
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: '/' }
    });
  };

  const promise = getToken().then(token => {
    if (!token) return showNotification();

    // Tenta buscar os dados reais, mas com timeout curto para o iOS não matar o SW
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    return fetch('/api/push_fetch.php', {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeout);
        if (data.status === 'success') {
          return showNotification(data.title, data.body);
        }
        return showNotification();
      })
      .catch(() => {
        return showNotification(); // Fallback genérico se tudo falhar
      });
  });

  event.waitUntil(promise);
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});