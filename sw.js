const CACHE = 'gather-shell-fecf9d59a3e7';
const SHELL = ['./', './index.html', './ui-dist/r-fecf9d59a3e7/gather.js', './ui-dist/r-fecf9d59a3e7/gather.css', './icon.svg', './manifest.webmanifest', './fonts/geist-serif.woff2', './fonts/geist-sans.woff2', './fonts/geist-mono.woff2', './ui-dist/gather.webp'];
const assets = new Set(SHELL.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('gather-shell-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  url.hash = '';
  const relativePath = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (url.origin === location.origin && request.method === 'GET' && (/^ui-dist\/assets\/[A-Za-z0-9_-]+\.js$/.test(relativePath) || relativePath === 'ui-dist/gather2.css')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const existing = await cache.match(request);
      if (existing) return existing;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }
  if (request.method !== 'GET' || !assets.has(url.href)) return;
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(CACHE);
      return await cache.match(url.href) || Response.error();
    }
  })());
});
