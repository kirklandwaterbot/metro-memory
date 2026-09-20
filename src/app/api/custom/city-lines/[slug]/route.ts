import path from 'path'
import { readFile } from 'fs/promises'

import { NextResponse } from 'next/server'

import { AVAILABLE_CITY_SLUGS } from '@/lib/availableCityData'
import { CITY_PATH_MAP } from '@/lib/cityPathMap'
import { readCityDataJson } from '@/lib/cityDataStorage'
import { loadCityConfig } from '@/lib/cityConfigRuntime'
import { deriveCityLines } from '@/lib/customWorldMap'
import { getMiniCityBySlug } from '@/lib/miniCities'
import { buildSubsetConfig } from '@/lib/subsetCity'
import type {
  Config,
  DataFeatureCollection,
  Line,
  LineGroup,
  LineGroupItem,
  RoutesFeatureCollection,
} from '@/lib/types'

type RouteParams = {
  params: Promise<{ slug: string }>
}

type CityDataPayload = {
  features: DataFeatureCollection
  routes: RoutesFeatureCollection
}

type ConfiguredLinesResult = {
  assetBasePath: string | null
  lines: Record<string, Partial<Line>>
  lineGroups: LineGroup[]
}

const loadConfig = async (slug: string): Promise<Config | null> => {
  try {
    return await loadCityConfig(slug)
  } catch {
    return null
  }
}

const filterLineGroups = (
  lineGroups: LineGroup[] | undefined,
  includeLines: Set<string>,
): LineGroup[] => {
  if (!lineGroups?.length) {
    return []
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
        .filter((item): item is LineGroupItem => item !== null)

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

        return hasPreviousLines && hasFutureLines && previousItem?.type !== 'separator'
      })

      const hasVisibleLines = items.some((item) => item.type === 'lines')

      return hasVisibleLines
        ? {
            ...group,
            items,
          }
        : null
    })
    .filter((group): group is LineGroup => group !== null)
}

const readConfiguredLines = async (
  slug: string,
  payload: CityDataPayload,
): Promise<ConfiguredLinesResult> => {
  const miniCity = getMiniCityBySlug(slug)
  if (miniCity) {
    const parentConfig = await loadConfig(miniCity.parentSlug)
    if (parentConfig) {
      const config = buildSubsetConfig(
        parentConfig,
        miniCity,
        payload.features,
        payload.routes,
      )

      return {
        assetBasePath: config.ASSET_BASE_PATH ?? CITY_PATH_MAP[miniCity.parentSlug] ?? null,
        lines: config.LINES,
        lineGroups: config.LINE_GROUPS ?? [],
      }
    }
  }

  const config = await loadConfig(slug)
  if (config) {
    return {
      assetBasePath: config.ASSET_BASE_PATH ?? CITY_PATH_MAP[slug] ?? null,
      lines: config.LINES,
      lineGroups: config.LINE_GROUPS ?? [],
    }
  }

  const sourceSlugs = [slug, miniCity?.parentSlug].filter(
    (entry): entry is string => Boolean(entry),
  )

  for (const sourceSlug of sourceSlugs) {
    const cityPath = CITY_PATH_MAP[sourceSlug]
    if (!cityPath) {
      continue
    }

    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'app',
        '(game)',
        ...cityPath.split('/'),
        'data',
        'lines.json',
      )
      return {
        assetBasePath: cityPath,
        lines: JSON.parse(await readFile(filePath, 'utf8')) as Record<string, Partial<Line>>,
        lineGroups: [],
      }
    } catch {
      // Try the next source slug. Mini cities often inherit line icons from the parent city.
    }
  }

  return { assetBasePath: CITY_PATH_MAP[slug] ?? null, lines: {}, lineGroups: [] }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params
  if (!AVAILABLE_CITY_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Unknown city.' }, { status: 404 })
  }

  let payload: CityDataPayload
  try {
    payload = await readCityDataJson<CityDataPayload>(slug)
  } catch {
    return NextResponse.json({ error: 'City data unavailable.' }, { status: 404 })
  }

  const {
    assetBasePath,
    lines: configuredLines,
    lineGroups: configuredLineGroups,
  } = await readConfiguredLines(slug, payload)

  const lines = Array.from(deriveCityLines(payload).entries())
    .map(([id, meta]) => {
      const configured = configuredLines[id]
      return {
        id,
        name: configured?.name ?? meta.name,
        color: configured?.color ?? meta.color,
        order: configured?.order ?? meta.order,
        icon: configured?.icon,
        badgeShape: configured?.badgeShape,
        badgeFit: configured?.badgeFit,
        badgeAspectRatio: configured?.badgeAspectRatio,
      }
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

  const cityIconBasePath = CITY_PATH_MAP[slug] ?? null
  const lineGroups = filterLineGroups(
    configuredLineGroups,
    new Set(lines.map((line) => line.id)),
  )

  return NextResponse.json({
    slug,
    icon: cityIconBasePath ? `/images/${cityIconBasePath}/icon.ico` : '/icon.ico',
    assetBasePath,
    lines,
    lineGroups,
  })
}
