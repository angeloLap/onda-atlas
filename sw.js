const CACHE = "onda-atlas-v2";
const SCOPE = new URL(self.registration.scope).pathname;
const at = (path) => `${SCOPE}${path}`;

const SHELL = [
  SCOPE,
  at("index.html"),
  at("manifest.webmanifest"),
  at("icons/icon-180.png"),
  at("icons/icon-192.png"),
  at("icons/icon-512.png"),
  at("icons/icon-maskable-512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL).catch(() => {});
      try {
        const response = await fetch(at("index.html"));
        const html = await response.text();
        const base = new URL(SCOPE, self.location.origin);
        const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((match) => new URL(match[1], base).pathname)
          .filter(
            (path) =>
              path.startsWith(SCOPE) &&
              !SHELL.includes(path) &&
              !path.endsWith("/sw.js"),
          );
        await Promise.all(
          assets.map((path) => cache.add(path).catch(() => {})),
        );
      } catch {
        // Se il precache degli asset fallisce, il runtime caching li recupera.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ||
            (await caches.match(at("index.html")));
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      });
    }),
  );
});
