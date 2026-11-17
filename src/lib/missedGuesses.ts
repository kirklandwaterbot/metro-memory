'use client'

export type MissedGuessEntry = {
  id: string
  city: string
  rawInput: string
  normalizedInput: string
  suggestions: string[]
  createdAt: string
}

const STORAGE_KEY = 'metro-memory-missed-guesses-v1'
export const MISSED_GUESSES_UPDATED_EVENT = 'metro-memory-missed-guesses-updated'
const MAX_ENTRIES_PER_CITY = 500

const isMissedGuessEntry = (value: unknown): value is MissedGuessEntry => {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<MissedGuessEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.city === 'string' &&
    typeof entry.rawInput === 'string' &&
    typeof entry.normalizedInput === 'string' &&
    typeof entry.createdAt === 'string' &&
    Array.isArray(entry.suggestions)
  )
}

export const readMissedGuesses = (city?: string): MissedGuessEntry[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const entries = Array.isArray(parsed) ? parsed.filter(isMissedGuessEntry) : []
    const filtered = city ? entries.filter((entry) => entry.city === city) : entries
    return filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  } catch {
    return []
  }
}

export const appendMissedGuess = (entry: Omit<MissedGuessEntry, 'id' | 'createdAt'>) => {
  if (typeof window === 'undefined') return
  const rawInput = entry.rawInput.trim()
  if (!rawInput) return

  const nextEntry: MissedGuessEntry = {
    ...entry,
    rawInput,
    suggestions: entry.suggestions.slice(0, 5),
    id: `${entry.city}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  const existing = readMissedGuesses()
  const nextForCity = [nextEntry, ...existing.filter((item) => item.city === entry.city)].slice(
    0,
    MAX_ENTRIES_PER_CITY,
  )
  const otherCities = existing.filter((item) => item.city !== entry.city)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextForCity, ...otherCities]))
  window.dispatchEvent(new CustomEvent(MISSED_GUESSES_UPDATED_EVENT, { detail: nextEntry }))

  fetch('/api/missed-guesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      city: entry.city,
      rawInput,
      normalizedInput: entry.normalizedInput,
      suggestions: nextEntry.suggestions,
    }),
    keepalive: true,
  }).catch(() => {
    // Local logging should never be blocked by analytics/network failures.
  })
}

export const clearMissedGuessesForCity = (city: string) => {
  if (typeof window === 'undefined') return
  const remaining = readMissedGuesses().filter((entry) => entry.city !== city)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  window.dispatchEvent(new CustomEvent(MISSED_GUESSES_UPDATED_EVENT, { detail: { city } }))
}

export const clearAllMissedGuesses = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(MISSED_GUESSES_UPDATED_EVENT, { detail: { city: null } }))
}

export type MergedMissedGuess = MissedGuessEntry & { mine: boolean; live: boolean }

const SAME_GUESS_WINDOW_MS = 2 * 60 * 1000

/**
 * Combines the shared server log (everyone's guesses) with this browser's local
 * log. Your own guesses are sent to the server too, so a local entry that has a
 * server twin (same city + input within two minutes) is shown once, marked
 * `mine`. Newest first.
 */
export const mergeMissedGuesses = (
  local: MissedGuessEntry[],
  live: MissedGuessEntry[],
  limit = 300,
): MergedMissedGuess[] => {
  const merged: MergedMissedGuess[] = live.map((entry) => ({ ...entry, mine: false, live: true }))
  for (const entry of local) {
    const time = Date.parse(entry.createdAt)
    const twin = merged.find(
      (item) =>
        item.live &&
        !item.mine &&
        item.city === entry.city &&
        item.rawInput === entry.rawInput &&
        Math.abs(Date.parse(item.createdAt) - time) < SAME_GUESS_WINDOW_MS,
    )
    if (twin) twin.mine = true
    else merged.push({ ...entry, mine: true, live: false })
  }
  return merged
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
}
