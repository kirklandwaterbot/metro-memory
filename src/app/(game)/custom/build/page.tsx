'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MdArrowBack, MdShare, MdSortByAlpha } from 'react-icons/md'

import LineBadge from '@/components/LineBadge'
import { AVAILABLE_CITY_SLUGS } from '@/lib/availableCityData'
import { cities, isCityDisabled, getSlugFromLink } from '@/lib/citiesConfig'
import { CITY_PATH_MAP } from '@/lib/cityPathMap'
import {
  countSelectedLines,
  encodeWorldSelection,
  type WorldMapSelection,
} from '@/lib/customWorldMapSelection'
import { MINI_CITIES } from '@/lib/miniCities'
import { repairMojibakeString } from '@/lib/repairMojibake'
import type { LineGroup } from '@/lib/types'

type CityLine = {
  id: string
  name: string
  color: string
  order: number
  icon?: string
  badgeShape?: 'circle' | 'capsule' | 'square' | 'wide' | 'diamond'
  badgeFit?: 'contain' | 'cover'
  badgeAspectRatio?: number
}

type CityLinesPayload = {
  assetBasePath?: string | null
  lines?: CityLine[]
  lineGroups?: LineGroup[]
}

type VisibleLineGroupItem =
  | {
      type: 'lines'
      title?: string
      titleImage?: string
      lineIds: string[]
    }
  | { type: 'separator' }

type VisibleLineGroup = {
  title?: string
  titleImage?: string
  items: VisibleLineGroupItem[]
}

type SortDirection = 'asc' | 'desc'
type ShareStatus = 'idle' | 'copied' | 'shared' | 'failed'

const STANDARD_ICON_SRC = '/icon.ico'

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

const continentRank = (continent: string) => {
  const index = CONTINENT_ORDER.indexOf(continent)
  return index === -1 ? CONTINENT_ORDER.length : index
}

const cleanDisplayName = (name: string) =>
  repairMojibakeString(name)
    .split(',')[0]
    .trim()

const titleCaseSlugPart = (part: string) =>
  SLUG_WORD_OVERRIDES[part] ??
  (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)

const prettifyCityName = (slug: string): string =>
  slug
    .split('-')
    .map(titleCaseSlugPart)
    .join(' ')

const cityNamesBySlug = new Map<string, string>()
const cityContinentsBySlug = new Map<string, string>()

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

const DISABLED_SLUGS = new Set(
  cities
    .filter((city) => isCityDisabled(city))
    .map((city) => getSlugFromLink(city.link))
    .filter((slug): slug is string => slug !== null),
)

const ALL_CITIES = Array.from(AVAILABLE_CITY_SLUGS)
  .filter((slug) => !DISABLED_SLUGS.has(slug) && Boolean(CITY_PATH_MAP[slug]))
  .map((slug) => {
    const continent = getCityContinent(slug)
    return {
      slug,
      name: getCityDisplayName(slug),
      continent,
      continentRank: continentRank(continent),
    }
  })

const cityListEntryBySlug = new Map(ALL_CITIES.map((city) => [city.slug, city]))

const compareCitySlugs = (leftSlug: string, rightSlug: string, direction: SortDirection) => {
  const directionFactor = direction === 'asc' ? 1 : -1
  const left = cityListEntryBySlug.get(leftSlug)
  const right = cityListEntryBySlug.get(rightSlug)

  return (
    (left?.continentRank ?? CONTINENT_ORDER.length) -
      (right?.continentRank ?? CONTINENT_ORDER.length) ||
    directionFactor *
      (left?.name ?? getCityDisplayName(leftSlug)).localeCompare(
        right?.name ?? getCityDisplayName(rightSlug),
      ) ||
    leftSlug.localeCompare(rightSlug)
  )
}

const cityIconSrc = (slug: string): string => {
  const assetBasePath = CITY_PATH_MAP[slug]
  return assetBasePath ? `/images/${assetBasePath}/icon.ico` : STANDARD_ICON_SRC
}

const CityIcon = ({
  slug,
  sizeClassName,
  width,
  height,
}: {
  slug: string
  sizeClassName: string
  width: number
  height: number
}) => {
  const [useFallback, setUseFallback] = useState(false)

  return (
    <Image
      src={useFallback ? STANDARD_ICON_SRC : cityIconSrc(slug)}
      alt=""
      width={width}
      height={height}
      unoptimized
      onError={() => setUseFallback(true)}
      className={`${sizeClassName} shrink-0 rounded-sm object-contain`}
    />
  )
}

