import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const { cleanStationName, matches, buildLine, indexOsm } = require(path.join(REPO, 'scripts', 'cities', 'osm-city.js'))

test('station names lose platform and "station" suffixes', () => {
  assert.equal(cleanStationName('Central Station, Platform 3'), 'Central')
  assert.equal(cleanStationName('Flinders Street Railway Station'), 'Flinders Street')
  assert.equal(cleanStationName('Elizabeth Quay Bus Station', ['Bus Station']), 'Elizabeth Quay Bus Station')
  assert.equal(cleanStationName('Perth Underground Platform 2'), 'Perth Underground')
  assert.equal(cleanStationName('Stop 71: RMIT Bundoora Campus'), 'RMIT Bundoora Campus')
})

test('relation matching uses every rule plus exclude', () => {
  const tags = { route: 'train', network: 'Transperth', name: 'Mandurah Line: Perth → Mandurah' }
  assert.ok(matches({ route: 'train', network: 'transperth', name: 'mandurah' }, tags))
  assert.ok(!matches({ route: 'train', name: 'fremantle' }, tags))
  assert.ok(!matches({ name: 'mandurah', exclude: '→ Mandurah' }, tags))
})

test('builds one ordered line from two direction relations, snapping to station names', () => {
  const node = (id: number, lon: number, lat: number, tags = {}) => ({ type: 'node', id, lon, lat, tags })
  const osm = {
    elements: [
      // stations
      node(1, 0, 0, { railway: 'station', name: 'Alpha Station' }),
      node(2, 0.01, 0, { railway: 'station', name: 'Bravo' }),
      node(3, 0.02, 0, { railway: 'station', name: 'Charlie' }),
      node(4, 0.03, 0, { railway: 'station', name: 'Delta' }),
      // stop positions near them (named like platforms)
      node(11, 0.0001, 0, { public_transport: 'stop_position', name: 'Alpha Platform 1' }),
      node(12, 0.0101, 0, { public_transport: 'stop_position', name: 'Bravo Platform 1' }),
      node(13, 0.0201, 0, { public_transport: 'stop_position' }),
      node(14, 0.0301, 0, { public_transport: 'stop_position' }),
      { type: 'way', id: 100, geometry: [0, 0.01, 0.02, 0.03].map((lon) => ({ lon, lat: 0 })), tags: { railway: 'rail' } },
      // outbound skips Bravo; inbound serves all four
      { type: 'relation', id: 1000, tags: { type: 'route', route: 'train', name: 'Test Line: Alpha → Delta' }, members: [
        { type: 'node', ref: 11, role: 'stop' }, { type: 'node', ref: 13, role: 'stop' }, { type: 'node', ref: 14, role: 'stop' }, { type: 'way', ref: 100, role: '' }] },
      { type: 'relation', id: 1001, tags: { type: 'route', route: 'train', name: 'Test Line: Delta → Alpha' }, members: [
        { type: 'node', ref: 14, role: 'stop' }, { type: 'node', ref: 13, role: 'stop' }, { type: 'node', ref: 12, role: 'stop' }, { type: 'node', ref: 11, role: 'stop' }, { type: 'way', ref: 100, role: '' }] },
    ],
  }
  const idx = indexOsm(osm)
  const built = buildLine({ id: 'T', name: 'Test' }, idx.rels, idx, {})
  assert.deepEqual(built.stations.map((s: any) => s.name), ['Delta', 'Charlie', 'Bravo', 'Alpha'])
  assert.deepEqual(built.stations[3].coordinates, [0, 0]) // station node, not stop position
  assert.equal(built.strings.length, 1)
  assert.ok(built.lengthM > 3000 && built.lengthM < 3500)
})

test('derives stations from the track when a route only lists its terminals, and clips to the bbox', () => {
  const node = (id: number, lon: number, lat: number, tags = {}) => ({ type: 'node', id, lon, lat, tags })
  const names = ['Adelaide', 'Bowden', 'Croydon', 'Kilkenny', 'Woodville', 'Outside']
  const osm = {
    elements: [
      ...names.map((n, i) => node(i + 1, 138.5 + i * 0.03, -34.9 + 0.0002, { railway: 'station', name: `${n} Railway Station` })),
      node(50, 138.5 + 0.06, -34.9 + 0.0003, { railway: 'station', name: 'Croydon Heritage Museum', usage: 'tourism' }),
      { type: 'way', id: 100, geometry: [0, 1, 2, 3, 4, 5].map((i) => ({ lon: 138.5 + i * 0.03, lat: -34.9 })), tags: { railway: 'rail' } },
      { type: 'relation', id: 1000, tags: { type: 'route', route: 'train', name: 'Train OUT' }, members: [
        { type: 'node', ref: 1, role: 'stop' }, { type: 'node', ref: 6, role: 'stop' }, { type: 'way', ref: 100, role: '' }] },
    ],
  }
  const idx = indexOsm(osm)
  const spec = { bbox: [-35, 138.45, -34.8, 138.64] }
  const built = buildLine({ id: 'O', name: 'Outer' }, idx.rels, idx, spec)
  assert.deepEqual(built.stations.map((s: any) => s.name), ['Adelaide', 'Bowden', 'Croydon', 'Kilkenny', 'Woodville'])
  for (const line of built.strings) for (const [lon] of line) assert.ok(lon <= 138.64)
})
