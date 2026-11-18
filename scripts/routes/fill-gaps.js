#!/usr/bin/env node
/**
 * Finds and fills missing route LineStrings.
 *
 * A gap is (a) a station further than 120 m from its own line's drawn route, or
 * (b) a line whose route is split into disconnected pieces. Gaps are filled by
 * the shortest path along track that is already drawn for another line of the
 * same family (e.g. the C along the A's 8 Av track), or along an extra reference
 * geometry file. Nothing is drawn as a straight line: if the only path is a big
 * detour, or there is no track nearby, the gap is reported instead.
 *
 *   node scripts/routes/fill-gaps.js --city=nyc --check     # report gaps only
 *   node scripts/routes/fill-gaps.js --city=nyc             # fill + report
 *   node scripts/routes/fill-gaps.js --city=nyc --lines=NewYorkSubwayC,NewYorkSubwayW
 *   node scripts/routes/fill-gaps.js --city=nyc --extra=commuter:path/to/shapes.geojson
 *
 * Filled geometry is added as one extra feature per line with
 * "auto_filled": "route-gaps". Re-running replaces those features, so it's safe
 * to run again after you add or fix strings by hand.
 */

const fs = require('fs')
const path = require('path')

const { loadCityPathMap, writeJsonLike, readJson, GAME_ROOT, ROOT } = require('../upcoming/lib/city')
const { haversine, nearestOnRoutes } = require('../upcoming/lib/geo')
const { MinHeap, buildGraph, lineStringsOf } = require('./lib/graph')
const { familyResolver, referencesFor } = require('./families')

const OFF_ROUTE_M = 120
const ATTACH_M = 250
const COVERAGE_STEP_M = 400
const COVERAGE_OFF_M = 200
// If most of a reference route is away from the drawn line, it's not this
// line's route (e.g. a shared GTFS route id) — skip coverage for it.
const COVERAGE_MAX_MISMATCH = 0.4
const AUTO_TAG = 'route-gaps'

/**
 * Removes out-and-back stubs (A, B, A) and points where the path doubles back
 * on itself within a few metres; both draw as spikes.
 */
function dropSpikes(points) {
  const out = []
  for (const p of points) {
    out.push(p)
    while (out.length >= 3) {
      const [a, b, c] = out.slice(-3)
      const ab = haversine(a, b)
      const bc = haversine(b, c)
      const ac = haversine(a, c)
      // b is a turnaround: going to it and back covers far more than a -> c,
      // or the path overshoots a junction and steps back a few metres onto
      // the parallel track (a short Z that draws as a spur).
      const shortReversal = Math.min(ab, bc) <= 100 && ac < Math.max(ab, bc) - 0.9 * Math.min(ab, bc)
      if (ab > 0 && bc > 0 && (ac < 0.25 * Math.min(ab, bc) || shortReversal)) {
        out.splice(out.length - 2, 1)
      } else break
    }
  }
  return out
}

