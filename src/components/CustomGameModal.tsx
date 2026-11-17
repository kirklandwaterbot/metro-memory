'use client'

import LineBadge from '@/components/LineBadge'
import { useSettings } from '@/context/SettingsContext'
import { formatLocalizedChinaUiTitle } from '@/lib/chinaUiText'
import { useConfig } from '@/lib/configContext'
import {
  buildCustomLayoutPath,
  saveCustomLayout,
  type SavedCustomLayout,
} from '@/lib/customLayouts'
import { formatLocalizedLineName } from '@/lib/lineNameDisplay'
import type { Line, LineGroup, LineGroupItem } from '@/lib/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CloseButton from './CloseButton'

type VisibleLinesItem = {
  type: 'lines'
  title?: string
  lineIds: string[]
}

type VisibleGroup = {
  title?: string
  items: Array<VisibleLinesItem | { type: 'separator' }>
}

const buildOrderedLineIds = (
  lines: Record<string, Line>,
  lineGroups: LineGroup[] | undefined,
) => {
  const ordered: string[] = []
  const seen = new Set<string>()

  const addLine = (lineId: string) => {
    if (!lines[lineId] || seen.has(lineId)) {
      return
    }
    seen.add(lineId)
    ordered.push(lineId)
  }

  lineGroups?.forEach((group) => {
    group.items.forEach((item) => {
      if (item.type !== 'lines') {
        return
      }
      item.lines.forEach(addLine)
    })
  })

  Object.entries(lines)
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

const buildVisibleGroups = (
  lines: Record<string, Line>,
  lineGroups: LineGroup[] | undefined,
  searchQuery: string,
  slug: string,
  language?: string,
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const localizeHeaderText = (value?: string) =>
    formatLocalizedChinaUiTitle(value, slug, language)
  const localizeLineText = (value?: string) =>
    formatLocalizedLineName(value, language)

  const matchesLine = (lineId: string) => {
    if (!normalizedQuery) {
      return true
    }

    const line = lines[lineId]
    if (!line) {
      return false
    }

    return (
      lineId.toLowerCase().includes(normalizedQuery) ||
      line.name.toLowerCase().includes(normalizedQuery) ||
      localizeLineText(line.name).toLowerCase().includes(normalizedQuery)
    )
  }

  const matchesText = (value?: string) =>
    !normalizedQuery || (value?.toLowerCase().includes(normalizedQuery) ?? false)

  const visibleGroups: VisibleGroup[] = []
  const groupedLineIds = new Set<string>()

  lineGroups?.forEach((group) => {
    const visibleItems: VisibleGroup['items'] = []

    group.items.forEach((item: LineGroupItem) => {
      if (item.type === 'separator') {
        if (
          visibleItems.length > 0 &&
          visibleItems[visibleItems.length - 1]?.type !== 'separator'
        ) {
          visibleItems.push(item)
        }
        return
      }

      const matchedLines = item.lines.filter((lineId) => {
        if (!lines[lineId]) {
          return false
        }
        if (matchesLine(lineId)) {
          return true
        }
        return (
          matchesText(item.title) ||
          matchesText(group.title) ||
          matchesText(localizeHeaderText(item.title)) ||
          matchesText(localizeHeaderText(group.title))
        )
      })

      if (matchedLines.length === 0) {
        return
      }

      matchedLines.forEach((lineId) => groupedLineIds.add(lineId))
      visibleItems.push({
        type: 'lines',
        title: localizeHeaderText(item.title),
        lineIds: matchedLines,
      })
    })

    while (visibleItems.at(-1)?.type === 'separator') {
      visibleItems.pop()
    }

    if (visibleItems.length > 0) {
      visibleGroups.push({
        title: localizeHeaderText(group.title),
        items: visibleItems,
      })
    }
  })

  const ungroupedLineIds = Object.keys(lines)
    .filter((lineId) => !groupedLineIds.has(lineId))
    .filter(matchesLine)
    .sort((left, right) => {
      const leftLine = lines[left]
      const rightLine = lines[right]
      const orderDelta = (leftLine?.order ?? 0) - (rightLine?.order ?? 0)
      if (orderDelta !== 0) {
        return orderDelta
      }
      return (leftLine?.name ?? left).localeCompare(rightLine?.name ?? right)
    })

  if (ungroupedLineIds.length > 0) {
    visibleGroups.push({
      title: localizeHeaderText('Additional Lines'),
      items: [
        {
          type: 'lines',
          lineIds: ungroupedLineIds,
        },
      ],
    })
  }

  return visibleGroups
}

type ApiLine = Partial<Line> & { id: string }
type CityLinesResponse = {
  assetBasePath?: string | null
  lines?: ApiLine[]
  lineGroups?: LineGroup[]
  stationCounts?: Record<string, number>
}

type Status = { kind: 'error' | 'info'; text: string } | null

const chipBase =
  'group flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]'
const pillButton =
  'rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'

export default function CustomGameModal({
  isOpen,
  onCloseAction,
  parentSlug,
  iconBasePath = null,
  initialLines = null,
  initialTitle = null,
  editingLayoutId = null,
  onSaved,
}: {
  isOpen: boolean
  onCloseAction: () => void
  parentSlug: string
  iconBasePath?: string | null
  /** Lines to start with (editing a layout / a smaller version). Null = all. */
  initialLines?: string[] | null
  initialTitle?: string | null
  /** Saved layout being edited, so "Save" updates it instead of adding one. */
  editingLayoutId?: string | null
  onSaved?: (layout: SavedCustomLayout) => void
}) {
  const { settings } = useSettings()
  const { LINES, LINE_GROUPS, METADATA } = useConfig()
  const tr = useCallback(
    (text: string) => formatLocalizedChinaUiTitle(text, parentSlug, settings.language),
    [parentSlug, settings.language],
  )

  // Start with what this page knows, then swap in the full city's lines (a
  // smaller version or custom game only has a subset of them).
  const [remote, setRemote] = useState<CityLinesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/custom/city-lines/${encodeURIComponent(parentSlug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((json: CityLinesResponse | null) => {
        if (!cancelled && json?.lines?.length) setRemote(json)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, parentSlug])

  const lines: Record<string, Line> = useMemo(() => {
    if (!remote?.lines?.length) return (LINES || {}) as Record<string, Line>
    const out: Record<string, Line> = {}
    for (const line of remote.lines) {
      out[line.id] = {
        name: line.name ?? line.id,
        color: line.color ?? '#888888',
        backgroundColor: line.backgroundColor ?? line.color ?? '#888888',
        textColor: line.textColor ?? '#FFFFFF',
        order: line.order ?? 0,
        icon: line.icon,
        badgeShape: line.badgeShape,
        badgeFit: line.badgeFit,
        badgeAspectRatio: line.badgeAspectRatio,
      }
    }
    return out
  }, [LINES, remote])
  const lineGroups = remote?.lines?.length ? remote.lineGroups : LINE_GROUPS
  const badgeBasePath = remote?.assetBasePath ?? iconBasePath
  const stationCounts = remote?.stationCounts ?? null

  const allLineIds = useMemo(() => buildOrderedLineIds(lines, lineGroups), [lines, lineGroups])

  const baseTitle = useMemo(
    () => formatLocalizedChinaUiTitle(String(METADATA?.title ?? 'Map'), parentSlug, settings.language),
    [METADATA?.title, parentSlug, settings.language],
  )
  const defaultTitle = `${baseTitle} - ${tr('Custom Layout')}`

  // `null` = untouched: follow initialLines (or everything) as lines load.
  const [touched, setTouched] = useState<Set<string> | null>(null)
  const [title, setTitle] = useState(initialTitle || defaultTitle)
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [savedId, setSavedId] = useState<string | null>(editingLayoutId)

  useEffect(() => {
    if (!isOpen) return
    setTouched(null)
    setTitle(initialTitle || defaultTitle)
    setSearchQuery('')
    setStatus(null)
    setSavedId(editingLayoutId)
  }, [isOpen, parentSlug])

  const selected = useMemo(() => {
    if (touched) return touched
    const known = new Set(allLineIds)
    const start = initialLines?.length ? initialLines.filter((id) => known.has(id)) : allLineIds
    return new Set(start.length ? start : allLineIds)
  }, [allLineIds, initialLines, touched])

  const visibleGroups = useMemo(
    () => buildVisibleGroups(lines, lineGroups, searchQuery, parentSlug, settings.language),
    [lines, lineGroups, parentSlug, searchQuery, settings.language],
  )
  const visibleLineIds = useMemo(
    () =>
      visibleGroups.flatMap((group) =>
        group.items.flatMap((item) => (item.type === 'lines' ? item.lineIds : [])),
      ),
    [visibleGroups],
  )

  const orderedSelection = useMemo(
    () => allLineIds.filter((lineId) => selected.has(lineId)),
    [allLineIds, selected],
  )
  const stationTotal = useMemo(
    () =>
      stationCounts
        ? orderedSelection.reduce((sum, lineId) => sum + (stationCounts[lineId] ?? 0), 0)
        : null,
    [orderedSelection, stationCounts],
  )

  const update = (fn: (next: Set<string>) => void) => {
    const next = new Set(selected)
    fn(next)
    setTouched(next)
    setStatus(null)
  }
  const setLineSelection = (lineIds: string[], shouldSelect: boolean) =>
    update((next) => lineIds.forEach((id) => (shouldSelect ? next.add(id) : next.delete(id))))
  const toggle = (lineId: string) =>
    update((next) => (next.has(lineId) ? next.delete(lineId) : next.add(lineId)))
  const invert = () =>
    update((next) => allLineIds.forEach((id) => (next.has(id) ? next.delete(id) : next.add(id))))

  const layout = () => ({
    parentSlug,
    lines: orderedSelection,
    title: title.trim() || defaultTitle,
  })

  const requireSelection = () => {
    if (orderedSelection.length) return true
    setStatus({ kind: 'error', text: tr('Pick at least one line to play.') })
    return false
  }

  const handlePlay = () => {
    if (!requireSelection()) return
    window.location.href = buildCustomLayoutPath(layout())
  }

  const handleSave = () => {
    if (!requireSelection()) return
    const saved = saveCustomLayout({ ...layout(), id: savedId })
    setSavedId(saved.id)
    onSaved?.(saved)
    setStatus({ kind: 'info', text: tr('Saved to My layouts in the sidebar.') })
  }

  const handleCopy = async () => {
    if (!requireSelection()) return
    const url = `${window.location.origin}${buildCustomLayoutPath(layout())}`
    try {
      await navigator.clipboard.writeText(url)
      setStatus({ kind: 'info', text: tr('Link copied — anyone with it can play this layout.') })
    } catch {
      setStatus({ kind: 'info', text: url })
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseAction()
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handlePlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!isOpen) return null

  const renderBadge = (lineId: string, line: Line) =>
    line.icon ? (
      <LineBadge
        lineId={lineId}
        line={line}
        iconBasePath={badgeBasePath}
        size="small"
        defaultFit="contain"
        maxWidth={44}
        alt=""
      />
    ) : (
      <span
        className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black"
        style={{ backgroundColor: line.color, color: line.textColor || '#fff' }}
        aria-hidden="true"
      >
        {line.name.length <= 3 ? line.name : ''}
      </span>
    )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCloseAction}
      role="dialog"
      aria-modal="true"
      aria-label={tr('Custom layout')}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-zinc-950 dark:text-zinc-50">
              {editingLayoutId || initialTitle ? tr('Edit custom layout') : tr('Create custom layout')}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {tr('Pick the lines you want to play. Progress counts toward the full city.')}
            </p>
          </div>
          <CloseButton
            ariaLabel="Close"
            onClick={onCloseAction}
            className="h-9 w-9 shrink-0 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus:ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-zinc-700"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Line picker */}
          <div className="flex min-h-0 flex-1 flex-col border-zinc-200 dark:border-zinc-800 md:border-r">
            <div className="space-y-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-900">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--accent-500)] focus:bg-white focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder={tr('Search lines or groups')}
                aria-label={tr('Search lines')}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {searchQuery.trim() ? (
                  <>
                    <button type="button" className={pillButton} onClick={() => setLineSelection(visibleLineIds, true)}>
                      {tr('Add matches')} ({visibleLineIds.length})
                    </button>
                    <button type="button" className={pillButton} onClick={() => setLineSelection(visibleLineIds, false)}>
                      {tr('Remove matches')}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={pillButton} onClick={() => setLineSelection(allLineIds, true)}>
                      {tr('All')}
                    </button>
                    <button type="button" className={pillButton} onClick={() => setLineSelection(allLineIds, false)}>
                      {tr('None')}
                    </button>
                    <button type="button" className={pillButton} onClick={invert}>
                      {tr('Invert')}
                    </button>
                  </>
                )}
                {loading && (
                  <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                    {tr('Loading all lines…')}
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {visibleGroups.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {tr('No lines match this search.')}
                </div>
              )}
              {visibleGroups.map((group, groupIndex) => {
                const groupLineIds = group.items.flatMap((item) =>
                  item.type === 'lines' ? item.lineIds : [],
                )
                const selectedInGroup = groupLineIds.filter((id) => selected.has(id)).length
                const allOn = selectedInGroup === groupLineIds.length
                return (
                  <section key={`${group.title ?? 'group'}-${groupIndex}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="min-w-0 flex-1 truncate text-sm font-black text-zinc-900 dark:text-zinc-100">
                        {group.title ?? tr('Lines')}
                      </h3>
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {selectedInGroup}/{groupLineIds.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLineSelection(groupLineIds, !allOn)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent-700)] transition hover:bg-[var(--accent-50,rgba(0,0,0,0.04))] dark:text-[var(--accent-300)]"
                      >
                        {allOn ? tr('None') : tr('All')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => {
                        if (item.type === 'separator') {
                          return (
                            <hr key={`sep-${groupIndex}-${itemIndex}`} className="border-zinc-200 dark:border-zinc-800" />
                          )
                        }
                        return (
                          <div key={`${item.title ?? 'item'}-${groupIndex}-${itemIndex}`}>
                            {item.title && (
                              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                {item.title}
                              </p>
                            )}
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {item.lineIds.map((lineId) => {
                                const line = lines[lineId]
                                if (!line) return null
                                const on = selected.has(lineId)
                                const count = stationCounts?.[lineId]
                                return (
                                  <button
                                    key={lineId}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={on}
                                    onClick={() => toggle(lineId)}
                                    className={`${chipBase} ${
                                      on
                                        ? 'border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'
                                        : 'border-transparent bg-zinc-100/70 opacity-60 hover:opacity-90 dark:bg-zinc-900/40'
                                    }`}
                                    style={on ? { boxShadow: `inset 3px 0 0 ${line.color}` } : undefined}
                                  >
                                    {renderBadge(lineId, line)}
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {formatLocalizedLineName(line.name, settings.language)}
                                      </span>
                                      {typeof count === 'number' && (
                                        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                          {count} {count === 1 ? tr('station') : tr('stations')}
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black ${
                                        on
                                          ? 'border-[var(--accent-600)] bg-[var(--accent-600)] text-white'
                                          : 'border-zinc-300 text-transparent dark:border-zinc-600'
                                      }`}
                                      aria-hidden="true"
                                    >
                                      ✓
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          {/* Summary + actions */}
          <aside className="flex shrink-0 flex-col gap-4 border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40 md:w-80 md:border-t-0">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {tr('Name')}
              </span>
              <input
                type="text"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handlePlay()
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[var(--accent-500)] focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  {orderedSelection.length}
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {' '}/ {allLineIds.length} {tr('lines')}
                  </span>
                </span>
                {stationTotal !== null && (
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                    {stationTotal} {tr('stations')}
                  </span>
                )}
              </div>
              {orderedSelection.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {orderedSelection.slice(0, 48).map((lineId) => (
                    <span
                      key={lineId}
                      title={lines[lineId]?.name}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: lines[lineId]?.color }}
                    />
                  ))}
                  {orderedSelection.length > 48 && (
                    <span className="text-[10px] font-bold text-zinc-500">+{orderedSelection.length - 48}</span>
                  )}
                </div>
              )}
            </div>

            {status && (
              <p
                role="status"
                className={`break-words rounded-xl px-3 py-2 text-xs font-semibold ${
                  status.kind === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                }`}
              >
                {status.text}
              </p>
            )}

            <div className="mt-auto grid gap-2">
              <button
                type="button"
                onClick={handlePlay}
                className="w-full rounded-xl bg-[var(--accent-600)] py-3 text-base font-black text-white transition hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] disabled:opacity-50"
                disabled={!orderedSelection.length}
              >
                {tr('Play')}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  {savedId ? tr('Update saved') : tr('Save')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  {tr('Copy link')}
                </button>
              </div>
              <p className="hidden text-center text-[11px] text-zinc-500 dark:text-zinc-400 md:block">
                {tr('Ctrl/⌘ + Enter to play · Esc to close')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
