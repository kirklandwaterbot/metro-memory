import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')

// Invented city: line X is fully drawn north–south; line Y shares X's track but
// nobody drew it; line Z has two pieces joined only by a long detour.
function makeCity() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'route-gaps-'))
  const data = path.join(root, 'src', 'app', '(game)', 'test', 'gapville', 'data')
  fs.mkdirSync(data, { recursive: true })
  fs.mkdirSync(path.join(root, 'src', 'lib'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'src', 'lib', 'cityPathMap.ts'),
    "export const CITY_PATH_MAP = {\n  'gapville': 'test/gapville',\n}\n",
  )
  // X: a 4 km track drawn as many short hand-joined strings with tiny gaps.
  const xStrings = []
  for (let i = 0; i < 40; i += 1) {
    xStrings.push([[0, 40 + i * 0.0009], [0, 40 + (i + 1) * 0.0009 - 0.00005]])
  }
  // Z piece 1 near the south of X, piece 2 far east; only link is a U-shaped
  // detour track drawn for line W.
  const routes = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { line: 'X', color: '#f00' }, geometry: { type: 'MultiLineString', coordinates: xStrings } },
      { type: 'Feature', properties: { line: 'Z', color: '#0f0' }, geometry: { type: 'LineString', coordinates: [[0.1, 40], [0.1, 40.01]] } },
      { type: 'Feature', properties: { line: 'Z', color: '#0f0' }, geometry: { type: 'LineString', coordinates: [[0.2, 40], [0.2, 40.01]] } },
      { type: 'Feature', properties: { line: 'W', color: '#00f' }, geometry: { type: 'LineString', coordinates: [[0.1, 40.01], [0.1, 40.2], [0.2, 40.2], [0.2, 40.01]] } },
    ],
  }
  const station = (id: number, name: string, line: string, c: number[]) => ({
    type: 'Feature', id, geometry: { type: 'Point', coordinates: c }, properties: { id, name, line },
  })
  const features = {
    type: 'FeatureCollection',
    features: [
      station(1, 'North', 'X', [0, 40.036]),
      station(2, 'South', 'X', [0, 40]),
      station(3, 'North', 'Y', [0.0003, 40.036]),
      station(4, 'Middle', 'Y', [0.0003, 40.018]),
      station(5, 'South', 'Y', [0.0003, 40]),
      station(6, 'West', 'Z', [0.1, 40.005]),
      station(7, 'East', 'Z', [0.2, 40.005]),
    ],
  }
  fs.writeFileSync(path.join(data, 'routes.json'), JSON.stringify(routes, null, 2))
  fs.writeFileSync(path.join(data, 'features.json'), JSON.stringify(features, null, 2))
  fs.writeFileSync(path.join(data, 'lines.json'), JSON.stringify({ X: { name: 'X' }, Y: { name: 'Y' }, Z: { name: 'Z' }, W: { name: 'W' } }))
  return { root, data }
}

const run = (root: string, ...args: string[]) =>
  spawnSync(process.execPath, [path.join(REPO, 'scripts', 'routes', 'fill-gaps.js'), '--city=gapville', ...args], {
    cwd: root,
    encoding: 'utf8',
  })

test('fills an undrawn line along the shared track and refuses a long detour', () => {
  const { root, data } = makeCity()

  const check = run(root, '--check')
  assert.equal(check.status, 2) // gaps found
  assert.match(check.stdout, /\*\*Y\*\* — 3 station\(s\) off the drawn route/)

  const fill = run(root)
  assert.equal(fill.status, 0, fill.stderr)
  assert.match(fill.stdout, /\*\*Z\*\*.*\n  - ⚠️ disconnected piece/)

  const routes = JSON.parse(fs.readFileSync(path.join(data, 'routes.json'), 'utf8')).features
  const y = routes.find((f: any) => f.properties.line === 'Y')
  assert.equal(y.properties.auto_filled, 'route-gaps')
  // Y follows X's track: every filled point is on x = 0.
  assert.ok(y.geometry.coordinates.flat().every((c: number[]) => Math.abs(c[0]) < 1e-9))
  // Z's pieces stay apart rather than being joined along W's long detour.
  assert.equal(routes.filter((f: any) => f.properties.line === 'Z' && f.properties.auto_filled).length, 0)

  // Re-running replaces the previous fill instead of stacking a second copy.
  run(root)
  const again = JSON.parse(fs.readFileSync(path.join(data, 'routes.json'), 'utf8')).features
  assert.equal(again.filter((f: any) => f.properties.auto_filled).length, 1)
  assert.equal(run(root, '--check', '--lines=X,Y').status, 0)
})
