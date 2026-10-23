/* Spartan 2027 — offline service worker.
   Bump CACHE_VERSION whenever any file changes, or phones keep the old copy. */

const CACHE_VERSION = "spartan-2027-v4";

const CORE = [
  "./",
  "./index.html",
  "./app.js",
  "./plan.js",
  "./figure.js",
  "./moves.js",
  "./store.js",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./helmet.svg",
  "./fonts/big-shoulders.woff2",
  "./fonts/barlow-400.woff2",
  "./fonts/barlow-600.woff2",
  "./fonts/barlow-700.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* The BlueStep endpoint is never cached: the log lives in the app's own storage. */
  if (url.origin !== self.location.origin) return;

  /* Cache-first so the gym basement with no signal still works; refresh in
     the background when there is a connection. */
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const refresh = fetch(req).then(async (fresh) => {
      if (fresh && fresh.ok) { const c = await caches.open(CACHE_VERSION); await c.put(req, fresh.clone()); }
      return fresh;
    }).catch(() => null);
    if (cached) { event.waitUntil(refresh); return cached; }
    const fresh = await refresh;
    if (fresh) return fresh;
    if (req.mode === "navigate") { const shell = await caches.match("./index.html"); if (shell) return shell; }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  })());
});
