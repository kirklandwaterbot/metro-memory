#!/usr/bin/env node
/**
 * Draws a line along its real right-of-way from OpenStreetMap.
 *
 * Reads route requests from data-sources/<city>/osm-routes.json, downloads every
 * railway way (active, under construction, disused, abandoned, razed) in a
 * corridor around the requested waypoints from the Overpass API, and routes the
 * line waypoint-to-waypoint along that track (Dijkstra). Ways whose name matches
 * the request's `preferName` are preferred; small gaps in OSM mapping are bridged
 * (and reported) so a missing 100 m of trail doesn't break the route.
 *
 *   node scripts/routes/osm-route.js --city=nyc                 # build missing routes
 *   node scripts/routes/osm-route.js --city=nyc --refresh       # rebuild all
 *   node scripts/routes/osm-route.js --city=nyc --fixture=f.json  # use a saved Overpass response
 *
 * Needs network access to Overpass (runs in GitHub Actions; see
 * .github/workflows/route-geometry.yml). Geometry © OpenStreetMap contributors (ODbL).
 */

const fs = require('fs')
const path = require('path')

const { ROOT, readJson, writeJsonLike, loadCityPathMap, GAME_ROOT } = require('../upcoming/lib/city')
const { haversine } = require('../upcoming/lib/geo')
const { MinHeap } = require('./lib/graph')

const OVERPASS =
  process.env.UPCOMING_OVERPASS_ENDPOINTS?.split(',')[0]?.trim() || 'https://overpass-api.de/api/interpreter'
const SNAP_M = 1500
const BRIDGE_M = 300
const BRIDGE_COST = 4
// When a leg has no connected path, join the closest points of the two sides
// if they are at most this far apart (e.g. a viaduct missing from OSM).
const LEG_BRIDGE_MAX_M = 2500
const SIMPLIFY_M = 2.5

/** Removes out-and-back stubs (A, B, A): the route touching a siding or stub track at a station. */
function dropSpikes(points) {
  const out = []
  for (const p of points) {
    out.push(p)
    while (out.length >= 3) {
      const [a, b, c] = out.slice(-3)
      const ab = haversine(a, b)
      const bc = haversine(b, c)
      if (ab > 0 && bc > 0 && haversine(a, c) < 0.25 * Math.min(ab, bc)) out.splice(out.length - 2, 1)
      else break
    }
  }
  return out
}

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

/** Waypoints: {coordinates} as given, or {station} looked up on the line. */
function resolveWaypoints(request, stations) {
  return request.waypoints.map((w) => {
    if (Array.isArray(w.coordinates)) return { name: w.name || 'waypoint', coordinates: w.coordinates }
    const s = stations.find((f) => f.properties?.line === request.line && f.properties?.name === w.station)
    if (!s) throw new Error(`${request.line}: station "${w.station}" not found`)
    return { name: w.station, coordinates: s.geometry.coordinates }
  })
}

function buildQuery(waypoints, bufferM) {
  const poly = waypoints.map((w) => `${w.coordinates[1].toFixed(5)},${w.coordinates[0].toFixed(5)}`).join(',')
  const area = `(around:${bufferM},${poly})`
  return `[out:json][timeout:240];
(
  way["railway"~"^(rail|light_rail|narrow_gauge|disused|abandoned|construction|razed|preserved|proposed)$"]${area};
  way["abandoned:railway"]${area};
  way["disused:railway"]${area};
  way["razed:railway"]${area};
  way["construction:railway"]${area};
  way["historic"="railway"]${area};
  way["railway:historic"]${area};
  way["old_railway_operator"]${area};
);
out body;
>;
out skel qt;`
}

