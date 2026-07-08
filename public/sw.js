const CACHE_NAME = 'word-paws-offline-v1'
const BASE = '/wordgames'
const APP_SHELL = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/favicon.svg`,
  `${BASE}/icon-192.svg`,
  `${BASE}/icon-512.svg`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetchNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function fetchNavigation(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)

    if (response.ok) {
      cache.put(`${BASE}/index.html`, response.clone())
    }

    return response
  } catch {
    return (await cache.match(`${BASE}/index.html`)) || (await cache.match(`${BASE}/`)) || Response.error()
  }
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)

  const response = await fetch(`${BASE}/index.html`, { cache: 'reload' })

  if (!response.ok) {
    return
  }

  const html = await response.clone().text()
  await cache.put(`${BASE}/index.html`, response)
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((assetUrl) => assetUrl.startsWith(`${BASE}/assets/`))

  await cache.addAll(assetUrls)
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)

    if (response.ok) {
      cache.put(request, response.clone())
    }

    return response
  } catch {
    return Response.error()
  }
}
