const CACHE = 'chronoflow-v2'
const STATIC_CACHE = 'chronoflow-static-v2'
const API_CACHE = 'chronoflow-api-v2'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const keep = new Set([CACHE, STATIC_CACHE, API_CACHE])
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

function isApiRequest(url) {
  const u = new URL(url)
  return u.hostname === 'dkuwoqqgdihmkadkiczu.supabase.co'
}

function isStaticAsset(url) {
  const u = new URL(url)
  const ext = u.pathname.split('.').pop()
  return ['js', 'css', 'woff2', 'woff', 'ttf', 'svg', 'png', 'ico', 'webp'].includes(ext)
}

function isNavigation(url) {
  const u = new URL(url)
  return u.origin === location.origin && u.pathname === '/'
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (isApiRequest(request.url)) {
    event.respondWith(networkFirst(request, API_CACHE))
  } else if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request))
  } else if (isNavigation(request.url)) {
    event.respondWith(networkFirst(request, STATIC_CACHE))
  } else {
    event.respondWith(networkFirst(request, CACHE))
  }
})

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      caches.open(cacheName).then((cache) => cache.put(request, clone))
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      return caches.match('/')
    }
    return new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}
