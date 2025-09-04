// public/sw.js

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    console.log('[SW] Push received:', data);

    // Siempre enviar un objeto en data
    const notificationData = {
        url: data.url || '/',
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Nueva notificación', {
            body: data.body || 'Tienes una nueva notificación.',
            icon: data.icon || '/icons/notification.png',
            data: notificationData,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Intentar enfocar una ventana existente
            for (const client of windowClients) {
                if ('focus' in client) {
                    client.focus();
                    // Si soporta navigate, navegar a la URL
                    return client.navigate ? client.navigate(url) : null;
                }
            }
            // Si no hay ventanas abiertas, abrir una nueva
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
