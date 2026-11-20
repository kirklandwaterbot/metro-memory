'use client'

import { useMemo, useState } from 'react'

import useTranslation from '@/hooks/useTranslation'
import type { UpcomingBoardData, UpcomingRow, UpcomingSection } from '@/lib/upcomingBoard'

// translation keys: upcomingSection<Key> (tab) and upcomingSection<Key>Hint
const SECTIONS: { id: UpcomingSection; key: string }[] = [
  { id: 'due', key: 'Due' },
  { id: 'needs-line', key: 'NeedsLine' },
  { id: 'check', key: 'Check' },
  { id: 'later', key: 'Later' },
  { id: 'added', key: 'Added' },
  { id: 'ignored', key: 'Ignored' },
]

type T = (key: string) => string

/** "{name} …" placeholders are filled in here; the catalog keeps them as-is. */
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m))

type Busy = { key: string; label: string } | null

export default function UpcomingBoard({ initial }: { initial: UpcomingBoardData }) {
  const { t } = useTranslation()
  const [data, setData] = useState(initial)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<UpcomingSection>(
    initial.rows.some((r) => r.section === 'due') ? 'due' : 'later',
  )
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.rows
    return data.rows.filter((r) =>
      [r.name, r.cityName, r.city, r.lineName || ''].some((v) => v.toLowerCase().includes(q)),
    )
  }, [data.rows, query])

  const counts = useMemo(() => {
    const c = {} as Record<UpcomingSection, number>
    for (const s of SECTIONS) c[s.id] = 0
    for (const r of filtered) c[r.section] += 1
    return c
  }, [filtered])

  const visible = filtered.filter((r) => r.section === open)
  const section = SECTIONS.find((s) => s.id === open)!

  async function act(body: Record<string, string>, key: string, label: string) {
    setBusy({ key, label })
    setError(null)
    try {
      const res = await fetch('/api/admin/upcoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('upcomingGenericError'))
      setData(json.board)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const cityOptions = useMemo(
    () => [...new Set(data.rows.map((r) => r.city))].sort(),
    [data.rows],
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('upcomingTitle')}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {fill(t('upcomingSummary'), { stations: data.rows.length, cities: data.trackedCities })}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('upcomingSearchPlaceholder')}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:w-72 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </header>

      {!data.canEdit && (
        <Note tone="zinc">{t('upcomingReadOnly')}</Note>
      )}
      {error && <Note tone="rose">{error}</Note>}
      {busy && <Note tone="sky">{busy.label}</Note>}

      <nav className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpen(s.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              open === s.id
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-800'
            }`}
          >
            {t(`upcomingSection${s.key}`)}
            <span className="ml-2 tabular-nums opacity-60">{counts[s.id]}</span>
          </button>
        ))}
      </nav>

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <p className="border-b border-zinc-200 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {t(`upcomingSection${section.key}Hint`)}
        </p>
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">{t('upcomingNothingHere')}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.slice(0, 400).map((r) => (
              <Row
                key={`${r.city}:${r.id}`}
                row={r}
                lines={data.lines[r.city] || []}
                canEdit={data.canEdit}
                busy={busy !== null}
                act={act}
                t={t}
              />
            ))}
          </ul>
        )}
        {visible.length > 400 && (
          <p className="border-t border-zinc-200 px-5 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
            {fill(t('upcomingShowingFirst'), { shown: 400, total: visible.length })}
          </p>
        )}
      </section>

      {data.canEdit && (
        <CheckCity
          cities={cityOptions}
          busy={busy !== null}
          onCheck={(city) =>
            act({ action: 'check', city }, `check:${city}`, fill(t('upcomingBusyChecking'), { city }))
          }
          t={t}
        />
      )}
    </div>
  )
}

function Row({
  row: r,
  lines,
  canEdit,
  busy,
  act,
  t,
}: {
  row: UpcomingRow
  lines: { id: string; name: string; color: string }[]
  canEdit: boolean
  busy: boolean
  act: (body: Record<string, string>, key: string, label: string) => void
  t: T
}) {
  const key = `${r.city}:${r.id}`
  const base = { city: r.city, id: r.id }
  const when =
    r.section === 'added'
      ? r.addedOn
        ? fill(t('upcomingAddedOn'), { date: r.addedOn })
        : t('upcomingInGame')
      : r.expected || t('upcomingNoDate')
  const sourceLabel = (label: string) =>
    label === 'Web' ? t('upcomingSourceWeb') : label === 'Map' ? t('upcomingSourceMap') : label

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ background: r.lineColor || '#a1a1aa' }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.name}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {r.cityName}
          {r.lineName ? ` · ${r.lineName}` : ''}
          {' · '}
          {when}
          {r.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="ml-2 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {sourceLabel(s.label)}
            </a>
          ))}
        </p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-2">
          {(r.section === 'needs-line' || r.section === 'due' || r.section === 'check') && (
            <select
              value={r.line || ''}
              disabled={busy}
              onChange={(e) =>
                e.target.value &&
                act(
                  { ...base, action: 'line', line: e.target.value },
                  key,
                  fill(t('upcomingBusySettingLine'), { name: r.name }),
                )
              }
              className="max-w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">{t('upcomingPickLine')}</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {r.lineCandidates.includes(l.id) ? '★ ' : ''}
                  {l.name}
                </option>
              ))}
            </select>
          )}
          {(r.section === 'due' || r.section === 'later' || r.section === 'check') && r.line && (
            <Button
              disabled={busy}
              tone="emerald"
              onClick={() =>
                act({ ...base, action: 'add' }, key, fill(t('upcomingBusyAdding'), { name: r.name }))
              }
            >
              {t('upcomingAdd')}
            </Button>
          )}
          {r.section !== 'added' && r.section !== 'ignored' && (
            <Button
              disabled={busy}
              onClick={() =>
                act({ ...base, action: 'ignore' }, key, fill(t('upcomingBusyIgnoring'), { name: r.name }))
              }
            >
              {t('upcomingIgnore')}
            </Button>
          )}
          {r.section === 'ignored' && (
            <Button
              disabled={busy}
              onClick={() =>
                act(
                  { ...base, action: 'restore' },
                  key,
                  fill(t('upcomingBusyRestoring'), { name: r.name }),
                )
              }
            >
              {t('upcomingRestore')}
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function CheckCity({
  cities,
  busy,
  onCheck,
  t,
}: {
  cities: string[]
  busy: boolean
  onCheck: (city: string) => void
  t: T
}) {
  const [city, setCity] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const slug = city.trim().toLowerCase()
        if (slug) onCheck(slug)
      }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-5 py-4 text-sm dark:border-zinc-700"
    >
      <span className="text-zinc-600 dark:text-zinc-400">{t('upcomingRecheckLabel')}</span>
      <input
        list="upcoming-cities"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder={t('upcomingRecheckPlaceholder')}
        className="w-56 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <datalist id="upcoming-cities">
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <Button disabled={busy || !city.trim()} tone="dark" type="submit">
        {t('upcomingCheck')}
      </Button>
      <span className="text-xs text-zinc-500">{t('upcomingRecheckHint')}</span>
    </form>
  )
}

function Button({
  children,
  tone = 'plain',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'plain' | 'emerald' | 'dark' }) {
  const tones = {
    plain:
      'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-500',
    dark: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900',
  }
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

function Note({ tone, children }: { tone: 'zinc' | 'rose' | 'sky'; children: React.ReactNode }) {
  const tones = {
    zinc: 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100',
  }
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}
