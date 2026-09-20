const SYNC_MANIFEST = '_metro-memory-assets-manifest-v1.json'
const READABLE_PREFIXES = ['images/', 'city-cards/', 'city-data/']

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Cache-Control, X-Metro-Sha256',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Origin': '*',
}

const json = (value, init = {}) => {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value)
  return new Response(JSON.stringify(value), { ...init, headers })
}

const objectKeyFromRequest = (request) => {
  const encodedPath = new URL(request.url).pathname.replace(/^\/+/, '')
  try {
    return decodeURIComponent(encodedPath)
  } catch {
    return null
  }
}

const isReadableKey = (key) =>
  key === SYNC_MANIFEST || READABLE_PREFIXES.some((prefix) => key.startsWith(prefix))

const isAuthorized = (request, env) => {
  const authorization = request.headers.get('Authorization')
  return Boolean(env.R2_SYNC_TOKEN) && authorization === `Bearer ${env.R2_SYNC_TOKEN}`
}

const objectHeaders = (object) => {
  const headers = new Headers(corsHeaders)
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('X-Content-Type-Options', 'nosniff')
  if (object.customMetadata?.sha256) {
    headers.set('X-Metro-Sha256', object.customMetadata.sha256)
  }
  return headers
}

const serveObject = async (request, env, context, key) => {
  if (!isReadableKey(key)) return new Response('Not Found', { status: 404 })

  if (request.method === 'HEAD') {
    const object = await env.ASSETS.head(key)
    if (!object) return new Response('Not Found', { status: 404 })
    const headers = objectHeaders(object)
    headers.set('Content-Length', String(object.size))
    return new Response(null, { status: 200, headers })
  }

  const hasRange = request.headers.has('Range')
  const cache = caches.default
  const cacheKey = new Request(request.url, { method: 'GET' })

  if (!hasRange) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
  }

  const object = await env.ASSETS.get(key, {
    onlyIf: request.headers,
    range: request.headers,
  })
  if (!object) return new Response('Not Found', { status: 404 })

  const headers = objectHeaders(object)
  if (!('body' in object)) {
    const notModified =
      request.headers.has('If-None-Match') || request.headers.has('If-Modified-Since')
    return new Response(null, { status: notModified ? 304 : 412, headers })
  }

  let status = 200
  if (hasRange && object.range) {
    const offset = object.range.offset ?? 0
    const length = object.range.length ?? object.size - offset
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`)
    headers.set('Content-Length', String(length))
    status = 206
  } else {
    headers.set('Content-Length', String(object.size))
  }

  const response = new Response(object.body, { status, headers })
  if (status === 200) context.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

const inventory = async (env) => {
  const objects = []
  let cursor
  do {
    const page = await env.ASSETS.list({ cursor, limit: 1000 })
    for (const object of page.objects) {
      objects.push({ key: object.key, size: object.size, etag: object.etag })
    }
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor)
  return objects
}

export default {
  async fetch(request, env, context) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)
    if (url.pathname === '/_health') {
      return json({ ok: true, manifest: Boolean(await env.ASSETS.head(SYNC_MANIFEST)) })
    }

    if (url.pathname === '/_sync/inventory') {
      if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, { status: 401 })
      const objects = await inventory(env)
      return json({ objects })
    }

    const key = objectKeyFromRequest(request)
    if (!key || !isReadableKey(key)) return new Response('Not Found', { status: 404 })

    if (request.method === 'GET' || request.method === 'HEAD') {
      return serveObject(request, env, context, key)
    }

    if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, { status: 401 })

    if (request.method === 'PUT') {
      const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream'
      const cacheControl = request.headers.get('Cache-Control') ?? 'public, max-age=300'
      const sha256 = request.headers.get('X-Metro-Sha256') ?? ''
      const object = await env.ASSETS.put(key, request.body, {
        httpMetadata: { contentType, cacheControl },
        customMetadata: sha256 ? { sha256 } : {},
      })
      context.waitUntil(caches.default.delete(new Request(request.url, { method: 'GET' })))
      return json({ key, size: object.size, etag: object.etag }, { status: 201 })
    }

    if (request.method === 'DELETE') {
      await env.ASSETS.delete(key)
      context.waitUntil(caches.default.delete(new Request(request.url, { method: 'GET' })))
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: { ...corsHeaders, Allow: 'GET, HEAD, OPTIONS, PUT, DELETE' },
    })
  },
}
