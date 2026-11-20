import type { Metadata } from 'next'

import cityAssetManifest from './cityAssetManifest.json'
import { CITY_PATH_MAP } from './cityPathMap'
import { getMiniCityBySlug } from './miniCities'

export const CITY_ASSETS_BASE_PATH = '/images'
export const DEFAULT_CITY_ICON_PATH = '/icon.ico'
export const DEFAULT_CITY_OPEN_GRAPH_IMAGE_PATH = '/city-cards/_default.jpg'

type CityAssetManifestEntry = {
  icon?: boolean
  iconVersion?: string
  openGraphExtension?: string
  openGraphVersion?: string
}

const CITY_ASSET_MANIFEST = cityAssetManifest as Record<
  string,
  CityAssetManifestEntry
>

const normalizeSlug = (slug: string | null | undefined) =>
  slug?.trim().toLowerCase() || null

const isProduction = process.env.NODE_ENV === 'production'

const normalizePathFromLink = (link: string | null | undefined) => {
  if (!link || !link.startsWith('/')) {
    return null
  }

  return link.replace(/^\//, '').split(/[?#]/)[0] || null
}

const appendVersionQuery = (
  assetPath: string,
  version: string | null | undefined,
) => {
  if (!isProduction) {
    return assetPath
  }
  return version ? `${assetPath}?v=${version}` : assetPath
}

type AssetKind = 'icon' | 'openGraph'

const manifestHasAsset = (
  slug: string | null | undefined,
  kind: AssetKind,
) => {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return false
  }

  const entry = CITY_ASSET_MANIFEST[normalizedSlug]
  if (!entry) {
    return false
  }

  return kind === 'icon' ? Boolean(entry.icon) : Boolean(entry.openGraphExtension)
}

const resolveCityAssetSlug = (
  slug: string | null | undefined,
  kind: AssetKind,
): string | null => {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return null
  }

  if (manifestHasAsset(normalizedSlug, kind)) {
    return normalizedSlug
  }

  const assetSourceSlug =
    normalizeSlug(getMiniCityBySlug(normalizedSlug)?.assetSourceSlug) ??
    normalizedSlug

  if (manifestHasAsset(assetSourceSlug, kind)) {
    return assetSourceSlug
  }

  if (kind === 'openGraph' && resolveCityAssetRoutePath(normalizedSlug)) {
    return normalizedSlug
  }

  return kind === 'openGraph' && resolveCityAssetRoutePath(assetSourceSlug)
    ? assetSourceSlug
    : null
}

export const resolveCityAssetRoutePath = (
  slug: string | null | undefined,
): string | null => {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return null
  }

  const directRoutePath =
    CITY_PATH_MAP[normalizedSlug] ??
    normalizePathFromLink(getMiniCityBySlug(normalizedSlug)?.link)
  if (directRoutePath) {
    return directRoutePath
  }
  return null
}

export const getCityAssetDirectory = (slug: string | null | undefined) => {
  const routePath = resolveCityAssetRoutePath(resolveCityAssetSlug(slug, 'openGraph'))
  return routePath ? `${CITY_ASSETS_BASE_PATH}/${routePath}` : null
}

export const resolveCityIconAssetSlug = (slug: string | null | undefined) => {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return null
  }

  return resolveCityAssetSlug(normalizedSlug, 'icon')
}

export const resolveCityOpenGraphAssetSlug = (
  slug: string | null | undefined,
) => {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return null
  }

  return resolveCityAssetSlug(normalizedSlug, 'openGraph')
}

export const getCityIconPath = (
  slug: string | null | undefined,
  fallbackPath = DEFAULT_CITY_ICON_PATH,
) => {
  const assetSlug = resolveCityAssetSlug(slug, 'icon')
  const assetRoutePath = resolveCityAssetRoutePath(assetSlug)
  if (!assetRoutePath) {
    return fallbackPath
  }

  return appendVersionQuery(
    `${CITY_ASSETS_BASE_PATH}/${assetRoutePath}/icon.ico`,
    assetSlug ? CITY_ASSET_MANIFEST[assetSlug]?.iconVersion : null,
  )
}

export const getCityIconMetadataPath = (
  slug: string | null | undefined,
  fallbackPath = DEFAULT_CITY_ICON_PATH,
) => {
  const assetSlug = resolveCityAssetSlug(slug, 'icon')
  const assetRoutePath = resolveCityAssetRoutePath(assetSlug)
  if (!assetSlug || !assetRoutePath) {
    return fallbackPath
  }

  // Static copy made at build time by scripts/sync-city-icons.js (named after
  // the city's folder). Served from the CDN, so it doesn't depend on the
  // /api/city-icon function being able to read public/ at runtime.
  const iconFileName = assetRoutePath.split('/').pop()
  // Always versioned, dev included: browsers cache tab icons by URL and
  // ignore a hard refresh, so a changed icon needs a changed URL.
  const iconVersion = CITY_ASSET_MANIFEST[assetSlug]?.iconVersion
  return iconVersion
    ? `/city-icons/${iconFileName}.ico?v=${iconVersion}`
    : `/city-icons/${iconFileName}.ico`
}

export const getCityOpenGraphImagePath = (
  slug: string | null | undefined,
  fallbackPath = DEFAULT_CITY_OPEN_GRAPH_IMAGE_PATH,
) => {
  const assetSlug = resolveCityOpenGraphAssetSlug(slug)
  if (!assetSlug) {
    return fallbackPath
  }

  const assetRoutePath = resolveCityAssetRoutePath(assetSlug)
  if (!assetRoutePath) {
    return fallbackPath
  }

  const openGraphExtension =
    (assetSlug ? CITY_ASSET_MANIFEST[assetSlug]?.openGraphExtension : null) ??
    'jpg'

  return appendVersionQuery(
    `${CITY_ASSETS_BASE_PATH}/${assetRoutePath}/opengraph-image.${openGraphExtension}`,
    assetSlug ? CITY_ASSET_MANIFEST[assetSlug]?.openGraphVersion : null,
  )
}

const mergeMetadataRecord = <T extends Record<string, unknown>>(
  value: T | null | undefined,
) => (value && typeof value === 'object' ? value : ({} as T))

export const withCityAssetMetadata = (
  slug: string,
  metadata: Metadata,
): Metadata => {
  const icon = getCityIconMetadataPath(slug)
  const openGraphImage = getCityOpenGraphImagePath(slug)

  return {
    ...metadata,
    icons: {
      ...mergeMetadataRecord(metadata.icons as Record<string, unknown> | null),
      icon,
      shortcut: icon,
      apple: icon,
    },
    openGraph: {
      ...mergeMetadataRecord(
        metadata.openGraph as Record<string, unknown> | null,
      ),
      images: [openGraphImage],
    },
    twitter: {
      ...mergeMetadataRecord(metadata.twitter as Record<string, unknown> | null),
      images: [openGraphImage],
    },
  }
}
