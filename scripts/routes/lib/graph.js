// Track graph built from route LineStrings, plus Dijkstra helpers.
// Nodes are distinct coordinates; edges join consecutive points of a string,
// and "snap" edges join a string's loose ends to nearby points of other strings
// (hand-joined strings rarely share exact vertices).

const { haversine } = require('../../upcoming/lib/geo')

const SNAP_M = 50
const REFERENCE_SNAP_M = 90 // reference shapes are simplified, so allow a wider join
const SNAP_PENALTY_M = 15
const CELL_DEG = 0.0006 // ~50-65 m grid cells

class MinHeap {
  constructor() {
    this.items = []
  }
  get size() {
    return this.items.length
  }
  push(priority, value) {
    const a = this.items
    a.push([priority, value])
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (a[p][0] <= a[i][0]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }
  pop() {
    const a = this.items
    const top = a[0]
    const last = a.pop()
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < a.length && a[l][0] < a[m][0]) m = l
        if (r < a.length && a[r][0] < a[m][0]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

function lineStringsOf(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return [geometry.coordinates]
  if (geometry.type === 'MultiLineString') return geometry.coordinates
  return []
}

class TrackGraph {
  constructor() {
    this.coords = [] // node -> [lon, lat]
    this.adj = [] // node -> [[neighbour, weight], ...]
    this.keyToNode = new Map()
    this.grid = new Map()
  }

  node(c) {
    const key = `${c[0].toFixed(6)},${c[1].toFixed(6)}`
    let n = this.keyToNode.get(key)
    if (n === undefined) {
      n = this.coords.length
      this.coords.push([Number(c[0]), Number(c[1])])
      this.adj.push([])
      this.keyToNode.set(key, n)
      const cell = this.cellKey(c[0], c[1])
      if (!this.grid.has(cell)) this.grid.set(cell, [])
      this.grid.get(cell).push(n)
    }
    return n
  }

  cellKey(lon, lat) {
    return `${Math.floor(lon / CELL_DEG)},${Math.floor(lat / CELL_DEG)}`
  }

  edge(a, b, w) {
    if (a === b) return
    this.adj[a].push([b, w])
    this.adj[b].push([a, w])
  }

  /**
   * Adds strings; returns the node ids of each string in order. `factor` > 1
   * makes these edges cost more, so reference geometry is only used where the
   * hand-drawn track has no path.
   */
  addStrings(strings, factor = 1) {
    const out = []
    for (const s of strings) {
      if (!Array.isArray(s) || !s.length) continue
      const nodes = s.map((c) => this.node(c))
      for (let i = 0; i < nodes.length - 1; i += 1) {
        this.edge(
          nodes[i],
          nodes[i + 1],
          factor * haversine(this.coords[nodes[i]], this.coords[nodes[i + 1]]),
        )
      }
      out.push(nodes)
    }
    return out
  }

  /** Nodes within `radius` metres of a point, nearest first. */
  near(c, radius) {
    const span = Math.ceil(radius / 50) + 1
    const cx = Math.floor(c[0] / CELL_DEG)
    const cy = Math.floor(c[1] / CELL_DEG)
    const found = []
    for (let dx = -span; dx <= span; dx += 1) {
      for (let dy = -span; dy <= span; dy += 1) {
        for (const n of this.grid.get(`${cx + dx},${cy + dy}`) || []) {
          const d = haversine(c, this.coords[n])
          if (d <= radius) found.push([d, n])
        }
      }
    }
    return found.sort((a, b) => a[0] - b[0])
  }

  /**
   * Joins every string end to nearby nodes of other strings. Ends may join
   * reference nodes from further away, since reference shapes are simplified.
   */
  snapEnds(stringNodes, referenceNodes = new Set()) {
    const owner = new Map()
    stringNodes.forEach((nodes, i) => nodes.forEach((n) => owner.set(n, i)))
    stringNodes.forEach((nodes, i) => {
      for (const end of [nodes[0], nodes[nodes.length - 1]]) {
        for (const [d, n] of this.near(this.coords[end], REFERENCE_SNAP_M)) {
          if (owner.get(n) === i) continue
          if (d <= SNAP_M || referenceNodes.has(n)) this.edge(end, n, d + SNAP_PENALTY_M)
        }
      }
    })
  }
}

const REFERENCE_COST = 1.5

function buildGraph(strings, referenceStrings = []) {
  const g = new TrackGraph()
  const stringNodes = g.addStrings(strings)
  const refNodes = g.addStrings(referenceStrings, REFERENCE_COST)
  g.snapEnds([...stringNodes, ...refNodes], new Set(refNodes.flat()))
  return g
}

module.exports = { MinHeap, TrackGraph, buildGraph, lineStringsOf, REFERENCE_COST }
