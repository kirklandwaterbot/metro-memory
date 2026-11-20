// Server-side reader for the admin "Upcoming" page. The data is the
// upcoming-stations tracker's own files (upcoming/<city>.json), written by
// scripts/upcoming/run.js (daily GitHub workflow or by hand) and act.js.

import fs from 'fs'
import path from 'path'

import { cities, getSlugFromLink } from './citiesConfig'
import { CITY_PATH_MAP } from './cityPathMap'

export type UpcomingSection = 'due' | 'needs-line' | 'check' | 'later' | 'added' | 'ignored'

export type UpcomingRow = {
  city: string
  cityName: string
  id: string
  name: string
  status: string
  statusReason: string
  section: UpcomingSection
  line: string | null
  lineName: string | null
  lineColor: string | null
  lineCandidates: string[]
  expected: string | null
  firstSeen: string | null
  addedOn: string | null
  coordinates: [number, number] | null
  sources: { label: string; url: string }[]
}

export type UpcomingBoardData = {
  rows: UpcomingRow[]
  lines: Record<string, { id: string; name: string; color: string }[]>
  trackedCities: number
  canEdit: boolean
}

const ROOT = process.cwd()
const STORE_DIR = path.join(ROOT, 'upcoming')

/** Writes (add/ignore/check) need a writable checkout, i.e. the local dev server. */
export function upcomingCanEdit() {
  return process.env.NODE_ENV !== 'production' || process.env.UPCOMING_ADMIN_WRITE === '1'
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return null
  }
}

const cityNames = new Map<string, string>()
for (const c of cities) {
  const slug = getSlugFromLink(c.link)
  if (slug) cityNames.set(slug, c.name)
}

type LineInfo = { name?: string; color?: string }

/** Same rule as the tracker: data/lines.json, or `export const LINES = {…}` in config.ts. */
function linesFromConfig(file: string): Record<string, LineInfo> {
  let src = ''
  try {
    src = fs.readFileSync(file, 'utf8')
  } catch {
    return {}
  }
  const start = src.search(/export const LINES\b/)
  if (start < 0) return {}
  const open = src.indexOf('{', src.indexOf('=', start))
  let depth = 0
  let end = -1
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}' && --depth === 0) {
      end = i
      break
    }
  }
  if (open < 0 || end < 0) return {}
  const lines: Record<string, LineInfo> = {}
  for (const m of src.slice(open + 1, end).matchAll(/(['"]?)([\w\- .]+)\1\s*:\s*\{([^{}]*)\}/g)) {
    const name = m[3].match(/\bname\s*:\s*(['"`])((?:(?!\1).)*)\1/)
    const color = m[3].match(/\bcolor\s*:\s*(['"`])((?:(?!\1).)*)\1/)
    if (name) lines[m[2].trim()] = { name: name[2], color: color ? color[2] : '' }
  }
  return lines
}

function cityLines(slug: string): Record<string, LineInfo> {
  const rel = CITY_PATH_MAP[slug]
  if (!rel) return {}
  const dir = path.join(ROOT, 'src', 'app', '(game)', rel)
  return (
    readJson<Record<string, LineInfo>>(path.join(dir, 'data', 'lines.json')) ||
    linesFromConfig(path.join(dir, 'config.ts'))
  )
}

function sectionOf(status: string): UpcomingSection {
  if (status === 'due' || status === 'overdue') return 'due'
  if (status === 'needs-line') return 'needs-line'
  if (status === 'check') return 'check'
  if (status === 'promoted' || status === 'in-game') return 'added'
  if (status === 'ignored') return 'ignored'
  return 'later'
}

type StoreEntry = {
  id: string
  name: string
  nameOverride?: string | null
  status: string
  statusReason?: string
  line?: string | null
  lineOverride?: string | null
  lineCandidates?: (string | { line?: string; id?: string })[]
  expected?: { date?: string; raw?: string } | null
  firstSeen?: string
  promotedOn?: string | null
  coordinates?: [number, number]
  sources?: { type: string; url: string }[]
  webCheck?: { url?: string } | null
}

export function loadUpcomingBoard(): UpcomingBoardData {
  const rows: UpcomingRow[] = []
  const lines: UpcomingBoardData['lines'] = {}
  let files: string[] = []
  try {
    files = fs.readdirSync(STORE_DIR).filter((f) => f.endsWith('.json'))
  } catch {
    // no tracker output yet
  }

  for (const file of files) {
    const store = readJson<{ city: string; entries: StoreEntry[] }>(path.join(STORE_DIR, file))
    if (!store?.entries?.length) continue
    const slug = store.city || file.replace(/\.json$/, '')
    const cl = cityLines(slug)
    lines[slug] = Object.entries(cl).map(([id, l]) => ({
      id,
      name: l.name || id,
      color: l.color || '#888888',
    }))

    for (const e of store.entries) {
      const line = e.lineOverride || e.line || null
      const sources = (e.sources || []).map((s) => ({
        label: s.type === 'osm' ? 'OSM' : s.type === 'wikidata' ? 'Wikidata' : s.type,
        url: s.url,
      }))
      if (e.webCheck?.url) sources.push({ label: 'Web', url: e.webCheck.url })
      // one link per kind is enough ("OSM", not "OSM OSM")
      const seen = new Set<string>()
      const unique = sources.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)))
      sources.length = 0
      sources.push(...unique)
      if (e.coordinates) {
        const [lon, lat] = e.coordinates
        sources.push({
          label: 'Map',
          url: `https://www.openrailwaymap.org/?style=standard&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&zoom=16`,
        })
      }
      rows.push({
        city: slug,
        cityName: cityNames.get(slug) || slug,
        id: e.id,
        name: e.nameOverride || e.name,
        status: e.status,
        statusReason: e.statusReason || '',
        section: sectionOf(e.status),
        line,
        lineName: line ? cl[line]?.name || line : null,
        lineColor: line ? cl[line]?.color || null : null,
        lineCandidates: (e.lineCandidates || [])
          .map((c) => (typeof c === 'string' ? c : c.line || c.id || ''))
          .filter(Boolean),
        expected: e.expected?.raw || e.expected?.date || null,
        firstSeen: e.firstSeen || null,
        addedOn: e.promotedOn || null,
        coordinates: e.coordinates || null,
        sources,
      })
    }
  }

  rows.sort(
    (a, b) =>
      (a.expected || '9999').localeCompare(b.expected || '9999') ||
      a.cityName.localeCompare(b.cityName) ||
      a.name.localeCompare(b.name),
  )
  return { rows, lines, trackedCities: Object.keys(lines).length, canEdit: upcomingCanEdit() }
}
