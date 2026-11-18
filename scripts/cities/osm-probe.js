#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * OpenStreetMap probe: dumps a compact snapshot of the rail network in an area,
 * including lines that are under construction or proposed, so city data can be
 * checked and extended offline.
 *
 * Request files live in data-sources/probes/requests/<slug>.json
 * (add "routeGeometry": true to also keep each operating route's track):
 *   { "slug": "gba", "bbox": [south, west, north, east] }
 *
 * Output (one file per request, written to --out, default data-sources/probes/out):
 *   {
 *     slug, bbox, fetchedAt,
 *     relations: [{ id, tags, stops: [{ name, lon, lat, role }] }],
 *     stations:  [{ id, lon, lat, state, tags }],   // operating, construction and proposed
 *     works:     [{ key, state, tags, lines: [[[lon,lat],...]] }]  // construction/proposed track
 *   }
 *
 * Runs in the "OSM Probe" Action (Overpass is not reachable from the dev
 * workspace); results are pushed to the `osm-probes` branch.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const REQ_DIR = path.join(ROOT, 'data-sources', 'probes', 'requests')
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const RAIL = 'subway|light_rail|train|tram|monorail|railway'

function query([s, w, n, e], { routeGeometry = false } = {}) {
  return `[out:json][timeout:900][maxsize:536870912][bbox:${s},${w},${n},${e}];
(
  rel["type"="route"]["route"~"^(${RAIL})$"];
  rel["type"~"^(route|proposed|construction)$"]["state"~"proposed|construction|planned"];
  rel["construction:route"~"^(${RAIL})$"];
  rel["proposed:route"~"^(${RAIL})$"];
  rel["type"="route"]["route"~"^(construction|proposed)$"];
)->.r;
.r out body;
node(r.r)->.rn;
.rn out;
way(r.r)["public_transport"="platform"]->.rp;
.rp out center;
(
  node["railway"~"^(station|halt|tram_stop)$"];
  node["railway"~"^(construction|proposed)$"]["construction"~"station|halt|stop"];
  node["railway"~"^(construction|proposed)$"]["proposed"~"station|halt|stop"];
  node["construction:railway"~"station|halt|stop"];
  node["proposed:railway"~"station|halt|stop"];
  node["public_transport"="station"];
  way["public_transport"="station"];
  way["railway"="station"];
  way["construction:railway"="station"];
  way["railway"="construction"]["construction"="station"];
)->.s;
.s out center;
(
  way["railway"~"^(construction|proposed)$"]["construction"!~"station|platform"]["proposed"!~"station|platform"];
  way["construction:railway"~"^(${RAIL}|rail)$"];
  way["proposed:railway"~"^(${RAIL}|rail)$"];
)->.w;
.w out geom;${
    routeGeometry
      ? `
(
  rel.r["route"~"^(subway|light_rail|tram|monorail)$"]["state"!~"proposed|construction|planned"];
  rel.r["route"="train"]["network"~"Suburban|Commuter|市郊|市域|S-Bahn",i];
)->.og;
way(r.og)["railway"]->.ow;
.ow out geom;`
      : ''
  }`
}

async function fetchOverpass(q) {
  let last = null
  for (let pass = 0; pass < 4; pass += 1) {
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(15 * 60 * 1000),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
              'MetroMemoryOsmProbe/1.0 (+https://github.com/kirklandwaterbot/metro-memory)',
          },
          body: `data=${encodeURIComponent(q)}`,
        })
        if (res.ok) {
          const json = await res.json()
          // Mirrors can lag days behind OSM; a stale answer would undo recent edits.
          const base = Date.parse(json?.osm3s?.timestamp_osm_base || '')
          const ageH = (Date.now() - base) / 3600000
          if (!Number.isFinite(ageH) || ageH < 48) return json
          console.error(
            `  ${endpoint}: data is ${Math.round(ageH)} h old, trying another server`,
          )
          last = new Error(
            `${endpoint}: stale data (${Math.round(ageH)} h old)`,
          )
          continue
        }
        last = new Error(
          `${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`,
        )
      } catch (error) {
        last = error
      }
      await new Promise((r) => setTimeout(r, 30000 * (pass + 1)))
    }
  }
  throw last
}

const R = (v) => Math.round(v * 1e6) / 1e6

function simplify(pts, tolDeg) {
  if (pts.length < 3) return pts
  const [x0, y0] = pts[0]
  const [xn, yn] = pts[pts.length - 1]
  if (x0 === xn && y0 === yn) {
    // closed way (a loop line): split at the farthest point
    let far = 0
    let best = -1
    pts.forEach(([x, y], i) => {
      const d = (x - x0) ** 2 + (y - y0) ** 2
      if (d > best) {
        best = d
        far = i
      }
    })
    if (far > 0 && far < pts.length - 1)
      return simplify(pts.slice(0, far + 1), tolDeg)
        .slice(0, -1)
        .concat(simplify(pts.slice(far), tolDeg))
  }
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = pts[a]
    const [bx, by] = pts[b]
    const len = Math.hypot(bx - ax, by - ay) || 1e-12
    let best = 0
    let idx = -1
    for (let i = a + 1; i < b; i += 1) {
      const d =
        Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) /
        len
      if (d > best) {
        best = d
        idx = i
      }
    }
    if (best > tolDeg) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

