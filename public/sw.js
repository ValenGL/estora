// public/sw.js
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
});

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/assets/images/estora.jpg",
    badge: "/assets/images/estora.jpg",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
