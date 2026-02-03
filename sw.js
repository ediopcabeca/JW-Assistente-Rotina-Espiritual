// sw.js - v1.6.4 (Force Cache Update + Debug Logs)
const CACHE_NAME = 'jw-assistant-v6';

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado.');
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action);
  const notification = event.notification;
  notification.close();

  if (event.action === 'snooze_1h') {
    event.waitUntil(openApp('/?action=snooze&id=' + notification.tag));
  } else {
    event.waitUntil(openApp('/'));
  }
});

self.addEventListener('push', (event) => {
  console.log('[SW] Evento Push recebido.');
  let data = { title: 'Lembrete JW', body: 'É hora da sua atividade espiritual!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    // requireInteraction removido por segurança na v1.6.4
    data: data.url || '/',
    tag: data.tag || 'jw-push-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .catch(err => console.error('[SW] Erro ao mostrar notificação:', err))
  );
});

async function openApp(url) {
  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    if (client.url.includes(location.origin) && 'focus' in client) {
      return client.focus();
    }
  }
  if (clients.openWindow) {
    return clients.openWindow(url);
  }
}

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});