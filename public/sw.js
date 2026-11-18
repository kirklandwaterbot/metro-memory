const CACHE_NAME = 'metro-memory-v5'
const CITY_CACHE_PREFIX = 'metro-memory-city-'
const OFFLINE_MANIFEST_URL = '/offline-manifest.json'
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  OFFLINE_MANIFEST_URL,
]

self.addEventListener('install', (event) => {
  // Only the app shell is cached up front. Cities are cached when the player
  // downloads them (CACHE_CITY), so installing the worker stays small.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          // Downloaded cities live in their own caches and must survive updates.
          .filter((key) => key !== CACHE_NAME && !key.startsWith(CITY_CACHE_PREFIX))
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

const cityCaches = async () =>
  Promise.all(
    (await caches.keys())
      .filter((key) => key.startsWith(CITY_CACHE_PREFIX))
      .map((key) => caches.open(key)),
  )

async function matchCityCaches(request, options) {
  for (const cache of await cityCaches()) {
    const match = await cache.match(request, options)
    if (match) return match
  }
  return null
}

async function cacheFirst(request) {
  const cityMatch = await matchCityCaches(request)
  if (cityMatch) return cityMatch

  const cache = await caches.open(CACHE_NAME)
  const match = await cache.match(request)
  if (match) return match

  const response = await fetch(request)
  if (response && response.ok) {
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, matchOptions) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone())
      // Keep downloaded cities current: refresh any city cache holding this URL.
      for (const cityCache of await cityCaches()) {
        if (await cityCache.match(request, matchOptions)) {
          cityCache.put(request, response.clone())
        }
      }
    }
    return response
  } catch (error) {
    const match = await cache.match(request, matchOptions)
    if (match) return match
    const cityMatch = await matchCityCaches(request, matchOptions)
    if (cityMatch) return cityMatch
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Map label glyphs never change for a given font and range.
  if (url.pathname.startsWith('/api/geo/glyphs/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // City data is updated between deploys, so prefer the network and fall
  // back to the copy saved when the city was downloaded.
  if (url.pathname.startsWith('/city-data')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (
    url.pathname.startsWith('/city-icons') ||
    url.pathname.startsWith('/city-cards') ||
    url.pathname.startsWith('/images')
  ) {
    event.respondWith(networkFirst(request))
    return
  }

  if (request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      networkFirst(request, { ignoreVary: true }).catch(async () => {
        const page =
          (await matchCityCaches(request, { ignoreSearch: true, ignoreVary: true })) ||
          (await caches.open(CACHE_NAME).then((cache) =>
            cache.match(request, { ignoreSearch: true, ignoreVary: true }),
          ))
        if (page) return page
        const cache = await caches.open(CACHE_NAME)
        const fallback = await cache.match('/', { ignoreVary: true })
        return fallback || Response.error()
      }),
    )
    return
  }
})

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}
  const port = event.ports?.[0]
  const reply = (message) => {
    if (port) {
      port.postMessage(message)
    }
  }

  if (type === 'CACHE_CITY') {
    event.waitUntil(
      (async () => {
        try {
          const citySlug = payload?.citySlug
          const assets = Array.isArray(payload?.assets) ? payload.assets : []
          if (!citySlug || assets.length === 0) {
            throw new Error('Missing city assets')
          }
          const cacheName = `${CITY_CACHE_PREFIX}${citySlug}`
          const existed = await caches.has(cacheName)
          const cache = await caches.open(cacheName)
          const failedAssets = []
          let next = 0
          // A few requests at a time: a city can need a few hundred files.
          const worker = async () => {
            while (next < assets.length) {
              const asset = assets[next++]
              try {
                let response = await fetch(new Request(asset, { cache: 'reload' }))
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                if (response.redirected) {
                  // Navigations refuse redirected responses, so store a plain copy.
                  response = new Response(await response.blob(), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                  })
                }
                await cache.put(asset, response)
              } catch {
                failedAssets.push(asset)
              }
            }
          }
          await Promise.all(Array.from({ length: 6 }, worker))
          const cachedCount = assets.length - failedAssets.length
          const required = Array.isArray(payload?.required) ? payload.required : []
          const missingRequired = required.filter((asset) => failedAssets.includes(asset))
          if (cachedCount === 0 || missingRequired.length > 0) {
            if (!existed) await caches.delete(cacheName)
            reply({
              ok: false,
              error: `Could not download ${missingRequired[0] ?? 'the city'}`,
              failedAssets,
            })
            return
          }
          reply({ ok: true, cachedCount, failed: failedAssets.length, failedAssets })
        } catch (error) {
          reply({ ok: false, error: error?.message || 'Unable to cache city' })
        }
      })(),
    )
    return
  }

  if (type === 'DELETE_CITY') {
    event.waitUntil(
      (async () => {
        try {
          const citySlug = payload?.citySlug
          if (!citySlug) {
            throw new Error('Missing city')
          }
          await caches.delete(`${CITY_CACHE_PREFIX}${citySlug}`)
          reply({ ok: true })
        } catch (error) {
          reply({ ok: false, error: error?.message || 'Unable to delete city' })
        }
      })(),
    )
  }
})
