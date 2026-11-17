#!/usr/bin/env node
/**
 * Upcoming-stations auto-updater.
 *
 *   node scripts/upcoming/run.js                     # today's rotating batch + anything due soon
 *   node scripts/upcoming/run.js --cities=boston,tokyo
 *   node scripts/upcoming/run.js --all --dry-run
 *
 * Options:
 *   --cities=a,b         research only these city slugs
 *   --all                research every city that has data
 *   --batch=N            rotating batch size when no --cities/--all (default 20)
 *   --dry-run            research and report, but write nothing
 *   --skip-discover      don't query OSM/Wikidata; just re-evaluate tracked entries
 *   --skip-promote       track only; never write into game data
 *   --no-web             skip the optional web/LLM check
 *   --web-limit=N        max web checks per run (default 15)
 *   --no-route-stubs     don't draw connector segments to new stations
 *   --today=YYYY-MM-DD   pretend it's this date (testing)
 *   --fixtures=DIR       read <slug>.overpass.json / <slug>.wikidata.json from DIR instead of the network
 *   --report=FILE        write the markdown report here
 *   --delay-ms=N         pause between cities (default 3000; 0 with fixtures)
 */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const { ROOT, listDataCities, loadCity, loadCityPathMap, writeJsonLike } = require('./lib/city')
const { loadStore, saveStore, listStoreSlugs } = require('./lib/store')
const overpass = require('./lib/overpass')
const wikidata = require('./lib/wikidata')
const { mergeIntoStore, refreshEntry } = require('./lib/discover')
const { promotionDecision, applyEntry } = require('./lib/promote')
const { webCheck, isWebCheckEnabled } = require('./lib/web')
const { buildReport } = require('./lib/report')
const { todayIso, addDays, parseLooseDate } = require('./lib/dates')
const { sleep } = require('./lib/http')

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

function list(v) {
  return String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Cities with tracked entries that open (or should have opened) within two weeks. */
function urgentCities(today, available) {
  const soon = addDays(today, 14)
  return listStoreSlugs().filter((slug) => {
    if (!available.has(slug)) return false
    return loadStore(slug).entries.some(
      (e) =>
        ['due', 'overdue', 'scheduled'].includes(e.status) &&
        (e.status !== 'scheduled' || (e.expected?.date && e.expected.date <= soon)),
    )
  })
}

function rotatingBatch(all, size, today) {
  if (!all.length) return []
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86_400_000)
  const start = (day * size) % all.length
  const out = []
  for (let i = 0; i < Math.min(size, all.length); i += 1) out.push(all[(start + i) % all.length])
  return out
}

