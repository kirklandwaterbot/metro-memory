import 'server-only'

import { createHash } from 'crypto'

import bbox from '@turf/bbox'

import { AVAILABLE_CITY_SLUGS } from './availableCityData'
import { cities, getSlugFromLink } from './citiesConfig'
import { loadCityConfig } from './cityConfigRuntime'
import { CITY_PATH_MAP } from './cityPathMap'
import { readCityDataJson } from './cityDataStorage'
import { isColorLight } from './colorUtils'
import { repairMojibakeString } from './repairMojibake'
import { buildSubsetConfig, filterSubsetRoutes } from './subsetCity'
import type {
  Config,
  DataFeature,
  DataFeatureCollection,
  Line,
  LineGroup,
  LineGroupItem,
  RoutesFeatureCollection,
} from './types'
import { MINI_CITIES, getMiniCityBySlug } from './miniCities'
import {
  normalizeWorldSelection,
  type WorldMapSelection,
} from './customWorldMapSelection'

type CityDataPayload = {
  features: DataFeatureCollection
  routes: RoutesFeatureCollection
}

const DEFAULT_LINE_COLOR = '#64748b'

// A generic Mapbox style that works with any token (the per-city styles live on
// a private account). Overridable via env for deployments with a custom style.
const getWorldMapStyle = () => {
  const style = process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim()
  if (
    !style ||
    style.includes('/your-account/') ||
    style.endsWith('/light-style') ||
    style.endsWith('/dark-style')
  ) {
    return 'mapbox://styles/mapbox/light-v11'
  }

  return style
}

const WORLD_MAP_STYLE = getWorldMapStyle()

const CONTINENT_ORDER = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Oceania',
  'Africa',
]

const CONTINENT_BY_PATH_SEGMENT: Record<string, string> = {
  'north-america': 'North America',
  'south-america': 'South America',
  europe: 'Europe',
  asia: 'Asia',
  oceania: 'Oceania',
  africa: 'Africa',
}

const SLUG_WORD_OVERRIDES: Record<string, string> = {
  dc: 'DC',
  gba: 'GBA',
  kc: 'KC',
  la: 'LA',
  lr: 'Little Rock',
  lv: 'Las Vegas',
  nyc: 'NYC',
  okc: 'OKC',
  slc: 'SLC',
  stl: 'St. Louis',
  taw: 'Tyne and Wear',
  thsr: 'THSR',
  uk: 'UK',
  usa: 'USA',
  wm: 'West Midlands',
}

const cityNamesBySlug = new Map<string, string>()
const cityContinentsBySlug = new Map<string, string>()

const cleanDisplayName = (name: string) =>
  repairMojibakeString(name)
    .split(',')[0]
    .trim()

cities.forEach((city) => {
  const slug = getSlugFromLink(city.link)
  if (!slug) {
    return
  }

  cityNamesBySlug.set(slug, cleanDisplayName(city.name))
  cityContinentsBySlug.set(slug, city.continent)
})

MINI_CITIES.forEach((city) => {
  cityNamesBySlug.set(city.slug, cleanDisplayName(city.name))
  cityContinentsBySlug.set(city.slug, city.continent)
})

const titleCaseSlugPart = (part: string) =>
  SLUG_WORD_OVERRIDES[part] ??
  (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)

const prettifyCityName = (slug: string): string =>
  slug
    .split('-')
    .map(titleCaseSlugPart)
    .join(' ')

const getCityDisplayName = (slug: string): string =>
  cityNamesBySlug.get(slug) ?? prettifyCityName(slug)

const getCityContinent = (slug: string): string => {
  const configuredContinent = cityContinentsBySlug.get(slug)
  if (configuredContinent) {
    return configuredContinent
  }

  const pathSegment = CITY_PATH_MAP[slug]?.split('/')[0]
  return pathSegment ? CONTINENT_BY_PATH_SEGMENT[pathSegment] ?? 'Other' : 'Other'
}

const continentRank = (continent: string) => {
  const index = CONTINENT_ORDER.indexOf(continent)
  return index === -1 ? CONTINENT_ORDER.length : index
}

