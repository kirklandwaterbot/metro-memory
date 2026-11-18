'use client'

import useTranslation from '@/hooks/useTranslation'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useMemo, useState } from 'react'

const MiniCityChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    className={`h-3.5 w-3.5 transition-transform duration-200 ${
      expanded ? '' : 'rotate-180'
    }`}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="m12 10.775l-3.9 3.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.6-4.6q.15-.15.325-.213T12 8.4q.2 0 .375.063t.325.212l4.6 4.6q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275l-3.9-3.9Z"
    />
  </svg>
)

type MiniCityLinkItem = {
  slug: string
  name: string
  link: string
}

type MiniCityLinksPanelProps = {
  title: string
  description: string
  items: MiniCityLinkItem[]
  currentSlug?: string | null
  defaultExpanded?: boolean
  /** false: always open, no expand/collapse toggle (e.g. inside a popover). */
  collapsible?: boolean
  onOpenCustomModal?: () => void
}

const MiniCityLinksPanel = ({
  title,
  description,
  items,
  currentSlug,
  defaultExpanded = true,
  collapsible = true,
  onOpenCustomModal,
}: MiniCityLinksPanelProps) => {
  const router = useRouter()
  const { t } = useTranslation()
  const [expandedState, setExpanded] = useState(defaultExpanded)
  const expanded = collapsible ? expandedState : true
  const normalizeOptionLabel = (value: string) =>
    value
      .replace(/\uFF09[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+\)/g, '\uFF09)')
      .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+(?=\))/g, '')

  const getLabel = (key: string, fallback: string) => {
    const value = t(key)
    return typeof value === 'string' && value !== key ? value : fallback
  }
  const selectorValue = useMemo(() => {
    if (currentSlug && items.some((item) => item.slug === currentSlug)) {
      return currentSlug
    }
    return ''
  }, [currentSlug, items])

  if (items.length === 0) {
    return null
  }

  const handleVersionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSlug = event.target.value
    const nextItem = items.find((item) => item.slug === nextSlug)
    if (!nextItem || nextItem.slug === currentSlug) {
      return
    }

    router.push(nextItem.link)
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={collapsible ? () => setExpanded((prev) => !prev) : undefined}
        disabled={!collapsible}
        className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-default"
        aria-expanded={collapsible ? expanded : undefined}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            {title}
          </h3>
          {expanded ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        {collapsible ? (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-base font-semibold text-zinc-600 transition hover:border-[var(--accent-400)] hover:text-[var(--accent-700)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-[var(--accent-500)] dark:hover:text-[var(--accent-300)]"
            aria-hidden="true"
          >
            <MiniCityChevron expanded={expanded} />
          </span>
        ) : null}
      </button>
      {expanded ? (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="sr-only">{title}</span>
            <select
              value={selectorValue}
              onChange={handleVersionChange}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 shadow-sm outline-none transition focus:border-[var(--accent-400)] focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="" disabled>
                {currentSlug
                  ? getLabel('selectRelatedVersion', 'Select a related version')
                  : getLabel('selectSmallerVersion', 'Select a smaller version')}
              </option>
              {items.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {normalizeOptionLabel(
                    item.slug === currentSlug
                      ? `${item.name} (${getLabel('currentTag', 'Current')})`
                      : item.name,
                  )}
                </option>
              ))}
            </select>
          </label>
          {onOpenCustomModal && (
            <button
              type="button"
              onClick={onOpenCustomModal}
              className="inline-flex items-center rounded-full border border-dashed border-zinc-400 bg-transparent px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-[var(--accent-400)] hover:text-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-400 dark:hover:text-zinc-200"
            >
              + {getLabel('createCustomMiniCity', 'Create Custom')}
            </button>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default MiniCityLinksPanel
