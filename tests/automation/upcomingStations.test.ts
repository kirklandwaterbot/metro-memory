import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const lib = (name: string) => require(path.join(REPO, 'scripts', 'upcoming', 'lib', name))

const { parseLooseDate, parseWikidataTime } = lib('dates.js')
const { normalizeStationName } = lib('names.js')
const { buildLineIndex, scoreLines } = lib('lines.js')
const { refreshEntry } = lib('discover.js')
const { promotionDecision } = lib('promote.js')
const { buildQuery: buildOverpassQuery } = lib('overpass.js')

// ---------------------------------------------------------------- helpers

function testCity(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'testville',
    lines: {
      TVRed: { name: 'Red', color: '#DA291C' },
      TVBlue: { name: 'Blue', color: '#0000FF' },
    },
    registry: null,
    localLanguages: [],
    modes: null,
    nameStyle: { style: 'roman', displayName: false, order: false },
    features: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: 0, geometry: { type: 'Point', coordinates: [-75, 40] }, properties: { id: 0, name: 'Alpha', line: 'TVRed' } },
      ],
    },
    ...overrides,
  }
}

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'osm:node/1',
    refs: ['osm:node/1'],
    name: 'Charlie',
    alternateNames: [],
    coordinates: [-75, 40.02],
    line: 'TVRed',
    lineOverride: null,
    osmState: 'construction',
    osmOpening: null,
    wikidataOpening: null,
    webAnnounced: null,
    expected: null,
    dateHistory: [],
    status: 'scheduled',
    statusReason: '',
    webCheck: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------- units

test('opening dates keep their precision window', () => {
  assert.deepEqual(
    { ...parseLooseDate('2027') },
    { raw: '2027', source: 'osm', date: '2027-01-01', latest: '2027-12-31', precision: 'year' },
  )
  assert.equal(parseLooseDate('2027-02').latest, '2027-02-28')
  assert.equal(parseLooseDate('~2027-06-15').precision, 'day')
  assert.equal(parseLooseDate('2027-Q3').date, '2027-07-01')
  assert.equal(parseLooseDate('late 2027').date, '2027-09-01')
  assert.equal(parseLooseDate('2027..2028').latest, '2028-12-31')
  assert.equal(parseLooseDate('soon').date, null)
  assert.equal(parseWikidataTime('+2027-03-01T00:00:00Z', 10).latest, '2027-03-31')
})

test('station names normalise across scripts and suffixes', () => {
  assert.equal(normalizeStationName('Nakano-sakaue (中野坂上)'), 'nakano sakaue')
  assert.equal(normalizeStationName('中野坂上駅'), '中野坂上')
  assert.equal(normalizeStationName('Gare de Lyon station'), 'de lyon')
})

test('line scoring picks a clear winner and refuses ties', () => {
  const index = buildLineIndex(testCity())
  const clear = scoreLines(index, [
    { text: 'Testville Metro Red Line', weight: 2 },
    { text: 'Blue Line', weight: 1 },
  ])
  assert.equal(clear.line, 'TVRed')
  const tie = scoreLines(index, [
    { text: 'Red Line', weight: 1 },
    { text: 'Blue Line', weight: 1 },
  ])
  assert.equal(tie.line, null)
  assert.equal(tie.ranked.length, 2)
  const excluded = scoreLines(index, [{ text: 'Red Line', weight: 3 }], new Set(['TVRed']))
  assert.equal(excluded.line, null)
})

test('a delay is recorded in dateHistory and the later date wins', () => {
  const city = testCity()
  const e = entry({ osmOpening: parseLooseDate('2026-12-15') })
  refreshEntry(e, city, '2026-11-17')
  assert.equal(e.expected.date, '2026-12-15')
  assert.equal(e.status, 'scheduled')

  const changes: unknown[] = []
  e.osmOpening = parseLooseDate('2027-03-01')
  refreshEntry(e, city, '2026-11-20', { dateChanges: changes })
  assert.equal(e.expected.date, '2027-03-01')
  assert.equal(changes.length, 1)
  assert.deepEqual(e.dateHistory, [{ on: '2026-11-20', from: '2026-12-15', to: '2027-03-01', source: 'osm' }])
})