const compareSelectionEntries = (
  left: WorldMapSelection[number],
  right: WorldMapSelection[number],
) => {
  const leftContinent = getCityContinent(left.city)
  const rightContinent = getCityContinent(right.city)
  return (
    continentRank(leftContinent) - continentRank(rightContinent) ||
    getCityDisplayName(left.city).localeCompare(getCityDisplayName(right.city)) ||
    left.city.localeCompare(right.city)
  )
}

const isPlayableCitySlug = (slug: string) =>
  AVAILABLE_CITY_SLUGS.has(slug) && Boolean(CITY_PATH_MAP[slug])

const readCityDataPayload = async (slug: string): Promise<CityDataPayload | null> => {
  try {
    return await readCityDataJson<CityDataPayload>(slug)
  } catch {
    return null
  }
}

const loadConfiguredCityConfig = async (
  slug: string,
  payload: CityDataPayload,
): Promise<Config | null> => {
  const miniCity = getMiniCityBySlug(slug)
  if (miniCity) {
    const parentConfig = await loadCityConfig(miniCity.parentSlug).catch(() => null)
    return parentConfig
      ? buildSubsetConfig(parentConfig, miniCity, payload.features, payload.routes)
      : null
  }

  return loadCityConfig(slug).catch(() => null)
}

const prefixAssetPath = (asset: string | undefined, assetBasePath?: string | null) => {
  if (!asset) {
    return undefined
  }

  const normalized = asset.replace(/^\/+/, '')
  if (normalized.startsWith('images/')) {
    return normalized.slice('images/'.length)
  }
  if (normalized.includes('/')) {
    return normalized
  }
  if (assetBasePath) {
    return `${assetBasePath.replace(/^\/+/, '')}/${normalized}`
  }
  return normalized
}

type DerivedLine = { name: string; color: string; order: number }

/**
 * Derives per-line metadata (name, color, order) for a city straight from its
 * route geometry, so we don't need the city's TypeScript config module. Lines
 * that only appear on station features (no route) fall back to sane defaults.
 */
export const deriveCityLines = (payload: CityDataPayload): Map<string, DerivedLine> => {
  const lines = new Map<string, DerivedLine>()

  payload.routes.features.forEach((feature) => {
    const lineId = feature.properties?.line
    if (typeof lineId !== 'string' || lines.has(lineId)) {
      return
    }
    lines.set(lineId, {
      name: feature.properties?.name || lineId,
      color: feature.properties?.color || DEFAULT_LINE_COLOR,
      order: feature.properties?.order ?? lines.size,
    })
  })

  // Include lines that have stations but no route geometry.
  payload.features.features.forEach((feature) => {
    const lineId = feature.properties?.line
    if (typeof lineId === 'string' && !lines.has(lineId)) {
      lines.set(lineId, { name: lineId, color: DEFAULT_LINE_COLOR, order: lines.size })
    }
  })

  return lines
}

const buildLine = (
  meta: DerivedLine,
  order: number,
  configured?: Partial<Line>,
  assetBasePath?: string | null,
): Line => {
  const color = configured?.color ?? meta.color
  const backgroundColor = configured?.backgroundColor ?? color

  return {
    name: configured?.name ?? meta.name,
    color,
    backgroundColor,
    textColor: configured?.textColor ?? (isColorLight(backgroundColor) ? '#1f2937' : '#ffffff'),
    order,
    badgeShape: configured?.badgeShape,
    badgeFit: configured?.badgeFit,
    badgeAspectRatio: configured?.badgeAspectRatio,
    progressOutlineColor: configured?.progressOutlineColor,
    statsColor: configured?.statsColor,
    icon: prefixAssetPath(configured?.icon, assetBasePath),
  }
}

const namespaceLineId = (citySlug: string, lineId: string) => `${citySlug}__${lineId}`

const namespaceClusterKey = (
  citySlug: string,
  clusterKey: number | string | undefined,
): string | undefined =>
  clusterKey === undefined || clusterKey === null
    ? undefined
    : `${citySlug}::${clusterKey}`

