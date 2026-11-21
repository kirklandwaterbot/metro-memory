#!/usr/bin/env node
/**
 * Fill gaps in a built city's route lines using the full rail network.
 *
 * OSM route relations often leave out track a service shares with another
 * line (e.g. China's Wuhan–Xi'an HSR runs on the Hanxiao intercity line
 * between Yunmeng and Wuhan), so the drawn line stops and restarts. This
 * joins the loose ends of each line along the shortest stretch of real track,
 * as long as that track is a sensible detour (not a long way round).
 *
 * Usage:
 *   node scripts/cities/fill-route-gaps.js <data dir> <overpass ways json>... \
 *     [--max-km 120] [--dry-run]
 *
 * The ways files are Overpass JSON with `out geom` ways (all rail in the area).
 */
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  if (i === -1) return fallback
  const v = args[i + 1]
  args.splice(i, 2)
  return v
}
const DRY_RUN = args.includes('--dry-run')
if (DRY_RUN) args.splice(args.indexOf('--dry-run'), 1)
const MAX_KM = Number(flag('--max-km', '120'))
const JOIN_M = Number(flag('--join-m', '400'))
const [dataDir, ...wayFiles] = args
if (!dataDir || !wayFiles.length) {
  console.error('usage: fill-route-gaps.js <data dir> <ways.json>... [--max-km N]')
  process.exit(1)
}

const R = 6371000
const rad = (d) => (d * Math.PI) / 180
const haversine = (a, b) => {
  const dLat = rad(b[1] - a[1])
  const dLon = rad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Douglas–Peucker in metres (equirectangular approximation is fine here)
const simplify = (pts, tolM) => {
  if (pts.length < 3) return pts
  const lat0 = rad(pts[0][1])
  const xy = pts.map((p) => [rad(p[0]) * Math.cos(lat0) * R, rad(p[1]) * R])
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let best = -1
    let bestD = tolM
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy || 1e-9
    for (let i = a + 1; i < b; i += 1) {
      const [px, py] = xy[i]
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
      const d = Math.hypot(px - ax - t * dx, py - ay - t * dy)
      if (d > bestD) {
        bestD = d
        best = i
      }
    }
    if (best !== -1) {
      keep[best] = 1
      stack.push([a, best], [best, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}
const round = (p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]

// ---- rail graph (node ids from OSM) ----
console.error('loading rail network…')
const nodeCoord = new Map()
const adj = new Map()
const addEdge = (a, b, d) => {
  if (!adj.has(a)) adj.set(a, [])
  if (!adj.has(b)) adj.set(b, [])
  adj.get(a).push(b, d)
  adj.get(b).push(a, d)
}
for (const file of wayFiles) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const el of data.elements || []) {
    if (el.type !== 'way' || !el.geometry || !el.nodes) continue
    const rw = el.tags?.railway
    if (rw && !/^(rail|light_rail|narrow_gauge|construction|subway|preserved)$/.test(rw)) continue
    if (el.tags?.service && /^(yard|spur|siding)$/.test(el.tags.service)) continue
    for (let i = 0; i < el.nodes.length; i += 1) {
      const g = el.geometry[i]
      if (g) nodeCoord.set(el.nodes[i], [g.lon, g.lat])
      if (i > 0 && g && el.geometry[i - 1]) {
        addEdge(
          el.nodes[i - 1],
          el.nodes[i],
          haversine([el.geometry[i - 1].lon, el.geometry[i - 1].lat], [g.lon, g.lat]),
        )
      }
    }
  }
}
// grid index of graph nodes for snapping
const CELL = 0.01
const cellOf = (p) => `${Math.floor(p[0] / CELL)},${Math.floor(p[1] / CELL)}`
const grid = new Map()
for (const [id, c] of nodeCoord) {
  if (!adj.has(id)) continue
  const k = cellOf(c)
  if (!grid.has(k)) grid.set(k, [])
  grid.get(k).push(id)
}
const nearestNodes = (p, maxM, limit = 6) => {
  const [cx, cy] = cellOf(p).split(',').map(Number)
  const r = Math.ceil(maxM / 900) + 1
  const hits = []
  for (let dx = -r; dx <= r; dx += 1)
    for (let dy = -r; dy <= r; dy += 1)
      for (const id of grid.get(`${cx + dx},${cy + dy}`) || []) {
        const d = haversine(p, nodeCoord.get(id))
        if (d <= maxM) hits.push([d, id])
      }
  hits.sort((a, b) => a[0] - b[0])
  return hits.slice(0, limit)
}
// Junctions are often mapped without a shared node (or through service
// track that isn't loaded): join every way end to the nearest track point of
// a different way within LINK_M metres.
const LINK_M = Number(flag('--link-m', '250'))
{
  const wayOf = new Map()
  const ends = []
  for (const file of wayFiles) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    for (const el of data.elements || []) {
      if (el.type !== 'way' || !el.nodes || el.nodes.length < 2) continue
      for (const n of el.nodes) if (!wayOf.has(n)) wayOf.set(n, el.id)
      ends.push([el.nodes[0], el.id], [el.nodes[el.nodes.length - 1], el.id])
    }
  }
  let links = 0
  for (const [n, wayId] of ends) {
    const c = nodeCoord.get(n)
    if (!c || !adj.has(n)) continue
    // already a junction?
    if ((adj.get(n).length / 2) > 1) continue
    const [cx, cy] = cellOf(c).split(',').map(Number)
    let best = null
    for (let dx = -1; dx <= 1; dx += 1)
      for (let dy = -1; dy <= 1; dy += 1)
        for (const id of grid.get(`${cx + dx},${cy + dy}`) || []) {
          if (id === n || wayOf.get(id) === wayId) continue
          const d = haversine(c, nodeCoord.get(id))
          if (d <= LINK_M && (!best || d < best[0])) best = [d, id]
        }
    if (best) {
      addEdge(n, best[1], best[0] + 50)
      links += 1
    }
  }
  console.error(`  joined ${links.toLocaleString()} loose track ends`)
}
console.error(`  ${adj.size.toLocaleString()} track nodes`)

// Dijkstra from several start nodes to several target nodes, with a cutoff
const shortestPath = (starts, targets, cutoff) => {
  const targetSet = new Map(targets.map(([d, id]) => [id, d]))
  const dist = new Map()
  const prev = new Map()
  const heap = []
  const push = (d, id) => {
    heap.push([d, id])
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i], heap[m]]
        i = m
      }
    }
    return top
  }
  for (const [d, id] of starts) {
    dist.set(id, d)
    push(d, id)
  }
  let best = null
  while (heap.length) {
    const [d, id] = pop()
    if (d > (dist.get(id) ?? Infinity)) continue
    if (d > cutoff || (best && d >= best.total)) break
    if (targetSet.has(id)) {
      const total = d + targetSet.get(id)
      if (!best || total < best.total) best = { total, id }
    }
    const list = adj.get(id) || []
    for (let i = 0; i < list.length; i += 2) {
      const n = list[i]
      const nd = d + list[i + 1]
      if (nd < (dist.get(n) ?? Infinity)) {
        dist.set(n, nd)
        prev.set(n, id)
        push(nd, n)
      }
    }
  }
  if (!best) return null
  const ids = [best.id]
  while (prev.has(ids[ids.length - 1])) ids.push(prev.get(ids[ids.length - 1]))
  return { length: best.total, coords: ids.reverse().map((id) => nodeCoord.get(id)) }
}

