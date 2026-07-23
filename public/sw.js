const CACHE_NAME = "fl2-command-center-v8";
const CORE = [
  "/tools.html", "/hq.html", "/heroes.html", "/daily.html", "/shops.html",
  "/calculator.html", "/research.html", "/tank.html", "/index.html",
  "/app.webmanifest", "/styles.css", "/tools.css", "/tool-common.css", "/command-center.css", "/calculator.css",
  "/app.js", "/profile-store.js", "/tool-common.js", "/tools.js",
  "/calculator-engine.js", "/calculator.js", "/progress-backup.js",
  "/research-engine.js", "/research.js", "/tank-engine.js", "/tank.js",
  "/hq-engine.js", "/hq.js", "/hero-engine.js", "/heroes.js",
  "/daily-engine.js", "/daily.js", "/shop-engine.js", "/shops.js",
  "/assets/brand/fl2-mark.svg",
  "/assets/calculator/equipment-promotion.webp", "/assets/calculator/power-core.webp", "/assets/calculator/merit-prices-reddit.jpeg",
  "/assets/heroes/alma.png", "/assets/heroes/amelia.png", "/assets/heroes/ava.png", "/assets/heroes/bella.png",
  "/assets/heroes/chinatsu.png", "/assets/heroes/christina.png", "/assets/heroes/dodomeki.png", "/assets/heroes/elizabeth.png",
  "/assets/heroes/evelyn.png", "/assets/heroes/fiona.png", "/assets/heroes/harleyna.png", "/assets/heroes/isabella.png",
  "/assets/heroes/katrina.png", "/assets/heroes/laura.png", "/assets/heroes/leah.png", "/assets/heroes/licia.png",
  "/assets/heroes/liliana.png", "/assets/heroes/maria.png", "/assets/heroes/mia.png", "/assets/heroes/miranda.png",
  "/assets/heroes/nyx.png", "/assets/heroes/oliveira.png", "/assets/heroes/sakura.png", "/assets/heroes/scarlett.png",
  "/assets/heroes/selena.png", "/assets/heroes/sophia.png", "/assets/heroes/vivian.png", "/assets/heroes/yu-chan.png",
  "/data/docs.json", "/data/manifest.json", "/data/research-trees.json", "/data/tank-modifications.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(CORE.map((url) => new Request(url, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("fl2-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/api/event" && request.method === "POST") {
    event.respondWith(fetch(request).catch(() => new Response(null, { status: 202 })));
    return;
  }
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); return response;
    }).catch(() => caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match("/tools.html"))));
    return;
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((cached) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
