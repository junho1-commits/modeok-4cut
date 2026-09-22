// 모덕 네컷 휴대폰판 — 한 번 연 파일을 저장해 두어 다음엔 빨리 열림 (항상 인터넷을 먼저 시도하고, 안 되면 저장본 사용)
const CACHE = 'modeok-4cut-mobile-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // Apps Script 요청 등은 건드리지 않음
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request)));
});
