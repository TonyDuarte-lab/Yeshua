const CACHE_NAME = "frente-parrilla-v2";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const esNavegacion = req.mode === "navigate" ||
    (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

  if (esNavegacion) {
    // Para el HTML principal: siempre intenta traer la version mas nueva de internet primero.
    // Solo usa la copia guardada si no hay conexion.
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          return resp;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // Para el resto de los archivos (iconos, manifest, logo): caché primero, mas rapido.
    e.respondWith(
      caches.match(req).then((resp) => resp || fetch(req))
    );
  }
});