function stateOf(t) {
  if (
    t.railway === 'construction' ||
    t['construction:railway'] ||
    t.construction === 'yes' ||
    t.state === 'construction'
  )
    return 'construction'
  if (
    t.railway === 'proposed' ||
    t['proposed:railway'] ||
    t.state === 'proposed' ||
    t.state === 'planned'
  )
    return 'proposed'
  return 'open'
}

function compact(osm, { routeGeometry: withRouteGeometry = false } = {}) {
  const routeWays = {}
  const nodes = new Map()
  const centers = new Map()
  const rels = []
  const stations = []
  const works = new Map()
  for (const el of osm.elements || []) {
    if (el.type === 'node') nodes.set(el.id, el)
    if (el.type === 'way' && el.center) centers.set(el.id, el)
    if (el.type === 'relation') rels.push(el)
  }
  for (const el of osm.elements || []) {
    const t = el.tags || {}
    const isStation =
      ['station', 'halt', 'tram_stop'].includes(t.railway) ||
      t.public_transport === 'station' ||
      /station|halt|stop/.test(t['construction:railway'] || '') ||
      /station|halt|stop/.test(t['proposed:railway'] || '') ||
      (['construction', 'proposed'].includes(t.railway) &&
        /station|halt|stop/.test(t.construction || t.proposed || ''))
    if (isStation && (t.name || t['name:en'])) {
      const lon = el.lon ?? el.center?.lon
      const lat = el.lat ?? el.center?.lat
      if (typeof lon === 'number')
        stations.push({
          id: `${el.type}/${el.id}`,
          lon: R(lon),
          lat: R(lat),
          state: stateOf(t),
          tags: t,
        })
    }
    if (el.type === 'way' && el.geometry && !isStation) {
      const state = stateOf(t)
      if (state === 'open') {
        if (withRouteGeometry && t.railway)
          routeWays[el.id] = simplify(
            el.geometry.map((p) => [R(p.lon), R(p.lat)]),
            0.00001,
          )
        continue
      }
      const key = [
        state,
        t.name || '',
        t['name:en'] || '',
        t.ref || '',
        t.line || '',
        t.construction || t.proposed || '',
      ].join(' | ')
      if (!works.has(key)) {
        const keepTags = {}
        for (const k of [
          'name',
          'name:en',
          'name:zh',
          'ref',
          'line',
          'construction',
          'proposed',
          'operator',
          'opening_date',
          'start_date',
          'usage',
          'service',
          'tunnel',
          'bridge',
        ])
          if (t[k]) keepTags[k] = t[k]
        works.set(key, { key, state, tags: keepTags, lines: [] })
      }
      works.get(key).lines.push(
        simplify(
          el.geometry.map((p) => [R(p.lon), R(p.lat)]),
          0.00005,
        ),
      )
    }
  }
  const relations = rels.map((r) => {
    const stops = []
    for (const m of r.members || []) {
      if (!/stop|platform/.test(m.role || '')) continue
      const el = m.type === 'node' ? nodes.get(m.ref) : centers.get(m.ref)
      if (!el) continue
      const lon = el.lon ?? el.center?.lon
      const lat = el.lat ?? el.center?.lat
      stops.push({
        name: el.tags?.name || null,
        nameEn: el.tags?.['name:en'] || null,
        lon: R(lon),
        lat: R(lat),
        role: m.role,
      })
    }
    return {
      id: r.id,
      tags: r.tags || {},
      stops,
      members: (r.members || []).length,
      ...(withRouteGeometry
        ? {
            ways: (r.members || [])
              .filter((m) => m.type === 'way' && routeWays[m.ref])
              .map((m) => m.ref),
          }
        : {}),
    }
  })
  return {
    relations,
    stations,
    works: [...works.values()],
    ...(withRouteGeometry ? { routeWays } : {}),
  }
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const m = a.match(/^--([^=]+)(?:=(.*))?$/)
      return m ? [m[1], m[2] ?? true] : [a, true]
    }),
  )
  const outDir = path.resolve(
    args.out || path.join(ROOT, 'data-sources', 'probes', 'out'),
  )
  fs.mkdirSync(outDir, { recursive: true })
  const files = fs.readdirSync(REQ_DIR).filter((f) => f.endsWith('.json'))
  const only = args.only ? String(args.only).split(',') : null
  for (const file of files) {
    const req = JSON.parse(fs.readFileSync(path.join(REQ_DIR, file), 'utf8'))
    if (only && !only.includes(req.slug)) continue
    const target = path.join(outDir, `${req.slug}.json`)
    if (!args.force && fs.existsSync(target)) {
      const prev = JSON.parse(fs.readFileSync(target, 'utf8'))
      if (
        JSON.stringify(prev.bbox) === JSON.stringify(req.bbox) &&
        prev.requestVersion === (req.version || 1)
      ) {
        console.log(`${req.slug}: up to date`)
        continue
      }
    }
    console.log(`${req.slug}: querying Overpass…`)
    // routeGeometry: also keep the track of every operating route, so a
    // city can be built from the snapshot (not just checked against it)
    const opts = { routeGeometry: Boolean(req.routeGeometry) }
    const osm = await fetchOverpass(query(req.bbox, opts))
    const out = {
      slug: req.slug,
      bbox: req.bbox,
      requestVersion: req.version || 1,
      fetchedAt: new Date().toISOString(),
      ...compact(osm, opts),
    }
    fs.writeFileSync(target, JSON.stringify(out))
    console.log(
      `${req.slug}: ${out.relations.length} relations, ${out.stations.length} stations, ${out.works.length} construction/proposed track groups`,
    )
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { compact, stateOf }
