const CACHE_NAME = "chefbox-shell-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icon.svg", "/manifest.webmanifest"];

function shouldHandleRequest(request) {
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return false;
  }

  if (requestUrl.origin !== self.location.origin) {
    return false;
  }

  if (request.mode === "navigate") {
    return true;
  }

  if (requestUrl.pathname.startsWith("/_next/") || requestUrl.pathname.startsWith("/api/")) {
    return false;
  }

  return request.destination === "image" || request.destination === "font";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandleRequest(event.request)) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));

          return networkResponse;
        })
        .catch(() => caches.match("/icon.svg"));
    }),
  );
});