const CACHE_NAME = 'app-cache-v3';

// Cài đặt: Buộc Service Worker mới kích hoạt ngay lập tức
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Kích hoạt: Tự động dọn sạch tất cả cache phiên bản cũ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Lấy dữ liệu: Network First (ưu tiên tải mới nhất từ mạng trước, mất mạng mới dùng cache)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});