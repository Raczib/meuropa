// Guarda la app, el itinerario cifrado y los documentos en el teléfono para que funcione sin internet.
// build.mjs cambia CACHE y la lista DATA cada vez que cambia el contenido; el teléfono baja la nueva versión
// la próxima vez que abra la app con internet.
const CACHE = "meuropa-dc409005b4";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
  "vendor/pdfjs/pdf.min.js", "vendor/pdfjs/pdf.worker.min.js"];
const DATA = /* DATA:start */ ["data.bin","meta.json","docs/94f11a8b21318f38.bin","docs/c2d1f0122b1efe92.bin","docs/783fbeccc622de8d.bin","docs/9b6646fb665e292c.bin","docs/7a81296c2923f559.bin","docs/367250753327b284.bin","docs/8c7061170708c302.bin","docs/be401559d4ec5ce2.bin","docs/8a517f5c92849ee6.bin","docs/4bbbd3715fb73bc7.bin","docs/1bf867d13270cb86.bin","docs/a3c28a3b95c6fe73.bin","docs/925925d9aa79bf19.bin","docs/5e7015024e08ccee.bin","docs/a1afcb012922124e.bin","docs/344097c85aa4a01b.bin","docs/be553f7c0638cc48.bin","docs/d31b308d66dcf6a1.bin","docs/4e8574ffd323c588.bin","docs/b4230a85dbcae7ba.bin","docs/86e4b3914906f2d6.bin","docs/699e6eda6c0ef182.bin","docs/d12e9ae98d2d6c2c.bin","docs/97a612f21551ff6f.bin","docs/88b22a722f624db6.bin","docs/9ba395d55e65cbaa.bin","docs/0bae44d8ac4307c0.bin","docs/48bfae1dfebaa304.bin","docs/a8f5fe134b9b7179.bin","docs/2a0f60689efda2fe.bin"] /* DATA:end */;

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
