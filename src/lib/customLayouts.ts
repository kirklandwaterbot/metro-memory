// Custom layouts: links to /custom games, plus a small "My layouts" list kept
// in this browser so players can come back to, edit, and share their layouts.

export type CustomLayout = {
  parentSlug: string
  lines: string[]
  title: string
}

export type SavedCustomLayout = CustomLayout & {
  id: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'metro-memory-custom-layouts-v1'
export const CUSTOM_LAYOUTS_UPDATED_EVENT = 'metro-memory-custom-layouts-updated'
const MAX_SAVED = 60

/** Relative link that plays a layout, e.g. /custom?parent=nyc&lines=A,C&title=… */
export const buildCustomLayoutPath = ({ parentSlug, lines, title }: CustomLayout) => {
  const params = new URLSearchParams()
  params.set('parent', parentSlug)
  params.set('lines', lines.join(','))
  if (title.trim()) params.set('title', title.trim())
  return `/custom?${params.toString()}`
}

/** Reads the layout a /custom page is playing from its query string. */
export const parseCustomLayout = (
  params: Pick<URLSearchParams, 'get'>,
): CustomLayout | null => {
  const parentSlug = params.get('parent')?.trim()
  const lines = (params.get('lines') || '')
    .split(',')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!parentSlug || !lines.length) return null
  return { parentSlug, lines, title: params.get('title')?.trim() || '' }
}

export const sameLineSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((line) => set.has(line))
}

const isSavedLayout = (value: unknown): value is SavedCustomLayout => {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<SavedCustomLayout>
  return (
    typeof v.id === 'string' &&
    typeof v.parentSlug === 'string' &&
    typeof v.title === 'string' &&
    Array.isArray(v.lines) &&
    v.lines.every((line) => typeof line === 'string') &&
    typeof v.updatedAt === 'string'
  )
}

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

const readAll = (): SavedCustomLayout[] => {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isSavedLayout) : []
  } catch {
    return []
  }
}

const writeAll = (layouts: SavedCustomLayout[]) => {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(layouts.slice(0, MAX_SAVED)))
  } catch {
    // Storage full or blocked: saving is a convenience, never fatal.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOM_LAYOUTS_UPDATED_EVENT))
  }
}

/** Saved layouts, newest first; only those for `parentSlug` when given. */
export const readCustomLayouts = (parentSlug?: string): SavedCustomLayout[] =>
  readAll()
    .filter((layout) => !parentSlug || layout.parentSlug === parentSlug)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

/** Finds a saved layout with the same city and the same lines. */
export const findSavedLayout = (layout: CustomLayout): SavedCustomLayout | null =>
  readAll().find(
    (saved) => saved.parentSlug === layout.parentSlug && sameLineSet(saved.lines, layout.lines),
  ) ?? null

/**
 * Saves a layout. Updates the entry with `id` (or, without an id, one with the
 * same city and lines) instead of creating a duplicate.
 */
export const saveCustomLayout = (
  layout: CustomLayout & { id?: string | null },
  now: Date = new Date(),
): SavedCustomLayout => {
  const all = readAll()
  const stamp = now.toISOString()
  const existing =
    (layout.id && all.find((saved) => saved.id === layout.id)) ||
    all.find(
      (saved) => saved.parentSlug === layout.parentSlug && sameLineSet(saved.lines, layout.lines),
    )
  const next: SavedCustomLayout = {
    id: existing?.id ?? `${layout.parentSlug}-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    parentSlug: layout.parentSlug,
    lines: [...layout.lines],
    title: layout.title.trim(),
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  }
  writeAll([next, ...all.filter((saved) => saved.id !== next.id)])
  return next
}

export const deleteCustomLayout = (id: string) => {
  writeAll(readAll().filter((saved) => saved.id !== id))
}
