// Service Worker for handling push notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/logo192.png', // Make sure this icon exists in your public folder
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'notification',
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Indimitra Notification', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // You can customize this to open specific URLs based on the notification
    clients.openWindow('/');
  }
});
