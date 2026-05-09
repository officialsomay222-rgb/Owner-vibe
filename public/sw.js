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
  const url = new URL(event.request.url);

  // Check if this is a proxy stream request
  if (url.pathname === '/proxy-stream') {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      event.respondWith(new Response('Missing target URL', { status: 400 }));
      return;
    }

    // Extract headers (like Range) to pass along
    const headers = new Headers();
    if (event.request.headers.has('Range')) {
      headers.set('Range', event.request.headers.get('Range') || '');
    }

    // Perform the fetch.
    // Because this fetch runs in the Service Worker and the app is running in Capacitor,
    // CapacitorHttp will intercept it natively, bypassing WebView CORS.
    event.respondWith(
      fetch(targetUrl, {
        method: 'GET',
        headers: headers,
        // mode: 'cors' - no-cors or let CapacitorHttp handle it
      }).then(response => {
        // Forward the response back to the audio tag
        const resHeaders = new Headers(response.headers);
        // Force headers if needed, but standard should be fine
        resHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: resHeaders
        });
      }).catch(err => {
        console.error('Service Worker proxy fetch failed:', err);
        return new Response('Proxy fetch failed', { status: 500 });
      })
    );
  }
});
