// Shared (client + server) helpers for encoding a cross-city "world map" custom
// selection into a compact, URL-safe token. Kept free of any Node/fs imports so
// it can be bundled into the client builder UI.

export type WorldMapCitySelection = {
  city: string
  lines: string[]
}

export type WorldMapSelection = WorldMapCitySelection[]

const CITY_SLUG_PATTERN = /^[a-z0-9-]+$/

/** Stands for "every line of this city", so whole-city picks keep the link short. */
export const ALL_LINES_TOKEN = '*'

const toBase64Url = (input: string): string => {
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(input, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(input)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  return typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64').toString('utf8')
    : decodeURIComponent(escape(atob(base64)))
}

/**
 * Normalizes a selection into a stable shape: cities sorted by slug, lines
 * sorted and de-duplicated, empty cities dropped. Stability matters because the
 * runtime derives a deterministic progress slug and feature ids from this order.
 */
export const normalizeWorldSelection = (
  selection: WorldMapSelection,
): WorldMapSelection =>
  selection
    .map((entry) => ({
      city: entry.city,
      lines: entry.lines.includes(ALL_LINES_TOKEN)
        ? [ALL_LINES_TOKEN]
        : Array.from(new Set(entry.lines.filter((line) => line.length > 0))).sort(),
    }))
    .filter((entry) => CITY_SLUG_PATTERN.test(entry.city) && entry.lines.length > 0)
    .sort((a, b) => a.city.localeCompare(b.city))

export const encodeWorldSelection = (selection: WorldMapSelection): string => {
  const normalized = normalizeWorldSelection(selection)
  const compact = normalized.map((entry) => [entry.city, entry.lines])
  return toBase64Url(JSON.stringify(compact))
}

export const decodeWorldSelection = (token: string): WorldMapSelection | null => {
  if (!token) {
    return null
  }
  try {
    const parsed = JSON.parse(fromBase64Url(token))
    if (!Array.isArray(parsed)) {
      return null
    }
    const selection: WorldMapSelection = []
    for (const entry of parsed) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Array.isArray(entry[1])) {
        continue
      }
      const lines = entry[1].filter((line): line is string => typeof line === 'string')
      selection.push({ city: entry[0], lines })
    }
    const normalized = normalizeWorldSelection(selection)
    return normalized.length > 0 ? normalized : null
  } catch {
    return null
  }
}

export const countSelectedLines = (selection: WorldMapSelection): number =>
  selection.reduce((total, entry) => total + entry.lines.length, 0)