function readFixture(dir, slug, kind) {
  const file = path.join(dir, `${slug}.${kind}.json`)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

async function researchCity(slug, ctx) {
  const { args, today, cityPathMap } = ctx
  const city = loadCity(slug, cityPathMap)
  const store = loadStore(slug)
  const errors = []
  let added = []
  let dateChanges = []

  if (!args['skip-discover']) {
    if (!city.bbox) throw new Error('no bounding box')
    const trackedOsm = store.entries
      .filter((e) => !['promoted', 'ignored', 'in-game'].includes(e.status))
      .flatMap((e) => (e.refs || []).filter((r) => r.startsWith('osm:')))
    const keepRefs = new Set(trackedOsm)

    let osm = []
    let checkedRefs = new Set()
    try {
      const json = args.fixtures
        ? readFixture(args.fixtures, slug, 'overpass')
        : await overpass.queryOverpass(
            overpass.buildQuery(city.bbox, { knownIds: trackedOsm.map((r) => r.slice(4)), today }),
          )
      if (json) {
        osm = overpass.parseResponse(json, { today, keepRefs })
        checkedRefs = keepRefs
      }
    } catch (error) {
      errors.push(`${slug}: OSM — ${error.message}`)
    }

    let wd = []
    try {
      const json = args.fixtures
        ? readFixture(args.fixtures, slug, 'wikidata')
        : await wikidata.queryWikidata(
            wikidata.buildQuery(city.bbox, { today, languages: city.localLanguages }),
          )
      if (json) wd = wikidata.parseResponse(json)
    } catch (error) {
      errors.push(`${slug}: Wikidata — ${error.message}`)
    }

    const merged = mergeIntoStore({ city, store, osm, wikidata: wd, today, checkedRefs })
    added = merged.added
    dateChanges = merged.dateChanges
  } else {
    for (const e of store.entries) refreshEntry(e, city, today, { dateChanges })
  }

  // Optional web check for anything whose opening is here or close.
  if (ctx.webEnabled) {
    const soon = addDays(today, 45)
    const lastWeek = addDays(today, -7)
    for (const e of store.entries) {
      if (ctx.webBudget <= 0) break
      const relevant =
        e.status === 'due' ||
        e.status === 'overdue' ||
        (e.status === 'scheduled' && e.expected?.date && e.expected.date <= soon && e.expected.precision !== 'day')
      if (!relevant || (e.webCheck && e.webCheck.checkedOn > lastWeek)) continue
      ctx.webBudget -= 1
      try {
        const label = city.registry?.city || slug.replace(/-/g, ' ')
        const result = await webCheck(e, label, today)
        if (result) {
          e.webCheck = result
          e.webAnnounced = result.announcedDate ? parseLooseDate(result.announcedDate, 'web') : null
          refreshEntry(e, city, today, { dateChanges })
        }
      } catch (error) {
        errors.push(`${slug}: web check for ${e.name} — ${error.message}`)
      }
    }
  }

  const promoted = []
  let routeChanged = false
  if (!args['skip-promote']) {
    for (const e of store.entries) {
      const decision = promotionDecision(e, city, today)
      if (!decision.ok) continue
      const applied = applyEntry(e, city, { routeStubs: !args['no-route-stubs'] })
      e.status = 'promoted'
      e.statusReason = decision.reason
      e.promotedOn = today
      e.promotionConfidence = decision.confidence
      e.featureId = applied.featureId
      routeChanged = routeChanged || applied.routeChanged
      promoted.push({ entry: e, decision, notes: applied.notes })
    }
  }

  let storeChanged = false
  if (!args['dry-run']) {
    storeChanged = saveStore(slug, store)
    if (promoted.length) {
      writeJsonLike(city.featuresPath, city.features)
      if (routeChanged) writeJsonLike(city.routesPath, city.routes)
    }
  }

  return { slug, city, store, added, dateChanges, promoted, errors, storeChanged }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const today = typeof args.today === 'string' ? args.today : todayIso()
  const cityPathMap = loadCityPathMap()
  const allCities = listDataCities()
  const available = new Set(allCities)

  let slugs
  if (args.cities) slugs = list(args.cities)
  else if (args.all) slugs = allCities
  else {
    const size = Number(args.batch) || 20
    slugs = [...new Set([...urgentCities(today, available), ...rotatingBatch(allCities, size, today)])]
  }
  const unknown = slugs.filter((s) => !available.has(s))
  slugs = slugs.filter((s) => available.has(s))

  const webEnabled = !args['no-web'] && !args.fixtures && isWebCheckEnabled()
  const ctx = { args, today, cityPathMap, webEnabled, webBudget: Number(args['web-limit']) || 15 }
  const delay = args['delay-ms'] !== undefined ? Number(args['delay-ms']) : args.fixtures ? 0 : 3000

  const results = []
  const errors = unknown.map((s) => `${s}: unknown city or no data/features.json`)
  for (const [i, slug] of slugs.entries()) {
    try {
      const r = await researchCity(slug, ctx)
      results.push(r)
      errors.push(...r.errors)
      console.error(
        `[upcoming] ${slug}: tracked ${r.store.entries.length}, new ${r.added.length}, date changes ${r.dateChanges.length}, promoted ${r.promoted.length}`,
      )
    } catch (error) {
      errors.push(`${slug}: ${error.message}`)
      console.error(`[upcoming] ${slug}: ERROR ${error.message}`)
    }
    if (delay && i < slugs.length - 1) await sleep(delay)
  }

  const promotedCount = results.reduce((n, r) => n + r.promoted.length, 0)
  if (promotedCount && !args['dry-run']) {
    const totals = spawnSync('node', [path.join('scripts', 'generate-station-totals.js')], {
      cwd: ROOT,
      stdio: ['ignore', process.stderr, process.stderr],
    })
    if (totals.status !== 0) errors.push('generate-station-totals.js failed')
  }

  const report = buildReport({ today, results, errors, webEnabled })
  if (typeof args.report === 'string') fs.writeFileSync(args.report, `${report}\n`)

  const allConfirmed = results.every((r) => r.promoted.every((p) => p.decision.confidence === 'confirmed'))
  const summary = {
    today,
    cities: results.map((r) => r.slug),
    tracked: results.reduce((n, r) => n + r.store.entries.length, 0),
    newlyTracked: results.reduce((n, r) => n + r.added.length, 0),
    dateChanges: results.reduce((n, r) => n + r.dateChanges.length, 0),
    promoted: promotedCount,
    allPromotionsConfirmed: allConfirmed,
    webChecks: webEnabled,
    errors,
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `promoted=${promotedCount}\nall_confirmed=${allConfirmed}\nnew=${summary.newlyTracked}\n`,
    )
  }
  console.log(JSON.stringify(summary, null, 2))
  if (!args.report) console.error(`\n${report}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
