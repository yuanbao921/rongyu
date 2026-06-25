/* ============================================================
   sw.js — Service Worker
   离线缓存策略：核心资源 Cache First，API 请求 Network First
   ============================================================ */

const CACHE_NAME    = 'rongyu-v1';
const CACHE_TIMEOUT = 3000; // 网络超时后降级读缓存（毫秒）

// 需要预缓存的核心资源（安装时全部下载到本地）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/layout.css',
  './css/components.css',
  './css/animations.css',
  './css/responsive.css',
  './js/utils.js',
  './js/wallpaper.js',
  './js/animation.js',
  './js/weather.js',
  './js/music.js',
  './js/notes.js',
  './js/chat.js',
  './js/main.js',
];

/* ---------- 安装：预缓存核心资源 ---------- */
self.addEventListener('install', event => {
  self.skipWaiting(); // 立即激活新版本
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

/* ---------- 激活：清理旧缓存 ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- 拦截请求 ---------- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API 请求（DeepSeek / ElevenLabs / OpenWeatherMap）→ Network First
  const isApiRequest =
    url.hostname.includes('deepseek.com') ||
    url.hostname.includes('elevenlabs.io') ||
    url.hostname.includes('openweathermap.org') ||
    url.hostname.includes('66mz8.com');

  if (isApiRequest) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 其余资源（HTML / CSS / JS）→ Cache First
  event.respondWith(cacheFirst(event.request));
});

/* ---------- 策略：Cache First ---------- */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 完全离线且缓存未命中，返回空响应
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/* ---------- 策略：Network First（带超时降级）---------- */
async function networkFirst(request) {
  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve(null), CACHE_TIMEOUT)
  );

  try {
    const response = await Promise.race([
      fetch(request),
      timeoutPromise,
    ]);

    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }

    // 超时或请求失败，降级读缓存
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });

  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}
