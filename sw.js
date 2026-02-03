// sw.js - v1.6.3 (Force Cache Update + Persistent Notifications)
const CACHE_NAME = 'jw-assistant-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle notification click and actions
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'snooze_1h') {
    event.waitUntil(openApp('/?action=snooze&id=' + notification.tag));
  } else {
    event.waitUntil(openApp('/'));
  }
});

// Handle real push notifications from server
self.addEventListener('push', (event) => {
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
    requireInteraction: true, // FAZ A NOTIFICAÇÃO FICAR PARADA NA TELA
    data: data.url || '/',
    tag: data.tag || 'jw-push-notification',
    actions: [
      { action: 'open_app', title: 'Ver' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
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

// Basic fetch handler (Network first)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});