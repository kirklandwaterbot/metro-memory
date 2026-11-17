import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')

test('routes a line along named OSM track, bridging a small mapping gap', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'osm-route-'))
  const data = path.join(root, 'src', 'app', '(game)', 'test', 'railtown', 'data')
  fs.mkdirSync(data, { recursive: true })
  fs.mkdirSync(path.join(root, 'src', 'lib'), { recursive: true })
  fs.mkdirSync(path.join(root, 'data-sources', 'railtown'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'lib', 'cityPathMap.ts'), "export const X = {\n  'railtown': 'test/railtown',\n}\n")

  // Schematic hand-drawn route to be replaced.
  fs.writeFileSync(
    path.join(data, 'routes.json'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { line: 'L', color: '#f0f', order: 7 }, geometry: { type: 'LineString', coordinates: [[0, 40], [0.1, 40]] } }],
    }),
  )
  const station = (name: string, c: number[]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: { name, line: 'L' } })
  fs.writeFileSync(
    path.join(data, 'features.json'),
    JSON.stringify({ type: 'FeatureCollection', features: [station('West', [0, 40]), station('East', [0.1, 40])] }),
  )
  fs.writeFileSync(
    path.join(root, 'data-sources', 'railtown', 'osm-routes.json'),
    JSON.stringify({ routes: [{ line: 'L', replace: true, preferName: 'cut-?off', waypoints: [{ station: 'West' }, { station: 'East' }] }] }),
  )

  // Named "Cut-Off" bows north (y = 40.002) with an ~85 m gap in the middle;
  // an unnamed straight track runs along y = 40 and is slightly shorter.
  const elements: any[] = []
  const node = (id: number, lon: number, lat: number) => elements.push({ type: 'node', id, lon, lat })
  for (let i = 0; i <= 10; i += 1) node(100 + i, i * 0.01, i === 0 || i === 10 ? 40 : 40.002)
  node(200, 0.049, 40.002) // way 1 ends here; ~85 m gap to way 2's first node
  elements.push({ type: 'way', id: 1, nodes: [100, 101, 102, 103, 104, 200], tags: { railway: 'abandoned', name: 'Lackawanna Cut-Off' } })
  elements.push({ type: 'way', id: 2, nodes: [105, 106, 107, 108, 109, 110], tags: { railway: 'abandoned', name: 'Lackawanna Cut-Off' } })
  for (let i = 0; i <= 10; i += 1) node(300 + i, i * 0.01, 40)
  elements.push({ type: 'way', id: 3, nodes: [100, ...Array.from({ length: 9 }, (_, i) => 301 + i), 110], tags: { railway: 'rail' } })
  const fixture = path.join(root, 'overpass.json')
  fs.writeFileSync(fixture, JSON.stringify({ elements }))

  const res = spawnSync(process.execPath, [path.join(REPO, 'scripts', 'routes', 'osm-route.js'), '--city=railtown', `--fixture=${fixture}`], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(res.status, 0, res.stderr)
  assert.match(res.stdout, /✅ L: .* m of mapping gaps bridged/)

  const features = JSON.parse(fs.readFileSync(path.join(data, 'routes.json'), 'utf8')).features
  assert.equal(features.length, 1) // schematic replaced
  const f = features[0]
  assert.equal(f.properties.color, '#f0f') // styling kept
  assert.equal(f.properties.order, 7)
  assert.ok(f.properties.osm_route.bridged_m > 50 && f.properties.osm_route.bridged_m < 150)
  // Follows the named Cut-Off (north bow), not the unnamed straight track.
  const mid = f.geometry.coordinates.filter((c: number[]) => c[0] > 0.005 && c[0] < 0.095)
  assert.ok(mid.length > 0 && mid.every((c: number[]) => c[1] > 40.0015))

  // Second run is a no-op unless --refresh.
  const again = spawnSync(process.execPath, [path.join(REPO, 'scripts', 'routes', 'osm-route.js'), '--city=railtown', `--fixture=${fixture}`], { cwd: root, encoding: 'utf8' })
  assert.match(again.stdout, /already built from OSM/)
})
