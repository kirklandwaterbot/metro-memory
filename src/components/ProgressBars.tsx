'use client'

import OverflowMarquee from '@/components/OverflowMarquee'
import { useSettings } from '@/context/SettingsContext'
import { formatLocalizedChinaUiTitle } from '@/lib/chinaUiText'
import { isColorLight } from '@/lib/colorUtils'
import { useConfig } from '@/lib/configContext'
import { formatLocalizedLineName } from '@/lib/lineNameDisplay'
import { getCompletionColor } from '@/lib/progressColors'
import clsx from 'clsx'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import LineBadge, { getLineBadgeMetrics } from './LineBadge'

/** Path of a rounded rectangle starting at the middle of the top edge, clockwise. */
const roundedRectPath = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  const cx = x + w / 2
  return [
    `M ${cx} ${y}`,
    `H ${x + w - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
    `V ${y + h - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
    `H ${x + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
    `V ${y + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    'Z',
  ].join(' ')
}

/**
 * Progress ring for non-circular badges: a stroke that follows the badge's own
 * rounded-rectangle outline, filling clockwise from the top centre like the
 * circular gauge does.
 */
const BadgeProgressRing = ({
  width,
  height,
  badgeRadius,
  ringWidth,
  progress,
  progressColor,
  trailColor,
  fillColor,
  contrastOutline,
  className,
}: {
  width: number
  height: number
  badgeRadius: number
  ringWidth: number
  progress: number
  progressColor: string
  trailColor: string
  fillColor: string
  contrastOutline?: boolean
  className?: string
}) => {
  const half = ringWidth / 2
  // Centre line of the stroke: concentric with the badge corners.
  const ring = roundedRectPath(
    half,
    half,
    width - ringWidth,
    height - ringWidth,
    badgeRadius + half,
  )
  const pct = Math.max(0, Math.min(1, progress)) * 100
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {/* Fill under the stroke too, so no background shows between ring and badge. */}
      <path d={ring} fill={fillColor} />
      <path d={ring} fill="none" stroke={trailColor} strokeWidth={ringWidth} />
      {contrastOutline && (
        <path
          d={roundedRectPath(0.5, 0.5, width - 1, height - 1, badgeRadius + ringWidth - 0.5)}
          fill="none"
          stroke="rgba(161,161,170,0.7)"
          strokeWidth={1}
        />
      )}
      {pct > 0 && (
        <path
          d={ring}
          fill="none"
          stroke={progressColor}
          strokeWidth={ringWidth}
          pathLength={100}
          strokeDasharray={pct >= 100 ? undefined : `${pct} 100`}
        />
      )}
    </svg>
  )
}

const cleanupLineName = (name?: string) => {
  if (!name) return ''

  let result = name
  const replacements: Array<[RegExp, string]> = [
    [/^AirTrain JFK\s*[–-]\s*/i, ''],
    [/^AirTrain\s+/i, ''],
    [/^MNRR\s+/i, ''],
    [/^LIRR\s+/i, ''],
    [/^CTrail\s+/i, ''],
    [/^NJT\s+Light\s+Rail\s+/i, ''],
    [/^NJT\s+HBLR\s+/i, ''],
    [/^NJT\s+/i, ''],
  ]

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement)
  }

  return result.replace(/^[–-]\s*/, '').replace(/\s{2,}/g, ' ').trim()
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const normalizeHex = (value: string) => {
  const hex = value.trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return hex
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return hex
  }
  return null
}