const lineGroupImageSrc = (image: string, iconBasePath?: string | null) => {
  const normalized = image.replace(/^\/+/, '')
  if (normalized.startsWith('images/')) {
    return `/${normalized}`
  }

  if (image.includes('/')) {
    return `/images/${normalized}`
  }

  if (iconBasePath) {
    return `/images/${iconBasePath.replace(/^\//, '')}/${image}`
  }

  return `/images/${image}`
}

const buildVisibleLineGroups = (
  lines: CityLine[],
  lineGroups: LineGroup[] | undefined,
): VisibleLineGroup[] => {
  const lineIds = new Set(lines.map((line) => line.id))
  const groupedLineIds = new Set<string>()
  const visibleGroups: VisibleLineGroup[] = []

  lineGroups?.forEach((group) => {
    const items: VisibleLineGroupItem[] = []

    group.items.forEach((item) => {
      if (item.type === 'separator') {
        const previous = items[items.length - 1]
        if (items.length > 0 && previous?.type !== 'separator') {
          items.push(item)
        }
        return
      }

      const visibleLineIds = item.lines.filter((lineId) => lineIds.has(lineId))
      if (visibleLineIds.length === 0) {
        return
      }

      visibleLineIds.forEach((lineId) => groupedLineIds.add(lineId))
      items.push({
        type: 'lines',
        title: item.title,
        titleImage: item.titleImage,
        lineIds: visibleLineIds,
      })
    })

    while (items[items.length - 1]?.type === 'separator') {
      items.pop()
    }

    if (items.some((item) => item.type === 'lines')) {
      visibleGroups.push({
        title: group.title,
        titleImage: group.titleImage,
        items,
      })
    }
  })

  const ungroupedLines = lines.filter((line) => !groupedLineIds.has(line.id))
  if (ungroupedLines.length > 0) {
    visibleGroups.push({
      items: [
        {
          type: 'lines',
          lineIds: ungroupedLines.map((line) => line.id),
        },
      ],
    })
  }

  return visibleGroups
}

