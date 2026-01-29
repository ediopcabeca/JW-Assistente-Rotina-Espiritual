// sw.js - v1.0.4 (Notification Actions & Sync)
const CACHE_NAME = 'jw-assistant-v2';

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
    // Para simplificar na web sem backend de push, o "adiar" abre o app 
    // para que o app possa reagendar localmente ou apenas foca no app.
    event.waitUntil(openApp('/?action=snooze&id=' + notification.tag));
  } else {
    // Ação padrão: apenas abrir/focar no app
    event.waitUntil(openApp('/'));
  }
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