#!/usr/bin/env node
/**
 * Merges extra lines built by osm-city.js (a spec whose "path" points under
 * data-sources/extras/<name>) into an existing, separately generated city —
 * e.g. KTM Komuter into Kuala Lumpur, KRL Commuterline into Jakarta.
 *
 *   node scripts/cities/merge-extra-lines.js --extra=kl-komuter --target=asia/malaysia/kuala-lumpur \
 *     --group="KTM Komuter"
 *
 * Idempotent: lines whose ids appear in the extra's lines.json are removed from
 * the target first, then appended again, so it can be rerun after the
 * target's own generator (generate-kuala-lumpur-data.js etc.) rewrites it.
 * An extra stop within 300 m of a target station with a matching name takes
 * the target's spelling, so transfers group in the game.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const GAME = path.join(ROOT, 'src', 'app', '(game)')

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.match(/^--([^=]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
if (!args.extra || !args.target) {
  console.error('usage: --extra=<name> --target=<game path> [--group=<title>]')
  process.exit(1)
}

const extraDir = path.join(ROOT, 'data-sources', 'extras', args.extra, 'data')
const targetDir = path.join(GAME, args.target, 'data')
const read = (d, f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))

const extraLines = read(extraDir, 'lines.json')
const extraFeatures = read(extraDir, 'features.json').features
const extraRoutes = read(extraDir, 'routes.json').features
const ids = new Set(Object.keys(extraLines))

const linesFile = read(targetDir, 'lines.json')
const featuresFile = read(targetDir, 'features.json')
const routesFile = read(targetDir, 'routes.json')
const featureList = Array.isArray(featuresFile)
  ? featuresFile
  : featuresFile.features

// 1. drop a previous merge
for (const id of ids) delete linesFile[id]
const kept = featureList.filter((f) => !ids.has(f.properties.line))
routesFile.features = routesFile.features.filter(
  (f) => !ids.has(f.properties.line),
)

// 2. align names with nearby target stations
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(stesen|station|stasiun|ktm|komuter|krl|srt)\b/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
const dist = ([x1, y1], [x2, y2]) => {
  const k = Math.cos((y1 * Math.PI) / 180) * 111320
  return Math.hypot((x1 - x2) * k, (y1 - y2) * 110540)
}
let renamed = 0
for (const f of extraFeatures) {
  const own = norm(f.properties.name)
  let best = null
  for (const t of kept) {
    const d = dist(f.geometry.coordinates, t.geometry.coordinates)
    if (d > 300) continue
    const other = norm(t.properties.name)
    if (!own || !other) continue
    if (!(own === other || own.includes(other) || other.includes(own))) continue
    if (!best || d < best.d) best = { d, t }
  }
  if (best && best.t.properties.name !== f.properties.name) {
    const alts = new Set([
      ...(f.properties.alternate_names || []),
      f.properties.name,
    ])
    alts.delete(best.t.properties.name)
    f.properties.name = best.t.properties.name
    f.properties.alternate_names = [...alts]
    renamed += 1
  }
}

// 3. append with fresh ids and orders
let nextId = Math.max(0, ...kept.map((f) => Number(f.properties.id) || 0)) + 1
const maxOrder = Math.max(
  -1,
  ...Object.values(linesFile).map((l) => Number(l.order) || 0),
)
for (const [id, line] of Object.entries(extraLines)) {
  linesFile[id] = { ...line, order: maxOrder + 1 + Number(line.order || 0) }
}
for (const f of extraFeatures) {
  const id = nextId++
  kept.push({ ...f, id, properties: { ...f.properties, id } })
}
routesFile.features.push(
  ...extraRoutes.map((r) => ({
    ...r,
    properties: { ...r.properties, order: linesFile[r.properties.line].order },
  })),
)

if (Array.isArray(featuresFile)) featuresFile.splice(0, featuresFile.length, ...kept)
else featuresFile.features = kept
fs.writeFileSync(path.join(targetDir, 'lines.json'), `${JSON.stringify(linesFile, null, 2)}\n`)
fs.writeFileSync(path.join(targetDir, 'features.json'), `${JSON.stringify(featuresFile, null, 2)}\n`)
fs.writeFileSync(path.join(targetDir, 'routes.json'), `${JSON.stringify(routesFile)}\n`)

// 4. line group in config.ts
const configPath = path.join(GAME, args.target, 'config.ts')
let config = fs.readFileSync(configPath, 'utf8')
const marker = `// merged: ${args.extra}`
const block = `  ${marker}\n  {\n    title: ${JSON.stringify(args.group || args.extra)},\n    items: [\n      {\n        type: 'lines',\n        lines: [${[...ids].map((i) => `'${i}'`).join(', ')}],\n      },\n    ],\n  },\n`
const start = config.indexOf(marker)
if (start >= 0) {
  const end = config.indexOf('\n  },\n', start) + '\n  },\n'.length
  config = config.slice(0, start - 2) + block + config.slice(end)
} else {
  const groupsAt = config.indexOf('export const LINE_GROUPS')
  const close = config.indexOf('\n]', groupsAt)
  config = `${config.slice(0, close + 1)}${block}${config.slice(close + 1)}`
}
fs.writeFileSync(configPath, config)
console.log(
  `${args.extra} -> ${args.target}: ${ids.size} lines, ${extraFeatures.length} stops (${renamed} renamed to match transfers)`,
)
