#!/usr/bin/env node
/**
 * Snap station points onto their own line's track.
 *
 * Station data often stores one point per station (e.g. OpenStreetMap's
 * station node), shared by every line that stops there. At an interchange
 * that point sits on at most one of the tracks, so the other lines' dots float
 * beside their track. This moves each station feature (one per line) onto the
 * nearest point of that line's track in routes.json, so every line's dot sits
 * on its own track and an interchange shows one dot per track.
 *
 * Safety rules:
 * - Only moves a point when its line has track within MAX_SNAP_M.
 * - Never snaps onto the dead end of a piece of track that stops short of the
 *   station (a gap in the track data, e.g. a missing extension): those are
 *   reported as track gaps instead, because snapping would drag the station
 *   away from where it really is.
 * - Points already on the track (within ON_TRACK_M) are left untouched.
 * - Lines that the game counts as one station today (an interchange whose
 *   lines shared a point) stay one station: they get a shared cluster_key
 *   when snapping moves them apart.
 *
 * Usage:
 *   node scripts/snap-stations-to-tracks.js            report what would change
 *   node scripts/snap-stations-to-tracks.js --write    apply
 *   node scripts/snap-stations-to-tracks.js --gaps     also list every track gap
 *   node scripts/snap-stations-to-tracks.js --write --quiet
 *                                                      only print when something moved
 *                                                      (used before dev and build)
 *   node scripts/snap-stations-to-tracks.js --write asia/china/tianjin
 *                                                      only cities whose path
 *                                                      contains this text
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GAME_ROOT = path.join(ROOT, 'src', 'app', '(game)')

const MAX_SNAP_M = 250 // don't move a station further than this; farther ones are listed for review
const ON_TRACK_M = 1.5 // already on the track
const DEAD_END_M = 25 // a dead end this close still counts (station at a terminus)
const JOIN_M = 8 // track pieces whose ends are this close are joined
// The game merges same-named stations closer than this (degrees) into one
// station (see COMPLEX_THRESHOLD in GamePage.tsx). Stations it merges today get
// an explicit cluster_key when snapping pulls them further apart, so the game
// still counts them as one station.
const COMPLEX_THRESHOLD = 0.00075

const findDataDirs = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const sub = path.join(dir, entry.name)
    if (entry.name === 'data' && fs.existsSync(path.join(sub, 'features.json'))) out.push(sub)
    else findDataDirs(sub, out)
  }
  return out
}

// Reproduce the file's own JSON formatting so only coordinates change in diffs.
const detectFormat = (raw, value) => {
  for (const indent of [0, 2, 1, 4, '\t']) {
    const text = JSON.stringify(value, null, indent || undefined)
    for (const ending of ['', '\n', '\r\n']) {
      const candidate = ending === '\r\n' ? text.replace(/\n/g, '\r\n') + ending : text + ending
      if (candidate === raw) return { indent, ending }
    }
  }
  return null
}
const serialize = (value, { indent, ending }) => {
  const text = JSON.stringify(value, null, indent || undefined)
  return ending === '\r\n' ? text.replace(/\n/g, '\r\n') + ending : text + ending
}

const round6 = (v) => Math.round(v * 1e6) / 1e6

/** Index a line's track as projected segments in a coarse grid. */
const buildTrackIndex = (strings, project) => {
  const CELL = 250
  const grid = new Map()
  const segments = []
  const ends = []
  strings.forEach((coords, s) => {
    const pts = coords.map(project)
    // each end with the direction the track runs from it (into the piece)
    const unit = (from, to) => {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
      return [(to[0] - from[0]) / len, (to[1] - from[1]) / len]
    }
    ends.push({ p: pts[0], inward: unit(pts[0], pts[1]) })
    ends.push({ p: pts[pts.length - 1], inward: unit(pts[pts.length - 1], pts[pts.length - 2]) })
    for (let i = 1; i < pts.length; i += 1) {
      const seg = { a: pts[i - 1], b: pts[i], s, first: i === 1, last: i === pts.length - 1 }
      const id = segments.push(seg) - 1
      const x0 = Math.floor(Math.min(seg.a[0], seg.b[0]) / CELL)
      const x1 = Math.floor(Math.max(seg.a[0], seg.b[0]) / CELL)
      const y0 = Math.floor(Math.min(seg.a[1], seg.b[1]) / CELL)
      const y1 = Math.floor(Math.max(seg.a[1], seg.b[1]) / CELL)
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 400) {
        ;(grid.get('big') ?? grid.set('big', []).get('big')).push(id)
        continue
      }
      for (let x = x0; x <= x1; x += 1)
        for (let y = y0; y <= y1; y += 1) {
          const key = `${x},${y}`
          ;(grid.get(key) ?? grid.set(key, []).get(key)).push(id)
        }
    }
  })
  // An end is a dead end unless track carries on past it: another piece that
  // starts there and runs the opposite way, or passes through it. Two parallel
  // tracks (one per direction) that both stop at the same place are still a
  // dead end, which is how a missing extension usually looks.
  const isDeadEnd = (p) => {
    const here = ends.filter((e) => Math.hypot(e.p[0] - p[0], e.p[1] - p[1]) <= JOIN_M)
    const mine = here.find((e) => samePoint(e.p, p)) || here[0]
    if (mine && here.some((e) => e.inward[0] * mine.inward[0] + e.inward[1] * mine.inward[1] < -0.3)) {
      return false
    }
    return !segments.some((seg) => {
      const { d, t } = projectOnSegment(p, seg)
      return d <= JOIN_M && t > 0.001 && t < 0.999
    })
  }
  const nearest = (p, radius) => {
    const ids = new Set(grid.get('big') || [])
    const r = Math.ceil(radius / CELL)
    const cx = Math.floor(p[0] / CELL)
    const cy = Math.floor(p[1] / CELL)
    for (let x = cx - r; x <= cx + r; x += 1)
      for (let y = cy - r; y <= cy + r; y += 1) for (const id of grid.get(`${x},${y}`) || []) ids.add(id)
    let best = null
    for (const id of ids) {
      const seg = segments[id]
      const hit = projectOnSegment(p, seg)
      if (!best || hit.d < best.d) best = { ...hit, seg }
    }
    return best
  }
  return { nearest, isDeadEnd }
}

