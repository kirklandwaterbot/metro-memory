#!/usr/bin/env node
/**
 * One action on one tracked upcoming station (used by the admin "Upcoming" page,
 * and handy from the terminal too).
 *
 *   node scripts/upcoming/act.js --city=moscow --id=osm:node/123 --action=add
 *   node scripts/upcoming/act.js --city=taipei --id=wd:Q10937175 --action=line --line=TPE-G
 *   node scripts/upcoming/act.js --city=taipei --id=wd:Q10937175 --action=ignore
 *   node scripts/upcoming/act.js --city=taipei --id=wd:Q10937175 --action=restore
 *
 * add      writes the station into the city's game data now (needs a line), then
 *          regenerates station totals and the exported city data
 * line     sets the line the station belongs to (lineOverride)
 * ignore   dismisses a false positive for good
 * restore  undoes "ignore"
 *
 * Prints one JSON line: { ok, entry } or { ok: false, error }.
 */

const { spawnSync } = require('child_process')
const path = require('path')

const { ROOT, loadCity, writeJsonLike } = require('./lib/city')
const { loadStore, saveStore } = require('./lib/store')
const { applyEntry } = require('./lib/promote')
const { refreshEntry } = require('./lib/discover')
const { todayIso } = require('./lib/dates')

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

function fail(error) {
  console.log(JSON.stringify({ ok: false, error }))
  process.exit(1)
}

function runNode(script) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script)], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (r.status !== 0) throw new Error(`${script} failed: ${(r.stderr || r.stdout).trim()}`)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const { city: slug, id, action } = args
  if (!slug || !id || !action) fail('needs --city, --id and --action')

  const store = loadStore(slug)
  const entry = store.entries.find((e) => e.id === id)
  if (!entry) fail(`no tracked station "${id}" in ${slug}`)

  const city = loadCity(slug)
  const today = typeof args.today === 'string' ? args.today : todayIso()

  if (action === 'ignore') {
    entry.status = 'ignored'
    entry.statusReason = 'dismissed by hand'
  } else if (action === 'restore') {
    if (entry.status !== 'ignored') fail('only an ignored station can be restored')
    entry.status = 'scheduled'
    refreshEntry(entry, city, today)
  } else if (action === 'line') {
    const line = String(args.line || '')
    if (!city.lines[line]) fail(`"${line}" is not a line of ${slug}`)
    entry.lineOverride = line
    if (entry.status !== 'ignored') refreshEntry(entry, city, today)
  } else if (action === 'add') {
    if (['promoted', 'in-game'].includes(entry.status)) fail('already in the game')
    const line = entry.lineOverride || entry.line
    if (!line || !city.lines[line]) fail('pick a line first')
    if (!Array.isArray(entry.coordinates) || !entry.name) fail('no name or coordinates')
    const applied = applyEntry(entry, city, { routeStubs: !args['no-route-stubs'] })
    entry.status = 'promoted'
    entry.statusReason = 'added by hand'
    entry.promotedOn = today
    entry.promotionConfidence = 'manual'
    entry.featureId = applied.featureId
    writeJsonLike(city.featuresPath, city.features)
    if (applied.routeChanged) writeJsonLike(city.routesPath, city.routes)
    saveStore(slug, store)
    runNode('generate-station-totals.js')
    runNode('export-city-data.js')
    console.log(JSON.stringify({ ok: true, entry, notes: applied.notes }))
    return
  } else {
    fail(`unknown action "${action}"`)
  }

  saveStore(slug, store)
  console.log(JSON.stringify({ ok: true, entry }))
}

try {
  main()
} catch (error) {
  fail(error.message)
}
