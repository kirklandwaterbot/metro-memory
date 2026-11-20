#!/usr/bin/env node
/**
 * Converts an Overpass JSON answer (see .tmp/q/*.overpassql: tram/monorail
 * ways, station nodes, route relations) into the probe snapshot format that
 * scripts/cities/china-city.js reads, for small systems the osm-probes branch
 * doesn't cover (or covers with the wrong bbox).
 *
 *   node scripts/cities/overpass-to-probe.js in.json slug > /tmp/probe/slug.json
 *
 * Tram/monorail ways that belong to no route relation are grouped into one
 * pseudo relation per name ("<track> 名称"), so a spec can match it with
 * "fromTrack": true. Data © OpenStreetMap contributors (ODbL).
 */
const fs = require('fs')

const [input, slug] = process.argv.slice(2)
const osm = JSON.parse(fs.readFileSync(input, 'utf8'))
const nodes = new Map()
const ways = new Map()
for (const e of osm.elements) {
  if (e.type === 'node') nodes.set(e.id, e)
  if (e.type === 'way') ways.set(e.id, e)
}
const routeWays = {}
for (const w of ways.values())
  if (w.geometry) routeWays[w.id] = w.geometry.map((p) => [p.lon, p.lat])

const isStation = (t) =>
  /^(station|halt|tram_stop|stop)$/.test(t.railway || '') ||
  t.public_transport === 'station'
const stations = []
for (const e of osm.elements) {
  const t = e.tags || {}
  if (!t.name || !isStation(t)) continue
  const lat = e.lat ?? e.center?.lat
  const lon = e.lon ?? e.center?.lon
  if (lat == null) continue
  stations.push({ id: `${e.type}/${e.id}`, lon, lat, state: 'open', tags: t })
}

const relations = []
const inRelation = new Set()
for (const r of osm.elements.filter((e) => e.type === 'relation')) {
  const stops = []
  const wayIds = []
  for (const m of r.members || []) {
    const w = m.type === 'way' ? ways.get(m.ref) : null
    if (w && isStation(w.tags || {}) && w.tags.name) {
      // station mapped as an area and listed in the relation in order
      const g = w.geometry || []
      const c = w.center || {
        lat: g.reduce((a, p) => a + p.lat, 0) / (g.length || 1),
        lon: g.reduce((a, p) => a + p.lon, 0) / (g.length || 1),
      }
      stops.push({
        name: w.tags.name,
        nameEn: w.tags['name:en'],
        lon: c.lon,
        lat: c.lat,
        role: 'stop',
      })
    } else if (w) {
      wayIds.push(m.ref)
      inRelation.add(m.ref)
    } else if (m.type === 'node' && /^stop/.test(m.role || '')) {
      const n = nodes.get(m.ref)
      if (!n?.tags?.name) continue
      stops.push({
        name: n.tags.name,
        nameEn: n.tags['name:en'],
        lon: n.lon,
        lat: n.lat,
        role: m.role,
      })
    }
  }
  relations.push({
    id: r.id,
    tags: r.tags || {},
    stops,
    members: (r.members || []).length,
    ways: wayIds,
  })
}
const orphan = new Map()
for (const w of ways.values()) {
  const kind = w.tags?.railway
  if (!/^(tram|monorail|light_rail|narrow_gauge)$/.test(kind || '')) continue
  if (inRelation.has(w.id) || !w.geometry) continue
  const key = `${kind}|${w.tags.name || ''}`.replace(/\|$/, '|')
  if (!orphan.has(key)) orphan.set(key, [])
  orphan.get(key).push(w.id)
}
let fake = -1
for (const [key, ids] of orphan) {
  const [kind, name] = key.split('|')
  relations.push({
    id: fake--,
    tags: { route: kind, name: `<track> ${name || kind}`, type: 'route' },
    stops: [],
    members: ids.length,
    ways: ids,
  })
}
process.stdout.write(
  JSON.stringify({
    slug,
    source: 'overpass',
    fetchedAt: osm.osm3s?.timestamp_osm_base,
    relations,
    stations,
    works: [],
    routeWays,
  }),
)