const pruneSeparators = (items: LineGroupItem[]) => {
  const pruned = items.filter((item, index, array) => {
    if (item.type !== 'separator') {
      return true
    }

    const previous = array[index - 1]
    const hasPreviousLines = array.slice(0, index).some((candidate) => candidate.type === 'lines')
    const hasFutureLines = array.slice(index + 1).some((candidate) => candidate.type === 'lines')
    return previous?.type !== 'separator' && hasPreviousLines && hasFutureLines
  })

  while (pruned[0]?.type === 'separator') {
    pruned.shift()
  }
  while (pruned[pruned.length - 1]?.type === 'separator') {
    pruned.pop()
  }

  return pruned
}

const buildCustomLineGroupItems = ({
  citySlug,
  requestedLines,
  configuredLineGroups,
  assetBasePath,
}: {
  citySlug: string
  requestedLines: string[]
  configuredLineGroups: LineGroup[]
  assetBasePath?: string | null
}): LineGroupItem[] => {
  const includeSet = new Set(requestedLines)
  const groupedLineIds = new Set<string>()
  const items: LineGroupItem[] = []

  configuredLineGroups.forEach((group) => {
    let groupAddedLines = false

    group.items.forEach((item) => {
      if (item.type === 'separator') {
        if (items.length > 0 && items[items.length - 1]?.type !== 'separator') {
          items.push(item)
        }
        return
      }

      const visibleLines = item.lines.filter((lineId) => includeSet.has(lineId))
      if (visibleLines.length === 0) {
        return
      }

      visibleLines.forEach((lineId) => groupedLineIds.add(lineId))
      if (items.length > 0 && !groupAddedLines && items[items.length - 1]?.type !== 'separator') {
        items.push({ type: 'separator' })
      }

      const title = item.title ?? (groupAddedLines ? undefined : group.title)
      const titleImage = item.titleImage ?? (groupAddedLines ? undefined : group.titleImage)

      items.push({
        type: 'lines',
        title,
        titleImage: prefixAssetPath(titleImage, assetBasePath),
        lines: visibleLines.map((lineId) => namespaceLineId(citySlug, lineId)),
      })
      groupAddedLines = true
    })
  })

  const ungroupedLines = requestedLines.filter((lineId) => !groupedLineIds.has(lineId))
  if (ungroupedLines.length > 0) {
    if (items.length > 0 && items[items.length - 1]?.type !== 'separator') {
      items.push({ type: 'separator' })
    }
    items.push({
      type: 'lines',
      lines: ungroupedLines.map((lineId) => namespaceLineId(citySlug, lineId)),
    })
  }

  return pruneSeparators(items)
}

/**
 * Loads the selected cities, filters each to its chosen lines, namespaces line
 * ids / cluster keys, re-ids stations globally so they don't collide, merges
 * everything into a single Config + feature/route collections, and auto-fits the
 * map to the combined bounds. Returns null if no valid line survives.
 */
