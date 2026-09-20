import { readCityDataJson } from './cityDataStorage'
import { MINI_CITIES, getMiniCityBySlug, getMiniCitiesForParent } from './miniCities'

type CityDataPayload = {
  features?:
    | Array<{
        id?: number | string | null
      }>
    | {
        features?: Array<{
          id?: number | string | null
        }>
      }
}

export type ProgressRecordLike = {
  citySlug: string
  foundIds?: unknown
  foundTimestamps?: unknown
}

const miniCityStationIdSetCache = new Map<string, Promise<Set<number>>>()

const extractStationIds = (payload: CityDataPayload): Set<number> => {
  const ids = new Set<number>()
  const features = Array.isArray(payload.features)
    ? payload.features
    : payload.features?.features ?? []

  features.forEach((feature) => {
    if (typeof feature?.id === 'number' && Number.isFinite(feature.id)) {
      ids.add(feature.id)
    }
  })

  return ids
}

export const loadMiniCityStationIdSetFromDisk = (
  slug: string,
): Promise<Set<number>> => {
  const cached = miniCityStationIdSetCache.get(slug)
  if (cached) {
    return cached
  }

  const request = readCityDataJson<CityDataPayload>(slug)
    .then(extractStationIds)
    .catch((error) => {
      miniCityStationIdSetCache.delete(slug)
      throw error
    })

  miniCityStationIdSetCache.set(slug, request)
  return request
}

export const normalizeFoundIds = (value: unknown): number[] =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : []).filter(
        (id): id is number => typeof id === 'number' && Number.isFinite(id),
      ),
    ),
  )

export const normalizeFoundTimestamps = (
  value: unknown,
): Record<string, string> => {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  const normalized: Record<string, string> = {}

  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    if (typeof entry === 'string') {
      normalized[key] = entry
    }
  })

  return normalized
}

export const buildProgressBySlug = (records: ProgressRecordLike[]) =>
  new Map(
    records.map((record) => [
      record.citySlug,
      new Set(normalizeFoundIds(record.foundIds)),
    ]),
  )

export const getMiniCityFamilyParentSlug = (
  slug: string | null | undefined,
): string | null => {
  if (!slug) {
    return null
  }

  const miniCity = getMiniCityBySlug(slug)
  if (miniCity) {
    return miniCity.parentSlug
  }

  return getMiniCitiesForParent(slug).length > 0 ? slug : null
}

export const getMiniCityFamilySlugs = (parentSlug: string): string[] => [
  parentSlug,
  ...getMiniCitiesForParent(parentSlug).map((miniCity) => miniCity.slug),
]

const buildFamilyFoundIds = (
  recordsBySlug: Map<string, Set<number>>,
  familySlugs: string[],
): Set<number> => {
  const foundIds = new Set<number>()

  familySlugs.forEach((slug) => {
    recordsBySlug.get(slug)?.forEach((id) => {
      foundIds.add(id)
    })
  })

  return foundIds
}

const buildMergedFamilyTimestamps = (
  records: ProgressRecordLike[],
  visibleFoundIds: Set<number>,
): Record<string, string> => {
  const merged = new Map<string, string>()

  records.forEach((record) => {
    const timestamps = normalizeFoundTimestamps(record.foundTimestamps)
    Object.entries(timestamps).forEach(([id, timestamp]) => {
      if (!visibleFoundIds.has(Number(id))) {
        return
      }

      const existing = merged.get(id)
      if (!existing || timestamp < existing) {
        merged.set(id, timestamp)
      }
    })
  })

  return Object.fromEntries(merged.entries())
}

export const resolveProgressPayloadForSlug = async (
  records: ProgressRecordLike[],
  citySlug: string,
): Promise<{ foundIds: number[]; foundTimestamps: Record<string, string> } | null> => {
  const familyParentSlug = getMiniCityFamilyParentSlug(citySlug)

  if (!familyParentSlug) {
    const record = records.find((entry) => entry.citySlug === citySlug)
    if (!record) {
      return null
    }

    return {
      foundIds: normalizeFoundIds(record.foundIds),
      foundTimestamps: normalizeFoundTimestamps(record.foundTimestamps),
    }
  }

  const familySlugs = getMiniCityFamilySlugs(familyParentSlug)
  const recordsBySlug = buildProgressBySlug(records)
  const familyFoundIds = buildFamilyFoundIds(recordsBySlug, familySlugs)

  if (familyFoundIds.size === 0) {
    return null
  }

  let visibleFoundIds = familyFoundIds
  const childDefinition = getMiniCityBySlug(citySlug)
  if (childDefinition) {
    const stationIds = await loadMiniCityStationIdSetFromDisk(citySlug)
    visibleFoundIds = new Set(
      Array.from(familyFoundIds).filter((id) => stationIds.has(id)),
    )
  }

  return {
    foundIds: Array.from(visibleFoundIds),
    foundTimestamps: buildMergedFamilyTimestamps(records, visibleFoundIds),
  }
}

export const deriveMiniCityProgressSummaries = async (
  records: ProgressRecordLike[],
): Promise<Array<{ citySlug: string; foundCount: number }>> => {
  const recordsBySlug = buildProgressBySlug(records)
  const summaryBySlug = new Map<string, number>()

  records.forEach((record) => {
    summaryBySlug.set(record.citySlug, normalizeFoundIds(record.foundIds).length)
  })

  const parentSlugs = new Set(MINI_CITIES.map((miniCity) => miniCity.parentSlug))

  for (const parentSlug of parentSlugs) {
    const familySlugs = getMiniCityFamilySlugs(parentSlug)
    const familyFoundIds = buildFamilyFoundIds(recordsBySlug, familySlugs)

    if (familyFoundIds.size === 0) {
      continue
    }

    summaryBySlug.set(parentSlug, familyFoundIds.size)

    for (const miniCity of getMiniCitiesForParent(parentSlug)) {
      const stationIds = await loadMiniCityStationIdSetFromDisk(miniCity.slug)
      let foundCount = 0

      familyFoundIds.forEach((stationId) => {
        if (stationIds.has(stationId)) {
          foundCount += 1
        }
      })

      summaryBySlug.set(miniCity.slug, foundCount)
    }
  }

  return Array.from(summaryBySlug.entries()).map(([citySlug, foundCount]) => ({
    citySlug,
    foundCount,
  }))
}
