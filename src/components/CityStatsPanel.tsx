'use client'

import { useSettings } from '@/context/SettingsContext'
import useTranslation from '@/hooks/useTranslation'
import { resolveAccentColorOption } from '@/lib/accentColors'
import { getCityIconPath } from '@/lib/cityAssets'
import { formatLocalizedChinaUiTitle } from '@/lib/chinaUiText'
import { formatLocalizedCityName } from '@/lib/cityNameDisplay'
import { resolveI18nLocaleCode } from '@/lib/i18n'
import { formatLocalizedLineName } from '@/lib/lineNameDisplay'
import { getMiniCityBySlug, isMiniCitySlug } from '@/lib/miniCities'
import { loadMiniCityParentConfig } from '@/lib/miniCityConfigRuntime'
import { isColorLight } from '@/lib/colorUtils'
import { getCompletionColor } from '@/lib/progressColors'
import { formatLocalizedStationDisplayName } from '@/lib/stationNameDisplay'
import { STATION_TOTALS } from '@/lib/stationTotals'
import { getStationKey } from '@/lib/stationUtils'
import { buildSubsetConfig } from '@/lib/subsetCity'
import { Config, DataFeature, DataFeatureCollection, Line, LineGroup, RoutesFeatureCollection } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'
import {
  MdEmojiEvents,
  MdHistory,
  MdHome,
  MdLocationCity,
  MdLock,
  MdPerson,
  MdPublic,
  MdSettings,
} from 'react-icons/md'
import { createPortal } from 'react-dom'
import CloseButton from './CloseButton'
import LineBadge, { getLineBadgeAspectRatio, getLineBadgeMetrics } from './LineBadge'

type CityStatsPanelProps = {
  cityDisplayName: string
  slug: string | null
  cityPath?: string | null
  open: boolean
  onClose: () => void
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
}

type StationTimelineEntry = {
  id: number
  name: string
  lineId?: string
  line?: Line
  lineName?: string
  lineColor?: string
  timestamp?: string
  deltaMs?: number
}

type LineStat = {
  lineId: string
  name: string
  color?: string
  backgroundColor?: string
  textColor?: string
  badgeShape?: Line['badgeShape']
  badgeFit?: Line['badgeFit']
  badgeAspectRatio?: Line['badgeAspectRatio']
  progressOutlineColor?: string
  found: number
  total: number
  percent: number
  durationMs?: number
  firstFoundAt?: string
  lastFoundAt?: string
  icon?: string
}

type GroupStat = {
  title?: string
  titleImage?: string
  items: Array<
    | { type: 'separator' }
    | {
        type: 'lines'
        title: string
        titleImage?: string
        found: number
        total: number
        percent: number
        lineIds: string[]
        accentColor?: string
        lineNames: string[]
      }
  >
}

type CityStatsSnapshot = {
  foundCount: number
  totalStations: number
  percentFound: number
  cumulativeTimeMs: number
  firstFoundAt?: string
  lastFoundAt?: string
  avgTimePerStationMs: number
  uniquePlayDays: number
  lineStats: LineStat[]
  groupStats: GroupStat[]
  timeline: StationTimelineEntry[]
  completedLines: number
  fastestCompletedLine?: LineStat
}

type LocalProgress = {
  foundIds: number[]
  timestamps: Record<string, string>
  totalStations: number
}

type CityDataPayload = {
  features?: DataFeatureCollection
  routes?: RoutesFeatureCollection
}