const LineGroupHeading = ({
  title,
  image,
  iconBasePath,
  compact = false,
}: {
  title?: string
  image?: string
  iconBasePath?: string | null
  compact?: boolean
}) => {
  if (!title && !image) {
    return null
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-2 px-2 ${
        compact
          ? 'pt-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300'
          : 'text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'
      }`}
    >
      {image ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${
            compact ? 'h-6 min-w-6 max-w-[5.5rem] px-1.5' : 'h-7 min-w-7 max-w-[6.5rem] px-2'
          }`}
        >
          <Image
            src={lineGroupImageSrc(image, iconBasePath)}
            alt=""
            width={112}
            height={40}
            unoptimized
            className="h-auto max-h-5 w-auto max-w-full object-contain"
          />
        </span>
      ) : null}
      {title ? <span className="truncate">{title}</span> : null}
    </div>
  )
}

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back to the legacy copy path below.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export default function CustomWorldMapBuilder() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [title, setTitle] = useState('My World Map')
  // Selected line ids per city.
  const [selected, setSelected] = useState<Record<string, Set<string>>>({})
  const [addedCities, setAddedCities] = useState<string[]>([])
  const [cityLines, setCityLines] = useState<Record<string, CityLine[]>>({})
  const [cityLineGroups, setCityLineGroups] = useState<Record<string, LineGroup[]>>({})
  const [cityAssetBasePaths, setCityAssetBasePaths] = useState<Record<string, string | null>>({})
  const [loadingCity, setLoadingCity] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle')

  const sortedCities = useMemo(
    () => [...ALL_CITIES].sort((a, b) => compareCitySlugs(a.slug, b.slug, sortDirection)),
    [sortDirection],
  )

  const sortedAddedCities = useMemo(
    () => [...addedCities].sort((a, b) => compareCitySlugs(a, b, sortDirection)),
    [addedCities, sortDirection],
  )

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sortedCities
    return sortedCities.filter(
      (city) =>
        city.name.toLowerCase().includes(query) ||
        city.slug.includes(query) ||
        city.continent.toLowerCase().includes(query),
    )
  }, [search, sortedCities])

  const loadCity = useCallback(
    async (slug: string) => {
      if (cityLines[slug]) return
      setLoadingCity(slug)
      try {
        const response = await fetch(`/api/custom/city-lines/${slug}`)
        if (!response.ok) return
        const data = (await response.json()) as CityLinesPayload
        setCityLines((prev) => ({ ...prev, [slug]: data.lines ?? [] }))
        setCityLineGroups((prev) => ({ ...prev, [slug]: data.lineGroups ?? [] }))
        setCityAssetBasePaths((prev) => ({
          ...prev,
          [slug]: data.assetBasePath ?? CITY_PATH_MAP[slug] ?? null,
        }))
      } catch {
        // ignore - city stays without lines and can be re-added
      } finally {
        setLoadingCity((current) => (current === slug ? null : current))
      }
    },
    [cityLines],
  )

  const addCity = useCallback(
    (slug: string) => {
      setAddedCities((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
      void loadCity(slug)
    },
    [loadCity],
  )

  const removeCity = useCallback((slug: string) => {
    setAddedCities((prev) => prev.filter((entry) => entry !== slug))
    setSelected((prev) => {
      const next = { ...prev }
      delete next[slug]
      return next
    })
  }, [])

  const toggleLine = useCallback((slug: string, lineId: string) => {
    setSelected((prev) => {
      const next = new Set(prev[slug] ?? [])
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return { ...prev, [slug]: next }
    })
  }, [])

  const setCitySelection = useCallback(
    (slug: string, lineIds: string[], shouldSelect: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev[slug] ?? [])
        lineIds.forEach((id) => (shouldSelect ? next.add(id) : next.delete(id)))
        return { ...prev, [slug]: next }
      })
    },
    [],
  )

  const selection: WorldMapSelection = useMemo(
    () =>
      sortedAddedCities
        .map((city) => ({ city, lines: Array.from(selected[city] ?? []) }))
        .filter((entry) => entry.lines.length > 0),
    [selected, sortedAddedCities],
  )

  const totalSelected = countSelectedLines(selection)
  const mapTitle = title.trim() || 'My World Map'

  const customMapPath = useMemo(() => {
    if (totalSelected === 0) {
      return null
    }

    const sel = encodeWorldSelection(selection)
    const params = new URLSearchParams({ world: '1', sel, title: mapTitle })
    return `/custom?${params.toString()}`
  }, [mapTitle, selection, totalSelected])

  const handlePlay = useCallback(() => {
    if (!customMapPath) return
    setLaunching(true)
    router.push(customMapPath)
  }, [customMapPath, router])

  const handleShare = useCallback(async () => {
    if (!customMapPath || typeof window === 'undefined') {
      return
    }

    const shareUrl = new URL(customMapPath, window.location.origin).toString()
    setSharing(true)
    setShareStatus('idle')

    try {
      if (navigator.share) {
        await navigator.share({
          title: mapTitle,
          text: `Play ${mapTitle} on Metro Memory.`,
          url: shareUrl,
        })
        setShareStatus('shared')
        return
      }

      const copied = await copyTextToClipboard(shareUrl)
      setShareStatus(copied ? 'copied' : 'failed')
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        setShareStatus('failed')
      }
    } finally {
      setSharing(false)
    }
  }, [customMapPath, mapTitle])

  useEffect(() => {
    if (shareStatus === 'idle') {
      return
    }

    const timeout = window.setTimeout(() => setShareStatus('idle'), 2400)
    return () => window.clearTimeout(timeout)
  }, [shareStatus])

  const shareButtonLabel =
    shareStatus === 'copied'
      ? 'Copied'
      : shareStatus === 'shared'
        ? 'Shared'
        : shareStatus === 'failed'
          ? 'Copy failed'
          : 'Share'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <MdArrowBack aria-hidden className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Custom World Map
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Mix lines from any cities around the world into a single map, then test how many
            stations you can name across all of them.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Add cities
          </label>
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cities"
              className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort cities ${sortDirection === 'asc' ? 'Z to A' : 'A to Z'}`}
              title={`Sort cities ${sortDirection === 'asc' ? 'Z to A' : 'A to Z'}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <MdSortByAlpha aria-hidden className="h-4 w-4" />
              {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
          </div>
          <div className="max-h-[52vh] overflow-y-auto pr-1">
            <ul className="space-y-1">
              {filteredCities.map((city, index) => {
                const isAdded = addedCities.includes(city.slug)
                const showContinentHeading =
                  index === 0 || filteredCities[index - 1]?.continent !== city.continent
                return (
                  <li key={city.slug}>
                    {showContinentHeading ? (
                      <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-zinc-500 first:pt-0 dark:text-zinc-400">
                        {city.continent}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => (isAdded ? removeCity(city.slug) : addCity(city.slug))}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        isAdded
                          ? 'bg-[var(--accent-600)] text-white'
                          : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CityIcon
                          slug={city.slug}
                          width={20}
                          height={20}
                          sizeClassName="h-5 w-5"
                        />
                        <span className="truncate">{city.name}</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs opacity-80">
                        {isAdded ? 'Remove' : 'Add'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Selected lines
          </label>
          {addedCities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Add a city on the left to choose its lines.
            </div>
          ) : (
            <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
              {sortedAddedCities.map((slug) => {
                const lines = cityLines[slug]
                const citySelected = selected[slug] ?? new Set<string>()
                const iconBasePath = cityAssetBasePaths[slug] ?? CITY_PATH_MAP[slug] ?? null
                const lineById = new Map(lines?.map((line) => [line.id, line]) ?? [])
                const visibleLineGroups = lines
                  ? buildVisibleLineGroups(lines, cityLineGroups[slug])
                  : []

                return (
                  <div
                    key={slug}
                    className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <CityIcon
                          slug={slug}
                          width={24}
                          height={24}
                          sizeClassName="h-6 w-6"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {getCityDisplayName(slug)}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {citySelected.size}/{lines?.length ?? 0} lines
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {lines && lines.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCitySelection(slug, lines.map((l) => l.id), true)}
                              className="rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => setCitySelection(slug, lines.map((l) => l.id), false)}
                              className="rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              None
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeCity(slug)}
                          className="rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {!lines ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {loadingCity === slug ? 'Loading lines...' : 'No line data.'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {visibleLineGroups.map((group, groupIndex) => (
                          <div
                            key={`${slug}-group-${group.title ?? groupIndex}`}
                            className="space-y-2"
                          >
                            <LineGroupHeading
                              title={group.title}
                              image={group.titleImage}
                              iconBasePath={iconBasePath}
                            />
                            {group.items.map((item, itemIndex) => {
                              if (item.type === 'separator') {
                                return (
                                  <div
                                    key={`${slug}-group-${groupIndex}-separator-${itemIndex}`}
                                    className="mx-2 border-t border-zinc-200 dark:border-zinc-800"
                                  />
                                )
                              }

                              return (
                                <div
                                  key={`${slug}-group-${groupIndex}-item-${item.title ?? itemIndex}`}
                                  className="space-y-1.5"
                                >
                                  <LineGroupHeading
                                    title={item.title}
                                    image={item.titleImage}
                                    iconBasePath={iconBasePath}
                                    compact
                                  />
                                  <div className="grid gap-1 sm:grid-cols-2">
                                    {item.lineIds.map((lineId) => {
                                      const line = lineById.get(lineId)
                                      if (!line) {
                                        return null
                                      }

                                      return (
                                        <label
                                          key={line.id}
                                          className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={citySelected.has(line.id)}
                                            onChange={() => toggleLine(slug, line.id)}
                                            className="h-4 w-4 shrink-0 rounded border-zinc-300 text-[var(--accent-600)] focus:ring-[var(--accent-500)]"
                                          />
                                          <LineBadge
                                            lineId={line.id}
                                            line={line}
                                            iconBasePath={iconBasePath}
                                            size="small"
                                            defaultFit="contain"
                                            maxWidth={72}
                                            alt=""
                                          />
                                          <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                                            {line.name}
                                          </span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:flex-row sm:items-center">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Map title"
          className="w-full flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {totalSelected} line{totalSelected === 1 ? '' : 's'} selected
        </span>
        <button
          type="button"
          onClick={handleShare}
          disabled={totalSelected === 0 || sharing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <MdShare aria-hidden className="h-4 w-4" />
          {sharing ? 'Sharing...' : shareButtonLabel}
        </button>
        <button
          type="button"
          onClick={handlePlay}
          disabled={totalSelected === 0 || launching}
          className="shrink-0 rounded-xl bg-[var(--accent-600)] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-700)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {launching ? 'Loading...' : 'Play World Map'}
        </button>
      </div>
    </div>
  )
}