'use client'

import { downloadNativeMapRegion } from '@/lib/capacitorMapboxOffline'

export type OfflineCityRecord = {
  citySlug: string
  downloadedAt: string
  assetCount: number
  mapDownloaded: boolean
  version: string
}

type OfflineManifest = {
  generatedAt?: string
  assets?: string[]
  cityPaths?: Record<string, string>
  cityAssets?: Record<string, string[]>
}

// Font stacks used by the game's own label layers (see GamePage).
const LABEL_FONT_STACKS = [
  'Cabin Regular,Arial Unicode MS Regular',
  'Cabin Bold,Arial Unicode MS Regular',
]

// Same-origin files the offline game needs; anything else (APIs, analytics,
// Next image optimiser) is skipped.
const OFFLINE_PATH_PREFIXES = [
  '/_next/static/',
  '/city-data/',
  '/city-icons/',
  '/city-cards/',
  '/images/',
  '/api/geo/glyphs/',
]

const isOfflineAsset = (pathname: string) =>
  OFFLINE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))

/** Files this page has already loaded: its JS and CSS chunks, data and icons. */
const collectLoadedAssets = () => {
  const urls = new Set<string>()
  const addUrl = (raw: string | null | undefined) => {
    if (!raw) return
    try {
      const url = new URL(raw, window.location.href)
      if (url.origin === window.location.origin && isOfflineAsset(url.pathname)) {
        urls.add(url.pathname + url.search)
      }
    } catch {
      // ignore malformed URLs
    }
  }
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    for (const entry of performance.getEntriesByType('resource')) {
      addUrl(entry.name)
    }
  }
  document.querySelectorAll('script[src]').forEach((el) => addUrl(el.getAttribute('src')))
  document
    .querySelectorAll('link[rel="stylesheet"], link[rel="preload"], link[rel="modulepreload"], link[rel="icon"]')
    .forEach((el) => addUrl(el.getAttribute('href')))
  return Array.from(urls)
}

// Mapbox draws CJK ideographs and Hangul with a local font, so those glyph
// ranges are never requested.
const isLocallyRenderedRange = (start: number) =>
  (start >= 0x3400 && start <= 0x9fff) || (start >= 0xac00 && start <= 0xd7af)

/** Glyph ranges the station labels need, read from the city's data files. */
const collectGlyphAssets = async (dataUrls: string[]) => {
  const ranges = new Set<number>([0])
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      for (const char of value) {
        const start = Math.floor((char.codePointAt(0) ?? 0) / 256) * 256
        if (start <= 0xffff && !isLocallyRenderedRange(start)) ranges.add(start)
      }
    } else if (Array.isArray(value)) {
      value.forEach(visit)
    } else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) {
        if (key === 'geometry') continue
        visit(inner)
      }
    }
  }
  for (const url of dataUrls) {
    try {
      const response = await fetch(url)
      if (response.ok) visit(await response.json())
    } catch {
      // the data file itself is reported by the service worker
    }
  }
  const assets: string[] = []
  for (const fontStack of LABEL_FONT_STACKS) {
    for (const start of ranges) {
      // Same spelling as Mapbox's own request, so the cached copy matches.
      assets.push(new URL(`/api/geo/glyphs/${fontStack}/${start}-${start + 255}.pbf`, window.location.origin).pathname)
    }
  }
  return assets
}

const OFFLINE_CITIES_KEY = 'mm-offline-cities-v1'

const readJson = <T>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const listOfflineCities = (): OfflineCityRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }
  return readJson<OfflineCityRecord[]>(
    window.localStorage.getItem(OFFLINE_CITIES_KEY),
  ) ?? []
}

const writeOfflineCities = (records: OfflineCityRecord[]) => {
  window.localStorage.setItem(OFFLINE_CITIES_KEY, JSON.stringify(records))
  window.dispatchEvent(new Event('metro-offline-cities-change'))
}

const getServiceWorkerController = async () => {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
    return null
  }
  if (navigator.serviceWorker.controller) {
    return navigator.serviceWorker.controller
  }
  const registration = await navigator.serviceWorker.ready.catch(() => null)
  return registration?.active ?? null
}

