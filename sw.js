self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "TUSK Protocol", body: event.data?.text() || "Nuova notifica" };
  }

  const title = payload.title || "TUSK Protocol";
  const options = {
    body: payload.body || "Nuova notifica",
    icon: payload.icon || "/assets/icons/tusk-icon-192.png",
    badge: payload.badge || "/assets/icons/tusk-icon-192.png",
    tag: payload.tag || "tusk-notifica",
    data: {
      url: payload.url || "/giudici.html"
    },
    requireInteraction: payload.requireInteraction !== false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/giudici.html";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const targetUrl = new URL(url, self.location.origin).href;
    for (const client of allClients) {
      if (client.url === targetUrl && "focus" in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
    return undefined;
  })());
});
