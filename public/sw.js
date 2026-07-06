importScripts('/workbox/workbox-sw.js')

if (!workbox) {
  console.error('Workbox failed to load')
}

workbox.setConfig({
  debug: false,
  modulePathPrefix: '/workbox/',
})

const CACHE_NAME = 'chronoflow-v1'
workbox.core.setCacheNameDetails({
  prefix: 'chronoflow',
  suffix: 'v1',
  precache: CACHE_NAME,
  runtime: 'runtime',
  googleAnalytics: 'ga',
})

const { registerRoute } = workbox.routing
const {
  StaleWhileRevalidate,
  NetworkFirst,
  CacheFirst,
} = workbox.strategies
const { CacheableResponsePlugin } = workbox.cacheableResponse
const { ExpirationPlugin } = workbox.expiration

const staticHandler = new CacheFirst({
  cacheName: CACHE_NAME,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
})

registerRoute(
  ({ request }) => {
    const { mode, destination } = request
    if (mode === 'navigate') return false
    const ext = new URL(request.url).pathname.split('.').pop()
    return ['js', 'css', 'html', 'woff2', 'woff', 'ttf'].includes(ext)
  },
  staticHandler,
)

const imageHandler = new StaleWhileRevalidate({
  cacheName: `${CACHE_NAME}-images`,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
  ],
})

registerRoute(
  ({ request }) => {
    const ext = new URL(request.url).pathname.split('.').pop()
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)
  },
  imageHandler,
)

const apiHandler = new NetworkFirst({
  cacheName: `${CACHE_NAME}-api`,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
  ],
})

registerRoute(
  ({ url }) => /supabase\.co/.test(url.hostname),
  apiHandler,
)

const navHandler = new NetworkFirst({
  cacheName: CACHE_NAME,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
})

registerRoute(
  ({ request }) => request.mode === 'navigate',
  navHandler,
)

workbox.core.skipWaiting()
workbox.core.clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
