import { getCityIconPath, getCityOpenGraphImagePath } from './cityAssets'
import { readCityDataJson } from './cityDataStorage'
import type { Config, DataFeatureCollection, RoutesFeatureCollection } from './types'
import { buildSubsetConfig, filterSubsetFeatures, filterSubsetRoutes } from './subsetCity'
import { getMiniCityBySlug, getMiniCityParentDefinition } from './miniCities'
import { loadMiniCityParentConfig } from './miniCityConfigRuntime'

type ParentCityAssets = {
  config: Config
  features: DataFeatureCollection
  routes: RoutesFeatureCollection
}

type CityDataPayload = {
  features: DataFeatureCollection
  routes: RoutesFeatureCollection
}

const CUSTOM_SLUG_PREFIX = 'custom-'

const readCityDataPayload = async (slug: string): Promise<CityDataPayload> => {
  return readCityDataJson<CityDataPayload>(slug)
}

const resolveCustomParentSlug = (slug: string): string => {
  const miniCity = getMiniCityBySlug(slug)
  if (miniCity) {
    return miniCity.parentSlug
  }

  if (slug.startsWith(CUSTOM_SLUG_PREFIX)) {
    return slug.slice(CUSTOM_SLUG_PREFIX.length)
  }

  return slug
}

const buildOrderedLineIds = (config: Config): string[] => {
  const ordered: string[] = []
  const seen = new Set<string>()

  const addLine = (lineId: string) => {
    if (!config.LINES[lineId] || seen.has(lineId)) {
      return
    }

    seen.add(lineId)
    ordered.push(lineId)
  }

  config.LINE_GROUPS?.forEach((group) => {
    group.items.forEach((item) => {
      if (item.type !== 'lines') {
        return
      }

      item.lines.forEach(addLine)
    })
  })

  Object.entries(config.LINES)
    .sort(([, left], [, right]) => {
      const orderDelta = (left.order ?? 0) - (right.order ?? 0)
      if (orderDelta !== 0) {
        return orderDelta
      }

      return left.name.localeCompare(right.name)
    })
    .forEach(([lineId]) => addLine(lineId))

  return ordered
}

const sanitizeCustomLineSelection = (
  config: Config,
  linesStr: string,
): string[] => {
  const requestedLineIds = linesStr
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (requestedLineIds.length === 0) {
    return []
  }

  const validRequestedLineIds = new Set<string>()
  requestedLineIds.forEach((lineId) => {
    if (config.LINES[lineId]) {
      validRequestedLineIds.add(lineId)
    }
  })

  if (validRequestedLineIds.size === 0) {
    return []
  }

  return buildOrderedLineIds(config).filter((lineId) =>
    validRequestedLineIds.has(lineId),
  )
}

const loadParentAssets = async (
  parentSlug: string,
): Promise<ParentCityAssets | null> => {
  const [config, payload] = await Promise.all([
    loadMiniCityParentConfig(parentSlug),
    readCityDataPayload(parentSlug).catch(() => null),
  ])

  if (!config || !payload) {
    return null
  }

  return {
    config,
    features: payload.features,
    routes: payload.routes,
  }
}

export const loadMiniCityPageAssets = async (slug: string) => {
  const definition = getMiniCityBySlug(slug)
  if (!definition) {
    return null
  }

  const [parentConfig, payload] = await Promise.all([
    loadMiniCityParentConfig(definition.parentSlug),
    readCityDataPayload(slug).catch(() => null),
  ])
  if (!parentConfig || !payload) {
    return null
  }

  const config = buildSubsetConfig(
    parentConfig,
    definition,
    payload.features,
    payload.routes,
  )

  return {
    definition,
    config,
    features: payload.features,
    routes: payload.routes,
  }
}

export const loadCustomMiniCityAssets = async (
  parentSlug: string,
  linesStr: string,
  customTitle: string,
) => {
  const resolvedParentSlug = resolveCustomParentSlug(parentSlug)
  const parentAssets = await loadParentAssets(resolvedParentSlug)
  if (!parentAssets) {
    return null
  }

  const includeLines = sanitizeCustomLineSelection(parentAssets.config, linesStr)
  if (includeLines.length === 0) {
    return null
  }

  const slug = `${CUSTOM_SLUG_PREFIX}${resolvedParentSlug}`
  const parentDef = getMiniCityParentDefinition(resolvedParentSlug)
  const normalizedTitle =
    customTitle.trim() || `${parentAssets.config.METADATA.title ?? 'Map'} - Custom Layout`
  const normalizedLinesStr = includeLines.join(',')

  const definition = {
    slug,
    parentSlug: resolvedParentSlug,
    parentName: parentDef?.parentName || resolvedParentSlug,
    parentLink: parentDef?.parentLink || `/${resolvedParentSlug}`,
    parentPath: parentDef?.parentPath || `/${resolvedParentSlug}`,
    continent: parentDef?.continent || 'Unknown',
    country: parentDef?.country || 'Unknown',
    name: normalizedTitle,
    link: `/custom?parent=${encodeURIComponent(resolvedParentSlug)}&lines=${encodeURIComponent(normalizedLinesStr)}&title=${encodeURIComponent(normalizedTitle)}`,
    includeLines,
    countingMode: 'mini' as const,
    keywords: [],
    icon: getCityIconPath(resolvedParentSlug),
    openGraphImage: getCityOpenGraphImagePath(resolvedParentSlug),
  }

  const features = filterSubsetFeatures(
    parentAssets.features,
    definition.includeLines,
  )
  const routes = filterSubsetRoutes(parentAssets.routes, definition.includeLines, {
    selectedFeatures: features,
    lineMetadata: parentAssets.config.LINES,
  })
  const config = buildSubsetConfig(parentAssets.config, definition, features, routes)

  return {
    definition,
    config,
    features,
    routes,
  }
}