const hexToRgb = (value?: string): [number, number, number] | null => {
  if (!value) return null
  const hex = normalizeHex(value)
  if (!hex) return null
  const int = parseInt(hex, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0')

const mixHexColors = (from: string, to: string, ratio: number) => {
  const fromRgb = hexToRgb(from)
  const toRgb = hexToRgb(to)
  if (!fromRgb || !toRgb) {
    return from
  }
  const t = clamp01(ratio)
  const mixed: [number, number, number] = [
    fromRgb[0] + (toRgb[0] - fromRgb[0]) * t,
    fromRgb[1] + (toRgb[1] - fromRgb[1]) * t,
    fromRgb[2] + (toRgb[2] - fromRgb[2]) * t,
  ]
  return `#${toHex(mixed[0])}${toHex(mixed[1])}${toHex(mixed[2])}`
}

const resolveGroupImageSrc = (image: string, iconBasePath?: string | null) => {
  if (image.includes('/')) {
    return `/images/${image.replace(/^\/+/, '')}`
  }

  if (iconBasePath) {
    return `/images/${iconBasePath.replace(/^\//, '')}/${image}`
  }

  return `/images/${image}`
}

const GroupHeading = ({
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

  const imageBoxClass = compact
    ? 'h-8 min-w-8 max-w-[7.5rem] rounded-lg px-2'
    : 'h-10 min-w-10 max-w-[9rem] rounded-xl px-2.5'
  const imageMaxClass = compact ? 'max-h-6 max-w-[5.5rem]' : 'max-h-8 max-w-[7rem]'

  if (image) {
    return (
      <div className={clsx('flex items-center gap-3', compact ? 'pt-1' : '')}>
        <div
          className={clsx(
            'flex shrink-0 items-center justify-center border border-zinc-200 bg-white dark:border-[#18181b] dark:bg-zinc-900/70',
            imageBoxClass,
          )}
        >
          <Image
            src={resolveGroupImageSrc(image, iconBasePath)}
            alt={title ?? ''}
            width={160}
            height={64}
            className={clsx('h-auto w-auto object-contain', imageMaxClass)}
          />
        </div>
        {title ? (
          <OverflowMarquee
            className={clsx(
              compact
                ? 'min-w-0 text-sm font-semibold text-zinc-700 dark:text-zinc-200'
                : 'min-w-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
            )}
            speed={compact ? 30 : 25}
            minDuration={8}
            gap={24}
            aria-label={title}
          >
            {title}
          </OverflowMarquee>
        ) : null}
      </div>
    )
  }

  if (!title) {
    return null
  }

  return (
    <OverflowMarquee
      className={clsx(
        compact
          ? 'pt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200'
          : 'text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
      )}
      speed={compact ? 30 : 25}
      minDuration={8}
      gap={24}
      aria-label={title}
    >
      {title}
    </OverflowMarquee>
  )
}

const ProgressBars = ({
  foundStationsPerLine,
  stationsPerLine,
  minimized = false,
  highlightedLineId,
  iconBasePath,
  minimizedMaxHeight,
}: {
  foundStationsPerLine: Record<string, number>
  stationsPerLine: Record<string, number>
  minimized?: boolean
  highlightedLineId?: string | null
  iconBasePath?: string | null
  minimizedMaxHeight?: number
}) => {
  const { LINES, GAUGE_COLORS, LINE_GROUPS, CITY_NAME } = useConfig()
  const { settings } = useSettings()
  const gaugeMode = GAUGE_COLORS ?? 'inverted'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
     if (highlightedLineId && lineRefs.current[highlightedLineId]) {
         lineRefs.current[highlightedLineId]?.scrollIntoView({
             behavior: 'smooth',
             block: 'center'
         })
     }
  }, [highlightedLineId])

  const orderedLines = useMemo(
    () =>
      Object.entries(LINES)
        .sort(([, a], [, b]) => (a?.order ?? 0) - (b?.order ?? 0))
        .map(([key]) => key),
    [LINES],
  )

  const groupedLineOrder = useMemo(() => {
    if (!LINE_GROUPS || LINE_GROUPS.length === 0) {
      return orderedLines
    }

    const keys: string[] = []
    for (const group of LINE_GROUPS) {
      for (const item of group.items) {
        if (item.type === 'lines') {
          for (const line of item.lines) {
            if (LINES[line] && !keys.includes(line)) {
              keys.push(line)
            }
          }
        }
      }
    }

    // ensure any lines not explicitly listed are still shown
    for (const line of orderedLines) {
      if (!keys.includes(line)) {
        keys.push(line)
      }
    }

    return keys
  }, [LINE_GROUPS, LINES, orderedLines])

  const renderLine = (line: string, compact: boolean) => {
    const meta = LINES[line]
    if (!meta) {
      return null
    }

    const total = stationsPerLine[line]
    if (!total) {
      return null
    }

    const found = foundStationsPerLine[line] || 0
    const displayName = formatLocalizedLineName(meta.name, settings.language) || meta.name
    const title = `${displayName} - ${found}/${total}`
    const customProgressColor = meta.progressOutlineColor
    const baseProgressColor = customProgressColor ?? meta.color ?? '#000000'
    const percentComplete = total > 0 ? found / total : 0
    const gaugeBackground =
      gaugeMode === 'inverted' ? (isDark ? '#27272a' : '#ffffff') : (meta.color || '#000000')

    let progressColor: string
    let trailColor: string

    if (gaugeMode === 'inverted') {
      progressColor = baseProgressColor
      trailColor = mixHexColors(baseProgressColor, gaugeBackground, 0.8)
    } else {
      const whiteShift = 
        percentComplete <= 0 ? 0 : Math.max(0.2, Math.pow(percentComplete, 0.6))
      progressColor = mixHexColors(baseProgressColor, '#ffffff', whiteShift)
      trailColor = mixHexColors(
        baseProgressColor,
        '#ffffff',
        Math.min(1, whiteShift * 0.65),
      )
    }

    const needsContrastBoost =
      gaugeMode === 'inverted' && !isDark && isColorLight(progressColor)
    const contrastRingClass = needsContrastBoost ? 'ring-1 ring-zinc-400/70' : undefined
    const completionColor = getCompletionColor(percentComplete)
    const badgeShape = meta.badgeShape ?? 'circle'
    const usesFramedShell = badgeShape !== 'circle'
    const badgeMetrics = getLineBadgeMetrics(badgeShape, 'small', meta.badgeAspectRatio)
    // The ring hugs the badge: same inset on every side, corners concentric with the badge's.
    const ringWidth = 3
    const shellWidth = badgeMetrics.width + ringWidth * 2
    const shellHeight = badgeMetrics.height + ringWidth * 2

    const isHighlighted = highlightedLineId === line

    return (
      <div 
        key={line} 
        className={clsx(
            "flex items-center gap-2 transition-colors duration-300",
            compact ? "rounded-full" : "rounded-lg",
            isHighlighted && [
                "bg-yellow-200 dark:bg-yellow-500/40",
                "ring-4 ring-yellow-200 dark:ring-yellow-500 z-10"
            ]
        )}
        ref={(el) => {
            if (el) lineRefs.current[line] = el
        }}
      >
        <div
          title={title}
          className="relative flex shrink-0 items-center justify-center"
          style={{
            width: usesFramedShell ? shellWidth : 32,
            height: usesFramedShell ? shellHeight : 32,
          }}
        >
          {usesFramedShell ? (
            <>
              <BadgeProgressRing
                width={shellWidth}
                height={shellHeight}
                badgeRadius={badgeMetrics.radius}
                ringWidth={ringWidth}
                progress={percentComplete}
                progressColor={progressColor}
                trailColor={trailColor}
                fillColor={gaugeBackground}
                contrastOutline={needsContrastBoost}
                className="absolute inset-0 drop-shadow dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
              />
              <LineBadge
                lineId={line}
                line={meta}
                iconBasePath={iconBasePath}
                defaultFit="cover"
                className="z-10"
              />
            </>
          ) : (
            <>
              <div
                className={clsx(
                  'absolute h-full w-full rounded-full shadow dark:shadow-black/40',
                  contrastRingClass,
                )}
              >
                <CircularProgressbar
                  background
                  backgroundPadding={3}
                  styles={buildStyles({
                    backgroundColor: gaugeBackground,
                    pathColor: progressColor,
                    textColor: isDark ? '#e4e4e7' : '#27272a',
                    trailColor,
                  })}
                  value={(100 * found) / total}
                />
              </div>
              <LineBadge
                lineId={line}
                line={meta}
                iconBasePath={iconBasePath}
                defaultFit="cover"
                className="z-20"
              />
            </>
          )}
        </div>
        {!compact && (
          <OverflowMarquee className="min-w-0 text-sm text-zinc-700 dark:text-zinc-200">
            <span>
              {displayName} -{' '}
              <span style={{ color: completionColor, fontWeight: 600 }}>
                {found}/{total}
              </span>
            </span>
          </OverflowMarquee>
        )}
      </div>
    )
  }

  if (minimized) {
    return (
      <div
        className="flex max-w-full flex-wrap items-start content-start gap-2 overflow-x-hidden overflow-y-auto pr-1 md:!max-h-none md:overflow-y-visible md:pr-0"
        style={
          minimizedMaxHeight && minimizedMaxHeight > 0
            ? { maxHeight: minimizedMaxHeight }
            : undefined
        }
      >
        {groupedLineOrder.map((line) => renderLine(line, true))}
      </div>
    )
  }

  if (!LINE_GROUPS || LINE_GROUPS.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 @container">
        {orderedLines.map((line) => renderLine(line, false))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {LINE_GROUPS.map((group, groupIndex) => {
        const isPureSeparator =
          !group.title && group.items.length === 1 && group.items[0].type === 'separator'
        const prevGroup = groupIndex > 0 ? LINE_GROUPS[groupIndex - 1] : null
        const prevIsPureSeparator = prevGroup
          ? !prevGroup.title &&
            prevGroup.items.length === 1 &&
            prevGroup.items[0].type === 'separator'
          : false
        const shouldRenderGroupHr =
          groupIndex > 0 && !isPureSeparator && !prevIsPureSeparator

        return (
          <div key={`${group.title ?? 'group'}-${groupIndex}`} className="space-y-3">
            {shouldRenderGroupHr ? (
              <hr className="border-zinc-200 dark:border-[#18181b]" />
            ) : null}
            <GroupHeading
              title={formatLocalizedChinaUiTitle(group.title, CITY_NAME, settings.language)}
              image={group.titleImage}
              iconBasePath={iconBasePath}
            />
            {group.items.map((item, itemIndex) => {
              if (item.type === 'separator') {
                return (
                  <hr
                    key={`separator-${groupIndex}-${itemIndex}`}
                    className="border-zinc-200 dark:border-[#18181b]"
                  />
                )
              }

              const visibleLines = item.lines.filter((line) => !!LINES[line])
              if (item.lines.length === 0) {
                return (
                  <GroupHeading
                    key={`${item.title ?? 'heading'}-${groupIndex}-${itemIndex}`}
                    title={formatLocalizedChinaUiTitle(item.title, CITY_NAME, settings.language)}
                    image={item.titleImage}
                    iconBasePath={iconBasePath}
                    compact
                  />
                )
              }
              if (visibleLines.length === 0) {
                return null
              }

              return (
                <div
                  key={`${item.title ?? 'lines'}-${groupIndex}-${itemIndex}`}
                  className="space-y-2"
                >
                  <GroupHeading
                    title={formatLocalizedChinaUiTitle(item.title, CITY_NAME, settings.language)}
                    image={item.titleImage}
                    iconBasePath={iconBasePath}
                    compact
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {visibleLines.map((line) => renderLine(line, false))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default ProgressBars
