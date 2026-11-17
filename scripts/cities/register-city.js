#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Adds a city built by osm-city.js to the hand-maintained registries so it
 * shows up as a playable city:
 *
 *   src/lib/cityPathMap.ts        slug -> path
 *   src/lib/cityConfigRuntime.ts  lazy config import
 *   src/lib/availableCityData.ts  playable slug set
 *   src/lib/citiesConfig.ts       city card (and removes the placeholder flag)
 *   src/lib/cityCoordinates.ts    map pin
 *   src/lib/cityNameDisplay.ts    Chinese display name
 *   src/lib/achievements.ts       completion achievement
 *
 * Every step is idempotent: entries that already exist are left alone, so the
 * script can run after every build. Registry details come from the spec's
 * optional "register" block:
 *
 *   "register": {
 *     "name": "Perth, WA", "continent": "Oceania",
 *     "coordinates": [115.8605, -31.9505], "zh": "珀斯, WA",
 *     "achievement": { "title": "...", "description": "..." }
 *   }
 *
 * Usage: node scripts/cities/register-city.js <slug>... | --all
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const LIB = path.join(ROOT, 'src', 'lib')
const SPEC_DIR = path.join(ROOT, 'city-specs')
const GAME_ROOT = path.join(ROOT, 'src', 'app', '(game)')

const read = (f) => fs.readFileSync(path.join(LIB, f), 'utf8')
const write = (f, s) => fs.writeFileSync(path.join(LIB, f), s)
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/**
 * Insert `entry` (one or more lines) into the block that starts at the first
 * line matching `startRe`, before the first key that sorts after `slug`.
 * Keys are lines matching `keyRe` (first capture group = key).
 */
function insertSorted(text, { startRe, endRe, keyRe, slug, entry }) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => startRe.test(l))
  if (start < 0) throw new Error(`block start ${startRe} not found`)
  let end = lines.length - 1
  for (let i = start + 1; i < lines.length; i += 1) {
    if (endRe.test(lines[i])) {
      end = i
      break
    }
  }
  let at = end
  for (let i = start + 1; i < end; i += 1) {
    const m = lines[i].match(keyRe)
    if (m && m[1].localeCompare(slug) > 0) {
      at = i
      break
    }
  }
  lines.splice(at, 0, ...entry.split('\n'))
  return lines.join('\n')
}