const formatDuration = (ms?: number) => {
  if (!ms || ms <= 0) {
    return '—'
  }

  const totalSeconds = Math.max(1, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (!days && !hours && seconds) parts.push(`${seconds}s`)

  return parts.length > 0 ? parts.slice(0, 3).join(' ') : '0s'
}

const formatDateTime = (timestamp?: string, language?: string) => {
  if (!timestamp) {
    return '—'
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat(resolveI18nLocaleCode(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`

const MODERN_STATS_FONT_STYLE = {
  fontFamily: 'Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
} as const

const resolveGroupTitleImageSrc = (
  cityPath: string | null | undefined,
  titleImage: string | null | undefined,
) => {
  if (!titleImage) {
    return null
  }

  // a path like "asia/china/gba/BYD.png" is already relative to /images
  if (titleImage.includes('/')) {
    return `/images/${titleImage.replace(/^\/+/, '')}`
  }

  if (!cityPath) {
    return null
  }

  return `/images/${cityPath.replace(/^\//, '')}/${titleImage}`
}

const TitleWithImage = ({
  cityPath,
  image,
  label,
  imageClassName,
  textClassName,
}: {
  cityPath?: string | null
  image?: string
  label: string
  imageClassName: string
  textClassName: string
}) => {
  const imageSrc = resolveGroupTitleImageSrc(cityPath, image)

  return (
    <div className="flex min-w-0 items-center gap-2">
      {imageSrc && (
        <span
          className={`relative flex shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950 ${imageClassName}`}
        >
          <Image
            alt=""
            src={imageSrc}
            fill
            sizes="64px"
            unoptimized
            className="object-contain"
          />
        </span>
      )}
      <span className={textClassName} style={MODERN_STATS_FONT_STYLE}>
        {label}
      </span>
    </div>
  )
}

const readLocalProgress = (slug: string): LocalProgress => {
  if (typeof window === 'undefined' || !slug) {
    return { foundIds: [], timestamps: {}, totalStations: 0 }
  }

  const parseJson = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback
    try {
      const parsed = JSON.parse(value)
      return parsed ?? fallback
    } catch {
      return fallback
    }
  }

  const foundIdsRaw = parseJson<number[] | number>(
    window.localStorage.getItem(`${slug}-stations`),
    [],
  )

  const foundIds: number[] = []
  const seenIds = new Set<number>()
  let numericFound = 0
  if (Array.isArray(foundIdsRaw)) {
    foundIdsRaw.forEach((value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return
      }
      const normalized = Math.trunc(value)
      if (!seenIds.has(normalized)) {
        seenIds.add(normalized)
        foundIds.push(normalized)
      }
    })
  } else if (typeof foundIdsRaw === 'number' && Number.isFinite(foundIdsRaw)) {
    numericFound = Math.max(0, Math.trunc(foundIdsRaw))
  }

  const timestamps = parseJson<Record<string, string>>(
    window.localStorage.getItem(`${slug}-stations-found-at`),
    {},
  )

  const totalStationsRaw = window.localStorage.getItem(
    `${slug}-station-total`,
  )
  const parsedTotal = totalStationsRaw ? Number(totalStationsRaw) : Number.NaN
  const totalStations =
    (Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null) ??
    STATION_TOTALS[slug] ??
    Math.max(foundIds.length, numericFound)

  if (numericFound > 0 && foundIds.length === 0) {
    const synthetic = Math.min(numericFound, totalStations || numericFound)
    for (let i = 0; i < synthetic; i += 1) {
      foundIds.push(i)
    }
  }

  return {
    foundIds,
    timestamps:
      typeof timestamps === 'object' && timestamps !== null ? timestamps : {},
    totalStations: Number.isFinite(totalStations) ? totalStations : foundIds.length,
  }
}

const resolveLineGroupStats = (
  lineGroups: LineGroup[] | undefined,
  totals: Map<string, number>,
  foundPerLine: Map<string, number>,
  linesMetadata: Config['LINES'],
  slug?: string | null,
  language?: string,
): GroupStat[] => {
  if (!lineGroups || lineGroups.length === 0) {
    return []
  }

  return lineGroups.map((group, groupIndex) => ({
    title: formatLocalizedChinaUiTitle(group.title, slug, language),
    titleImage: group.titleImage,
    items: group.items.map((item, itemIndex) => {
      if (item.type === 'separator') {
        return { type: 'separator' as const }
      }

      const aggregate = item.lines.reduce(
        (acc, lineId) => {
          const total = totals.get(lineId) ?? 0
          const found = foundPerLine.get(lineId) ?? 0
          return {
            total: acc.total + total,
            found: acc.found + Math.min(found, total),
          }
        },
        { total: 0, found: 0 },
      )

      const visibleLines = item.lines.filter((lineId) =>
        totals.has(lineId) || Boolean(linesMetadata[lineId]),
      )

      const derivedTitle =
        formatLocalizedChinaUiTitle(
          formatLocalizedLineName(
            item.title ??
              (visibleLines.length === 1
                ? linesMetadata[visibleLines[0]]?.name ?? visibleLines[0]
                : visibleLines.length > 0
                  ? visibleLines
                      .map((lineId) => linesMetadata[lineId]?.name ?? lineId)
                      .join(', ')
                  : 'Misc services'),
            language,
          ),
          slug,
          language,
        )
      const lineNames = visibleLines.map(
        (lineId) =>
          formatLocalizedLineName(linesMetadata[lineId]?.name ?? lineId, language),
      )

      return {
        type: 'lines' as const,
        title: derivedTitle,
        titleImage: item.titleImage,
        total: aggregate.total,
        found: aggregate.found,
        percent: aggregate.total > 0 ? aggregate.found / aggregate.total : 0,
        accentColor:
          visibleLines.length === 1
            ? linesMetadata[visibleLines[0]]?.color
            : undefined,
        lineIds: visibleLines,
        lineNames,
      }
    }),
  }))
}

const resolveStationName = (feature?: DataFeature, language?: string) => {
  if (!feature) {
    return 'Unknown station'
  }
  const value =
    feature.properties?.display_name ??
    feature.properties?.long_name ??
    feature.properties?.short_name ??
    feature.properties?.name ??
    `Station ${feature.id ?? ''}`
  return formatLocalizedStationDisplayName(String(value), language)
}

const computeStats = ({
  config,
  featureCollection,
  progress,
  slug,
  language,
}: {
  config: Config
  featureCollection: DataFeatureCollection
  progress: LocalProgress
  slug?: string | null
  language?: string
}): CityStatsSnapshot => {
  const idToFeature = new Map<number, DataFeature>()
  const totalsPerLine = new Map<string, number>()
  const lineStationKeys = new Map<string, Set<string>>()

  featureCollection.features.forEach((feature) => {
    const id =
      typeof feature.id === 'number'
        ? feature.id
        : Number(feature.id ?? Number.NaN)
    if (Number.isFinite(id)) {
      idToFeature.set(id, feature)
    }

    const line = feature.properties.line
    if (!line) return
    if (!lineStationKeys.has(line)) {
      lineStationKeys.set(line, new Set())
    }
    lineStationKeys.get(line)!.add(getStationKey(feature))
  })

  lineStationKeys.forEach((keys, line) => {
    totalsPerLine.set(line, keys.size)
  })

  const normalizedFoundIds = Array.from(
    new Set(progress.foundIds.filter((id) => idToFeature.has(id))),
  )
  const totalStations =
    idToFeature.size > 0
      ? idToFeature.size
      : Math.max(progress.totalStations, normalizedFoundIds.length)
  const normalizedProgress: LocalProgress = {
    ...progress,
    foundIds: normalizedFoundIds,
    totalStations,
  }

  const foundPerLineSet = new Map<string, Set<string>>()
  const timeline: StationTimelineEntry[] = []
  const timestampedEntries: StationTimelineEntry[] = []

  normalizedProgress.foundIds.forEach((id) => {
    const feature = idToFeature.get(id)
    if (!feature) {
      return
    }
    const line = feature.properties.line
    const key = getStationKey(feature)
    if (line) {
      if (!foundPerLineSet.has(line)) {
        foundPerLineSet.set(line, new Set())
      }
      foundPerLineSet.get(line)!.add(key)
    }

    const timestamp = normalizedProgress.timestamps[String(id)]
    const lineMeta = line ? config.LINES[line] : undefined
    const entry: StationTimelineEntry = {
      id,
      name: resolveStationName(feature, language),
      lineId: line ?? undefined,
      line: lineMeta,
      lineName: line
        ? formatLocalizedLineName(lineMeta?.name ?? line, language)
        : undefined,
      lineColor: lineMeta?.color,
      timestamp: timestamp && !Number.isNaN(Date.parse(timestamp)) ? timestamp : undefined,
    }
    timeline.push(entry)
    if (entry.timestamp) {
      timestampedEntries.push(entry)
    }
  })

  timestampedEntries.sort(
    (a, b) =>
      Date.parse(a.timestamp as string) - Date.parse(b.timestamp as string),
  )

  const firstTimestamp = timestampedEntries[0]?.timestamp
  const lastTimestamp = timestampedEntries[timestampedEntries.length - 1]?.timestamp
  const cumulativeTimeMs =
    firstTimestamp && lastTimestamp
      ? Math.max(
          0,
          Date.parse(lastTimestamp) - Date.parse(firstTimestamp),
        )
      : 0
  const avgTimePerStationMs =
    timestampedEntries.length > 1
      ? cumulativeTimeMs / (timestampedEntries.length - 1)
      : 0

  const uniquePlayDays = new Set(
    timestampedEntries.map((entry) =>
      entry.timestamp ? new Date(entry.timestamp).toISOString().slice(0, 10) : '',
    ),
  )
  uniquePlayDays.delete('')

  const lineStats: LineStat[] = Object.entries(config.LINES).map(
    ([lineId, meta]) => {
      const total = totalsPerLine.get(lineId) ?? 0
      const foundCount = foundPerLineSet.get(lineId)?.size ?? 0

      const timestamps: number[] = timestampedEntries
        .filter((entry) => entry.lineId === lineId && entry.timestamp)
        .map((entry) => Date.parse(entry.timestamp as string))
        .filter((value) => Number.isFinite(value))

      const first = timestamps.length > 0 ? Math.min(...timestamps) : null
      const last = timestamps.length > 0 ? Math.max(...timestamps) : null
      const durationMs =
        first !== null && last !== null && last > first ? last - first : undefined

      const displayColor = meta?.statsColor ?? meta?.color ?? meta?.backgroundColor
      return {
        lineId,
        name: formatLocalizedLineName(meta?.name ?? lineId, language),
        color: displayColor,
        backgroundColor: meta?.backgroundColor,
        textColor: meta?.textColor,
        badgeShape: meta?.badgeShape,
        badgeFit: meta?.badgeFit,
        badgeAspectRatio: meta?.badgeAspectRatio,
        progressOutlineColor: meta?.progressOutlineColor,
        found: foundCount,
        total,
        percent: total > 0 ? foundCount / total : 0,
        firstFoundAt: first ? new Date(first).toISOString() : undefined,
        lastFoundAt: last ? new Date(last).toISOString() : undefined,
        durationMs,
        icon: meta?.icon,
      }
    },
  )

  const completedLines = lineStats.filter(
    (line) => line.total > 0 && line.found >= line.total,
  )
  const fastestCompletedLine = [...completedLines]
    .filter((line) => line.durationMs)
    .sort((a, b) => (a.durationMs ?? 0) - (b.durationMs ?? 0))[0]

  const groupStats = resolveLineGroupStats(
    config.LINE_GROUPS,
    totalsPerLine,
    new Map(
      Array.from(foundPerLineSet.entries()).map(([line, keys]) => [
        line,
        keys.size,
      ]),
    ),
    config.LINES,
    slug,
    language,
  )

  const enrichedTimeline = timestampedEntries.map((entry) => ({
    ...entry,
    deltaMs: entry.timestamp
      ? Date.parse(entry.timestamp) -
        (firstTimestamp ? Date.parse(firstTimestamp) : 0)
      : undefined,
  }))

  return {
    foundCount: normalizedProgress.foundIds.length,
    totalStations: normalizedProgress.totalStations,
    percentFound:
      normalizedProgress.totalStations > 0
        ? normalizedProgress.foundIds.length / normalizedProgress.totalStations
        : 0,
    cumulativeTimeMs,
    firstFoundAt: firstTimestamp,
    lastFoundAt: lastTimestamp,
    avgTimePerStationMs,
    uniquePlayDays: uniquePlayDays.size,
    lineStats,
    groupStats,
    timeline: enrichedTimeline.reverse().slice(0, 10),
    completedLines: completedLines.length,
    fastestCompletedLine,
  }
}

const CityStatsPanel = ({
  cityDisplayName,
  slug,
  cityPath,
  open,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
}: CityStatsPanelProps) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const accentPalette = resolveAccentColorOption(settings.accentColor)
  const accentFallbackColor = accentPalette?.palette[600] ?? '#0284c7'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CityStatsSnapshot | null>(null)
  const localizedCityDisplayName = formatLocalizedCityName(
    cityDisplayName,
    slug ?? cityDisplayName,
    settings.language,
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowLeft' && onNavigatePrevious) {
        event.preventDefault()
        onNavigatePrevious()
        return
      }
      if (event.key === 'ArrowRight' && onNavigateNext) {
        event.preventDefault()
        onNavigateNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [open, onClose, onNavigateNext, onNavigatePrevious])

  useEffect(() => {
    const resolvedPath = cityPath?.replace(/^\//, '') ?? null
    if (!open || !slug) {
      return
    }
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setStats(null)
      try {
        let config: Config
        let featureCollection: DataFeatureCollection

        if (isMiniCitySlug(slug)) {
          const miniCity = getMiniCityBySlug(slug)
          if (!miniCity) {
            throw new Error(`Unknown mini city: ${slug}`)
          }

          const [parentConfig, payloadResponse] = await Promise.all([
            loadMiniCityParentConfig(miniCity.parentSlug),
            fetch(`/city-data/${slug}.json`, { cache: 'no-store' }),
          ])

          if (!parentConfig) {
            throw new Error(`Missing parent config for ${slug}`)
          }

          if (!payloadResponse.ok) {
            throw new Error(`Unable to fetch city-data payload for ${slug}`)
          }

          const payload = (await payloadResponse.json()) as CityDataPayload

          if (!payload.features) {
            throw new Error(`Missing features payload for ${slug}`)
          }

          featureCollection = payload.features
          config = buildSubsetConfig(
            parentConfig,
            miniCity,
            payload.features,
            payload.routes ?? { type: 'FeatureCollection', features: [] },
          )
        } else {
          if (!resolvedPath) {
            return
          }

          const [configModule, payloadResponse] = await Promise.all([
            import(`@/app/(game)/${resolvedPath}/config`) as Promise<{ default: Config }>,
            fetch(`/city-data/${slug}.json`, { cache: 'no-store' }),
          ])

          if (cancelled) {
            return
          }

          if (!payloadResponse.ok) {
            throw new Error(`Unable to fetch city-data payload for ${slug}`)
          }

          const payload = (await payloadResponse.json()) as CityDataPayload
          if (!payload.features) {
            throw new Error(`Missing features payload for ${slug}`)
          }

          config = configModule.default
          featureCollection = payload.features
        }

        if (cancelled) {
          return
        }

        const progress = readLocalProgress(slug)
        const snapshot = computeStats({
          config,
          featureCollection,
          progress,
          slug,
          language: settings.language,
        })
        setStats(snapshot)
      } catch (err) {
        console.error(err)
        setError(
          'Unable to load detailed stats. Try opening this city once to generate progress data.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, slug, cityPath])

  if (!open || !slug) {
    return null
  }

  if (typeof document === 'undefined') {
      return null
  }

  const cityIconSrc = getCityIconPath(slug)
  const quickNavLinks = [
    { label: t('tabHome'), href: '/', icon: MdHome },
    { label: t('tabCities'), href: '/?tab=cities', icon: MdLocationCity },
    { label: t('tabAchievements'), href: '/?tab=achievements', icon: MdEmojiEvents },
    { label: t('tabUpdateLog'), href: '/?tab=updateLog', icon: MdHistory },
    { label: t('tabAccount'), href: '/?tab=account', icon: MdPerson },
    { label: t('tabGlobalStats'), href: '/?tab=globalStats', icon: MdPublic },
    { label: t('tabSettings'), href: '/?tab=settings', icon: MdSettings },
    { label: t('tabPrivacy'), href: '/?tab=privacy', icon: MdLock },
  ]

  const handleInnerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  const renderOverview = () => {
    if (!stats) {
      return null
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
          <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('cityStatsStationsProgress')}
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            <span className="text-emerald-500">
              {stats.foundCount.toLocaleString()}
            </span>{' '}
            <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
              / {stats.totalStations.toLocaleString()}
            </span>
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: getCompletionColor(stats.percentFound) }}
          >
            {t('cityStatsPercentFound', { percent: formatPercent(stats.percentFound) })}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#18181b] dark:bg-zinc-900">
          <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('cityStatsTimeSpent')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatDuration(stats.cumulativeTimeMs)}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {t('cityStatsAvgPerStation', {
              duration: formatDuration(stats.avgTimePerStationMs),
            })}{' '}
            · {t('cityStatsPlayDays', { count: stats.uniquePlayDays })}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#18181b] dark:bg-zinc-900">
          <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('cityStatsFirstLatest')}
          </p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
            {t('cityStatsFirst', {
              value: formatDateTime(stats.firstFoundAt, settings.language),
            })}
            <br />
            {t('cityStatsLatest', {
              value: formatDateTime(stats.lastFoundAt, settings.language),
            })}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
          <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('cityStatsCompletedLines')}
          </p>
          {(() => {
            const totalLineCount = stats.lineStats.filter((line) => line.total > 0).length
            const completionRatio =
              totalLineCount > 0 ? stats.completedLines / totalLineCount : 0
            return (
              <p
                className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50"
                style={{ color: getCompletionColor(completionRatio) }}
              >
                {stats.completedLines}
              </p>
            )
          })()}
          {stats.fastestCompletedLine && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {t('cityStatsFastestLine', {
                line: stats.fastestCompletedLine.name,
                duration: stats.fastestCompletedLine.durationMs
                  ? formatDuration(stats.fastestCompletedLine.durationMs)
                  : undefined,
              })}
            </p>
          )}
        </div>
      </div>
    )
  }

  const renderLineStats = () => {
    if (!stats) {
      return null
    }

    const visibleLines = stats.lineStats.filter((line) => line.total > 0)
    if (visibleLines.length === 0) {
      return null
    }

    const lineStatsMap = new Map(stats.lineStats.map((line) => [line.lineId, line]))

    return (
      <div>
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t('cityStatsLineBreakdown')}
        </h4>
        <div className="mt-3 space-y-6">
          {stats.groupStats.map((group, groupIndex) => (
            <div key={`${group.title ?? 'group'}-${groupIndex}`} className="space-y-3">
              {group.title && (
                <TitleWithImage
                  cityPath={cityPath}
                  image={group.titleImage}
                  label={group.title}
                  imageClassName="h-8 w-14"
                  textClassName="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                />
              )}
              {group.items.map((item, itemIndex) => {
                if (item.type === 'separator') {
                  return (
                    <hr
                      key={`separator-${groupIndex}-${itemIndex}`}
                      className="border-zinc-200 dark:border-[#18181b]"
                    />
                  )
                }

                const itemVisibleLines = item.lineIds
                  .map((id) => lineStatsMap.get(id))
                  .filter((line): line is LineStat => !!line && line.total > 0)

                if (itemVisibleLines.length === 0) {
                  return null
                }

                return (
                  <div
                    key={`${item.title ?? 'lines'}-${groupIndex}-${itemIndex}`}
                    className="space-y-2"
                  >
                    {item.titleImage && (
                      <TitleWithImage
                        cityPath={cityPath}
                        image={item.titleImage}
                        label={item.title}
                        imageClassName="h-7 w-12"
                        textClassName="text-sm font-semibold tracking-[0.01em] text-zinc-700 dark:text-zinc-200"
                      />
                    )}
                    <div className="space-y-2">
                      {itemVisibleLines.map((line) => {
                        const fillColor = line.color ?? '#4f46e5'
                        const needsContrastBorder = isColorLight(fillColor)
                        const badgeMetrics = getLineBadgeMetrics(
                          line.badgeShape,
                          'medium',
                          getLineBadgeAspectRatio(line),
                        )
                        const badgeColumnWidth = Math.min(badgeMetrics.width, 96)
                        return (
                          <div
                            key={line.lineId}
                            className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#18181b] dark:bg-zinc-900"
                          >
                            <div
                              className="flex flex-shrink-0 items-center justify-center"
                              style={{ width: badgeColumnWidth }}
                            >
                              <LineBadge
                                lineId={line.lineId}
                                line={line}
                                iconBasePath={cityPath}
                                size="medium"
                                defaultFit="contain"
                                maxWidth={badgeColumnWidth}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p
                                    className="text-sm font-semibold tracking-[0.01em] text-zinc-900 dark:text-zinc-100"
                                    style={MODERN_STATS_FONT_STYLE}
                                  >
                                    {line.name}
                                  </p>
                                  <p
                                    className="text-xs font-semibold"
                                    style={{ color: getCompletionColor(line.percent) }}
                                  >
                                    {line.found}/{line.total} ({formatPercent(line.percent)})
                                  </p>
                                </div>
                                <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                                  {line.durationMs
                                    ? `Active for ${formatDuration(line.durationMs)}`
                                    : t('cityStatsNoTimeData')}
                                </div>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, line.percent * 100)}%`,
                                    backgroundColor: fillColor,
                                    boxShadow: needsContrastBorder
                                      ? 'inset 0 0 0 1px rgba(24,24,27,0.18)'
                                      : undefined,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderGroupStats = () => {
    if (!stats || stats.groupStats.length === 0) {
      return null
    }

    return (
      <div>
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t('cityStatsHeadersSubheaders')}
        </h4>
        <div className="mt-3 space-y-4">
          {stats.groupStats.map((group, idx) => (
            <div key={`${group.title ?? 'group'}-${idx}`}>
              {group.title && (
                <TitleWithImage
                  cityPath={cityPath}
                  image={group.titleImage}
                  label={group.title}
                  imageClassName="h-8 w-14"
                  textClassName="text-xs font-semibold uppercase tracking-wide text-[var(--accent-500)] dark:text-[var(--accent-300)]"
                />
              )}
              <div className="mt-2 space-y-2">
                {group.items.map((item, itemIdx) =>
                  item.type === 'separator' ? (
                    <hr
                      key={`separator-${idx}-${itemIdx}`}
                      className="border-zinc-200 dark:border-[#18181b]"
                    />
                  ) : (
                    <div
                      key={`${item.title ?? 'lines'}-${idx}-${itemIdx}`}
                      className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#18181b] dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between">
                        <TitleWithImage
                          cityPath={cityPath}
                          image={item.titleImage}
                          label={item.title}
                          imageClassName="h-7 w-12"
                          textClassName="text-sm font-semibold tracking-[0.01em] text-zinc-800 dark:text-zinc-100"
                        />
                        <p
                          className="text-sm font-semibold"
                          style={{ color: getCompletionColor(item.percent) }}
                        >
                          {item.found}/{item.total}{' '}
                          <span className="text-xs font-normal">
                            ({formatPercent(item.percent)})
                          </span>
                        </p>
                      </div>
                      {(() => {
                        const fillColor = item.accentColor ?? accentFallbackColor
                        const needsContrastBorder = isColorLight(fillColor)
                        return (
                          <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, item.percent * 100)}%`,
                                backgroundColor: fillColor,
                                boxShadow: needsContrastBorder
                                  ? 'inset 0 0 0 1px rgba(24,24,27,0.18)'
                                  : undefined,
                              }}
                            ></div>
                          </div>
                        )
                      })()}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTimeline = () => {
    if (!stats || stats.timeline.length === 0) {
      return (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No timestamped stations yet. Play the city to start building your history.
        </p>
      )
    }

    return (
      <ol className="space-y-3">
        {stats.timeline.map((entry, index) => {
          const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
          const accentColor = rankColors[index] ?? undefined
          return (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#18181b] dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-300 text-lg font-semibold text-zinc-600 dark:border-[#18181b] dark:text-zinc-200">
              <span
                style={
                  accentColor
                    ? { color: accentColor, fontWeight: 700 }
                    : { fontWeight: 600 }
                }
              >
                {index + 1}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {entry.name}
                </p>
                {entry.lineId && entry.line && (
                  <div className="mt-1">
                    <LineBadge
                      lineId={entry.lineId}
                      line={entry.line}
                      iconBasePath={cityPath}
                      defaultFit="contain"
                      maxWidth={64}
                    />
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-zinc-500 dark:text-zinc-300">
                {entry.timestamp
                  ? formatDateTime(entry.timestamp, settings.language)
                  : t('unknownLabel')}
              </div>
            </div>
          </li>
        )
      })}
      </ol>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {onNavigatePrevious && (
        <button
          type="button"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-base font-semibold text-zinc-800 shadow-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-900/90 dark:text-zinc-100"
          onClick={(event) => {
            event.stopPropagation()
            onNavigatePrevious()
          }}
          aria-label="View previous city stats"
        >
          &lt;
        </button>
      )}
      {onNavigateNext && (
        <button
          type="button"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-base font-semibold text-zinc-800 shadow-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-900/90 dark:text-zinc-100"
          onClick={(event) => {
            event.stopPropagation()
            onNavigateNext()
          }}
          aria-label="View next city stats"
        >
          &gt;
        </button>
      )}
      <div
        className="mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-[#18181b] dark:bg-zinc-950"
        onClick={handleInnerClick}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full">
            <p className="text-sm uppercase tracking-wide text-[var(--accent-500)] dark:text-[var(--accent-300)]">
              {t('progressDetailsTitle')}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 dark:border-[#18181b] dark:bg-zinc-900 sm:h-14 sm:w-14">
                <Image
                  src={cityIconSrc}
                  alt={`${localizedCityDisplayName} icon`}
                  fill
                  sizes="(max-width: 640px) 48px, 56px"
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <h3 className="min-w-0 flex-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                {localizedCityDisplayName}
              </h3>
            </div>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {quickNavLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="group inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                aria-label={link.label}
                title={link.label}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:pl-2 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:pl-2 group-focus-visible:opacity-100">
                  {link.label}
                </span>
              </Link>
            )
          })}
          <CloseButton
            ariaLabel={t('closeLabel')}
            onClick={onClose}
            className="h-11 w-11 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          />
        </div>
        <div className="mt-4 space-y-6">
          {loading && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
               {t('loadingCityStats')}
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200">
              {error}
            </p>
          )}
          {!loading && !error && renderOverview()}
          {!loading && !error && renderLineStats()}
          {!loading && !error && renderGroupStats()}
          {!loading && !error && (
            <div>
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t('cityStatsTimelineTitle')}
              </h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {t('cityStatsTimelineSubtitle')}
              </p>
              <div className="mt-3">{renderTimeline()}</div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CityStatsPanel