function parseArgs(argv) {
  const args = { extra: [] }
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (!m) continue
    if (m[1] === 'extra') args.extra.push(m[2])
    else args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

/** data/ or data/full/, whichever holds routes.json (NYC uses full/). */
function resolveDataDir(slug) {
  const rel = loadCityPathMap()[slug]
  if (!rel) throw new Error(`unknown city "${slug}"`)
  const base = path.join(GAME_ROOT, rel, 'data')
  for (const dir of [base, path.join(base, 'full')]) {
    if (fs.existsSync(path.join(dir, 'routes.json')) && fs.existsSync(path.join(dir, 'features.json'))) {
      return dir
    }
  }
  throw new Error(`no routes.json + features.json under ${base}`)
}

function analyseLine(line, strings, stations) {
  const routeFeatures = strings.map((coordinates) => ({ geometry: { type: 'LineString', coordinates } }))
  const offRoute = []
  for (const s of stations) {
    const c = s.geometry.coordinates
    const near = routeFeatures.length ? nearestOnRoutes(c, routeFeatures) : null
    const d = near ? near.distance : Infinity
    if (d > OFF_ROUTE_M) offRoute.push({ name: s.properties.name, coordinates: c, distance: d })
  }
  return { line, offRoute }
}

/** Connected pieces of a line's own strings within the family graph. */
function ownComponents(graph, ownNodeLists) {
  const own = new Set(ownNodeLists.flat())
  const seen = new Set()
  const comps = []
  for (const start of own) {
    if (seen.has(start)) continue
    const comp = []
    const stack = [start]
    seen.add(start)
    while (stack.length) {
      const u = stack.pop()
      comp.push(u)
      for (const [v] of graph.adj[u]) {
        if (own.has(v) && !seen.has(v)) {
          seen.add(v)
          stack.push(v)
        }
      }
    }
    comps.push(comp)
  }
  return comps.sort((a, b) => b.length - a.length)
}

/**
 * Is a path along drawn track a believable stand-in for the missing string?
 * Station gaps are short and allow some curvature. Joining two pieces you drew
 * separately over a long distance is held to a near-direct path: a long missing
 * link usually means the real track (e.g. an unbuilt branch) isn't drawn at all,
 * and borrowing a far-off line would draw the wrong route.
 */
function acceptable(length, straight, kind) {
  if (kind === 'piece' && straight > 1500) return length <= 1.25 * straight
  return length <= Math.max(1.6 * straight + 400, straight + 800)
}

/** Short path along track between two nodes (bounded), or null. */
function localPath(graph, from, to, maxLen = 800, { sameLine = false } = {}) {
  if (from === to) return [from]
  // sameLine: only move along track that shares a line with the start point.
  const startLines = sameLine ? graph.nodeLines?.get(from) : null
  const onLine = (v) => {
    if (!startLines || !startLines.size) return true
    const lines = graph.nodeLines.get(v)
    return !lines || [...lines].some((l) => startLines.has(l))
  }
  const dist = new Map([[from, 0]])
  const prev = new Map()
  const heap = new MinHeap()
  heap.push(0, from)
  while (heap.size) {
    const [d, u] = heap.pop()
    if (d > (dist.get(u) ?? Infinity)) continue
    if (u === to) {
      const out = []
      for (let v = to; v !== undefined; v = prev.get(v)) out.push(v)
      return out.reverse()
    }
    for (const [v, w] of graph.adj[u]) {
      const nd = d + w
      if (nd <= maxLen && nd < (dist.get(v) ?? Infinity) && onLine(v)) {
        dist.set(v, nd)
        prev.set(v, u)
        heap.push(nd, v)
      }
    }
  }
  return null
}

/**
 * Multi-source Dijkstra growth over the family graph: starting from `tree`,
 * repeatedly connect the nearest unreached target along drawn track.
 */
function grow(graph, treeNodes, targets, pieceOf = new Map()) {
  const n = graph.coords.length
  const dist = new Float64Array(n).fill(Infinity)
  const prev = new Int32Array(n).fill(-1)
  const heap = new MinHeap()
  const targetsAt = new Map()
  const added = []
  const unresolved = []
  const inTree = new Set()

  const addTree = (nodes) => {
    for (const u of nodes) {
      inTree.add(u)
      if (dist[u] !== 0) {
        dist[u] = 0
        prev[u] = -1
        heap.push(0, u)
      }
    }
  }

  for (const t of targets) {
    if (t.reached) continue
    const attachNodes = t.kind === 'piece' ? t.nodes : t.attach
    for (const node of attachNodes) {
      if (!targetsAt.has(node)) targetsAt.set(node, [])
      targetsAt.get(node).push(t)
    }
  }
  addTree(treeNodes)

  while (heap.size) {
    const [d, u] = heap.pop()
    if (d > dist[u]) continue

    const here = (targetsAt.get(u) || []).filter((t) => !t.reached)
    if (here.length) {
      const pathNodes = []
      for (let v = u; v !== -1; v = prev[v]) pathNodes.push(v)
      pathNodes.reverse()
      // Judge detours on the drawn length, not the search cost (which includes
      // penalties for hopping between strings).
      let len = 0
      for (let i = 1; i < pathNodes.length; i += 1) {
        len += haversine(graph.coords[pathNodes[i - 1]], graph.coords[pathNodes[i]])
      }
      let joined = false
      for (const t of here) {
        t.reached = true
        // For a piece, measure to the point actually reached, not an arbitrary
        // node of the piece.
        const straight = haversine(
          graph.coords[pathNodes[0]],
          t.kind === 'piece' ? graph.coords[u] : t.coordinates,
        )
        // A closer, *separate* piece of this line means the target belongs with
        // that piece; reaching it from a far piece via other lines' track
        // would draw the wrong route (e.g. the M via Liberty Av to Rockaway).
        const startPiece = pieceOf.get(pathNodes[0])
        let closest = null
        for (const [v, piece] of pieceOf) {
          const dd = haversine(graph.coords[v], t.coordinates)
          if (!closest || dd < closest.d) closest = { d: dd, piece }
        }
        if (
          pathNodes.length > 1 &&
          closest &&
          startPiece !== undefined &&
          closest.piece !== startPiece &&
          !acceptable(len, closest.d, t.kind)
        ) {
          unresolved.push({
            name: t.name,
            reason: `nearest part of this line (${Math.round(closest.d)} m away) isn't joined to it by drawn track`,
          })
          continue
        }
        if (pathNodes.length > 1 && !acceptable(len, straight, t.kind)) {
          unresolved.push({
            name: t.name,
            reason: `only path along drawn track is a ${Math.round(len)} m detour for a ${Math.round(straight)} m gap`,
          })
          continue
        }
        joined = true
        if (t.kind === 'piece') addTree(t.nodes)
      }
      if (joined) {
        // A station counts as reached at any track point within 250 m; carry
        // the path on to the point nearest the station so no stub is left.
        const station = here.find((t) => t.kind !== 'piece' && t.attach?.length)
        if (station && station.attach[0] !== u) {
          // Along the same line's track only: hopping onto a neighbouring
          // line drew spurs at stations like Times Sq, while a short limit
          // left line ends short of their last station.
          const tail = localPath(graph, u, station.attach[0], 400, { sameLine: true })
          if (tail) pathNodes.push(...tail.slice(1))
        }
        if (pathNodes.length > 1) added.push(pathNodes.map((v) => graph.coords[v]))
        const piece = pieceOf.get(pathNodes[0])
        if (piece !== undefined) for (const v of pathNodes) if (!pieceOf.has(v)) pieceOf.set(v, piece)
        addTree(pathNodes)
        continue
      }
    }

    for (const [v, w] of graph.adj[u]) {
      const nd = d + w
      if (nd < dist[v]) {
        dist[v] = nd
        prev[v] = u
        heap.push(nd, v)
      }
    }
  }

  for (const t of targets) {
    if (!t.reached) {
      t.reached = true
      unresolved.push({ name: t.name, reason: 'not connected to this line by any drawn track' })
    }
  }
  return { added, unresolved, inTree }
}

function pointTarget(graph, kind, name, coordinates, unresolved) {
  // Every track point nearly as close as the nearest, so a station can be
  // reached on its own line's track rather than only on whichever line happens
  // to pass a few metres closer (e.g. the 42 St Shuttle at Times Sq).
  const found = graph.near(coordinates, ATTACH_M)
  const limit = found.length ? found[0][0] + 80 : 0
  const attach = found.filter(([d]) => d <= limit).slice(0, 60).map(([, node]) => node)
  const t = { kind, name, coordinates, attach, reached: false }
  if (!attach.length) {
    t.reached = true
    unresolved.push({ name, reason: `no drawn track within ${ATTACH_M} m` })
  }
  return t
}

/**
 * Two phases, so stations hang off the right piece:
 *  1. connect every off-route station (and official-route point) to the
 *     nearest of the line's own pieces;
 *  2. join any pieces that are still separate, under the strict piece rule.
 */
function fillLine({ graph, ownNodeLists, stations, offRoute, coverage = [] }) {
  const unresolved = []
  const added = []
  const ownNodes = ownNodeLists.flat()
  const offNames = new Set(offRoute.map((s) => s.name))
  const hasOwn = ownNodes.length > 0

  const stationTargets = (hasOwn ? stations.filter((s) => offNames.has(s.properties.name)) : stations).map(
    (s) => pointTarget(graph, 'station', s.properties.name, s.geometry.coordinates, unresolved),
  )
  const coverageTargets = coverage.map((p) => pointTarget(graph, 'coverage', p.name, p.coordinates, unresolved))
  const phase1Targets = [...stationTargets, ...coverageTargets]

  let seedNodes = ownNodes
  if (!hasOwn) {
    // Nothing drawn: seed from the station furthest from the line's centre.
    const live = stationTargets.filter((t) => !t.reached)
    if (!live.length) return { added, unresolved }
    const cx = live.reduce((sum, t) => sum + t.coordinates[0], 0) / live.length
    const cy = live.reduce((sum, t) => sum + t.coordinates[1], 0) / live.length
    const seed = live.reduce((a, b) =>
      haversine(a.coordinates, [cx, cy]) > haversine(b.coordinates, [cx, cy]) ? a : b,
    )
    seed.reached = true
    seedNodes = seed.attach.slice(0, 1)
  }

  const pieceOf = new Map()
  ownComponents(graph, ownNodeLists).forEach((comp, i) => comp.forEach((v) => pieceOf.set(v, i)))
  const p1 = grow(graph, seedNodes, phase1Targets, pieceOf)
  added.push(...p1.added)
  unresolved.push(...p1.unresolved)

  // Phase 2: pieces of (own + phase-1 paths) that are still separate.
  const drawn = [...ownNodeLists, ...p1.added.map((s) => s.map((c) => graph.keyToNode.get(`${c[0].toFixed(6)},${c[1].toFixed(6)}`)))]
  const comps = ownComponents(graph, drawn)
  if (comps.length > 1) {
    const pieceTargets = comps.slice(1).map((comp) => ({
      kind: 'piece',
      name: `disconnected piece (${comp.length} pts)`,
      nodes: comp,
      coordinates: graph.coords[comp[0]],
      reached: false,
    }))
    const p2 = grow(graph, comps[0], pieceTargets)
    added.push(...p2.added)
    unresolved.push(...p2.unresolved)
  }
  return { added, unresolved }
}

/** Points every ~400 m along a polyline. */
function samplePoints(strings, step) {
  const out = []
  for (const s of strings) {
    let carry = 0
    for (let i = 0; i < s.length - 1; i += 1) {
      const seg = haversine(s[i], s[i + 1])
      let at = carry === 0 && i === 0 ? 0 : step - carry
      while (at <= seg) {
        const t = seg ? at / seg : 0
        out.push([s[i][0] + (s[i + 1][0] - s[i][0]) * t, s[i][1] + (s[i + 1][1] - s[i][1]) * t])
        at += step
      }
      carry = (carry + seg) % step
    }
  }
  return out
}

/** Official-route points far from the drawn line, or null when the route doesn't fit. */
function coverageTargets(line, ownStrings, refStrings) {
  const own = ownStrings.map((coordinates) => ({ geometry: { type: 'LineString', coordinates } }))
  const samples = samplePoints(refStrings, COVERAGE_STEP_M)
  if (!samples.length) return { points: [], skipped: false }
  const off = samples.filter((p) => {
    const near = own.length ? nearestOnRoutes(p, own) : null
    return !near || near.distance > COVERAGE_OFF_M
  })
  if (own.length && off.length / samples.length > COVERAGE_MAX_MISMATCH) {
    return { points: [], skipped: true, mismatch: off.length / samples.length }
  }
  return {
    points: off.map((p) => ({
      name: `official route near ${p[1].toFixed(4)}, ${p[0].toFixed(4)}`,
      coordinates: p,
    })),
    skipped: false,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.city) {
    console.error('Usage: fill-gaps.js --city=<slug> [--check] [--lines=a,b] [--extra=family:file.geojson]')
    process.exit(1)
  }
  const slug = args.city
  const dir = resolveDataDir(slug)
  const routesPath = path.join(dir, 'routes.json')
  const routes = readJson(routesPath)
  const stationsFc = readJson(path.join(dir, 'features.json'))
  const lines = readJson(path.join(dir, 'lines.json')) || {}
  const familyOf = familyResolver(slug)

  // Filling rebuilds from hand-drawn strings only (so re-runs replace the old
  // fill); checking looks at everything that's drawn, fill included.
  const manual = args.check
    ? routes.features
    : routes.features.filter((f) => f?.properties?.auto_filled !== AUTO_TAG)
  const stringsByLine = new Map()
  const firstProps = new Map()
  for (const f of manual) {
    const line = f?.properties?.line
    if (!line) continue
    if (!stringsByLine.has(line)) stringsByLine.set(line, [])
    stringsByLine.get(line).push(...lineStringsOf(f.geometry))
    if (!firstProps.has(line)) firstProps.set(line, f.properties)
  }
  const stationsByLine = new Map()
  for (const s of stationsFc.features) {
    const line = s?.properties?.line
    if (!line || !Array.isArray(s?.geometry?.coordinates)) continue
    if (!stationsByLine.has(line)) stationsByLine.set(line, [])
    stationsByLine.get(line).push(s)
  }

  const refs = referencesFor(slug)
  const extraSpecs = [
    ...(args['no-references'] ? [] : refs.files.map((r) => `${r.family}:${path.join(ROOT, r.file)}`)),
    ...args.extra,
  ]
  const coverageRoutes = new Map()
  if (refs.coverage && !args['no-references']) {
    const fc = readJson(path.join(ROOT, refs.coverage.file))
    for (const f of fc?.features || []) {
      const key = f?.properties?.[refs.coverage.key]
      if (!key) continue
      if (!coverageRoutes.has(key)) coverageRoutes.set(key, [])
      coverageRoutes.get(key).push(...lineStringsOf(f.geometry))
    }
  }

  const extrasByFamily = new Map()
  for (const spec of extraSpecs) {
    const [family, file] = spec.split(/:(.+)/)
    const fc = readJson(file)
    if (!fc) throw new Error(`cannot read ${file}`)
    if (!extrasByFamily.has(family)) extrasByFamily.set(family, [])
    for (const f of fc.features || []) extrasByFamily.get(family).push(...lineStringsOf(f.geometry))
  }

  const wanted = args.lines ? new Set(String(args.lines).split(',')) : null
  const allLines = [...new Set([...stringsByLine.keys(), ...stationsByLine.keys()])]
    .filter((l) => !wanted || wanted.has(l))
    .sort()

  const before = allLines
    .map((l) => analyseLine(l, stringsByLine.get(l) || [], stationsByLine.get(l) || []))
    .filter((a) => a.offRoute.length)

  const graphCache = new Map()
  const familyGraph = (family) => {
    if (!graphCache.has(family)) {
      const strings = []
      const stringLines = []
      for (const [line, s] of stringsByLine) {
        if (familyOf(line) === family || (family.startsWith('own:') && `own:${line}` === family)) {
          strings.push(...s)
          stringLines.push(...s.map(() => line))
        }
      }
      graphCache.set(family, buildGraph(strings, extrasByFamily.get(family) || [], stringLines))
    }
    return graphCache.get(family)
  }

  const results = []
  for (const line of allLines) {
    const own = stringsByLine.get(line) || []
    const stations = stationsByLine.get(line) || []
    const { offRoute } = analyseLine(line, own, stations)
    const graph = familyGraph(familyOf(line))
    const ownNodeLists = own.map((s) => s.map((c) => graph.keyToNode.get(`${c[0].toFixed(6)},${c[1].toFixed(6)}`)))
    const pieces = ownComponents(graph, ownNodeLists).length
    const refKey = refs.coverage?.lines?.[line]
    const cov = refKey && coverageRoutes.has(refKey)
      ? coverageTargets(line, own, coverageRoutes.get(refKey))
      : { points: [], skipped: false }
    if (!offRoute.length && pieces <= 1 && !cov.points.length) continue
    if (args.check) {
      results.push({ line, offRoute, pieces, coverage: cov, added: [], unresolved: [] })
      continue
    }
    const { added, unresolved } = fillLine({ graph, ownNodeLists, stations, offRoute, coverage: cov.points })
    results.push({ line, offRoute, pieces, coverage: cov, added, unresolved })
  }

  // ---- report
  const out = []
  const km = (strings) =>
    strings.reduce((sum, s) => sum + s.slice(1).reduce((a, c, i) => a + haversine(s[i], c), 0), 0) / 1000
  out.push(`# Route gaps — ${slug}${args.check ? ' (check only)' : ''}`)
  out.push('')
  if (!results.length) out.push('No gaps: every station sits on its line and every line is one piece. ✅')
  for (const r of results) {
    const covNote = r.coverage?.points.length
      ? `, ${(r.coverage.points.length * COVERAGE_STEP_M / 1000).toFixed(1)} km of the official route not drawn`
      : ''
    const head = `- **${r.line}** — ${r.offRoute.length} station(s) off the drawn route, ${r.pieces} piece(s)${covNote}`
    if (args.check) {
      out.push(`${head}: ${r.offRoute.slice(0, 8).map((s) => s.name).join(', ')}${r.offRoute.length > 8 ? ', …' : ''}`)
      continue
    }
    out.push(`${head} → filled ${r.added.length} gap(s), ${km(r.added).toFixed(1)} km along existing track`)
    const covMissing = r.unresolved.filter((u) => u.name.startsWith('official route'))
    for (const u of r.unresolved.filter((x) => !x.name.startsWith('official route'))) {
      out.push(`  - ⚠️ ${u.name}: ${u.reason}`)
    }
    if (covMissing.length) {
      out.push(`  - ⚠️ ~${(covMissing.length * COVERAGE_STEP_M / 1000).toFixed(1)} km of the official route couldn't be traced (first: ${covMissing[0].name}; ${covMissing[0].reason})`)
    }
  }
  const report = out.join('\n')
  if (typeof args.report === 'string') fs.writeFileSync(args.report, `${report}\n`)
  console.log(report)

  if (args.check || args['dry-run']) {
    if (args.check && results.length) process.exitCode = 2
    return
  }

  // ---- write: replace previous auto-filled features
  const keep = routes.features.filter((f) => f?.properties?.auto_filled !== AUTO_TAG || (wanted && !wanted.has(f.properties.line)))
  for (const r of results) {
    if (!r.added.length) continue
    const meta = firstProps.get(r.line) || {
      line: r.line,
      name: lines[r.line]?.name || r.line,
      color: lines[r.line]?.color,
    }
    keep.push({
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: r.added
          .map((s) => dropSpikes(s.map(([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6])))
          .filter((s) => s.length >= 2),
      },
      properties: { ...meta, line: r.line, auto_filled: AUTO_TAG },
    })
  }
  routes.features = keep
  writeJsonLike(routesPath, routes)
  console.error(`\nWrote ${path.relative(process.cwd(), routesPath)}`)
}

main()