function register(spec) {
  const { slug } = spec
  const reg = spec.register || {}
  const done = []
  const configFile = path.join(GAME_ROOT, spec.path, 'config.ts')
  if (!fs.existsSync(configFile))
    throw new Error(
      `${slug}: ${spec.path}/config.ts missing — build the city first`,
    )

  // cityPathMap.ts
  let s = read('cityPathMap.ts')
  if (!new RegExp(`^\\s+'${slug}':`, 'm').test(s)) {
    s = insertSorted(s, {
      startRe: /CITY_PATH_MAP/,
      endRe: /^};?\s*$/,
      keyRe: /^\s+'([^']+)':/,
      slug,
      entry: `  '${slug}': '${spec.path}',`,
    })
    write('cityPathMap.ts', s)
    done.push('cityPathMap')
  }

  // cityConfigRuntime.ts
  s = read('cityConfigRuntime.ts')
  if (!s.includes(`case '${slug}':`)) {
    s = insertSorted(s, {
      startRe: /switch \(slug\)/,
      endRe: /^\s+default:/,
      keyRe: /^\s+case '([^']+)':/,
      slug,
      entry: `    case '${slug}': {\n      const configModule = await import('@/app/(game)/${spec.path}/config')\n      return configModule.default\n    }`,
    })
    write('cityConfigRuntime.ts', s)
    done.push('cityConfigRuntime')
  }

  // availableCityData.ts
  s = read('availableCityData.ts')
  if (!new RegExp(`^\\s+'${slug}',`, 'm').test(s)) {
    s = insertSorted(s, {
      startRe: /AVAILABLE_CITY_SLUGS/,
      endRe: /^\]\)/,
      keyRe: /^\s+'([^']+)',/,
      slug,
      entry: `  '${slug}',`,
    })
    write('availableCityData.ts', s)
    done.push('availableCityData')
  }

  // citiesConfig.ts — card entry + placeholder flag
  s = read('citiesConfig.ts')
  const link = `/${spec.path}`
  const placeholderLine = new RegExp(
    `^\\s+'${spec.path.replace(/[/]/g, '\\/')}',\\n`,
    'm',
  )
  if (placeholderLine.test(s)) {
    s = s.replace(placeholderLine, '')
    done.push('citiesConfig placeholder removed')
  }
  const linkIdx = s.indexOf(`link: '${link}',`)
  if (linkIdx >= 0) {
    // Drop hideInStats from this entry only (placeholders hide from stats).
    const close = s.indexOf('\n  },', linkIdx)
    const body = s.slice(linkIdx, close)
    if (/\n\s+hideInStats: true,/.test(body)) {
      s =
        s.slice(0, linkIdx) +
        body.replace(/\n\s+hideInStats: true,/, '') +
        s.slice(close)
      done.push('citiesConfig hideInStats removed')
    }
  } else if (reg.name && reg.continent) {
    const entry = `  {\n    name: ${q(reg.name)},\n    link: ${q(link)},\n    continent: ${q(reg.continent)},\n  },`
    // Insert before the first card of the same continent whose name sorts after ours.
    const re =
      /\n  \{\n    name: '((?:[^'\\]|\\.)*)',\n(?:    [^\n]*\n)*?    continent: '([^']+)',/g
    let at = -1
    let lastSame = -1
    let m
    while ((m = re.exec(s))) {
      if (m[2] !== reg.continent) continue
      lastSame = m.index
      if (m[1].localeCompare(reg.name) > 0 && at < 0) at = m.index
    }
    if (at < 0 && lastSame >= 0)
      at = s.indexOf('\n  },', lastSame) + '\n  },'.length
    if (at < 0)
      throw new Error(`${slug}: no ${reg.continent} section in citiesConfig.ts`)
    s = `${s.slice(0, at)}\n${entry}${s.slice(at)}`
    done.push('citiesConfig card')
  }
  write('citiesConfig.ts', s)

  // cityCoordinates.ts / cityNameDisplay.ts / achievements.ts — append when missing.
  const keyed = (file, value, startRe) => {
    let t = read(file)
    if (new RegExp(`^\\s+'?${slug}'?:`, 'm').test(t)) return
    t = insertSorted(t, {
      startRe,
      endRe: /^\}/,
      keyRe: /^  '?([a-z0-9-]+)'?:/,
      slug,
      entry: value,
    })
    write(file, t)
    done.push(file.replace(/\.ts$/, ''))
  }
  if (reg.coordinates) {
    const [lon, lat] = reg.coordinates
    keyed(
      'cityCoordinates.ts',
      `  '${slug}': [${lon.toFixed(4)}, ${lat.toFixed(4)}],`,
      /=\s*\{/,
    )
  }
  if (reg.zh)
    keyed('cityNameDisplay.ts', `  '${slug}': ${q(reg.zh)},`, /=\s*\{/)
  if (reg.achievement) {
    keyed(
      'achievements.ts',
      `  '${slug}': {\n    title: ${JSON.stringify(reg.achievement.title)},\n    description: ${JSON.stringify(reg.achievement.description)},\n  },`,
      /ACHIEVEMENTS[^=]*=\s*\{/,
    )
  }
  return done
}

function main() {
  const args = process.argv.slice(2)
  const slugs = args.includes('--all')
    ? fs
        .readdirSync(SPEC_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
    : args
  let failed = 0
  for (const slug of slugs) {
    const spec = JSON.parse(
      fs.readFileSync(path.join(SPEC_DIR, `${slug}.json`), 'utf8'),
    )
    try {
      const done = register(spec)
      console.log(
        `${slug}: ${done.length ? done.join(', ') : 'already registered'}`,
      )
    } catch (error) {
      failed += 1
      console.error(`${slug}: ${error.message}`)
    }
  }
  process.exitCode = failed ? 1 : 0
}

if (require.main === module) main()

module.exports = { insertSorted, register }
