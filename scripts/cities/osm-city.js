#!/usr/bin/env node
/**
 * Builds a city's game data from OpenStreetMap.
 *
 * Reads city-specs/<slug>.json (which lines exist, their names/colours, and how
 * to recognise each line's OSM route relations), downloads the route relations,
 * their track and stops from Overpass, and writes:
 *   src/app/(game)/<path>/data/{features,routes,lines}.json
 *   src/app/(game)/<path>/{config,metadata,page}.tsx|ts   (replacing a placeholder)
 *
 *   node scripts/cities/osm-city.js --spec=perth            # build one (skips if unchanged)
 *   node scripts/cities/osm-city.js --all                   # build every spec that changed
 *   node scripts/cities/osm-city.js --spec=perth --force
 *   node scripts/cities/osm-city.js --spec=perth --fixture=overpass.json
 *
 * Needs network access to Overpass, so it runs in GitHub Actions
 * (.github/workflows/city-build.yml). Data © OpenStreetMap contributors (ODbL).
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { ROOT, GAME_ROOT } = require('../upcoming/lib/city')
const { haversine } = require('../upcoming/lib/geo')

const SPEC_DIR = path.join(ROOT, 'city-specs')
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const ROUTE_TYPES = 'subway|light_rail|train|tram|monorail|railway|funicular'
const STOP_ROLE =
  /^(stop|stop_entry_only|stop_exit_only|forward_stop|backward_stop)(_\d+)?$/
const PLATFORM_ROLE = /^platform(_entry_only|_exit_only)?(_\d+)?$/

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

// ------------------------------------------------------------------ fetch

function buildQuery(bbox) {
  const [s, w, n, e] = bbox
  return `[out:json][timeout:600][maxsize:1073741824][bbox:${s},${w},${n},${e}];
rel["type"="route"]["route"~"^(${ROUTE_TYPES})$"]->.r;
.r out body;
way(r.r)->.w;
.w out geom;
node(r.r)->.n;
.n out;
(
  node["railway"~"^(station|halt|tram_stop)$"];
  node["public_transport"="station"];
  way["public_transport"="station"];
  way["railway"="station"];
)->.s;
.s out center;`
}

async function fetchOverpass(query) {
  let last = null
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(15 * 60 * 1000),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
              'MetroMemoryCityBuilder/1.0 (+https://github.com/kirklandwaterbot/metro-memory)',
          },
          body: `data=${encodeURIComponent(query)}`,
        })
        if (res.ok) return await res.json()
        console.error(`  ${endpoint}: HTTP ${res.status}`)
        last = new Error(
          `${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`,
        )
        if (res.status === 400) throw last
      } catch (error) {
        console.error(`  ${endpoint}: ${String(error.message).slice(0, 200)}`)
        last = error
        if (String(error.message).includes('HTTP 400')) throw error
      }
      await new Promise((r) => setTimeout(r, 15000))
    }
  }
  throw last
}

// ------------------------------------------------------------------ helpers

const lower = (v) => String(v ?? '').toLowerCase()

function matches(rule, tags) {
  for (const [key, pattern] of Object.entries(rule || {})) {
    if (key === 'exclude') continue
    const re = new RegExp(pattern, 'i')
    if (key === 'name') {
      const hay = [tags.name, tags['name:en'], tags.ref, tags.official_name]
        .filter(Boolean)
        .join(' | ')
      if (!re.test(hay)) return false
    } else if (!re.test(String(tags[key] ?? ''))) {
      return false
    }
  }
  if (rule?.exclude) {
    const hay = [tags.name, tags['name:en'], tags.ref]
      .filter(Boolean)
      .join(' | ')
    if (new RegExp(rule.exclude, 'i').test(hay)) return false
  }
  return true
}

/** "Central Station, Platform 3" -> "Central"; "Flinders Street Railway Station" -> "Flinders Street". */
function cleanStationName(raw, keepWords = []) {
  let s = String(raw || '').trim()
  s = s.replace(
    /\s*[,(-]\s*(platform|plat\.?|stand|stop|bay)\s*[\w/ ]+\)?\s*$/i,
    '',
  )
  s = s.replace(/\s+(platform|plat\.?)\s+[\w/]+$/i, '')
  const suffix =
    /\s+(railway station|train station|light rail station|light rail stop|tram stop|metro station|station|stn|stop)$/i
  if (!keepWords.some((w) => new RegExp(`${w}$`, 'i').test(s)))
    s = s.replace(suffix, '')
  return s.replace(/\s{2,}/g, ' ').trim()
}

