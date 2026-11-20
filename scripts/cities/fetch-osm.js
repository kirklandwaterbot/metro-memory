#!/usr/bin/env node
/**
 * Downloads the Overpass data osm-city.js needs and saves it to a file, so a
 * city can be built later (or elsewhere) with --osm-dir / --fixture.
 *
 *   node scripts/cities/fetch-osm.js --spec=lima --out=.tmp/osm
 *   node scripts/cities/fetch-osm.js --bbox=s,w,n,e --slug=foo --out=.tmp/osm
 *   node scripts/cities/fetch-osm.js --query-file=q.overpassql --slug=foo --out=.tmp/osm
 *
 * A spec may give its own "query" (Overpass QL) instead of a bbox, e.g. for a
 * nationwide network. Data © OpenStreetMap contributors (ODbL).
 */
const fs = require('fs')
const path = require('path')
const { buildQuery, fetchOverpass } = require('./osm-city')

const ROOT = path.resolve(__dirname, '..', '..')

async function main() {
  const args = {}
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  const out = path.resolve(args.out || '.tmp/osm')
  fs.mkdirSync(out, { recursive: true })
  const jobs = []
  if (args['query-file']) {
    jobs.push({ slug: args.slug, query: fs.readFileSync(args['query-file'], 'utf8') })
  } else if (args.bbox) {
    jobs.push({ slug: args.slug, query: buildQuery(args.bbox.split(',').map(Number)) })
  } else {
    for (const slug of String(args.spec || '').split(',').filter(Boolean)) {
      const spec = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'city-specs', `${slug}.json`), 'utf8'),
      )
      jobs.push({ slug, query: spec.query || buildQuery(spec.bbox) })
    }
  }
  if (!jobs.length) throw new Error('use --spec=<slug>[,<slug>] or --bbox=s,w,n,e --slug=x')
  for (const job of jobs) {
    const file = path.join(out, `${job.slug}.json`)
    if (fs.existsSync(file) && !args.force) {
      console.log(`${job.slug}: already have ${file}`)
      continue
    }
    const t0 = Date.now()
    const json = await fetchOverpass(job.query)
    fs.writeFileSync(file, JSON.stringify(json))
    console.log(
      `${job.slug}: ${(json.elements || []).length} elements, ${Math.round(fs.statSync(file).size / 1024)} KB in ${Math.round((Date.now() - t0) / 1000)}s`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
