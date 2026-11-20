#!/usr/bin/env node
/**
 * Redraws lines as their physical tracks from OpenStreetMap: every running
 * track (two, three, four...) along the line's current route, the way the
 * LIRR and Metro-North are drawn, instead of one centre line.
 *
 * Reads data-sources/<city>/osm-tracks.json:
 *   { "bufferM": 25, "lines": ["NJTNorthEastCorridor", "Amtrak", ...] }
 *
 * For each line it keeps the OSM rail ways (no yards or spurs) that run
 * alongside its current route within bufferM, clipped to that corridor and
 * parallel to it. Wherever OSM has no track along the route, the old
 * geometry is kept, so nothing goes missing. Planned ("future") pieces are
 * left alone.
 *
 *   node scripts/routes/osm-tracks.js --city=nyc [--lines=A,B] [--report=out.md] [--dry-run]
 *   node scripts/routes/osm-tracks.js --city=nyc --overpass-file=.tmp/osm/nyc-tracks.json
 *
 * Needs network access to Overpass (runs in the Track Layouts workflow).
 * Geometry © OpenStreetMap contributors (ODbL).
 */
const fs = require('fs')
const path = require('path')
const { ROOT, readJson, writeJsonLike, loadCityPathMap, GAME_ROOT } = require('../upcoming/lib/city')
const { haversine } = require('../upcoming/lib/geo')

const ENDPOINTS = [
  process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const CELL_DEG = 0.04
// OSM railway=* values counted as running track. Subways and light rail are
// tagged railway=subway / light_rail, so osm-tracks.json can widen this per
// line: "railwaysByLine": { "^NewYorkSubway": "subway|construction" }
// (a line not matched by any pattern keeps the default).
const DEFAULT_RAILWAYS = 'rail|construction'

/** Rail ways from a saved Overpass response (`out tags geom`), e.g. from scripts/cities/fetch-osm.js. */
function readOverpassFile(file, railways = DEFAULT_RAILWAYS) {
  const wanted = new Set(railways.split('|'))
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const ways = []
  for (const el of json.elements || []) {
    if (el.type !== 'way' || !el.geometry) continue
    const tags = el.tags || {}
    if (!wanted.has(tags.railway)) continue
    if (['yard', 'spur'].includes(tags.service)) continue
    ways.push({ id: el.id, tags, coords: el.geometry.map((g) => [g.lon, g.lat]) })
  }
  return ways
}
const MIN_RUN_M = 60
const MAX_ANGLE_DEG = 30
const SIMPLIFY_M = 2
const KEEP_OLD_MIN_M = 50
const JOIN_GAP_M = 60
const JOIN_MAX_ANGLE_DEG = 20

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

function resolveDataDir(slug) {
  const rel = loadCityPathMap()[slug]
  if (!rel) throw new Error(`unknown city "${slug}"`)
  const base = path.join(GAME_ROOT, rel, 'data')
  for (const dir of [base, path.join(base, 'full')]) {
    if (fs.existsSync(path.join(dir, 'routes.json'))) return dir
  }
  throw new Error(`no routes.json under ${base}`)
}

const stringsOf = (g) =>
  g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : []

// ---- planar helpers (metres, local projection) ----
function projector(lat0) {
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320
  return { to: ([lon, lat]) => [lon * kx, lat * 110540], from: ([x, y]) => [x / kx, y / 110540] }
}

function segInfo(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const L = dx * dx + dy * dy
  let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0
  t = Math.max(0, Math.min(1, t))
  return {
    d: Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy),
    bearing: Math.atan2(dy, dx),
    point: [a[0] + t * dx, a[1] + t * dy],
  }
}