test('stations past their window without confirmation go overdue, not into the game', () => {
  const city = testCity()
  const e = entry({ osmOpening: parseLooseDate('2026-06-01') })
  refreshEntry(e, city, '2026-11-17')
  assert.equal(e.status, 'overdue')
  assert.equal(promotionDecision(e, city, '2026-11-17').ok, false)
})

test('promotion needs real evidence of opening', () => {
  const city = testCity()
  // OSM flipped to operational
  assert.equal(
    promotionDecision(entry({ osmState: 'operational' }), city, '2026-11-17').confidence,
    'confirmed',
  )
  // operational but pre-tagged with a future date: wait
  assert.equal(
    promotionDecision(entry({ osmState: 'operational', osmOpening: parseLooseDate('2026-12-01') }), city, '2026-11-17').ok,
    false,
  )
  // web says open from a strong source
  assert.equal(
    promotionDecision(entry({ webCheck: { opened: true, tier: 1, url: 'https://transit.example.gov/x' } }), city, '2026-11-17').ok,
    true,
  )
  // weak web source is not enough
  assert.equal(
    promotionDecision(entry({ webCheck: { opened: true, tier: 3, url: 'https://blog.example.com' } }), city, '2026-11-17').ok,
    false,
  )
  // two sources agree on a passed day -> scheduled-confidence promotion
  const agreed = entry({ osmOpening: parseLooseDate('2026-11-15'), wikidataOpening: parseWikidataTime('2026-11-15T00:00:00Z', 11) })
  assert.equal(promotionDecision(agreed, city, '2026-11-17').confidence, 'scheduled')
  // ...unless the web check says it's delayed
  agreed.webCheck = { opened: false, tier: 1 }
  assert.equal(promotionDecision(agreed, city, '2026-11-17').ok, false)
  // unknown line never promotes
  assert.equal(promotionDecision(entry({ osmState: 'operational', line: 'TVPurple' }), city, '2026-11-17').ok, false)
  // ignored stays ignored
  assert.equal(promotionDecision(entry({ osmState: 'operational', status: 'ignored' }), city, '2026-11-17').ok, false)
})

test('overpass query includes tracked ids and the bbox', () => {
  const q = buildOverpassQuery([39.9, -75.1, 40.1, -74.9], { knownIds: ['node/101', 'way/7'], today: '2026-11-17' })
  assert.match(q, /\[bbox:39\.9,-75\.1,40\.1,-74\.9\]/)
  assert.match(q, /node\(id:101\);/)
  assert.match(q, /way\(id:7\);/)
  assert.match(q, /start_date"~"\^\(2025\|2026\)"/)
})

// ---------------------------------------------------------------- end to end

function makeTempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upcoming-'))
  const dataDir = path.join(root, 'src', 'app', '(game)', 'test', 'testville', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true })
  fs.mkdirSync(path.join(root, 'src', 'lib'), { recursive: true })
  fs.copyFileSync(
    path.join(REPO, 'scripts', 'generate-station-totals.js'),
    path.join(root, 'scripts', 'generate-station-totals.js'),
  )
  fs.writeFileSync(
    path.join(root, 'src', 'lib', 'cityPathMap.ts'),
    "export const CITY_PATH_MAP: Record<string, string> = {\n  'testville': 'test/testville',\n}\n",
  )
  fs.writeFileSync(
    path.join(dataDir, 'lines.json'),
    JSON.stringify({ TVRed: { name: 'Red', color: '#DA291C', backgroundColor: '#000', textColor: '#fff', order: 0 } }, null, 2),
  )
  fs.writeFileSync(
    path.join(dataDir, 'features.json'),
    `${JSON.stringify(
      {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [-75, 40] }, properties: { id: 0, name: 'Alpha', line: 'TVRed' }, id: 0 },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [-75, 40.01] }, properties: { id: 1, name: 'Bravo', line: 'TVRed' }, id: 1 },
        ],
      },
      null,
      2,
    )}\n`,
  )
  fs.writeFileSync(
    path.join(dataDir, 'routes.json'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-75, 40], [-75, 40.01]] }, properties: { line: 'TVRed', name: 'TVRed', color: '#DA291C' } },
      ],
    }),
  )
  return { root, dataDir }
}

