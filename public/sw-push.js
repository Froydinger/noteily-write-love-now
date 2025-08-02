// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: false,
      silent: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error processing push:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  
  // Handle different notification types
  let url = '/';
  if (data.type === 'note_shared' && data.noteId) {
    url = `/note/${data.noteId}`;
  } else if (data.type === 'daily_prompt') {
    url = '/prompts';
  }
  
  event.waitUntil(
    clients.matchAll().then(function(clientList) {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // Could track notification close events here
});