async function fetchOverpass(query) {
  const endpoints = [
    OVERPASS,
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ]
  let last = null
  // Public Overpass servers are often at capacity: try each a few times,
  // waiting longer each round. A "runtime error" remark or an empty answer
  // counts as a failure, since a corridor around rail track is never empty.
  for (let pass = 0; pass < 4; pass += 1) {
    if (pass) await new Promise((r) => setTimeout(r, 20_000 * pass))
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MetroMemoryRouteBuilder/1.0 (+https://github.com/kirklandwaterbot/metro-memory)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(300_000),
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
        if (!(json.elements || []).length) {
          last = new Error(`${endpoint}: empty answer`)
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

/** Cost multiplier for a way: prefer real, named mainline track. */
function wayFactor(tags, preferName) {
  let f = 1
  const state = tags.railway
  const formerRailway = !state && (tags.historic === 'railway' || tags['railway:historic'] || tags.old_railway_operator)
  if (state === 'abandoned' || state === 'razed' || tags['abandoned:railway'] || tags['razed:railway'] || formerRailway) {
    f *= 1.15
  }
  if (state === 'proposed') f *= 1.6
  if (tags.service === 'yard' || tags.service === 'siding' || tags.service === 'spur') f *= 1.8
  if (tags.service === 'crossover') f *= 3
  const label = [tags.name, tags.old_name, tags['abandoned:name'], tags.description, tags.operator, tags.old_railway_operator]
    .filter(Boolean)
    .join(' ')
  if (preferName && new RegExp(preferName, 'i').test(label)) f *= 0.7
  return f
}

function buildGraph(osm, preferName) {
  const coords = new Map() // node id -> [lon, lat]
  for (const el of osm.elements || []) if (el.type === 'node') coords.set(el.id, [el.lon, el.lat])
  const adj = new Map()
  const deg = new Map()
  const add = (a, b, w, bridged = false) => {
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a).push([b, w, bridged])
    adj.get(b).push([a, w, bridged])
  }
  for (const el of osm.elements || []) {
    if (el.type !== 'way' || !Array.isArray(el.nodes)) continue
    const f = wayFactor(el.tags || {}, preferName)
    const nodes = el.nodes.filter((n) => coords.has(n))
    for (let i = 0; i < nodes.length - 1; i += 1) {
      add(nodes[i], nodes[i + 1], f * haversine(coords.get(nodes[i]), coords.get(nodes[i + 1])))
    }
    for (const end of [nodes[0], nodes[nodes.length - 1]]) deg.set(end, (deg.get(end) || 0) + 1)
  }

  // Bridge small mapping gaps from loose way ends to nearby track.
  const cell = (c) => `${Math.floor(c[0] / 0.003)},${Math.floor(c[1] / 0.003)}`
  const grid = new Map()
  for (const id of adj.keys()) {
    const k = cell(coords.get(id))
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(id)
  }
  for (const [id, d] of deg) {
    if (d !== 1 || (adj.get(id) || []).length > 1) continue
    const c = coords.get(id)
    const [cx, cy] = cell(c).split(',').map(Number)
    let best = null
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const other of grid.get(`${cx + dx},${cy + dy}`) || []) {
          if (other === id || adj.get(id).some(([n]) => n === other)) continue
          const dist = haversine(c, coords.get(other))
          if (dist > 5 && dist <= BRIDGE_M && (!best || dist < best.dist)) best = { other, dist }
        }
      }
    }
    if (best) add(id, best.other, best.dist * BRIDGE_COST, true)
  }
  return { coords, adj }
}

function snap(graph, point, preferNodes) {
  let best = null
  for (const [id, c] of graph.coords) {
    if (!graph.adj.has(id)) continue
    const d = haversine(point, c) * (preferNodes?.has(id) ? 0.6 : 1)
    if (d <= SNAP_M && (!best || d < best.d)) best = { id, d }
  }
  return best?.id ?? null
}

function shortest(graph, from, to) {
  const dist = new Map([[from, 0]])
  const prev = new Map()
  const heap = new MinHeap()
  heap.push(0, from)
  while (heap.size) {
    const [d, u] = heap.pop()
    if (d > dist.get(u)) continue
    if (u === to) break
    for (const [v, w, bridged] of graph.adj.get(u) || []) {
      const nd = d + w
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd)
        prev.set(v, [u, bridged])
        heap.push(nd, v)
      }
    }
  }
  if (!dist.has(to)) return null
  const nodes = [to]
  let bridgedM = 0
  for (let v = to; prev.has(v); ) {
    const [u, bridged] = prev.get(v)
    if (bridged) bridgedM += haversine(graph.coords.get(u), graph.coords.get(v))
    nodes.push(u)
    v = u
  }
  nodes.reverse()
  return { coords: nodes.map((n) => graph.coords.get(n)), bridgedM }
}

/** Every node reachable from `start`. */
function reachable(graph, start) {
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    const u = stack.pop()
    for (const [v] of graph.adj.get(u) || []) {
      if (!seen.has(v)) {
        seen.add(v)
        stack.push(v)
      }
    }
  }
  return seen
}

/**
 * Closest pair of nodes between the part of the network reachable from `a` and
 * the part reachable from `b`, searching near the a–b corridor.
 */