const samePoint = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6

function projectOnSegment(p, { a, b }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0
  const q = [a[0] + t * dx, a[1] + t * dy]
  return { q, t, d: Math.hypot(p[0] - q[0], p[1] - q[1]) }
}

const snapCity = (dataDir, { write, previousFeatures = null }) => {
  const featuresPath = path.join(dataDir, 'features.json')
  const routesPath = path.join(dataDir, 'routes.json')
  const city = path.relative(GAME_ROOT, path.dirname(dataDir)).split(path.sep).join('/')
  const result = { city, moved: [], gaps: [], far: [], noTrack: new Set(), skipped: null }
  if (!fs.existsSync(routesPath)) {
    result.skipped = 'no routes.json'
    return result
  }
  const rawFeatures = fs.readFileSync(featuresPath, 'utf8')
  const features = JSON.parse(rawFeatures)
  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))

  const pts = features.features.map((f) => f.geometry.coordinates)
  if (pts.length === 0) return result
  const lat0 = pts.reduce((sum, p) => sum + p[1], 0) / pts.length
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320
  const ky = 110540
  const project = ([lon, lat]) => [lon * kx, lat * ky]
  const unproject = ([x, y]) => [round6(x / kx), round6(y / ky)]

  const stringsByLine = new Map()
  for (const route of routes.features || []) {
    const line = route.properties?.line
    if (!line || !route.geometry) continue
    // collect every coordinate string, whatever the nesting (some files
    // declare MultiLineString but nest one level deeper or shallower)
    const strings = []
    const collect = (c) => {
      if (!Array.isArray(c) || c.length === 0) return
      if (typeof c[0] === 'number') return
      if (Array.isArray(c[0]) && typeof c[0][0] === 'number') {
        const clean = c.filter((p) => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]))
        if (clean.length >= 2) strings.push(clean)
        return
      }
      c.forEach(collect)
    }
    if (/LineString/.test(route.geometry.type)) collect(route.geometry.coordinates)
    const list = stringsByLine.get(line) ?? stringsByLine.set(line, []).get(line)
    list.push(...strings)
  }
  const indexes = new Map()
  const indexFor = (line) => {
    if (!indexes.has(line)) {
      const strings = stringsByLine.get(line)
      indexes.set(line, strings?.length ? buildTrackIndex(strings, project) : null)
    }
    return indexes.get(line)
  }

  // Which features the game merges into one station today (before snapping).
  const nameKeys = (feature) => {
    const props = feature.properties || {}
    const keys = new Set()
    for (const value of [props.name, ...(Array.isArray(props.alternate_names) ? props.alternate_names : [])]) {
      if (typeof value !== 'string') continue
      const v = value.trim().toLowerCase()
      if (!v) continue
      keys.add(v)
      const bare = v.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
      if (bare) keys.add(bare)
    }
    return keys
  }
  const before = features.features.map((f) => [...f.geometry.coordinates])
  const parent = features.features.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const buckets = new Map()
  features.features.forEach((f, i) => {
    const [x, y] = before[i]
    const key = `${Math.floor(x / COMPLEX_THRESHOLD)},${Math.floor(y / COMPLEX_THRESHOLD)}`
    ;(buckets.get(key) ?? buckets.set(key, []).get(key)).push(i)
  })
  const keysCache = new Map()
  const keysOf = (i) => keysCache.get(i) ?? keysCache.set(i, nameKeys(features.features[i])).get(i)
  features.features.forEach((f, i) => {
    const [x, y] = before[i]
    const bx = Math.floor(x / COMPLEX_THRESHOLD)
    const by = Math.floor(y / COMPLEX_THRESHOLD)
    for (let dx = -1; dx <= 1; dx += 1)
      for (let dy = -1; dy <= 1; dy += 1)
        for (const j of buckets.get(`${bx + dx},${by + dy}`) || []) {
          if (j <= i) continue
          if (Math.hypot(before[j][0] - x, before[j][1] - y) > COMPLEX_THRESHOLD) continue
          const a = keysOf(i)
          if ([...keysOf(j)].some((k) => a.has(k))) parent[find(j)] = find(i)
        }
  })

  const originalPoint = new Map(features.features.map((f) => [f, [...f.geometry.coordinates]]))
  const byLine = new Map()
  for (const f of features.features) {
    const l = f.properties?.line
    ;(byLine.get(l) ?? byLine.set(l, []).get(l)).push(f)
  }
  const stationsOnLine = (l) => byLine.get(l) || []

  // Stations that were one station in the previous version of this data
  // (e.g. before a rebuild) stay one station.
  if (Array.isArray(previousFeatures)) {
    const indexById = new Map(features.features.map((f, i) => [f.id ?? f.properties?.id, i]))
    const prevGroups = new Map()
    for (const f of previousFeatures) {
      const k = f.properties?.cluster_key
      if (k === undefined || k === null || k === '') continue
      ;(prevGroups.get(k) ?? prevGroups.set(k, []).get(k)).push(f.id ?? f.properties?.id)
    }
    // plus groups the game formed by proximity in the previous data
    const prev = previousFeatures.map((f) => ({ id: f.id ?? f.properties?.id, c: f.geometry.coordinates, keys: nameKeys(f) }))
    for (let a = 0; a < prev.length; a += 1)
      for (let b = a + 1; b < prev.length; b += 1) {
        if (Math.hypot(prev[a].c[0] - prev[b].c[0], prev[a].c[1] - prev[b].c[1]) > COMPLEX_THRESHOLD) continue
        if (![...prev[b].keys].some((k) => prev[a].keys.has(k))) continue
        const ia = indexById.get(prev[a].id)
        const ib = indexById.get(prev[b].id)
        if (ia !== undefined && ib !== undefined) parent[find(ib)] = find(ia)
      }
    for (const ids of prevGroups.values()) {
      const idx = ids.map((id) => indexById.get(id)).filter((i) => i !== undefined)
      for (const i of idx.slice(1)) parent[find(i)] = find(idx[0])
    }
  }

  let changed = false
  for (const feature of features.features) {
    const line = feature.properties?.line
    const index = indexFor(line)
    if (!index) {
      result.noTrack.add(line)
      continue
    }
    const p = project(feature.geometry.coordinates)
    const hit = index.nearest(p, MAX_SNAP_M)
    const name = feature.properties.name
    if (!hit || hit.d > MAX_SNAP_M) {
      result.far.push({ name, line, d: hit ? Math.round(hit.d) : null })
      continue
    }
    if (hit.d <= ON_TRACK_M) continue
    const atEnd = (hit.t === 0 && hit.seg.first) || (hit.t === 1 && hit.seg.last)
    if (atEnd && hit.d > DEAD_END_M && index.isDeadEnd(hit.q)) {
      // The track stops short of this point. If this is the line's station
      // nearest that end, it's the terminus and the line's platform is at the
      // end of the track (the point usually belongs to another line's
      // platform at an interchange): snap. If another station of the line is
      // nearer the end, track is missing between them: leave it and report.
      const nearestOther = Math.min(
        ...stationsOnLine(line)
          .filter((other) => other !== feature)
          .map((other) => {
            const q = project(originalPoint.get(other))
            return Math.hypot(q[0] - hit.q[0], q[1] - hit.q[1])
          }),
      )
      if (!(hit.d < nearestOther)) {
        result.gaps.push({ name, line, d: Math.round(hit.d) })
        continue
      }
      result.termini = (result.termini || 0) + 1
    }
    const next = unproject(hit.q)
    if (samePoint(next, feature.geometry.coordinates)) continue
    result.moved.push({ name, line, d: Math.round(hit.d), from: feature.geometry.coordinates, to: next })
    feature.geometry.coordinates = next
    changed = true
  }

  // Keep merged stations merged once their points are on separate tracks.
  const groups = new Map()
  features.features.forEach((f, i) => {
    const root = find(i)
    ;(groups.get(root) ?? groups.set(root, []).get(root)).push(i)
  })
  for (const members of groups.values()) {
    if (members.length < 2) continue
    let spread = 0
    for (const i of members)
      for (const j of members) {
        const a = features.features[i].geometry.coordinates
        const b = features.features[j].geometry.coordinates
        spread = Math.max(spread, Math.hypot(a[0] - b[0], a[1] - b[1]))
      }
    if (spread <= COMPLEX_THRESHOLD * 0.95) continue
    const existing = members
      .map((i) => features.features[i].properties.cluster_key)
      .find((k) => k !== undefined && k !== null && k !== '')
    const ids = members.map((i) => features.features[i].id ?? features.features[i].properties.id ?? i)
    const key = existing ?? `stn-${Math.min(...ids.filter((v) => typeof v === 'number'), Number.MAX_SAFE_INTEGER)}-${members.length}`
    for (const i of members) {
      const props = features.features[i].properties
      if (props.cluster_key === undefined || props.cluster_key === null || props.cluster_key === '') {
        props.cluster_key = key
        changed = true
        result.clustered = (result.clustered || 0) + 1
      }
    }
  }

  // Carry existing cluster keys over unchanged (stable output across rebuilds).
  if (Array.isArray(previousFeatures)) {
    const prevKey = new Map(previousFeatures.map((f) => [f.id ?? f.properties?.id, f.properties?.cluster_key]))
    for (const f of features.features) {
      const k = prevKey.get(f.id ?? f.properties?.id)
      if (k !== undefined && k !== null && k !== '' && f.properties.cluster_key !== k) {
        const members = features.features.filter((g) => prevKey.get(g.id ?? g.properties?.id) === k)
        if (members.length > 1) {
          f.properties.cluster_key = k
          changed = true
        }
      }
    }
  }

  if (write && changed) {
    const format = detectFormat(rawFeatures, JSON.parse(rawFeatures))
    if (!format) {
      // e.g. PowerShell ConvertTo-Json's indentation: rewrite as standard JSON
      result.skipped = 'reformatted as standard 2-space JSON'
    }
    fs.writeFileSync(featuresPath, serialize(features, format || { indent: 2, ending: '\n' }))
  }
  return result
}

