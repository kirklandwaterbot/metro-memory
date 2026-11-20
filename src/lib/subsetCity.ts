import bbox from '@turf/bbox'
import { Metadata } from 'next'

import { getCityIconPath, getCityOpenGraphImagePath } from './cityAssets'
import {
  Config,
  DataFeatureCollection,
  Line,
  LineGroup,
  LineGroupItem,
  RoutesFeatureCollection,
} from './types'
import { MiniCityDefinition } from './miniCities'

const EMPTY_ROUTES: RoutesFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const INTERLINED_ROUTE_STATION_TOLERANCE = 0.0005
const INTERLINED_ROUTE_STATION_TOLERANCE_SQ =
  INTERLINED_ROUTE_STATION_TOLERANCE * INTERLINED_ROUTE_STATION_TOLERANCE

type Coordinate = [number, number]

type RouteLineMetadata = {
  color?: string
  order?: number
}

type FilterSubsetRoutesOptions = {
  selectedFeatures?: DataFeatureCollection
  lineMetadata?: Record<string, RouteLineMetadata | undefined>
}

const filterLines = (
  lines: Record<string, Line>,
  includeLines: Set<string>,
): Record<string, Line> =>
  Object.fromEntries(
    Object.entries(lines).filter(([lineId]) => includeLines.has(lineId)),
  )

const filterLineGroups = (
  lineGroups: LineGroup[] | undefined,
  includeLines: Set<string>,
): LineGroup[] | undefined => {
  if (!lineGroups?.length) {
    return lineGroups
  }

  return lineGroups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.type !== 'lines') {
            return item
          }

          const lines = item.lines.filter((lineId) => includeLines.has(lineId))
          if (lines.length === 0) {
            return null
          }

          return {
            ...item,
            lines,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      const items = filteredItems.filter((item, index, array): item is LineGroupItem => {
        if (item.type !== 'separator') {
          return true
        }

        const hasPreviousLines = array
          .slice(0, index)
          .some((candidate) => candidate.type === 'lines')
        const hasFutureLines = array
          .slice(index + 1)
          .some((candidate) => candidate.type === 'lines')
        const previousItem = array[index - 1]

        return (
          hasPreviousLines &&
          hasFutureLines &&
          previousItem?.type !== 'separator'
        )
      })

      const hasVisibleLines = items.some((item) => item.type === 'lines')

      return hasVisibleLines
        ? {
            ...group,
            items,
          }
        : null
    })
    .filter((group): group is NonNullable<typeof group> => group !== null)
}

const collectSelectedStationPoints = (
  featureCollection: DataFeatureCollection | undefined,
  includeLines: Set<string>,
) => {
  if (!featureCollection) {
    return []
  }

  const pointsByLine = new Map<string, Coordinate[]>()

  featureCollection.features.forEach((feature) => {
    if (feature.geometry?.type !== 'Point') {
      return
    }

    const lineId = feature.properties?.line
    if (typeof lineId !== 'string' || !includeLines.has(lineId)) {
      return
    }

    const [lng, lat] = feature.geometry.coordinates
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return
    }

    const points = pointsByLine.get(lineId) ?? []
    points.push([lng, lat])
    pointsByLine.set(lineId, points)
  })

  return Array.from(pointsByLine.entries())
}

const routeLineStrings = (
  geometry: RoutesFeatureCollection['features'][number]['geometry'],
): Coordinate[][] => {
  if (geometry.type === 'LineString') {
    return [geometry.coordinates as Coordinate[]]
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates as Coordinate[][]
  }

  return []
}

const distanceToSegmentSq = (
  point: Coordinate,
  start: Coordinate,
  end: Coordinate,
) => {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]

  if (dx === 0 && dy === 0) {
    const x = point[0] - start[0]
    const y = point[1] - start[1]
    return x * x + y * y
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
        (dx * dx + dy * dy),
    ),
  )
  const projectedLng = start[0] + t * dx
  const projectedLat = start[1] + t * dy
  const x = point[0] - projectedLng
  const y = point[1] - projectedLat
  return x * x + y * y
}

const routeTouchesAnyPoint = (
  route: RoutesFeatureCollection['features'][number],
  points: Coordinate[],
) => {
  if (points.length === 0) {
    return false
  }

  const lineStrings = routeLineStrings(route.geometry)
  for (const lineString of lineStrings) {
    for (let index = 1; index < lineString.length; index += 1) {
      const start = lineString[index - 1]
      const end = lineString[index]
      for (const point of points) {
        if (distanceToSegmentSq(point, start, end) <= INTERLINED_ROUTE_STATION_TOLERANCE_SQ) {
          return true
        }
      }
    }
  }

  return false
}

const normalizeColor = (color: string | undefined) => color?.trim().toLowerCase()

const routeCanRepresentLine = (
  route: RoutesFeatureCollection['features'][number],
  lineId: string,
  lineMetadata: FilterSubsetRoutesOptions['lineMetadata'],
) => {
  const selectedColor = normalizeColor(lineMetadata?.[lineId]?.color)
  const routeColor = normalizeColor(route.properties?.color)

  return !selectedColor || !routeColor || selectedColor === routeColor
}

