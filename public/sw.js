// Service Worker to intercept audio stream requests
// We proxy the fetch to bypass CORS via CapacitorHttp

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
  // We no longer need the /proxy-stream interceptor since we use JioSaavn CDN directly.
  // Capacitor handles standard fetch requests without CORS issues,
  // and native audio playback accesses the CDN perfectly.
});