const main = () => {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const showGaps = args.includes('--gaps')
  const filter = args.find((a) => !a.startsWith('--'))
  const dirs = findDataDirs(GAME_ROOT).filter((d) => !filter || d.split(path.sep).join('/').includes(filter))

  let moved = 0
  let gaps = 0
  let far = 0
  const rows = []
  for (const dir of dirs) {
    const r = snapCity(dir, { write })
    moved += r.moved.length
    gaps += r.gaps.length
    far += r.far.length
    if (r.moved.length || r.gaps.length || r.far.length || r.skipped) rows.push(r)
  }
  const quiet = args.includes('--quiet')
  if (quiet && moved === 0) return
  for (const r of rows) {
    if (quiet && r.moved.length === 0) continue
    const bits = [`${r.moved.length} moved`]
    if (r.termini) bits.push(`${r.termini} termini moved to the end of their track`)
    if (r.clustered) bits.push(`${r.clustered} kept as one station`)
    if (r.gaps.length) bits.push(`${r.gaps.length} at track gaps`)
    if (r.far.length) bits.push(`${r.far.length} too far from track`)
    if (r.skipped) bits.push(r.skipped)
    console.log(`${r.city}: ${bits.join(', ')}`)
    if (showGaps) {
      for (const g of r.gaps) console.log(`    gap: ${g.name} (${g.line}) - track ends ${g.d} m away`)
      for (const f of r.far)
        console.log(`    far: ${f.name} (${f.line}) - ${f.d === null ? 'no track nearby' : `nearest track ${f.d} m away`}`)
    }
  }
  console.log(
    `\n${write ? 'Snapped' : 'Would snap'} ${moved} station point(s) onto their tracks in ${dirs.length} cities.` +
      (gaps ? ` ${gaps} left in place at track gaps (run with --gaps to list).` : '') +
      (far ? ` ${far} have no track within ${MAX_SNAP_M} m.` : ''),
  )
}

if (require.main === module) main()

module.exports = { snapCity }