function run(root: string, today: string) {
  const res = spawnSync(
    process.execPath,
    [
      path.join(REPO, 'scripts', 'upcoming', 'run.js'),
      '--cities=testville',
      `--today=${today}`,
      `--fixtures=${path.join(REPO, 'tests', 'automation', 'fixtures', 'upcoming')}`,
      `--report=${path.join(root, 'report.md')}`,
    ],
    { cwd: root, encoding: 'utf8', env: { ...process.env, SERPAPI_API_KEY: '', AUTOMATION_LLM_API_KEY: '' } },
  )
  assert.equal(res.status, 0, res.stderr)
  return JSON.parse(res.stdout)
}

test('end to end: discovers, tracks, and adds stations once they open', () => {
  const { root, dataDir } = makeTempRepo()

  const first = run(root, '2026-11-17')
  assert.equal(first.promoted, 1)
  assert.equal(first.allPromotionsConfirmed, true)

  const store = JSON.parse(fs.readFileSync(path.join(root, 'upcoming', 'testville.json'), 'utf8'))
  const byName = Object.fromEntries(store.entries.map((e: any) => [e.name, e]))
  assert.deepEqual(Object.keys(byName).sort(), ['Charlie', 'Delta', 'Echo', 'Golf'])
  assert.equal(byName.Delta.status, 'promoted') // OSM already shows it open
  assert.equal(byName.Charlie.status, 'scheduled')
  assert.equal(byName.Charlie.line, 'TVRed')
  assert.deepEqual(byName.Charlie.refs.sort(), ['osm:node/101', 'wd:Q9001'])
  assert.equal(byName.Echo.status, 'needs-line') // Purple line isn't in the game
  assert.equal(byName.Golf.line, 'TVRed') // Wikidata-only sighting
  assert.equal(byName.Golf.expected.precision, 'month')

  let features = JSON.parse(fs.readFileSync(path.join(dataDir, 'features.json'), 'utf8')).features
  assert.equal(features.length, 3)
  assert.deepEqual(features[2].properties, { id: 2, name: 'Delta', line: 'TVRed' })
  const routes = JSON.parse(fs.readFileSync(path.join(dataDir, 'routes.json'), 'utf8')).features
  assert.equal(routes.length, 2) // connector to Delta
  assert.equal(routes[1].properties.auto_generated, 'upcoming-stations')
  assert.match(fs.readFileSync(path.join(root, 'src', 'lib', 'stationTotals.ts'), 'utf8'), /"testville": 3/)
  const report = fs.readFileSync(path.join(root, 'report.md'), 'utf8')
  assert.match(report, /Added to the game/)
  assert.match(report, /\[OpenRailwayMap\]\(https:\/\/www\.openrailwaymap\.org\/\?style=standard&lat=40\.03000&lon=-75\.00000&zoom=16\)/)
  assert.match(report, /\[OSM\]\(https:\/\/www\.openstreetmap\.org\/node\/101\) · \[Wikidata\]/)

  // Re-running the same day changes nothing.
  const before = fs.readFileSync(path.join(root, 'upcoming', 'testville.json'), 'utf8')
  const again = run(root, '2026-11-17')
  assert.equal(again.promoted, 0)
  assert.equal(fs.readFileSync(path.join(root, 'upcoming', 'testville.json'), 'utf8'), before)

  // The day after Charlie's opening day (OSM + Wikidata agree on it).
  const later = run(root, '2026-12-16')
  assert.equal(later.promoted, 1)
  assert.equal(later.allPromotionsConfirmed, false) // date-only, flagged for review
  features = JSON.parse(fs.readFileSync(path.join(dataDir, 'features.json'), 'utf8')).features
  assert.equal(features.at(-1).properties.name, 'Charlie')
  assert.equal(features.length, 4)
})
