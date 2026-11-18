// Reads (and writes back) a city's game data: features.json, routes.json,
// lines.json and its optional city-registry entry.

const fs = require('fs')
const path = require('path')

const { bboxOfFeatures } = require('./geo')
const { isAscii } = require('./names')

const ROOT = process.cwd()
const GAME_ROOT = path.join(ROOT, 'src', 'app', '(game)')

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Writes JSON in the same layout the file already used (pretty vs minified). */
function writeJsonLike(file, value) {
  let pretty = true
  let trailingNewline = true
  try {
    const raw = fs.readFileSync(file, 'utf8')
    pretty = /\n\s+"/.test(raw.slice(0, 2000))
    trailingNewline = raw.endsWith('\n')
  } catch {
    // new file: pretty with newline
  }
  const body = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
  fs.writeFileSync(file, trailingNewline ? `${body}\n` : body)
}

function loadCityPathMap() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'cityPathMap.ts'), 'utf8')
  const map = {}
  for (const m of src.matchAll(/'([^']+)':\s*'([^']+)'/g)) map[m[1]] = m[2]
  return map
}

/** Slugs whose city has its own data/features.json (mini-cities are skipped). */
function listDataCities() {
  const map = loadCityPathMap()
  const seenDirs = new Set()
  const slugs = []
  for (const [slug, rel] of Object.entries(map)) {
    const dir = path.join(GAME_ROOT, rel, 'data')
    if (seenDirs.has(dir)) continue
    if (!fs.existsSync(path.join(dir, 'features.json'))) continue
    seenDirs.add(dir)
    slugs.push(slug)
  }
  return slugs.sort()
}

function validBbox(b) {
  return (
    Array.isArray(b) &&
    b.length === 4 &&
    b.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    b[0] < b[2] &&
    b[1] < b[3]
  )
}

/** Guesses how the city writes station names so new ones match. */
function inferNameStyle(features) {
  const names = features.map((f) => f?.properties?.name).filter((n) => typeof n === 'string')
  if (!names.length) return { style: 'roman', displayName: false, order: false }
  const bilingual = names.filter((n) => /[(（][^)）]*[^\x00-\x7F][^)）]*[)）]\s*$/.test(n)).length
  const ascii = names.filter((n) => isAscii(n)).length
  const style =
    bilingual / names.length > 0.5 ? 'bilingual' : ascii / names.length > 0.6 ? 'roman' : 'native'
  const props = features.map((f) => f?.properties || {})
  return {
    style,
    displayName: props.filter((p) => 'display_name' in p).length / props.length > 0.5,
    order: props.filter((p) => typeof p.order === 'number').length / props.length > 0.5,
  }
}

/**
 * Some cities define `export const LINES = { U1: { name: 'U1', color: '#…' } }`
 * inline in config.ts instead of data/lines.json. Pull out id/name/color.
 */
function linesFromConfig(configPath) {
  let src
  try {
    src = fs.readFileSync(configPath, 'utf8')
  } catch {
    return {}
  }
  const start = src.search(/export const LINES\b/)
  if (start < 0) return {}
  const open = src.indexOf('{', src.indexOf('=', start))
  if (open < 0) return {}
  let depth = 0
  let end = -1
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end < 0) return {}
  const body = src.slice(open + 1, end)
  const lines = {}
  for (const m of body.matchAll(/(['"]?)([\w\- .]+)\1\s*:\s*\{([^{}]*)\}/g)) {
    const props = m[3]
    const name = props.match(/\bname\s*:\s*(['"`])((?:(?!\1).)*)\1/)
    const color = props.match(/\bcolor\s*:\s*(['"`])((?:(?!\1).)*)\1/)
    if (name) lines[m[2].trim()] = { name: name[2], color: color ? color[2] : '' }
  }
  return lines
}

function loadCity(slug, cityPathMap = loadCityPathMap()) {
  const rel = cityPathMap[slug]
  if (!rel) throw new Error(`unknown city slug "${slug}"`)
  const dir = path.join(GAME_ROOT, rel, 'data')
  const featuresPath = path.join(dir, 'features.json')
  const routesPath = path.join(dir, 'routes.json')
  const linesPath = path.join(dir, 'lines.json')

  const features = readJson(featuresPath)
  if (!features || !Array.isArray(features.features)) {
    throw new Error(`no features.json for "${slug}"`)
  }
  const routes = readJson(routesPath)
  const lines = readJson(linesPath) || linesFromConfig(path.join(GAME_ROOT, rel, 'config.ts'))
  const registry = readJson(path.join(ROOT, 'city-registry', `${slug}.json`))

  const bbox = validBbox(registry?.bbox) ? registry.bbox : bboxOfFeatures(features.features)
  const localLanguages = Array.isArray(registry?.localLanguages)
    ? registry.localLanguages.filter((l) => typeof l === 'string')
    : []

  return {
    slug,
    rel,
    dir,
    featuresPath,
    routesPath,
    linesPath,
    features,
    routes,
    lines,
    registry,
    bbox,
    localLanguages,
    modes: Array.isArray(registry?.modes) ? registry.modes : null,
    nameStyle: inferNameStyle(features.features),
  }
}

module.exports = {
  ROOT,
  GAME_ROOT,
  readJson,
  writeJsonLike,
  loadCityPathMap,
  listDataCities,
  loadCity,
  inferNameStyle,
}
