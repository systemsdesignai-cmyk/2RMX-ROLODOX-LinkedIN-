// Service Worker Web Push & Notification Click Handler for Remix Rolodox
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🔔 Rolodox Reminder', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Relationship Follow-up Due';
  const options = {
    body: data.body || 'You have a contact scheduled for follow-up today.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [150, 80, 150],
    tag: data.tag || `maint-${data.contactId || 'general'}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || `/?openMaintenanceContact=${data.contactId || ''}`,
      contactId: data.contactId,
      scheduledDate: data.scheduledDate,
      action: data.action || 'maintain'
    },
    actions: [
      { action: 'maintain', title: 'Maintain Now' },
      { action: 'snooze', title: 'Remind Later' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const contactId = notifData.contactId;
  const action = event.action || 'open';

  // Construct target URL with parameter
  const targetUrl = new URL(self.registration.scope, self.location.origin);
  if (contactId) {
    targetUrl.searchParams.set('openMaintenanceContact', contactId.toString());
  }
  if (action === 'snooze') {
    targetUrl.searchParams.set('snoozeReminder', 'true');
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window client is already open, focus it and broadcast event
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            contactId,
            action,
            timestamp: Date.now()
          });
          return client.navigate(targetUrl.href);
        }
      }
      // If no window is open, open a fresh window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});