/** Grid index of a line's route segments for fast nearest-segment lookups. */
function segmentIndex(strings, proj, cell = 100) {
  const grid = new Map()
  for (const s of strings) {
    const q = s.map(proj.to)
    for (let i = 1; i < q.length; i += 1) {
      const a = q[i - 1]
      const b = q[i]
      const x0 = Math.floor(Math.min(a[0], b[0]) / cell)
      const x1 = Math.floor(Math.max(a[0], b[0]) / cell)
      const y0 = Math.floor(Math.min(a[1], b[1]) / cell)
      const y1 = Math.floor(Math.max(a[1], b[1]) / cell)
      for (let x = x0; x <= x1; x += 1)
        for (let y = y0; y <= y1; y += 1) {
          const key = `${x},${y}`
          if (!grid.has(key)) grid.set(key, [])
          grid.get(key).push([a, b])
        }
    }
  }
  return {
    nearest(p, radius) {
      let best = null
      const r = Math.ceil(radius / cell)
      const cx = Math.floor(p[0] / cell)
      const cy = Math.floor(p[1] / cell)
      for (let x = cx - r; x <= cx + r; x += 1)
        for (let y = cy - r; y <= cy + r; y += 1)
          for (const [a, b] of grid.get(`${x},${y}`) || []) {
            const info = segInfo(p, a, b)
            if (!best || info.d < best.d) best = info
          }
      return best && best.d <= radius ? best : null
    },
  }
}

function simplify(points, tol, proj) {
  if (points.length < 3) return points
  const xy = points.map(proj.to)
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let maxD = 0
    let idx = -1
    for (let i = a + 1; i < b; i += 1) {
      const d = segInfo(xy[i], xy[a], xy[b]).d
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

const lengthM = (pts) => pts.slice(1).reduce((s, p, i) => s + haversine(pts[i], p), 0)
const round6 = (p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]

async function overpass(query) {
  let last = null
  for (let pass = 0; pass < 4; pass += 1) {
    if (pass) await new Promise((r) => setTimeout(r, 15_000 * pass))
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MetroMemoryTrackLayouts/1.0 (+https://github.com/kirklandwaterbot/metro-memory)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(180_000),
        })
        if (!res.ok) {
          last = new Error(`${endpoint}: HTTP ${res.status}`)
          continue
        }
        const json = await res.json()
        if (/runtime error|timed out|out of memory/i.test(json.remark || '')) {
          last = new Error(`${endpoint}: ${json.remark}`)
          continue
        }
        return json
      } catch (error) {
        last = error
      }
    }
  }
  throw last
}

/** OSM running track in the grid cells the given strings pass through. */
async function fetchTracks(allStrings, log, railways = DEFAULT_RAILWAYS) {
  const cells = new Set()
  for (const s of allStrings) {
    for (let i = 0; i < s.length; i += 1) {
      const a = s[i]
      const b = s[i + 1] || a
      const steps = Math.max(1, Math.ceil(haversine(a, b) / 500))
      for (let k = 0; k <= steps; k += 1) {
        const lon = a[0] + ((b[0] - a[0]) * k) / steps
        const lat = a[1] + ((b[1] - a[1]) * k) / steps
        cells.add(`${Math.floor(lon / CELL_DEG)},${Math.floor(lat / CELL_DEG)}`)
      }
    }
  }
  const ways = new Map()
  let done = 0
  for (const key of cells) {
    const [cx, cy] = key.split(',').map(Number)
    const s = (cy * CELL_DEG).toFixed(4)
    const w = (cx * CELL_DEG).toFixed(4)
    const n = ((cy + 1) * CELL_DEG).toFixed(4)
    const e = ((cx + 1) * CELL_DEG).toFixed(4)
    const q = `[out:json][timeout:120];way["railway"~"^(${railways})$"]["service"!~"^(yard|spur)$"](${s},${w},${n},${e});out tags geom;`
    const res = await overpass(q)
    for (const el of res.elements || []) {
      if (el.type === 'way' && el.geometry) ways.set(el.id, el)
    }
    done += 1
    if (done % 20 === 0) log(`  ${done}/${cells.size} map cells`)
  }
  return [...ways.values()].map((w) => ({
    id: w.id,
    tags: w.tags || {},
    coords: w.geometry.map((g) => [g.lon, g.lat]),
  }))
}