function closestBetween(graph, a, b) {
  const fromA = reachable(graph, a)
  if (fromA.has(b)) return null
  const fromB = reachable(graph, b)
  const cell = (c) => `${Math.floor(c[0] / 0.01)},${Math.floor(c[1] / 0.01)}`
  const grid = new Map()
  for (const id of fromB) {
    const k = cell(graph.coords.get(id))
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(id)
  }
  let best = null
  for (const id of fromA) {
    const c = graph.coords.get(id)
    const [cx, cy] = cell(c).split(',').map(Number)
    for (let dx = -3; dx <= 3; dx += 1) {
      for (let dy = -3; dy <= 3; dy += 1) {
        for (const other of grid.get(`${cx + dx},${cy + dy}`) || []) {
          const d = haversine(c, graph.coords.get(other))
          if (!best || d < best.d) best = { from: id, to: other, d }
        }
      }
    }
  }
  return best
}

/** Douglas-Peucker simplification in metres. */
function simplify(points, tol) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  const k = Math.cos((points[0][1] * Math.PI) / 180) * 111320
  const xy = points.map(([lon, lat]) => [lon * k, lat * 111320])
  while (stack.length) {
    const [a, b] = stack.pop()
    let maxD = 0
    let idx = -1
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    for (let i = a + 1; i < b; i += 1) {
      const d = Math.abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) / len
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.city) throw new Error('--city is required')
  const requestsPath = path.join(ROOT, 'data-sources', args.city, 'osm-routes.json')
  const requests = readJson(requestsPath)?.routes || []
  if (!requests.length) {
    console.log(`No OSM route requests in ${path.relative(ROOT, requestsPath)}`)
    return
  }
  const dir = resolveDataDir(args.city)
  const routesPath = path.join(dir, 'routes.json')
  const routes = readJson(routesPath)
  const stations = readJson(path.join(dir, 'features.json'))?.features || []
  const report = []
  let changed = false

  for (const request of requests) {
    // A line can be built in several parts (e.g. branches), told apart by
    // `part`; each part replaces only its own earlier build.
    const part = request.part || null
    const label = part ? `${request.line} (${part})` : request.line
    const samePart = (f) =>
      f.properties?.line === request.line &&
      f.properties?.osm_route &&
      (f.properties.osm_route.part || null) === part
    const done = routes.features.some(samePart)
    if (done && !args.refresh) {
      report.push(`- ${label}: already built from OSM (use --refresh to rebuild)`)
      continue
    }
    const waypoints = resolveWaypoints(request, stations)
    let osm
    if (args.fixture) {
      osm = readJson(args.fixture)
    } else {
      // One query per leg: a single corridor around a long, busy route (the
      // Northeast Corridor through New York) times out on Overpass.
      const seen = new Set()
      osm = { elements: [] }
      const remarks = []
      let fetchError = null
      for (let i = 0; i < waypoints.length - 1 && !fetchError; i += 1) {
        let res
        try {
          res = await fetchOverpass(buildQuery(waypoints.slice(i, i + 2), request.bufferM || 5000))
        } catch (error) {
          fetchError = `${waypoints[i].name} → ${waypoints[i + 1].name}: ${error.message}`
          break
        }
        if (res.remark) remarks.push(res.remark)
        for (const el of res.elements || []) {
          const key = `${el.type}/${el.id}`
          if (seen.has(key)) continue
          seen.add(key)
          osm.elements.push(el)
        }
      }
      if (fetchError) {
        report.push(`- ⚠️ ${label}: Overpass unavailable (${fetchError.slice(0, 200)}) — not changed`)
        continue
      }
      if (remarks.length) report.push(`- ℹ️ ${label}: Overpass said: ${remarks.join(' | ').slice(0, 300)}`)
      const ways = osm.elements.filter((e) => e.type === 'way').length
      const nodes = osm.elements.filter((e) => e.type === 'node').length
      report.push(`- ℹ️ ${label}: ${ways} OSM ways, ${nodes} nodes in the corridor`)
    }
    const graph = buildGraph(osm, request.preferName)

    const preferNodes = new Set()
    for (const el of osm.elements || []) {
      if (el.type === 'way' && wayFactor(el.tags || {}, request.preferName) < 0.9) {
        for (const n of el.nodes || []) preferNodes.add(n)
      }
    }

    const snapped = waypoints.map((w) => ({ ...w, node: snap(graph, w.coordinates, preferNodes) }))
    const missing = snapped.filter((w) => w.node === null)
    if (missing.length) {
      report.push(`- ⚠️ ${label}: no OSM track within ${SNAP_M} m of ${missing.map((w) => w.name).join(', ')} — not changed`)
      continue
    }

    let line = []
    let bridgedM = 0
    const legs = []
    let failed = null
    for (let i = 0; i < snapped.length - 1; i += 1) {
      const a = snapped[i]
      const b = snapped[i + 1]
      let leg = shortest(graph, a.node, b.node)
      const legBridges = []
      // Join up to three missing links (e.g. a viaduct OSM doesn't connect).
      for (let tries = 0; !leg && tries < 3; tries += 1) {
        const gap = closestBetween(graph, a.node, b.node)
        if (!gap || gap.d > LEG_BRIDGE_MAX_M) break
        const w = gap.d * BRIDGE_COST
        graph.adj.get(gap.from).push([gap.to, w, true])
        graph.adj.get(gap.to).push([gap.from, w, true])
        const at = graph.coords.get(gap.from)
        legBridges.push(`${Math.round(gap.d)} m unconnected in OSM near ${at[1].toFixed(4)}, ${at[0].toFixed(4)}`)
        leg = shortest(graph, a.node, b.node)
      }
      if (!leg) {
        const gap = closestBetween(graph, a.node, b.node)
        failed = `${a.name} → ${b.name}: no connected OSM track${
          gap ? ` (closest the two sides get: ${Math.round(gap.d)} m near ${graph.coords.get(gap.from)[1].toFixed(4)}, ${graph.coords.get(gap.from)[0].toFixed(4)})` : ''
        }`
        break
      }
      for (const note of legBridges) legs.push(`  bridged: ${note}`)
      bridgedM += leg.bridgedM
      const chord = haversine(a.coordinates, b.coordinates)
      const len = lengthM(leg.coords)
      legs.push(`${a.name} → ${b.name}: ${(len / 1000).toFixed(1)} km (chord ${(chord / 1000).toFixed(1)} km)${leg.bridgedM ? `, ${Math.round(leg.bridgedM)} m bridged` : ''}`)
      if (len > chord * 2.5 + 2000) failed = `${a.name} → ${b.name} takes a ${(len / 1000).toFixed(1)} km detour`
      line = line.length ? line.concat(leg.coords.slice(1)) : leg.coords
    }
    if (failed) {
      report.push(`- ⚠️ ${label}: ${failed} — not changed`)
      continue
    }

    const simplified = simplify(dropSpikes(line), SIMPLIFY_M).map(([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6])
    // Name and colour from the line's other drawn track, or from lines.json.
    const previous = routes.features.filter((f) => f.properties?.line === request.line && !f.properties?.future)
    const lineMeta = readJson(path.join(dir, 'lines.json'))?.[request.line]
    const base = previous[0]?.properties || {
      line: request.line,
      ...(lineMeta ? { name: lineMeta.name, color: lineMeta.color, order: lineMeta.order } : {}),
    }
    const kept = request.replace
      ? routes.features.filter((f) => f.properties?.line !== request.line)
      : routes.features.filter((f) => !samePart(f))
    kept.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: simplified },
      properties: {
        ...Object.fromEntries(Object.entries(base).filter(([k]) => !['auto_filled', 'osm_route', 'future'].includes(k))),
        ...(request.properties || {}),
        line: request.line,
        osm_route: {
          ...(part ? { part } : {}),
          source: '© OpenStreetMap contributors (ODbL), via Overpass',
          built: new Date().toISOString().slice(0, 10),
          from: waypoints[0].name,
          to: waypoints[waypoints.length - 1].name,
          bridged_m: Math.round(bridgedM),
        },
      },
    })
    routes.features = kept
    changed = true
    report.push(
      `- ✅ ${label}: ${(lengthM(simplified) / 1000).toFixed(1)} km along OSM track, ${simplified.length} points, ${Math.round(bridgedM)} m of mapping gaps bridged`,
    )
    for (const l of legs) report.push(`  - ${l}`)
  }

  if (changed && !args['dry-run']) writeJsonLike(routesPath, routes)
  const text = `# OSM route geometry — ${args.city}\n\n${report.join('\n')}\n`
  if (typeof args.report === 'string') fs.writeFileSync(args.report, text)
  console.log(text)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
