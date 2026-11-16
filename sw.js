// sw.js — 족발 비즈니스 솔루션 연구소 PWA 서비스워커
// HTML(내비게이션)은 네트워크 우선 → 항상 최신 배포 반영, 오프라인이면 캐시 폴백.
// 그 외 자산(JSON/이미지)은 캐시 우선.
const CACHE = 'jokbal-lab-v2';
const ASSETS = ['./', './index.html', './manifest.json', './favicon.svg', './data/ontology.json', './data/stores.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
  // 내비게이션(HTML) → 네트워크 우선
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // 그 외 → 캐시 우선
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