// ---- per-line gap filling ----
const routesPath = path.join(dataDir, 'routes.json')
const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))
let totalAdded = 0
let totalDropped = 0
const stationsByLine = new Map()
{
  const fc = JSON.parse(fs.readFileSync(path.join(dataDir, 'features.json'), 'utf8'))
  for (const f of fc.features) {
    const line = f.properties?.line
    if (!line || f.geometry?.type !== 'Point') continue
    if (!stationsByLine.has(line)) stationsByLine.set(line, [])
    stationsByLine.get(line).push(f.geometry.coordinates)
  }
}
let totalKm = 0

for (const feature of routes.features) {
  if (process.env.ONLY_LINE && feature.properties.line !== process.env.ONLY_LINE) continue
  const g = feature.geometry
  const pieces =
    g.type === 'MultiLineString' ? g.coordinates : g.type === 'LineString' ? [g.coordinates] : []
  if (pieces.length < 2) continue

  // union-find over pieces; pieces touch when an endpoint is near any vertex
  const parent = pieces.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (a, b) => {
    parent[find(a)] = find(b)
  }
  const vgrid = new Map()
  const vcell = (p) => `${Math.floor(p[0] / 0.005)},${Math.floor(p[1] / 0.005)}`
  pieces.forEach((piece, i) =>
    piece.forEach((p) => {
      const k = vcell(p)
      if (!vgrid.has(k)) vgrid.set(k, [])
      vgrid.get(k).push([i, p])
    }),
  )
  const touching = (p, self) => {
    const [cx, cy] = vcell(p).split(',').map(Number)
    const out = new Set()
    for (let dx = -1; dx <= 1; dx += 1)
      for (let dy = -1; dy <= 1; dy += 1)
        for (const [i, q] of vgrid.get(`${cx + dx},${cy + dy}`) || [])
          if (i !== self && haversine(p, q) <= JOIN_M) out.add(i)
    return out
  }
  // Every piece end is a possible place to continue from. (Double track makes
  // most ends sit right beside the other track, so "loose ends only" would
  // miss nearly every real gap.)
  const ends = []
  pieces.forEach((piece, i) => {
    for (const end of [piece[0], piece[piece.length - 1]]) {
      touching(end, i).forEach((j) => union(i, j))
      ends.push({ piece: i, p: end })
    }
  })

  // closest end pairs between each two different stretches of the line
  const byPair = new Map()
  for (let a = 0; a < ends.length; a += 1)
    for (let b = a + 1; b < ends.length; b += 1) {
      const ca = find(ends[a].piece)
      const cb = find(ends[b].piece)
      if (ca === cb) continue
      const d = haversine(ends[a].p, ends[b].p)
      if (d > MAX_KM * 1000) continue
      const key = ca < cb ? `${ca}|${cb}` : `${cb}|${ca}`
      const list = byPair.get(key) || []
      list.push([d, a, b])
      byPair.set(key, list)
    }
  const candidates = []
  for (const list of byPair.values()) {
    list.sort((x, y) => x[0] - y[0])
    candidates.push(...list.slice(0, 16))
  }
  candidates.sort((x, y) => x[0] - y[0])

  const added = []
  for (const [d, a, b] of candidates) {
    const A = ends[a]
    const B = ends[b]
    if (find(A.piece) === find(B.piece)) continue
    const starts = nearestNodes(A.p, 600)
    const targets = nearestNodes(B.p, 600)
    if (!starts.length || !targets.length) continue
    const maxLen = d * 1.6 + 3000
    const found = shortestPath(starts, targets, maxLen)
    if (process.env.DEBUG_LINE === feature.properties.line) {
      console.error(
        `    try ${A.p} -> ${B.p} straight ${(d / 1000).toFixed(1)}km:`,
        found ? `${(found.length / 1000).toFixed(1)}km` : 'no path',
      )
    }
    if (!found || found.length > maxLen) continue
    const coords = simplify([A.p, ...found.coords, B.p], 60).map(round)
    added.push(coords)
    union(A.piece, B.piece)
    totalKm += found.length / 1000
  }
  // Stretches still cut off from the rest of the line that have none of the
  // line's stations on them are stray mapping (a disconnected stub, track
  // still being built): drop them rather than draw a line that goes nowhere.
  const lineStations = stationsByLine.get(feature.properties.line) || []
  const comps = new Map()
  pieces.forEach((piece, i) => {
    const k = find(i)
    if (!comps.has(k)) comps.set(k, [])
    comps.get(k).push(i)
  })
  const hasStation = (ids) =>
    ids.some((i) =>
      pieces[i].some((p) => lineStations.some((st) => haversine(p, st) <= 1500)),
    )
  const dropped = new Set()
  if (comps.size > 1 && lineStations.length) {
    const withStations = [...comps.values()].filter(hasStation)
    if (withStations.length) {
      for (const ids of comps.values())
        if (!withStations.includes(ids)) ids.forEach((i) => dropped.add(i))
    }
  }
  if (dropped.size) {
    totalDropped += dropped.size
    console.error(`  ${feature.properties.line}: dropped ${dropped.size} stray piece(s) with no stations`)
  }
  if (added.length || dropped.size) {
    totalAdded += added.length
    feature.geometry = {
      type: 'MultiLineString',
      coordinates: [...pieces.filter((_, i) => !dropped.has(i)), ...added],
    }
    const parts = new Set(pieces.map((_, i) => i).filter((i) => !dropped.has(i)).map(find))
    console.error(
      `  ${feature.properties.line} ${feature.properties.name ?? ''}: +${added.length} gap(s), ${parts.size} piece(s) left`,
    )
  }
}

console.error(
  `filled ${totalAdded} gaps (${Math.round(totalKm)} km of track), dropped ${totalDropped} stray pieces`,
)
if (!DRY_RUN) {
  const original = fs.readFileSync(routesPath, 'utf8')
  const indent = /^\{\n  /.test(original) ? 2 : undefined
  fs.writeFileSync(routesPath, JSON.stringify(routes, null, indent) + (original.endsWith('\n') ? '\n' : ''))
}