const normName = (s) =>
  lower(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function lineStrings(points) {
  return points.length > 1 ? [points] : []
}

/** Douglas–Peucker in metres. */
function simplify(points, tol = 2) {
  if (points.length < 3) return points
  const k = Math.cos((points[0][1] * Math.PI) / 180) * 111320
  const xy = points.map(([x, y]) => [x * k, y * 111320])
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let best = -1
    let idx = -1
    for (let i = a + 1; i < b; i += 1) {
      const d =
        Math.abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) /
        len
      if (d > best) {
        best = d
        idx = i
      }
    }
    if (best > tol) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

const round = ([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6]

// ------------------------------------------------------------------ build

const PALETTE = [
  '#E4002B',
  '#0072CE',
  '#00A651',
  '#F7A800',
  '#7D3F98',
  '#00A7B5',
  '#D4006A',
  '#8C6E4A',
  '#5C6670',
  '#F26522',
]

/** Most common `colour` tag among the matched relations, as #RRGGBB. */
function osmColour(rels) {
  const counts = new Map()
  for (const r of rels) {
    let c = String(r.tags?.colour || '').trim()
    if (/^[0-9a-f]{6}$/i.test(c)) c = `#${c}`
    if (!/^#[0-9a-f]{6}$/i.test(c)) continue
    c = c.toUpperCase()
    counts.set(c, (counts.get(c) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

function indexOsm(osm) {
  const rels = []
  const ways = new Map()
  const nodes = new Map()
  const stations = []
  for (const el of osm.elements || []) {
    if (el.type === 'relation') rels.push(el)
    else if (el.type === 'way' && el.geometry) ways.set(el.id, el)
    else if (el.type === 'node') nodes.set(el.id, el)
    const t = el.tags || {}
    const isStation =
      ['station', 'halt', 'tram_stop'].includes(t.railway) ||
      t.public_transport === 'station'
    if (isStation && t.name) {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (typeof lat === 'number')
        stations.push({
          id: `${el.type}/${el.id}`,
          coordinates: [lon, lat],
          tags: t,
        })
    }
  }
  return { rels, ways, nodes, stations }
}

function nearestStation(stations, point, radius, preferName) {
  let best = null
  for (const s of stations) {
    const d = haversine(point, s.coordinates)
    if (d > radius) continue
    const bonus =
      preferName && normName(s.tags.name).includes(normName(preferName))
        ? 0.5
        : 1
    const score = d * bonus
    if (!best || score < best.score) best = { ...s, score, d }
  }
  return best
}

/** Stops of one relation in order, as {name, coordinates}. */
function relationStops(rel, idx, spec, mode) {
  const radius =
    mode === 'tram' || mode === 'light_rail'
      ? (spec.tramStationRadius ?? 120)
      : (spec.stationRadius ?? 300)
  const out = []
  let members = (rel.members || []).filter((m) => STOP_ROLE.test(m.role || ''))
  if (!members.length)
    members = (rel.members || []).filter((m) =>
      PLATFORM_ROLE.test(m.role || ''),
    )
  for (const m of members) {
    let point = null
    let ownName = null
    if (m.type === 'node' && idx.nodes.has(m.ref)) {
      const n = idx.nodes.get(m.ref)
      point = [n.lon, n.lat]
      ownName = n.tags?.name
    } else if (m.type === 'way' && idx.ways.has(m.ref)) {
      const w = idx.ways.get(m.ref)
      const g = w.geometry
      point = [
        g.reduce((s, p) => s + p.lon, 0) / g.length,
        g.reduce((s, p) => s + p.lat, 0) / g.length,
      ]
      ownName = w.tags?.name
    }
    if (!point) continue
    const st = nearestStation(
      idx.stations,
      point,
      radius,
      cleanStationName(ownName),
    )
    const rawName =
      st?.tags?.[spec.nameTag || 'name'] || st?.tags?.name || ownName
    if (!rawName) continue
    const name =
      (spec.rename || {})[cleanStationName(rawName, spec.keepSuffix)] ||
      cleanStationName(rawName, spec.keepSuffix)
    const coordinates = st ? st.coordinates : point
    const prev = out[out.length - 1]
    if (prev && normName(prev.name) === normName(name)) continue
    out.push({ name, coordinates })
  }
  return out
}

function buildLine(line, rels, idx, spec) {
  const mode = rels[0]?.tags?.route
  const sequences = rels
    .map((r) => relationStops(r, idx, spec, mode))
    .filter((s) => s.length)
  sequences.sort((a, b) => b.length - a.length)

  // Merge every relation's stops into one ordered list (longest first).
  const stations = []
  const sameStation = (a, b) =>
    normName(a.name) === normName(b.name) &&
    haversine(a.coordinates, b.coordinates) < (spec.mergeRadius ?? 800)
  for (const seq of sequences) {
    for (let i = 0; i < seq.length; i += 1) {
      const s = seq[i]
      if (stations.some((x) => sameStation(x, s))) continue
      // Insert next to the previous stop of this sequence when we know it.
      let at = stations.length
      for (let j = i - 1; j >= 0; j -= 1) {
        const k = stations.findIndex((x) => sameStation(x, seq[j]))
        if (k >= 0) {
          at = k + 1
          break
        }
      }
      stations.splice(at, 0, s)
    }
  }
  for (const extra of line.addStations || []) {
    if (!stations.some((x) => normName(x.name) === normName(extra.name)))
      stations.push(extra)
  }
  const dropped = new Set((line.removeStations || []).map(normName))
  const finalStations = stations.filter((s) => !dropped.has(normName(s.name)))

  // Track: every way member that isn't a platform or stop.
  const wayIds = new Set()
  for (const r of rels) {
    for (const m of r.members || []) {
      if (
        m.type === 'way' &&
        !PLATFORM_ROLE.test(m.role || '') &&
        !STOP_ROLE.test(m.role || '')
      )
        wayIds.add(m.ref)
    }
  }
  const strings = []
  let lengthM = 0
  for (const id of wayIds) {
    const w = idx.ways.get(id)
    if (!w) continue
    const pts = simplify(
      w.geometry.map((p) => [p.lon, p.lat]),
      spec.simplifyM ?? 2,
    ).map(round)
    for (const s of lineStrings(pts)) {
      strings.push(s)
      lengthM += s.slice(1).reduce((a, p, i) => a + haversine(s[i], p), 0)
    }
  }
  return { stations: finalStations, strings, lengthM, relations: rels.length }
}

// ------------------------------------------------------------------ code generation

const tsString = (s) =>
  `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function boundsOf(features, padRatio = 0.08) {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const f of features) {
    const [x, y] = f.geometry.coordinates
    w = Math.min(w, x)
    e = Math.max(e, x)
    s = Math.min(s, y)
    n = Math.max(n, y)
  }
  const px = (e - w) * padRatio + 0.01
  const py = (n - s) * padRatio + 0.01
  return {
    bounds: [
      [w - px, s - py],
      [e + px, n + py],
    ],
    maxBounds: [
      [w - px * 4 - 0.1, s - py * 4 - 0.1],
      [e + px * 4 + 0.1, n + py * 4 + 0.1],
    ],
  }
}

function writeCode(spec, dir, features) {
  const fmt = (v) => Math.round(v * 1000) / 1000
  const { bounds, maxBounds } = boundsOf(features)
  const groups = spec.lineGroups.map(
    (g) => `  {
    title: ${tsString(g.title)},
    items: [
      {
        type: 'lines',
        lines: [${g.lines.map(tsString).join(', ')}],
      },
    ],
  },`,
  )
  const url = `https://metro-memory.xyz/${spec.path}`
  const meta = `  icons: {
    icon: '/api/city-icon/${spec.slug}',
    apple: '/api/city-icon/${spec.slug}',
  },
  title: ${tsString(spec.gameTitle)},
  description: ${tsString(spec.description)},
  openGraph: {
    title: ${tsString(spec.gameTitle)},
    description: ${tsString(spec.description)},
    type: 'website',
    locale: ${tsString(spec.locale || 'en_US')},
    url: ${tsString(url)},
  },`

  fs.writeFileSync(
    path.join(dir, 'config.ts'),
    `// Generated by scripts/cities/osm-city.js from city-specs/${spec.slug}.json.
import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
${groups.join('\n')}
]

export const METADATA: Metadata = {
${meta}
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [${fmt(bounds[0][0])}, ${fmt(bounds[0][1])}],
    [${fmt(bounds[1][0])}, ${fmt(bounds[1][1])}],
  ],
  maxBounds: [
    [${fmt(maxBounds[0][0])}, ${fmt(maxBounds[0][1])}],
    [${fmt(maxBounds[1][0])}, ${fmt(maxBounds[1][1])}],
  ],
  minZoom: ${spec.minZoom ?? 8},
  fadeDuration: 50,
}

export const CITY_NAME = ${tsString(spec.slug)}

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

const config: Config = {
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
`,
  )
  fs.writeFileSync(
    path.join(dir, 'metadata.ts'),
    `import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata(${tsString(spec.slug)}, {
${meta}
})
`,
  )
  const component = spec.slug
    .replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/[^A-Za-z0-9]/g, '')
  fs.writeFileSync(
    path.join(dir, 'page.tsx'),
    `export { metadata } from './metadata'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'
import CityDataGamePage from '@/components/CityDataGamePage'
import { Provider } from '@/lib/configContext'
import Main from '@/components/Main'

export default function ${component}Page() {
  return (
    <Provider value={config}>
      <Main className="min-h-screen">
        <CityDataGamePage slug=${JSON.stringify(spec.slug)} />
      </Main>
    </Provider>
  )
}
`,
  )
}

// ------------------------------------------------------------------ main

async function buildCity(spec, args, osmCache) {
  const dir = path.join(GAME_ROOT, spec.path)
  const dataDir = path.join(dir, 'data')
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify(spec))
    .digest('hex')
    .slice(0, 12)
  const hashFile = path.join(dataDir, '.spec-hash')
  if (
    !args.force &&
    fs.existsSync(hashFile) &&
    fs.readFileSync(hashFile, 'utf8').trim() === hash
  ) {
    return `- ${spec.slug}: unchanged (spec hash ${hash}) — skipped`
  }

  const key = JSON.stringify(spec.bbox)
  let osm = osmCache.get(key)
  if (!osm) {
    const t0 = Date.now()
    console.error(`${spec.slug}: querying Overpass…`)
    osm = args.fixture
      ? JSON.parse(fs.readFileSync(args.fixture, 'utf8'))
      : await fetchOverpass(buildQuery(spec.bbox))
    console.error(
      `${spec.slug}: ${(osm.elements || []).length} elements in ${Math.round((Date.now() - t0) / 1000)}s`,
    )
    osmCache.set(key, osm)
  }
  const idx = indexOsm(osm)

  const report = [`## ${spec.slug}`]
  const features = []
  const routes = []
  const lines = {}
  const used = new Set()
  let id = 0
  spec.lines.forEach((line, order) => {
    const rels = idx.rels.filter((r) => matches(line.match, r.tags || {}))
    rels.forEach((r) => used.add(r.id))
    const built = buildLine(line, rels, idx, spec)
    const color =
      line.color || osmColour(rels) || PALETTE[order % PALETTE.length]
    lines[line.id] = {
      name: line.name,
      color,
      backgroundColor: line.backgroundColor || color,
      textColor: line.textColor || '#FFFFFF',
      order,
      ...(line.icon ? { icon: line.icon } : {}),
    }
    built.stations.forEach((s, i) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: round(s.coordinates) },
        properties: { id, name: s.name, line: line.id, order: i },
        id,
      })
      id += 1
    })
    if (built.strings.length) {
      routes.push({
        type: 'Feature',
        geometry: { type: 'MultiLineString', coordinates: built.strings },
        properties: { line: line.id, name: line.name, color, order },
      })
    }
    const warn = !rels.length
      ? ' ⚠️ no OSM route relation matched'
      : !built.stations.length
        ? ' ⚠️ no stations found'
        : ''
    report.push(
      `- ${line.id} (${line.name}): ${rels.length} relation(s), ${built.stations.length} stations, ${(built.lengthM / 1000).toFixed(1)} km of track${warn}`,
    )
    if (rels.length) {
      const names = [
        ...new Set(
          rels.map((r) => r.tags?.name || r.tags?.ref || `relation ${r.id}`),
        ),
      ]
      report.push(
        `  - via: ${names.slice(0, 6).join(' / ')}${names.length > 6 ? ` (+${names.length - 6} more)` : ''}`,
      )
    }
    if (built.stations.length)
      report.push(`  - ${built.stations.map((s) => s.name).join(' · ')}`)
  })

  // Route relations in the area that no line claimed (helps fix the spec).
  const unused = idx.rels
    .filter((r) => !used.has(r.id))
    .filter(
      (r) =>
        !spec.ignoreUnmatched ||
        !new RegExp(spec.ignoreUnmatched, 'i').test(
          `${r.tags?.network} ${r.tags?.name}`,
        ),
    )
    .map(
      (r) =>
        `${r.tags?.route} | ${r.tags?.network || '-'} | ${r.tags?.ref || '-'} | ${r.tags?.name || '-'}`,
    )
  const uniqueUnused = [...new Set(unused)].sort()
  if (uniqueUnused.length) {
    report.push(
      `- Unmatched route relations in the area (${uniqueUnused.length}):`,
    )
    for (const u of uniqueUnused.slice(0, 80)) report.push(`  - ${u}`)
  }

  if (!args['dry-run']) {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(
      path.join(dataDir, 'features.json'),
      `${JSON.stringify({ type: 'FeatureCollection', features }, null, 2)}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'routes.json'),
      `${JSON.stringify({ type: 'FeatureCollection', features: routes })}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'lines.json'),
      `${JSON.stringify(lines, null, 2)}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'SOURCE.md'),
      `Generated by \`scripts/cities/osm-city.js\` from \`city-specs/${spec.slug}.json\`.\n\nStation and route data © OpenStreetMap contributors, available under the Open Database License (ODbL).\n`,
    )
    if (features.length) writeCode(spec, dir, features)
    fs.writeFileSync(hashFile, `${hash}\n`)
  }
  return report.join('\n')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = args.all
    ? fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.json'))
    : String(args.spec || '')
        .split(',')
        .filter(Boolean)
        .map((s) => `${s}.json`)
  if (!files.length) throw new Error('use --spec=<slug>[,<slug>] or --all')
  const cache = new Map()
  const out = []
  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, file), 'utf8'))
    try {
      out.push(await buildCity(spec, args, cache))
    } catch (error) {
      out.push(`## ${spec.slug}\n- ⚠️ build failed: ${error.message}`)
    }
  }
  const report = `# OSM city build\n\n${out.join('\n\n')}\n`
  if (typeof args.report === 'string') fs.writeFileSync(args.report, report)
  console.log(report)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  cleanStationName,
  matches,
  buildLine,
  indexOsm,
  relationStops,
}
