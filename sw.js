// Guarda la app, el itinerario cifrado y los documentos en el teléfono para que funcione sin internet.
// build.mjs cambia CACHE y la lista DATA cada vez que cambia el contenido; el teléfono baja la nueva versión
// la próxima vez que abra la app con internet.
const CACHE = "meuropa-f9b30f8eb7";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
  "vendor/pdfjs/pdf.min.js", "vendor/pdfjs/pdf.worker.min.js"];
const DATA = /* DATA:start */ ["data.bin","meta.json","docs/dc1cc0406224d18c.bin","docs/b7626afd39b15bd2.bin","docs/7fc53b0792943219.bin","docs/cdd418f5b29b6059.bin","docs/fa188d0e70feeb5c.bin","docs/d6205c8559dee5a6.bin","docs/163a3a222f6092de.bin","docs/56f670da0f1917f9.bin","docs/73428b9c653613c1.bin","docs/a2e4c2803305acb5.bin","docs/41324926d1819feb.bin","docs/d0330d6a14d70c77.bin","docs/a61aca9aa83c7114.bin","docs/5690736c52815c00.bin","docs/4806d4afe5910d9e.bin","docs/eb307f7146d6c938.bin","docs/c3e2f1430201a328.bin","docs/54d58442a5e507bd.bin","docs/f1fce42b677e44ce.bin","docs/047bf2aaf4f7e1ce.bin","docs/9d125bdb2d319d30.bin","docs/500d60c615e6786d.bin","docs/f3ec9310f93f45de.bin","docs/6a89be57b73a0214.bin","docs/813d8f840ec6d9f1.bin","docs/36942ccf98033499.bin","docs/751fcf843d545008.bin","docs/9b6d02dc15d92cd3.bin","docs/6662ba7dfeeab3ab.bin","docs/9add7859fd4120e2.bin"] /* DATA:end */;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...CORE, ...DATA])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Itinerario y llave: primero internet (por si cambió la contraseña o el viaje), si no hay, la copia guardada.
    if (/\/(data\.bin|meta\.json)$/.test(url.pathname)) {
      e.respondWith(fetch(req, { cache: "no-store" }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }))));
      return;
    }
    // Todo lo propio sale de la copia guardada; si falta, se pide a la red.
    const key = req.mode === "navigate" ? "index.html" : req;
    e.respondWith(caches.open(CACHE).then(c => c.match(key, { ignoreSearch: true }).then(hit => hit || fetch(req))));
    return;
  }
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