const postToServiceWorker = async <T>(
  type: string,
  payload: unknown,
  timeoutMs = 30_000,
) => {
  // navigator.serviceWorker.ready never settles without a registration (for
  // example in development), so give up after a few seconds.
  const controller = await Promise.race([
    getServiceWorkerController(),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8_000)),
  ])
  if (!controller) {
    throw new Error('Offline downloads need the installed app (service worker not running)')
  }
  return new Promise<T>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Service worker request timed out'))
    }, timeoutMs)
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeoutId)
      const data = event.data
      if (data?.ok) {
        resolve(data as T)
      } else {
        reject(new Error(data?.error ?? 'Service worker request failed'))
      }
    }
    controller.postMessage({ type, payload }, [channel.port2])
  })
}

export const fetchOfflineManifest = async () => {
  const response = await fetch('/offline-manifest.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Unable to load offline manifest')
  }
  return (await response.json()) as OfflineManifest
}

export const isCityDownloaded = (citySlug: string) =>
  listOfflineCities().some((entry) => entry.citySlug === citySlug)

type DownloadOptions = {
  /** Page the player opens for this city, e.g. '/asia/china/gba'. */
  pagePath?: string
}

export const downloadCityForOffline = async (
  citySlug: string,
  options: DownloadOptions = {},
) => {
  const manifest = await fetchOfflineManifest()
  const cityPath = manifest.cityPaths?.[citySlug]
  const pagePath =
    options.pagePath ??
    (cityPath ? `/${cityPath}` : window.location.pathname)
  const cityAssets = manifest.cityAssets?.[citySlug] ?? [
    `/city-data/${citySlug}.json`,
    `/city-icons/${citySlug}.ico`,
    `/city-cards/${citySlug}.jpg`,
  ]
  const loaded = collectLoadedAssets()
  const dataUrls = Array.from(
    new Set([...cityAssets, ...loaded].filter((url) => url.startsWith('/city-data/'))),
  )
  const glyphs = await collectGlyphAssets(dataUrls)
  const pages = Array.from(
    new Set([pagePath, cityPath ? `/${cityPath}` : null].filter(Boolean) as string[]),
  )
  const assets = Array.from(
    new Set(['/', '/manifest.webmanifest', ...pages, ...cityAssets, ...loaded, ...glyphs]),
  )
  // Without the page or its data the city cannot open offline at all.
  const required = [...pages, ...dataUrls.filter((url) => cityAssets.includes(url) || loaded.includes(url))]

  // Verify the SW cache succeeded before marking the city as downloaded.
  let cacheResult: { cachedCount?: number; failed?: number } | undefined
  try {
    cacheResult = await postToServiceWorker<{ cachedCount?: number; failed?: number }>(
      'CACHE_CITY',
      { citySlug, assets, required },
      5 * 60_000,
    )
  } catch (error) {
    // Remove any partial record so the UI doesn't show a broken offline entry.
    writeOfflineCities(
      listOfflineCities().filter((entry) => entry.citySlug !== citySlug),
    )
    throw error
  }

  const nativeMap = await downloadNativeMapRegion({ citySlug })
  const record: OfflineCityRecord = {
    citySlug,
    downloadedAt: new Date().toISOString(),
    assetCount: cacheResult?.cachedCount ?? assets.length,
    mapDownloaded: nativeMap.ok,
    version: manifest.generatedAt ?? 'unknown',
  }
  const next = [
    ...listOfflineCities().filter((entry) => entry.citySlug !== citySlug),
    record,
  ].sort((a, b) => a.citySlug.localeCompare(b.citySlug))
  writeOfflineCities(next)
  return record
}

export const deleteOfflineCity = async (citySlug: string) => {
  await postToServiceWorker('DELETE_CITY', { citySlug }).catch(() => null)
  writeOfflineCities(
    listOfflineCities().filter((entry) => entry.citySlug !== citySlug),
  )
}
