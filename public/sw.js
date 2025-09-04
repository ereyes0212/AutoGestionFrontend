// public/sw.js
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'Nueva notificación', {
            body: data.body || 'Tienes una nueva notificación.',
            icon: data.icon || '/icons/notification.png',
            data: data.url || '/'
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) if (client.url === url && 'focus' in client) return client.focus();
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