/** Rail ways from an `osmium export -f geojsonseq` file, filtered like the Overpass query. */
function readOsmFile(file, railways = DEFAULT_RAILWAYS) {
  const wanted = new Set(railways.split('|'))
  const ways = []
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/^\x1e/, '').trim()
    if (!line) continue
    let f
    try {
      f = JSON.parse(line)
    } catch {
      continue
    }
    const tags = f.properties || {}
    if (!wanted.has(tags.railway)) continue
    if (['yard', 'spur'].includes(tags.service)) continue
    const strings =
      f.geometry?.type === 'LineString'
        ? [f.geometry.coordinates]
        : f.geometry?.type === 'MultiLineString'
          ? f.geometry.coordinates
          : []
    for (const coords of strings) if (coords.length >= 2) ways.push({ id: f.id ?? tags['@id'], tags, coords })
  }
  return ways
}

/** Pieces of OSM track that run alongside `routeStrings` within bufferM. */
function tracksAlong(routeStrings, osmWays, bufferM, proj) {
  const index = segmentIndex(routeStrings, proj)
  const runs = []
  for (const way of osmWays) {
    // densify so a run is cut where the track actually leaves the route,
    // not at the next OSM node (which can be hundreds of metres away)
    const coords = densify(way.coords, 10)
    const xy = coords.map(proj.to)
    let cur = []
    const flush = () => {
      if (cur.length >= 2) runs.push({ id: way.id, coords: cur })
      cur = []
    }
    for (let i = 0; i < xy.length; i += 1) {
      const near = index.nearest(xy[i], bufferM)
      let ok = Boolean(near)
      if (ok) {
        // locally parallel to the route: a track crossing it is left out
        const a = xy[Math.max(0, i - 1)]
        const b = xy[Math.min(xy.length - 1, i + 1)]
        const bearing = Math.atan2(b[1] - a[1], b[0] - a[0])
        let diff = Math.abs(bearing - near.bearing) % Math.PI
        if (diff > Math.PI / 2) diff = Math.PI - diff
        ok = (diff * 180) / Math.PI <= MAX_ANGLE_DEG
      }
      if (ok) cur.push(coords[i])
      else flush()
    }
    flush()
  }
  // OSM splits track at every bridge, switch and signal, so a short run is
  // only dropped when it is not joined (through shared nodes) to others that
  // together reach MIN_RUN_M: bridges stay, stray crossing stubs go.
  const parent = runs.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const byNode = new Map()
  runs.forEach((r, i) => {
    for (const p of r.coords) {
      const key = `${p[0].toFixed(7)},${p[1].toFixed(7)}`
      if (byNode.has(key)) parent[find(i)] = find(byNode.get(key))
      else byNode.set(key, i)
    }
  })
  const total = new Map()
  runs.forEach((r, i) => total.set(find(i), (total.get(find(i)) || 0) + lengthM(r.coords)))
  const kept = runs.filter((_, i) => total.get(find(i)) >= MIN_RUN_M)
  return [...kept, ...bridgeGaps(kept, proj)]
}

/**
 * Short straight links across small breaks in a track (a node just outside
 * the buffer, an unmapped bridge span): two loose ends that face each other
 * within JOIN_GAP_M are joined. Ends that meet other track are left alone.
 */
