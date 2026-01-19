const CACHE_NAME = 'musicflow-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // CRITICAL: Never intercept audio/stream requests - let them go directly
  if (event.request.url.includes('/api/stream')) return;
  if (event.request.url.includes('/api/')) return;
  
  // Skip YouTube requests
  if (event.request.url.includes('youtube.com') || event.request.url.includes('ytimg.com')) return;
  
  // Skip audio/video MIME types
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version if offline
        return caches.match(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
});

// Push notifications (future)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'MusicFlow', body: 'New music available!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

// Handle audio focus and background playback messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    console.log('🎵 Received keep-alive ping for background playback');
  }
});

console.log('🎵 MusicFlow Service Worker v2 loaded - Background Audio Optimized');
