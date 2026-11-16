// sw.js — 족발 비즈니스 솔루션 연구소 PWA 서비스워커
// 캐시 우선(cache-first): 오프라인에서도 랜딩이 뜨도록 핵심 자산 캐시.
const CACHE = 'jokbal-lab-v1';
const ASSETS = ['./', './index.html', './manifest.json', './favicon.svg', './solution.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