function bridgeGaps(runs, proj) {
  const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`
  const count = new Map()
  for (const r of runs) for (const p of r.coords) count.set(key(p), (count.get(key(p)) || 0) + 1)
  const ends = []
  for (const r of runs) {
    const c = r.coords
    for (const [p, q] of [
      [c[0], c[1]],
      [c[c.length - 1], c[c.length - 2]],
    ]) {
      if (count.get(key(p)) > 1) continue // meets other track
      const a = proj.to(p)
      const b = proj.to(q)
      const len = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1
      ends.push({ p, xy: a, dir: [(a[0] - b[0]) / len, (a[1] - b[1]) / len], used: false })
    }
  }
  const cell = JOIN_GAP_M
  const grid = new Map()
  ends.forEach((e, i) => {
    const k = `${Math.floor(e.xy[0] / cell)},${Math.floor(e.xy[1] / cell)}`
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(i)
  })
  const pairs = []
  const cos = Math.cos((JOIN_MAX_ANGLE_DEG * Math.PI) / 180)
  ends.forEach((e, i) => {
    const cx = Math.floor(e.xy[0] / cell)
    const cy = Math.floor(e.xy[1] / cell)
    for (let x = cx - 1; x <= cx + 1; x += 1) {
      for (let y = cy - 1; y <= cy + 1; y += 1) {
        for (const j of grid.get(`${x},${y}`) || []) {
          if (j <= i) continue
          const f = ends[j]
          const v = [f.xy[0] - e.xy[0], f.xy[1] - e.xy[1]]
          const dist = Math.hypot(v[0], v[1])
          if (dist < 1 || dist > JOIN_GAP_M) continue
          const u = [v[0] / dist, v[1] / dist]
          // each end points at the other, and the two ends point opposite ways
          if (e.dir[0] * u[0] + e.dir[1] * u[1] < cos) continue
          if (-(f.dir[0] * u[0] + f.dir[1] * u[1]) < cos) continue
          pairs.push([dist, i, j])
        }
      }
    }
  })
  pairs.sort((a, b) => a[0] - b[0])
  const out = []
  for (const [, i, j] of pairs) {
    if (ends[i].used || ends[j].used) continue
    ends[i].used = ends[j].used = true
    out.push({ id: 'join', coords: [ends[i].p, ends[j].p] })
  }
  return out
}

function densify(coords, stepM) {
  const out = []
  for (let i = 0; i < coords.length; i += 1) {
    const a = coords[i]
    const b = coords[i + 1]
    out.push(a)
    if (!b) break
    const steps = Math.floor(haversine(a, b) / stepM)
    for (let k = 1; k < steps; k += 1) {
      out.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps])
    }
  }
  return out
}

/** Stretches of the old route with no new track beside them. */
function uncovered(routeStrings, runs, bufferM, proj) {
  const index = segmentIndex(
    runs.map((r) => r.coords),
    proj,
  )
  const out = []
  for (const s of routeStrings) {
    // densify so short gaps are noticed
    const dense = []
    for (let i = 0; i < s.length; i += 1) {
      const a = s[i]
      const b = s[i + 1]
      dense.push(a)
      if (!b) break
      const steps = Math.floor(haversine(a, b) / 20)
      for (let k = 1; k < steps; k += 1) {
        dense.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps])
      }
    }
    let cur = []
    const flush = () => {
      if (cur.length >= 2 && lengthM(cur) >= KEEP_OLD_MIN_M) out.push(cur)
      cur = []
    }
    // where an old stretch meets new track, end it on the track itself
    const onTrack = (p) => {
      const near = index.nearest(proj.to(p), bufferM * 1.2)
      return near ? proj.from(near.point) : p
    }
    for (let i = 0; i < dense.length; i += 1) {
      if (index.nearest(proj.to(dense[i]), bufferM * 1.2)) {
        if (cur.length) {
          cur.push(onTrack(dense[i]))
          flush()
        }
      } else {
        if (!cur.length && i > 0) cur.push(onTrack(dense[i - 1]))
        cur.push(dense[i])
      }
    }
    flush()
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.city) throw new Error('--city is required')
  const configPath = path.join(ROOT, 'data-sources', args.city, 'osm-tracks.json')
  const config = readJson(configPath) || {}
  const bufferM = Number(config.bufferM || 25)
  const railwaysByLine = Object.entries(config.railwaysByLine || {}).map(([re, types]) => [new RegExp(re), String(types)])
  const railwaysFor = (line) => (railwaysByLine.find(([re]) => re.test(line)) || [null, DEFAULT_RAILWAYS])[1]
  const railways = [...new Set([DEFAULT_RAILWAYS, ...railwaysByLine.map(([, t]) => t)].join('|').split('|'))].join('|')
  const lines = args.lines ? String(args.lines).split(',') : config.lines || []
  const dir = resolveDataDir(args.city)
  const routesPath = path.join(dir, 'routes.json')
  const routes = readJson(routesPath)
  const report = [`# Track layouts — ${args.city}`, '']
  const log = (m) => console.log(m)

  // The route each line's track is looked up along. Once a line has been
  // replaced by its tracks the drawn route is no longer a centreline, so the
  // first build saves it to track-centrelines.json and later builds use that.
  const centrelinesPath = path.join(ROOT, 'data-sources', args.city, 'track-centrelines.json')
  const centrelines = readJson(centrelinesPath) || {}
  const current = new Map()
  for (const f of routes.features) {
    const line = f.properties?.line
    if (!lines.includes(line) || f.properties?.future || centrelines[line]) continue
    if (!current.has(line)) current.set(line, [])
    current.get(line).push(...stringsOf(f.geometry).filter((s) => s.length >= 2))
  }
  let savedNew = false
  for (const line of lines) {
    if (centrelines[line]) current.set(line, centrelines[line])
    else if (current.has(line)) {
      centrelines[line] = current.get(line).map((s) => s.map(round6))
      savedNew = true
    }
  }
  const all = [...current.values()].flat()
  if (!all.length) throw new Error('none of the lines have a route to follow')
  const proj = projector(all[0][0][1])
  let osmWays
  if (args['osm-file']) {
    // GeoJSON sequence from `osmium export` of a Geofabrik extract: no
    // Overpass needed (the public servers are often too busy for a big area).
    osmWays = readOsmFile(args['osm-file'], railways)
  } else if (args['overpass-file']) {
    osmWays = readOverpassFile(args['overpass-file'], railways)
  } else {
    log(`Fetching OSM track for ${current.size} lines…`)
    osmWays = await fetchTracks(all, log, railways)
  }
  log(`${osmWays.length} OSM track ways`)

  for (const line of lines) {
    const strings = current.get(line)
    if (!strings?.length) {
      report.push(`- ⚠️ ${line}: no current route — skipped`)
      continue
    }
    const allowed = new Set(railwaysFor(line).split('|'))
    const runs = tracksAlong(strings, osmWays.filter((w) => allowed.has(w.tags.railway)), bufferM, proj)
    const old = uncovered(strings, runs, bufferM, proj)
    const trackKm = runs.reduce((s, r) => s + lengthM(r.coords), 0) / 1000
    const oldKm = old.reduce((s, r) => s + lengthM(r), 0) / 1000
    const routeKm = strings.reduce((s, r) => s + lengthM(r), 0) / 1000
    if (!runs.length) {
      report.push(`- ⚠️ ${line}: no OSM track along the route — not changed`)
      continue
    }
    const base = routes.features.find((f) => f.properties?.line === line && !f.properties?.future)
    const props = Object.fromEntries(
      Object.entries(base.properties).filter(
        ([k]) => !['auto_filled', 'osm_route', 'osm_tracks', 'note', 'drawn_from'].includes(k),
      ),
    )
    props.osm_tracks = {
      source: `© OpenStreetMap contributors (ODbL), via ${args['osm-file'] ? 'Geofabrik' : 'Overpass'}`,
      built: new Date().toISOString().slice(0, 10),
      buffer_m: bufferM,
    }
    const geometry = [
      ...runs.map((r) => simplify(r.coords, SIMPLIFY_M, proj).map(round6)),
      ...old.map((r) => simplify(r, SIMPLIFY_M, proj).map(round6)),
    ].filter((s) => s.length >= 2)
    routes.features = routes.features.filter((f) => !(f.properties?.line === line && !f.properties?.future))
    routes.features.push({ type: 'Feature', geometry: { type: 'MultiLineString', coordinates: geometry }, properties: props })
    report.push(
      `- ✅ ${line}: ${trackKm.toFixed(1)} km of OSM track along a ${routeKm.toFixed(1)} km route` +
        (oldKm > 0.05 ? `; ${oldKm.toFixed(1)} km kept from the old route where OSM has no track` : ''),
    )
  }

  if (!args['dry-run']) {
    writeJsonLike(routesPath, routes)
    if (savedNew) {
      const sorted = Object.fromEntries(Object.keys(centrelines).sort().map((k) => [k, centrelines[k]]))
      // one line per string keeps the file reviewable without pretty-printing every point
      const body = Object.entries(sorted)
        .map(([k, v]) => `  ${JSON.stringify(k)}: [\n${v.map((s) => `    ${JSON.stringify(s)}`).join(',\n')}\n  ]`)
        .join(',\n')
      fs.writeFileSync(centrelinesPath, `{\n${body}\n}\n`)
    }
  }
  report.push('')
  const text = report.join('\n')
  if (args.report) fs.writeFileSync(args.report, text)
  console.log(text)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { tracksAlong, uncovered, projector, readOsmFile }