export const loadCustomWorldMapAssets = async (
  rawSelection: WorldMapSelection,
  customTitle: string,
) => {
  const selection = normalizeWorldSelection(rawSelection)
    .filter((entry) => isPlayableCitySlug(entry.city))
    .sort(compareSelectionEntries)

  if (selection.length === 0) {
    return null
  }

  const payloads = await Promise.all(
    selection.map(async (entry) => {
      const payload = await readCityDataPayload(entry.city)
      const config = payload ? await loadConfiguredCityConfig(entry.city, payload) : null
      return { entry, payload, config }
    }),
  )

  const mergedLines: Record<string, Line> = {}
  const lineGroups: NonNullable<Config['LINE_GROUPS']> = []
  const mergedFeatures: DataFeature[] = []
  const mergedRoutes: RoutesFeatureCollection['features'] = []
  let lineOrder = 0
  let nextFeatureId = 1

  for (const { entry, payload, config } of payloads) {
    if (!payload) {
      continue
    }

    const cityLineMeta = deriveCityLines(payload)
    const configuredLines = config?.LINES ?? {}
    const requestedLines = entry.lines.filter(
      (lineId) => cityLineMeta.has(lineId) || Boolean(configuredLines[lineId]),
    )
    if (requestedLines.length === 0) {
      continue
    }

    const includeSet = new Set(requestedLines)
    const assetBasePath = config?.ASSET_BASE_PATH ?? CITY_PATH_MAP[entry.city] ?? null
    const namespacedIds: string[] = []

    requestedLines.forEach((lineId) => {
      const ns = namespaceLineId(entry.city, lineId)
      const configured = configuredLines[lineId]
      const meta = cityLineMeta.get(lineId) ?? {
        name: configured?.name ?? lineId,
        color: configured?.color ?? DEFAULT_LINE_COLOR,
        order: configured?.order ?? 0,
      }
      mergedLines[ns] = buildLine(meta, lineOrder++, configured, assetBasePath)
      namespacedIds.push(ns)
    })

    const selectedCityFeatures: DataFeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    }

    payload.features.features.forEach((feature) => {
      const lineId = feature.properties?.line
      if (typeof lineId !== 'string' || !includeSet.has(lineId)) {
        return
      }

      selectedCityFeatures.features.push(feature)
      const id = nextFeatureId++
      mergedFeatures.push({
        ...feature,
        id,
        properties: {
          ...feature.properties,
          id,
          line: namespaceLineId(entry.city, lineId),
          cluster_key: namespaceClusterKey(entry.city, feature.properties?.cluster_key),
        },
      })
    })

    const selectedRoutes = filterSubsetRoutes(payload.routes, requestedLines, {
      selectedFeatures: selectedCityFeatures,
      lineMetadata: configuredLines,
    })

    selectedRoutes.features.forEach((feature) => {
      const lineId = feature.properties?.line
      if (typeof lineId !== 'string' || !includeSet.has(lineId)) {
        return
      }

      const namespacedLineId = namespaceLineId(entry.city, lineId)
      const line = mergedLines[namespacedLineId]
      mergedRoutes.push({
        ...feature,
        properties: {
          ...feature.properties,
          line: namespacedLineId,
          color: feature.properties?.color ?? line?.color ?? DEFAULT_LINE_COLOR,
          order: line?.order ?? feature.properties?.order,
        },
      })
    })

    lineGroups.push({
      title: getCityDisplayName(entry.city),
      titleImage: assetBasePath ? `${assetBasePath}/icon.ico` : undefined,
      items: buildCustomLineGroupItems({
        citySlug: entry.city,
        requestedLines,
        configuredLineGroups: config?.LINE_GROUPS ?? [],
        assetBasePath,
      }),
    })
  }

  if (Object.keys(mergedLines).length === 0 || mergedFeatures.length === 0) {
    return null
  }

  const features: DataFeatureCollection = {
    type: 'FeatureCollection',
    features: mergedFeatures,
  }
  const routes: RoutesFeatureCollection = {
    type: 'FeatureCollection',
    features: mergedRoutes,
  }

  const boundsSource = mergedRoutes.length > 0 ? routes : features
  const [minLng, minLat, maxLng, maxLat] = bbox(boundsSource)
  const hasBounds =
    [minLng, minLat, maxLng, maxLat].every((value) => Number.isFinite(value)) &&
    maxLng > minLng &&
    maxLat > minLat

  const selectionKey = createHash('sha1')
    .update(JSON.stringify(selection))
    .digest('hex')
    .slice(0, 12)
  const slug = `custom-world-${selectionKey}`
  const title = customTitle.trim() || 'Custom World Map'

  const config: Config = {
    MAP_FROM_DATA: true,
    MAP_RENDER_CULLING: { enabled: false, paddingFactor: 0.5 },
    LOCALE: 'en',
    CITY_NAME: slug,
    MAP_CONFIG: {
      container: 'map',
      style: WORLD_MAP_STYLE,
      fadeDuration: 50,
      ...(hasBounds
        ? {
            bounds: [
              [minLng, minLat],
              [maxLng, maxLat],
            ] as [[number, number], [number, number]],
            fitBoundsOptions: { padding: 48 },
          }
        : { center: [0, 20] as [number, number], zoom: 1.4 }),
    },
    METADATA: { title: `${title} - Metro Memory`, description: title },
    LINES: mergedLines,
    LINE_GROUPS: lineGroups,
  }

  const definition = { slug, title, selection }

  return { config, features, routes, definition }
}