const findInterlinedRouteLine = (
  route: RoutesFeatureCollection['features'][number],
  selectedPointsByLine: Array<[string, Coordinate[]]>,
  lineMetadata: FilterSubsetRoutesOptions['lineMetadata'],
) => {
  for (const [lineId, points] of selectedPointsByLine) {
    if (routeCanRepresentLine(route, lineId, lineMetadata) && routeTouchesAnyPoint(route, points)) {
      return lineId
    }
  }

  return null
}

export const filterSubsetFeatures = (
  featureCollection: DataFeatureCollection,
  includeLines: string[],
): DataFeatureCollection => {
  const lineSet = new Set(includeLines)
  return {
    ...featureCollection,
    features: featureCollection.features.filter((feature) => {
      const lineId = feature.properties?.line
      return typeof lineId === 'string' && lineSet.has(lineId)
    }),
  }
}

export const filterSubsetRoutes = (
  routes: RoutesFeatureCollection | undefined,
  includeLines: string[],
  options: FilterSubsetRoutesOptions = {},
): RoutesFeatureCollection => {
  if (!routes) {
    return EMPTY_ROUTES
  }

  const lineSet = new Set(includeLines)
  const selectedPointsByLine = collectSelectedStationPoints(
    options.selectedFeatures,
    lineSet,
  )

  return {
    ...routes,
    features: routes.features.flatMap((feature) => {
      const lineId = feature.properties?.line
      if (typeof lineId === 'string' && lineSet.has(lineId)) {
        return [feature]
      }

      const interlinedLineId = findInterlinedRouteLine(
        feature,
        selectedPointsByLine,
        options.lineMetadata,
      )
      if (!interlinedLineId) {
        return []
      }

      const lineMeta = options.lineMetadata?.[interlinedLineId]
      return [
        {
          ...feature,
          properties: {
            ...feature.properties,
            line: interlinedLineId,
            color: lineMeta?.color ?? feature.properties.color,
            order: lineMeta?.order ?? feature.properties.order,
          },
        },
      ]
    }),
  }
}

const deriveSubsetBounds = (
  features: DataFeatureCollection,
  routes: RoutesFeatureCollection,
) => {
  const target =
    routes.features.length > 0
      ? routes
      : features.features.length > 0
        ? features
        : null

  if (!target) {
    return null
  }

  const [minLng, minLat, maxLng, maxLat] = bbox(target)
  if (
    ![minLng, minLat, maxLng, maxLat].every((value) => Number.isFinite(value)) ||
    maxLng <= minLng ||
    maxLat <= minLat
  ) {
    return null
  }

  return {
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat],
    ] as [[number, number], [number, number]],
    maxBounds: [
      [minLng - 0.4, minLat - 0.4],
      [maxLng + 0.4, maxLat + 0.4],
    ] as [[number, number], [number, number]],
  }
}

const buildSubsetMetadata = (
  parentMetadata: Metadata,
  definition: MiniCityDefinition,
): Metadata => {
  // "Moscow Metro" -> "Moscow Metro Memory", not "Moscow Metro Metro Memory"
  const title = /\b(Metro|Subway|U-Bahn|Métro|Metrô|MRT|Metropolitana)$/i.test(definition.name)
    ? `${definition.name} Memory`
    : `${definition.name} Metro Memory`
  const description = `How many stations in ${definition.name} can you name?`
  const icon = definition.icon ?? getCityIconPath(definition.slug)
  const openGraphImage =
    definition.openGraphImage ?? getCityOpenGraphImagePath(definition.slug)

  return {
    ...parentMetadata,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
    alternates: {
      ...(typeof parentMetadata.alternates === 'object' && parentMetadata.alternates
        ? parentMetadata.alternates
        : {}),
      canonical: definition.link,
    },
    title,
    description,
    openGraph: {
      ...(typeof parentMetadata.openGraph === 'object' && parentMetadata.openGraph
        ? parentMetadata.openGraph
        : {}),
      title,
      description,
      url: `https://metro-memory.xyz${definition.link}`,
      images: [openGraphImage],
    },
    twitter: {
      ...(typeof parentMetadata.twitter === 'object' && parentMetadata.twitter
        ? parentMetadata.twitter
        : {}),
      title,
      description,
      images: [openGraphImage],
    },
  }
}

export const buildSubsetConfig = (
  parentConfig: Config,
  definition: MiniCityDefinition,
  features: DataFeatureCollection,
  routes: RoutesFeatureCollection,
): Config => {
  const includeLines = new Set(definition.includeLines)
  const subsetBounds = deriveSubsetBounds(features, routes)
  const mapConfig = {
    ...parentConfig.MAP_CONFIG,
  }

  if (subsetBounds) {
    mapConfig.bounds = subsetBounds.bounds
    mapConfig.maxBounds = subsetBounds.maxBounds
  }

  return {
    ...parentConfig,
    CITY_NAME: definition.slug,
    ASSET_BASE_PATH: definition.parentPath,
    MAP_CONFIG: mapConfig,
    METADATA: buildSubsetMetadata(parentConfig.METADATA, definition),
    LINES: filterLines(parentConfig.LINES, includeLines),
    LINE_GROUPS: filterLineGroups(parentConfig.LINE_GROUPS, includeLines),
  }
}
