const CACHE_NAME = 'addition-playground-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.ico'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

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

// icon.png(301x301)를 크롬 설치 규격(192x192, 512x512)으로 실시간 변환
async function generateResizedIcon(size) {
  const response = await fetch('./icon.png', { cache: 'no-cache' });
  const blob = await response.blob();

  if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, size, size);
    const resizedBlob = await canvas.convertToBlob({ type: 'image/png' });
    return new Response(resizedBlob, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' }
    });
  }
  return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/icon-192.png')) {
    event.respondWith(generateResizedIcon(192).catch(() => fetch('./icon.png')));
    return;
  }

  if (url.pathname.endsWith('/icon-512.png')) {
    event.respondWith(generateResizedIcon(512).catch(() => fetch('./icon.png')));
    return;
  }

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
