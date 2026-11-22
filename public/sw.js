self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.open("early-rise-v1").then(async (cache) => {
      try {
        const network = await fetch(req);
        if (req.url.includes("/_next/static/") || req.url.endsWith(".webmanifest")) {
          cache.put(req, network.clone());
        }
        return network;
      } catch {
        const cached = await cache.match(req);
        return cached || Response.error();
      }
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "小小作息", body: "提醒时间到了", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url || "/" },
      icon: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
