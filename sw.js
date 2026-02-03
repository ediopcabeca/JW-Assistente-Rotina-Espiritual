// sw.js - v1.7.1 (Push-to-Fetch + Cache Flush)
const CACHE_NAME = 'jw-assistant-v11';

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

// ESCUTADOR DE PUSH (O Coração da v1.7.0)
self.addEventListener('push', (event) => {
  let promise;

  if (event.data) {
    // Se veio com dados (improvável no nosso PHP atual), usa eles
    try {
      const data = event.data.json();
      promise = Promise.resolve(data);
    } catch (e) {
      promise = Promise.resolve({ title: 'Lembrete JW', body: event.data.text() });
    }
  } else {
    // ESTRATÉGIA PUSH-TO-FETCH (v1.7.0)
    // Busca os dados no servidor porque o push veio "vazio" (apenas sinal de acorda)
    console.log("[SW] Push vazio recebido, buscando detalhes...");

    // Tenta recuperar o token do IndexedDB ou do Cache (aqui usamos uma estratégia de fetch simples)
    // Nota: O servidor precisa identificar o usuário. Normalmente usamos o endpoint de subscrição como ID.
    promise = fetch('/api/push_fetch.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') return data;
        throw new Error("Sem dados");
      });
  }

  event.waitUntil(
    promise.then(data => {
      return self.registration.showNotification(data.title || 'Lembrete JW', {
        body: data.body || 'Atividade agendada!',
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
      });
    }).catch(err => {
      console.warn("[SW] Falha ao processar push:", err);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});