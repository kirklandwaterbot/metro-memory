'use client'

import { useSettings } from '@/context/SettingsContext'
import { formatLocalizedChinaUiTitle } from '@/lib/chinaUiText'
import {
  CUSTOM_LAYOUTS_UPDATED_EVENT,
  buildCustomLayoutPath,
  deleteCustomLayout,
  findSavedLayout,
  readCustomLayouts,
  saveCustomLayout,
  type CustomLayout,
  type SavedCustomLayout,
} from '@/lib/customLayouts'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type CustomLayoutsPanelProps = {
  parentSlug: string
  /** The layout being played, when on a /custom page. */
  currentLayout?: CustomLayout | null
  onCreate: () => void
  onEdit: (layout: CustomLayout & { id?: string | null }) => void
}

/**
 * Sidebar card for custom layouts: create one, edit the one you're playing,
 * and replay / edit / share / delete layouts saved in this browser.
 */
export default function CustomLayoutsPanel({
  parentSlug,
  currentLayout = null,
  onCreate,
  onEdit,
}: CustomLayoutsPanelProps) {
  const { settings } = useSettings()
  const tr = useCallback(
    (text: string) => formatLocalizedChinaUiTitle(text, parentSlug, settings.language),
    [parentSlug, settings.language],
  )
  const [saved, setSaved] = useState<SavedCustomLayout[]>([])
  const [currentSaved, setCurrentSaved] = useState<SavedCustomLayout | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setSaved(readCustomLayouts(parentSlug))
    setCurrentSaved(currentLayout ? findSavedLayout(currentLayout) : null)
  }, [currentLayout, parentSlug])

  useEffect(() => {
    refresh()
    window.addEventListener(CUSTOM_LAYOUTS_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CUSTOM_LAYOUTS_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  const copyLink = async (layout: SavedCustomLayout | CustomLayout, key: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${buildCustomLayoutPath(layout)}`)
      setCopied(key)
      setTimeout(() => setCopied((value) => (value === key ? null : value)), 1800)
    } catch {
      // Clipboard blocked: nothing else to do from here.
    }
  }

  const smallButton =
    'rounded-full px-2 py-1 text-[11px] font-bold text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            {tr('Custom layouts')}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {currentLayout
              ? tr('You are playing a custom layout.')
              : tr('Play only the lines you choose.')}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {currentLayout ? (
          <>
            <button
              type="button"
              onClick={() => onEdit({ ...currentLayout, id: currentSaved?.id ?? null })}
              className="rounded-full bg-[var(--accent-600)] px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            >
              {tr('Edit this layout')}
            </button>
            {!currentSaved && (
              <button
                type="button"
                onClick={() => {
                  saveCustomLayout(currentLayout)
                  refresh()
                }}
                className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-bold text-zinc-700 transition hover:border-[var(--accent-400)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              >
                {tr('Save')}
              </button>
            )}
            <button
              type="button"
              onClick={onCreate}
              className="rounded-full border border-dashed border-zinc-400 px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-[var(--accent-400)] hover:text-[var(--accent-700)] dark:border-zinc-600 dark:text-zinc-400"
            >
              + {tr('New')}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full bg-[var(--accent-600)] px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          >
            + {tr('Create custom layout')}
          </button>
        )}
      </div>

      {saved.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {tr('My layouts')}
          </p>
          <ul className="space-y-1">
            {saved.map((layout) => {
              const isCurrent = currentSaved?.id === layout.id
              return (
                <li
                  key={layout.id}
                  className={`rounded-xl px-2.5 py-2 ${
                    isCurrent ? 'bg-white ring-1 ring-[var(--accent-400)] dark:bg-zinc-950' : 'hover:bg-white/70 dark:hover:bg-zinc-950/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildCustomLayoutPath(layout)}
                      className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-900 hover:underline dark:text-zinc-100"
                      title={layout.title}
                    >
                      {layout.title || tr('Custom layout')}
                    </Link>
                    <span className="shrink-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {layout.lines.length} {tr('lines')}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-0.5">
                    {!isCurrent && (
                      <Link href={buildCustomLayoutPath(layout)} className={smallButton}>
                        {tr('Play')}
                      </Link>
                    )}
                    <button type="button" className={smallButton} onClick={() => onEdit(layout)}>
                      {tr('Edit')}
                    </button>
                    <button type="button" className={smallButton} onClick={() => copyLink(layout, layout.id)}>
                      {copied === layout.id ? tr('Copied!') : tr('Copy link')}
                    </button>
                    {confirmDelete === layout.id ? (
                      <button
                        type="button"
                        className={`${smallButton} text-red-600 dark:text-red-300`}
                        onClick={() => {
                          deleteCustomLayout(layout.id)
                          setConfirmDelete(null)
                        }}
                      >
                        {tr('Really delete?')}
                      </button>
                    ) : (
                      <button type="button" className={smallButton} onClick={() => setConfirmDelete(layout.id)}>
                        {tr('Delete')}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
