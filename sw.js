const CACHE_NAME = 'addition-playground-dynamic';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.ico'
];

// 설치 즉시 대기 상태를 건너뛰고 새 서비스 워커 활성화
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

// 활성화 즉시 열린 모든 탭/앱 화면의 제어권 확보
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 네트워크 우선 전략 (코드 수정 시 즉시 최신본 반영, 오프라인 시에만 캐시 사용)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});