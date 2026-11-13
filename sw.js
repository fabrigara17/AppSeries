const CACHE = 'appseries-v2';
const ASSETS = [
  './',
  './index.html',
  './src/style/style.css',
  './src/views/register.html',
  './src/views/nueva-serie.html',
  './src/js/supabaseClient.js',
  './src/js/main.js',
  './src/js/series.js'
];

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});