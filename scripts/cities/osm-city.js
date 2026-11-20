#!/usr/bin/env node
/**
 * Builds a city's game data from OpenStreetMap.
 *
 * Reads city-specs/<slug>.json (which lines exist, their names/colours, and how
 * to recognise each line's OSM route relations), downloads the route relations,
 * their track and stops from Overpass, and writes:
 *   src/app/(game)/<path>/data/{features,routes,lines}.json
 *   src/app/(game)/<path>/{config,metadata,page}.tsx|ts   (replacing a placeholder)
 *
 *   node scripts/cities/osm-city.js --spec=perth            # build one (skips if unchanged)
 *   node scripts/cities/osm-city.js --all                   # build every spec that changed
 *   node scripts/cities/osm-city.js --spec=perth --force
 *   node scripts/cities/osm-city.js --spec=perth --fixture=overpass.json
 *
 * Needs network access to Overpass, so it runs in GitHub Actions
 * (.github/workflows/city-build.yml). Data © OpenStreetMap contributors (ODbL).
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { ROOT, GAME_ROOT } = require('../upcoming/lib/city')
const { haversine } = require('../upcoming/lib/geo')

const SPEC_DIR = path.join(ROOT, 'city-specs')
// Bump when the build logic changes so every city rebuilds.
const BUILDER_VERSION = 7

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const ROUTE_TYPES = 'subway|light_rail|train|tram|monorail|railway|funicular'
const STOP_ROLE =
  /^(stop|stop_entry_only|stop_exit_only|forward_stop|backward_stop)(_\d+)?$/
const PLATFORM_ROLE = /^platform(_entry_only|_exit_only)?(_\d+)?$/

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

// ------------------------------------------------------------------ fetch

function buildQuery(bbox) {
  const [s, w, n, e] = bbox
  return `[out:json][timeout:600][maxsize:268435456][bbox:${s},${w},${n},${e}];
rel["type"="route"]["route"~"^(${ROUTE_TYPES})$"]->.r;
.r out body;
way(r.r)->.w;
.w out geom;
node(r.r)->.n;
.n out;
(
  node["railway"~"^(station|halt|tram_stop)$"];
  node["public_transport"="station"];
  way["public_transport"="station"];
  way["railway"="station"];
)->.s;
.s out center;`
}

async function fetchOverpass(query) {
  let last = null
  for (let pass = 0; pass < 4; pass += 1) {
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(15 * 60 * 1000),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
              'MetroMemoryCityBuilder/1.0 (+https://github.com/kirklandwaterbot/metro-memory)',
          },
          body: `data=${encodeURIComponent(query)}`,
        })
        if (res.ok) {
          const json = await res.json()
          // Mirrors can lag days behind OSM; a stale answer would undo recent edits.
          const base = Date.parse(json?.osm3s?.timestamp_osm_base || '')
          const ageH = (Date.now() - base) / 3600000
          if (!Number.isFinite(ageH) || ageH < 48) return json
          console.error(
            `  ${endpoint}: data is ${Math.round(ageH)} h old, trying another server`,
          )
          last = new Error(
            `${endpoint}: stale data (${Math.round(ageH)} h old)`,
          )
          continue
        }
        console.error(`  ${endpoint}: HTTP ${res.status}`)
        last = new Error(
          `${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`,
        )
        if (res.status === 400) throw last
      } catch (error) {
        console.error(`  ${endpoint}: ${String(error.message).slice(0, 200)}`)
        last = error
        if (String(error.message).includes('HTTP 400')) throw error
      }
      await new Promise((r) => setTimeout(r, 30000 * (pass + 1)))
    }
  }
  throw last
}

// ------------------------------------------------------------------ helpers

const lower = (v) => String(v ?? '').toLowerCase()

function matches(rule, tags) {
  for (const [key, pattern] of Object.entries(rule || {})) {
    if (key === 'exclude') continue
    const re = new RegExp(pattern, 'i')
    if (key === 'name') {
      const hay = [tags.name, tags['name:en'], tags.ref, tags.official_name]
        .filter(Boolean)
        .join(' | ')
      if (!re.test(hay)) return false
    } else if (!re.test(String(tags[key] ?? ''))) {
      return false
    }
  }
  if (rule?.exclude) {
    const hay = [tags.name, tags['name:en'], tags.ref]
      .filter(Boolean)
      .join(' | ')
    if (new RegExp(rule.exclude, 'i').test(hay)) return false
  }
  return true
}

/** "Central Station, Platform 3" -> "Central"; "Flinders Street Railway Station" -> "Flinders Street". */
function cleanStationName(raw, keepWords = []) {
  let s = String(raw || '').trim()
  s = s.replace(/^stop\s+[a-z]?\d+[a-z]?\s*:\s*/i, '') // Melbourne/Adelaide: "Stop 71: RMIT Bundoora Campus"
  s = s.replace(
    /\s*[,(-]\s*(platform|plat\.?|stand|stop|bay)\s*[\w/ ]+\)?\s*$/i,
    '',
  )
  s = s.replace(/\s+(platform|plat\.?)\s+[\w/]+$/i, '')
  const suffix =
    /\s+(railway station|train station|light rail station|light rail stop|tram stop|metro station|station|stn|stop)$/i
  if (!keepWords.some((w) => new RegExp(`${w}$`, 'i').test(s)))
    s = s.replace(suffix, '')
  return s.replace(/\s{2,}/g, ' ').trim()
}

const normName = (s) =>
  lower(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’.]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** Split a polyline into the runs that lie inside bbox [s, w, n, e] (all of it when no bbox). */
function lineStrings(points, bbox) {
  if (!bbox) return points.length > 1 ? [points] : []
  const out = []
  let run = []
  for (const p of points) {
    if (inBbox(p, bbox)) run.push(p)
    else {
      if (run.length > 1) out.push(run)
      run = []
    }
  }
  if (run.length > 1) out.push(run)
  return out
}

const inBbox = ([lon, lat], [s, w, n, e]) =>
  lat >= s && lat <= n && lon >= w && lon <= e

/** Douglas–Peucker in metres. */
function simplify(points, tol = 2) {
  if (points.length < 3) return points
  const k = Math.cos((points[0][1] * Math.PI) / 180) * 111320
  const xy = points.map(([x, y]) => [x * k, y * 111320])
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let best = -1
    let idx = -1
    for (let i = a + 1; i < b; i += 1) {
      const d =
        Math.abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) /
        len
      if (d > best) {
        best = d
        idx = i
      }
    }
    if (best > tol) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

const round = ([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6]

// ------------------------------------------------------------------ build

const PALETTE = [
  '#E4002B',
  '#0072CE',
  '#00A651',
  '#F7A800',
  '#7D3F98',
  '#00A7B5',
  '#D4006A',
  '#8C6E4A',
  '#5C6670',
  '#F26522',
]

/** Most common `colour` tag among the matched relations, as #RRGGBB. */
function osmColour(rels) {
  const counts = new Map()
  for (const r of rels) {
    let c = String(r.tags?.colour || '').trim()
    if (/^[0-9a-f]{6}$/i.test(c)) c = `#${c}`
    if (!/^#[0-9a-f]{6}$/i.test(c)) continue
    c = c.toUpperCase()
    counts.set(c, (counts.get(c) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

/** public_transport=station that only serves buses or ferries (e.g. "Whitfords Bus Terminal"). */
function isBusOnly(t) {
  if (t.railway) return false
  if (
    ['train', 'subway', 'light_rail', 'tram', 'monorail'].some(
      (m) => t[m] === 'yes',
    )
  )
    return false
  return (
    t.bus === 'yes' ||
    t.ferry === 'yes' ||
    t.amenity === 'bus_station' ||
    /\b(bus|ferry|coach)\b/i.test(t.name || '')
  )
}

function indexOsm(osm) {
  const rels = []
  const ways = new Map()
  const nodes = new Map()
  const stations = []
  for (const el of osm.elements || []) {
    if (el.type === 'relation') rels.push(el)
    else if (el.type === 'way' && el.geometry) ways.set(el.id, el)
    else if (el.type === 'node') nodes.set(el.id, el)
    const t = el.tags || {}
    const isStation =
      ['station', 'halt', 'tram_stop'].includes(t.railway) ||
      (t.public_transport === 'station' && !isBusOnly(t))
    const heritage =
      t.usage === 'tourism' ||
      t.disused === 'yes' ||
      Boolean(t['disused:railway']) ||
      /\b(former|disused|closed)\b/i.test(t.name || '') ||
      t['railway:preserved'] === 'yes' ||
      Boolean(t.historic) ||
      /\b(heritage|museum|miniature|tramway)\b/i.test(t.name || '')
    if (isStation && !heritage && t.name) {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (typeof lat === 'number')
        stations.push({
          id: `${el.type}/${el.id}`,
          coordinates: [lon, lat],
          tags: t,
        })
    }
  }
  return { rels, ways, nodes, stations }
}

function nearestStation(stations, point, radius, preferName) {
  let best = null
  for (const s of stations) {
    const d = haversine(point, s.coordinates)
    if (d > radius) continue
    const want = preferName ? normName(preferName) : ''
    const have = normName(s.tags.name)
    const bonus =
      want && have === want ? 0.3 : want && have.includes(want) ? 0.6 : 1
    const score = d * bonus
    if (!best || score < best.score) best = { ...s, score, d }
  }
  return best
}

const TRANSLIT = {
  ru: {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  },
  uk: {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
    з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
    о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '',
  },
  be: {
    а: 'a', б: 'b', в: 'v', г: 'h', д: 'd', е: 'ye', ё: 'yo', ж: 'zh', з: 'z',
    і: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ў: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
    ш: 'sh', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', "'": '', '’': '',
  },
  ka: {
    ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
    კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
    ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch',
    ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
  },
  hy: {
    ա: 'a', բ: 'b', գ: 'g', դ: 'd', ե: 'e', զ: 'z', է: 'e', ը: 'y', թ: 't',
    ժ: 'zh', ի: 'i', լ: 'l', խ: 'kh', ծ: 'ts', կ: 'k', հ: 'h', ձ: 'dz',
    ղ: 'gh', ճ: 'ch', մ: 'm', յ: 'y', ն: 'n', շ: 'sh', ո: 'o', չ: 'ch',
    պ: 'p', ջ: 'j', ռ: 'r', ս: 's', վ: 'v', տ: 't', ր: 'r', ց: 'ts',
    ու: 'u', փ: 'p', ք: 'k', օ: 'o', ֆ: 'f', և: 'yev',
  },
}

const VOWELS = 'аеёиоуыэюяіїєaeiouy'

/**
 * Romanises a station name the way English Wikipedia spells these systems
 * (Russian: "Ploshchad Revolyutsii", Ukrainian national system "Maidan
 * Nezalezhnosti"), word by word with each word capitalised.
 */
function transliterate(text, lang) {
  const table = TRANSLIT[lang] || TRANSLIT.ru
  const src = String(text || '')
  if (lang === 'hy') {
    let out = ''
    for (const ch of src.replace(/ու/g, '\u0001').replace(/Ու|ՈՒ/g, '\u0002')) {
      if (ch === '\u0001') out += 'u'
      else if (ch === '\u0002') out += 'U'
      else {
        const lo = ch.toLowerCase()
        const prevCh = out.slice(-1)
        let m = table[lo]
        if (lo === 'ե' && (!prevCh || /\s/.test(prevCh))) m = 'ye'
        if (lo === 'և' && prevCh && !/\s/.test(prevCh)) m = 'ev'
        out += m === undefined ? ch : ch !== lo && m ? m[0].toUpperCase() + m.slice(1) : m
      }
    }
    return titleCase(out)
  }
  const chars = [...src]
  let out = ''
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]
    const lo = ch.toLowerCase()
    const prev = (chars[i - 1] || ' ').toLowerCase()
    const next = (chars[i + 1] || ' ').toLowerCase()
    const wordStart = !/[\p{L}'’ʼ]/u.test(prev)
    const afterVowel = VOWELS.includes(prev) || 'ьъ\'’ʼ'.includes(prev)
    const wordEnd = !/\p{L}/u.test(next)
    let m = table[lo] ?? TRANSLIT.ru[lo]
    if (m !== undefined && lang !== 'ka') {
      if (lang === 'uk') {
        if (wordStart && { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' }[lo])
          m = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' }[lo]
        if (lo === 'г' && prev === 'з') m = 'gh'
      } else {
        // Russian / Belarusian
        if (lo === 'е') m = (wordStart || afterVowel) && prev !== 'ы' ? 'ye' : 'e'
        if ((lo === 'и' || lo === 'ы') && next === 'й' && wordEnd === false) {
          const after = (chars[i + 2] || ' ').toLowerCase()
          if (!/\p{L}/u.test(after)) {
            out += ch !== lo ? 'Y' : 'y'
            i += 1
            continue
          }
        }
        if (lo === 'ь' && next === 'и') m = 'y'
      }
    }
    if (m === undefined) {
      out += ch
      continue
    }
    out += ch !== lo && m ? m[0].toUpperCase() + m.slice(1) : m
  }
  return titleCase(out)
}

const HANGUL_INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const HANGUL_MEDIAL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const HANGUL_FINAL = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']

/** Revised Romanization of Hangul (syllable by syllable, word-initial r -> r). */
function romanizeKorean(text) {
  let out = ''
  for (const ch of String(text || '')) {
    const c = ch.codePointAt(0) - 0xac00
    if (c < 0 || c > 11171) {
      out += ch
      continue
    }
    const ini = Math.floor(c / 588)
    const med = Math.floor((c % 588) / 28)
    const fin = c % 28
    let syl = HANGUL_INITIAL[ini] + HANGUL_MEDIAL[med] + HANGUL_FINAL[fin]
    // a lone r at the start of a word reads as r in the North (Ryongsong)
    out += syl
  }
  return titleCase(out)
}

/** "ploshchad revolyutsii" -> "Ploshchad Revolyutsii" (keeps "Moskva-Siti"). */
function titleCase(s) {
  return String(s)
    .replace(/(^|[\s(«"„]|(?<!\d)[-–])(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase())
    .replace(/(?<=\p{L}\s)(I|Na|V|U|Pri|Imeni)(?=\s)/gu, (w) =>
      w === 'Imeni' ? w : w.toLowerCase(),
    )
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Station label. With spec.localName (e.g. Japan: {"tag": "name", "enTags":
 * ["name:en", "name:ja-Latn"], "altTags": ["name:ja-Hira"], "strip": "駅$"})
 * the name is "English (local)" and the local/kana names become answers.
 * spec.altTags adds answers for Latin-script cities (e.g. "alt_name").
 */
function stationLabel(spec, tags, fallbackRaw) {
  const t = tags || {}
  const strip = spec.stripPrefix ? new RegExp(spec.stripPrefix, 'i') : null
  const clean = (v) => {
    const x = cleanStationName(v, spec.keepSuffix)
    return strip ? x.replace(strip, '').trim() : x
  }
  const loc = spec.localName
  let name
  const alternates = []
  if (loc) {
    const strip = loc.strip ? new RegExp(loc.strip) : null
    const tidyLocal = (v) => {
      let x = String(v || '').trim()
      x = x.replace(/[（(][^）)]*[）)]\s*$/, '').trim()
      if (strip) x = x.replace(strip, '').trim()
      return x
    }
    const local = tidyLocal(t[loc.tag || 'name'] || fallbackRaw)
    const enRaw = (loc.enTags || ['name:en']).map((k) => t[k]).find(Boolean)
    let en = enRaw ? clean(enRaw) : ''
    if (!en && loc.romanize === 'ko' && local) en = romanizeKorean(local)
    // "Hondori (Peace Memorial Park)": the bracket is an answer, not the name
    const paren = en.match(/^(.+?)\s*\(([^)]+)\)$/)
    if (paren) {
      en = paren[1]
      alternates.push(paren[2])
    }
    // One English spelling per local name across the city (OSM mixes
    // "Hondōri" and "Hondori" for 本通), so same-named stops still group.
    spec.__enByLocal = spec.__enByLocal || new Map()
    if (local && en && !spec.__enByLocal.has(local)) spec.__enByLocal.set(local, en)
    if (local && spec.__enByLocal.has(local)) {
      const first = spec.__enByLocal.get(local)
      if (en && first !== en) alternates.push(en)
      en = first
    }
    if (en && local && normName(en) !== normName(local)) name = `${en} (${local})`
    else name = en || local
    if (local) alternates.push(local)
    for (const k of loc.altTags || []) if (t[k]) alternates.push(tidyLocal(t[k]))
    if (en) alternates.push(en)
  } else if (spec.transliterate) {
    // Cyrillic/Georgian/Armenian etc.: a Latin name is shown, and the local
    // script, OSM's English name and romanised Russian names are answers.
    const tidy = (v) => {
      let x = clean(String(v || '').replace(/[«»"„“”]/g, ''))
      if (spec.localStrip) x = x.replace(new RegExp(spec.localStrip), '').trim()
      return x
    }
    const local = tidy(t.name || fallbackRaw)
    const en = tidy((spec.enTags || ['name:en']).map((k) => t[k]).find(Boolean))
    const auto = transliterate(local, spec.transliterate)
    const mode = spec.display || 'translit'
    if (mode === 'local') name = titleCase(local)
    else if (mode === 'en') name = en ? titleCase(en) : auto
    else name = auto
    // Same spelling for every stop sharing a local name (transfers group).
    spec.__enByLocal = spec.__enByLocal || new Map()
    if (local && !spec.__enByLocal.has(local)) spec.__enByLocal.set(local, name)
    if (local && spec.__enByLocal.get(local) !== name) {
      alternates.push(name)
      name = spec.__enByLocal.get(local)
    }
    alternates.push(local, en, auto)
    const ru = tidy(t['name:ru'])
    if (ru) alternates.push(ru, transliterate(ru, 'ru'))
    if (spec.transliterate !== 'ru' && spec.transliterate !== 'uk' && spec.transliterate !== 'be') {
      // nothing extra
    } else if (spec.transliterate !== 'ru' && /[Ѐ-ӿ]/.test(local)) {
      alternates.push(transliterate(local, 'ru'))
    }
  } else {
    name = clean(t[spec.nameTag || 'name'] || t.name || fallbackRaw)
    if (spec.localStrip) name = name.replace(new RegExp(spec.localStrip), '').trim()
  }
  for (const k of spec.altTags || []) {
    for (const v of String(t[k] || '').split(';')) if (v.trim()) alternates.push(clean(v))
  }
  // "Callao (B)" -> "Callao": the line letter only disambiguates in OSM.
  // "Uruguai / Tijuca" -> "Uruguai" (the neighbourhood stays an answer).
  if (spec.primaryBeforeSlash && /\s\/\s/.test(name)) {
    const parts = name.split(/\s+\/\s+/)
    alternates.push(...parts.slice(1))
    name = parts[0]
  }
  if (spec.stripLineSuffix) name = name.replace(/\s*\([A-Z0-9]{1,3}\)$/, '')
  for (const [re, to] of spec.nameReplace || []) {
    const next = name.replace(new RegExp(re, 'g'), to).replace(/\s{2,}/g, ' ').trim()
    if (next !== name) {
      alternates.push(name)
      name = next
    }
  }
  name = (spec.rename || {})[name] || name
  for (const a of (spec.alternates || {})[name] || []) alternates.push(a)
  // "Congreso - Raúl Alfonsín": each part is an answer too.
  if (spec.splitDash) {
    const sep = spec.splitHyphen
      ? /\s*[-–—•]\s*|\s+\/\s+/
      : /\s+[-–—•\/]\s+/
    for (const part of name.split(sep)) if (part !== name) alternates.push(part)
  }
  const alts = [...new Set(alternates.filter((a) => a && a !== name))]
  return { name, alternates: alts }
}

/** Stops of one relation in order, as {name, coordinates}. */
function relationStops(rel, idx, spec, mode) {
  // Heavy rail stops shouldn't snap to tram stops on the street outside.
  const railOnly = !['tram', 'light_rail'].includes(mode)
  const candidates = railOnly
    ? idx.stations.filter(
        (st) =>
          st.tags.railway !== 'tram_stop' &&
          !(
            mode === 'train' &&
            st.tags.station === 'subway' &&
            st.tags.train !== 'yes'
          ) &&
          !(
            st.tags.tram === 'yes' &&
            st.tags.train !== 'yes' &&
            st.tags.subway !== 'yes' &&
            !st.tags.railway
          ),
      )
    : idx.stations
  const radius =
    mode === 'tram' || mode === 'light_rail'
      ? (spec.tramStationRadius ?? 120)
      : (spec.stationRadius ?? 300)
  const out = []
  let members = (rel.members || []).filter((m) => STOP_ROLE.test(m.role || ''))
  if (!members.length)
    members = (rel.members || []).filter((m) =>
      PLATFORM_ROLE.test(m.role || ''),
    )
  for (const m of members) {
    let point = null
    let ownName = null
    if (m.type === 'node' && idx.nodes.has(m.ref)) {
      const n = idx.nodes.get(m.ref)
      point = [n.lon, n.lat]
      ownName = n.tags?.name?.replace(/\s+\d+[A-Za-z]?$/, '')
    } else if (m.type === 'way' && idx.ways.has(m.ref)) {
      const w = idx.ways.get(m.ref)
      const g = w.geometry
      point = [
        g.reduce((s, p) => s + p.lon, 0) / g.length,
        g.reduce((s, p) => s + p.lat, 0) / g.length,
      ]
      ownName = w.tags?.name
    }
    if (!point) continue
    const st = nearestStation(
      candidates,
      point,
      radius,
      cleanStationName(ownName),
    )
    const rawTags = st?.tags || (ownName ? { name: ownName } : null)
    if (!rawTags?.name && !ownName) continue
    const { name, alternates } = stationLabel(spec, rawTags, ownName)
    if (!name) continue
    const coordinates = st ? st.coordinates : point
    const prev = out[out.length - 1]
    if (prev && normName(prev.name) === normName(name)) continue
    out.push({ name, alternates, coordinates })
  }
  return out
}

function buildLine(line, rels, idx, spec) {
  const mode = rels[0]?.tags?.route
  let sequences = rels
    .map((r) => relationStops(r, idx, spec, mode))
    .filter((s) => s.length)
  const untrimmed = sequences.flat()
  if (line.between) {
    // Keep only the part of each service between two named stations (inclusive),
    // e.g. the Sunbury end of a cross-city through service.
    const [from, to] = line.between.map(normName)
    sequences = sequences
      .map((seq) => {
        const a = seq.findIndex((x) => normName(x.name) === from)
        const b = seq.findIndex((x) => normName(x.name) === to)
        if (a < 0 || b < 0) return null
        return a <= b ? seq.slice(a, b + 1) : seq.slice(b, a + 1).reverse()
      })
      .filter((seq) => seq && seq.length)
  }
  sequences.sort((a, b) => b.length - a.length)

  // Merge every relation's stops into one ordered list (longest first).
  const stations = []
  const sameStation = (a, b) =>
    normName(a.name) === normName(b.name) &&
    haversine(a.coordinates, b.coordinates) < (spec.mergeRadius ?? 800)
  for (const seq of sequences) {
    for (let i = 0; i < seq.length; i += 1) {
      const s = seq[i]
      if (stations.some((x) => sameStation(x, s))) continue
      // Insert next to the previous stop of this sequence when we know it.
      let at = stations.length
      for (let j = i - 1; j >= 0; j -= 1) {
        const k = stations.findIndex((x) => sameStation(x, seq[j]))
        if (k >= 0) {
          at = k + 1
          break
        }
      }
      stations.splice(at, 0, s)
    }
  }
  // Some networks only tag the terminals as stops (e.g. Adelaide Metro):
  // fall back to the stations that sit on the line's own track.
  const forceTrack = spec.stationsFromTrack || line.stationsFromTrack
  // (skipped when the line is pinned by pathBetween/stationList: on a
  // whole national network the greedy chaining would be wasted work)
  if (!line.pathBetween && !line.stationList && (forceTrack || (mode !== 'tram' && stations.length < 3))) {
    let along = stationsAlongTrack(rels, idx, spec, mode)
    if (line.between) {
      const [from, to] = line.between.map(normName)
      const a = along.findIndex((x) => normName(x.name) === from)
      const b = along.findIndex((x) => normName(x.name) === to)
      if (a >= 0 && b >= 0)
        along = a <= b ? along.slice(a, b + 1) : along.slice(b, a + 1).reverse()
    }
    if (along.length > stations.length || line.between) {
      stations.length = 0
      stations.push(...along)
    }
  }
  // National networks where every station belongs to the operator that
  // manages it (UK TOCs): "stationTags": {"operator": "^ScotRail$"}.
  if (line.stationTags) {
    stations.length = 0
    const picked = idx.stations.filter((st) => {
      if (spec.bbox && !inBbox(st.coordinates, spec.bbox)) return false
      return Object.entries(line.stationTags).every(([k, re]) =>
        new RegExp(re, 'i').test(String(st.tags[k] ?? '')),
      )
    })
    for (const st of picked) {
      const { name, alternates } = stationLabel(spec, st.tags)
      if (!name || stations.some((x) => normName(x.name) === normName(name))) continue
      stations.push({ name, alternates, coordinates: st.coordinates })
    }
    stations.sort((a, b) => a.name.localeCompare(b.name))
  }
  let pathTrack = null
  if (line.pathBetween) {
    pathTrack = trackPathBetween(rels, idx, { ...spec, trackJoinM: line.trackJoinM ?? spec.trackJoinM }, line.pathBetween)
    if (pathTrack) {
      stations.length = 0
      stations.push(...stationsAlongPath(pathTrack, idx, spec))
    }
  }
  // An authoritative station list (e.g. from Wikipedia) for lines whose OSM
  // relations list no stops: each name is matched to the OSM station of that
  // name nearest the line's own track, so a same-named metro station nearby
  // or a conventional station the viaduct passes isn't picked up.
  if (line.stationList) {
    const pts = []
    for (const r of rels)
      for (const w of trackWays(r, idx))
        for (let i = 0; i < w.geometry.length; i += 3)
          pts.push([w.geometry[i].lon, w.geometry[i].lat])
    const distToTrack = (c) => {
      let best = Infinity
      for (const p of pts) {
        const d = haversine(c, p)
        if (d < best) best = d
      }
      return best
    }
    const strip = spec.localName?.strip ? new RegExp(spec.localName.strip) : null
    const key = (v) => normName(String(v || '').replace(strip || /$^/, ''))
    stations.length = 0
    for (const wanted of line.stationList) {
      const k = key(wanted)
      let best = null
      for (const st of idx.stations) {
        const t = st.tags || {}
        if (key(t[spec.localName?.tag || 'name']) !== k && key(t.name) !== k)
          continue
        if (t.railway === 'tram_stop' || t.subway === 'yes') continue
        const d = pts.length ? distToTrack(st.coordinates) : 0
        if (!best || d < best.d) best = { d, st }
      }
      if (!best || best.d > (line.stationListMaxM ?? 1500)) {
        console.error(`  ${line.id}: no OSM station near the track for ${wanted}`)
        continue
      }
      const { name, alternates } = stationLabel(spec, best.st.tags, wanted)
      stations.push({ name, alternates, coordinates: best.st.coordinates })
    }
  }
  // The same station twice on one line (a stray stop in the relation)
  for (let i = stations.length - 1; i > 0; i -= 1) {
    const k = normName(stations[i].name)
    if (stations.slice(0, i).some((x) => normName(x.name) === k))
      stations.splice(i, 1)
  }
  // Stations of another line that this service runs through (e.g. a line
  // whose trains continue over a neighbour's track): drop them by name.
  for (const drop of line.removeStations || []) {
    const k = stations.findIndex((x) => normName(x.name) === normName(drop))
    if (k >= 0) stations.splice(k, 1)
  }
  for (const extra of line.addStations || []) {
    if (stations.some((x) => normName(x.name) === normName(extra.name)))
      continue
    let coordinates = extra.coordinates
    if (!coordinates) {
      // Name only: take the OSM station of that name (inside the bbox).
      const hit = idx.stations.find(
        (st) =>
          normName(cleanStationName(st.tags.name)) ===
            normName(extra.osmName || extra.name) &&
          st.tags.railway !== 'tram_stop' &&
          (!spec.bbox || inBbox(st.coordinates, spec.bbox)),
      )
      if (!hit) continue
      coordinates = hit.coordinates
    }
    let item = {
      name: extra.name,
      ...(extra.alternates ? { alternates: extra.alternates } : {}),
      coordinates,
    }
    if (extra.osmName && !extra.coordinates) {
      const hitTags = idx.stations.find(
        (st) =>
          normName(cleanStationName(st.tags.name)) === normName(extra.osmName),
      )?.tags
      if (hitTags) item = { ...stationLabel(spec, hitTags), coordinates }
    }
    const anchor = extra.before || extra.after
    const k = anchor
      ? stations.findIndex((x) => normName(x.name) === normName(anchor))
      : -1
    if (k < 0) stations.push(item)
    else stations.splice(extra.before ? k : k + 1, 0, item)
  }
  const dropped = new Set((line.removeStations || []).map(normName))
  const finalStations = stations.filter(
    (s) =>
      !dropped.has(normName(s.name)) &&
      (!spec.bbox || inBbox(s.coordinates, spec.bbox)),
  )

  // Track: every way member that isn't a platform or stop.
  const wayIds = new Set()
  const extraWayIds = new Set()
  if (line.extraTrack) {
    for (const r of idx.rels.filter((x) =>
      matches(line.extraTrack, x.tags || {}),
    )) {
      for (const m of r.members || [])
        if (m.type === 'way') extraWayIds.add(m.ref)
    }
  }
  for (const r of rels) {
    for (const m of r.members || []) {
      if (
        m.type === 'way' &&
        !PLATFORM_ROLE.test(m.role || '') &&
        !STOP_ROLE.test(m.role || '')
      )
        wayIds.add(m.ref)
    }
  }
  // With `between`, draw only the track nearer a kept station than a dropped one.
  let keepTrack = null
  if (line.between) {
    const kept = new Set(finalStations.map((x) => normName(x.name)))
    const ref = [
      ...finalStations.map((x) => ({ c: x.coordinates, keep: true })),
      ...untrimmed
        .filter((x) => !kept.has(normName(x.name)))
        .map((x) => ({ c: x.coordinates, keep: false })),
    ]
    keepTrack = (p) => {
      let best = null
      for (const r of ref) {
        const d = haversine(p, r.c)
        if (!best || d < best.d) best = { d, keep: r.keep }
      }
      return !best || best.keep
    }
  }
  const strings = []
  let lengthM = 0
  if (pathTrack) {
    const pts = simplify(pathTrack, spec.simplifyM ?? 2).map(round)
    for (const run of lineStrings(pts, spec.bbox)) {
      strings.push(run)
      lengthM += run.slice(1).reduce((a, p, i) => a + haversine(run[i], p), 0)
    }
    wayIds.clear()
    extraWayIds.clear()
  }
  // Extra track (e.g. a newly converted section missing from the route relation)
  // is kept only near the line's stations.
  const nearLine = (pt) =>
    finalStations.some(
      (x) => haversine(pt, x.coordinates) <= (line.extraTrackRadius ?? 900),
    )
  for (const id of [
    ...wayIds,
    ...[...extraWayIds].filter((x) => !wayIds.has(x)),
  ]) {
    const isExtra = !wayIds.has(id)
    const w = idx.ways.get(id)
    if (!w) continue
    const pts = simplify(
      w.geometry.map((p) => [p.lon, p.lat]),
      spec.simplifyM ?? 2,
    ).map(round)
    for (const s of keepNear(
      keepNear(lineStrings(pts, spec.bbox), keepTrack),
      isExtra ? nearLine : null,
    )) {
      strings.push(s)
      lengthM += s.slice(1).reduce((a, p, i) => a + haversine(s[i], p), 0)
    }
  }
  return { stations: finalStations, strings, lengthM, relations: rels.length }
}

function trackWays(rel, idx) {
  return (rel.members || [])
    .filter(
      (m) =>
        m.type === 'way' &&
        !PLATFORM_ROLE.test(m.role || '') &&
        !STOP_ROLE.test(m.role || ''),
    )
    .map((m) => idx.ways.get(m.ref))
    .filter(Boolean)
}

/**
 * Shortest path along the line's track between two named stations (Dijkstra
 * over the member ways), for national lines whose relations hold whole
 * networks: "pathBetween": ["Bangkok", "Lop Buri"]. Returns the path as
 * [lon, lat] points, or null when either station or a connection is missing.
 */
function trackPathBetween(rels, idx, spec, names) {
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`
  const coords = new Map()
  const adj = new Map()
  const link = (a, b) => {
    const ka = key(a)
    const kb = key(b)
    if (ka === kb) return
    coords.set(ka, a)
    coords.set(kb, b)
    const d = haversine(a, b)
    if (!adj.has(ka)) adj.set(ka, [])
    if (!adj.has(kb)) adj.set(kb, [])
    adj.get(ka).push([kb, d])
    adj.get(kb).push([ka, d])
  }
  for (const r of rels)
    for (const w of trackWays(r, idx))
      for (let i = 1; i < w.geometry.length; i += 1)
        link(
          [w.geometry[i - 1].lon, w.geometry[i - 1].lat],
          [w.geometry[i].lon, w.geometry[i].lat],
        )
  if (!adj.size) return null
  // Tracks of a double-track line or a junction often meet without sharing a
  // node: join every way end to any track point within 30 m.
  const grid = new Map()
  const cell = (p) => `${Math.floor(p[0] / 0.0005)},${Math.floor(p[1] / 0.0005)}`
  for (const [k, c] of coords) {
    const g = cell(c)
    if (!grid.has(g)) grid.set(g, [])
    grid.get(g).push(k)
  }
  const ends = []
  for (const r of rels)
    for (const w of trackWays(r, idx)) {
      const g = w.geometry
      ends.push([g[0].lon, g[0].lat], [g[g.length - 1].lon, g[g.length - 1].lat])
    }
  const joinM = spec.trackJoinM ?? 30
  const reach = Math.ceil(joinM / 50)
  // union-find over track points, so gaps are bridged between different
  // pieces only (never as shortcuts within a connected stretch)
  const parent = new Map()
  const find = (k) => {
    let r = k
    while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)
    let c = k
    while (parent.has(c) && parent.get(c) !== r) {
      const n = parent.get(c)
      parent.set(c, r)
      c = n
    }
    return r
  }
  const union = (a, b) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const [k, list] of adj) for (const [n] of list) union(k, n)
  // size of each piece of track as mapped (before any gap bridging), so a
  // station can be snapped to the main line rather than a stub beside it
  const rawSize = new Map()
  {
    const tally = new Map()
    for (const k of coords.keys()) tally.set(find(k), (tally.get(find(k)) || 0) + 1)
    for (const k of coords.keys()) rawSize.set(k, tally.get(find(k)))
  }
  const near = (e, maxD, otherComponentOnly) => {
    const [cx, cy] = cell(e).split(',').map(Number)
    const r = Math.ceil(maxD / 50)
    let best = null
    const ke = key(e)
    for (let dx = -r; dx <= r; dx += 1)
      for (let dy = -r; dy <= r; dy += 1)
        for (const k of grid.get(`${cx + dx},${cy + dy}`) || []) {
          if (k === ke) continue
          if (otherComponentOnly && find(k) === find(ke)) continue
          const d = haversine(e, coords.get(k))
          if (d < maxD && (!best || d < best.d)) best = { d, k }
        }
    return best
  }
  for (const e of ends) {
    const b = near(e, 30, true)
    if (b) {
      link(e, coords.get(b.k))
      union(key(e), b.k)
    }
  }
  if (joinM > 30) {
    for (const e of ends) {
      const b = near(e, joinM, true)
      if (b) {
        link(e, coords.get(b.k))
        union(key(e), b.k)
      }
    }
  }
  void reach
  const findStation = (name) => {
    const want = normName(name)
    const hits = idx.stations.filter(
      (st) =>
        normName(cleanStationName(st.tags['name:en'] || '')) === want ||
        normName(cleanStationName(st.tags.name || '')) === want,
    )
    // Snap to the nearest track point, but prefer the main network over a
    // stub (a siding or an isolated station track) that happens to be closer.
    let best = null
    for (const st of hits)
      for (const [k, c] of coords) {
        const d = haversine(st.coordinates, c)
        if (d >= 1500) continue
        const score = d + ((rawSize.get(k) || 0) < 2000 ? 3000 : 0)
        if (!best || score < best.score) best = { d, k, score }
      }
    if (!best) return null
    // "hubM": let the path change tracks anywhere inside the station (station
    // throats are often mapped as service track, which isn't loaded)
    const hubM = spec.hubM ?? 0
    if (!hubM) return best.k
    const hub = `hub:${want}:${best.k}`
    const at = coords.get(best.k)
    coords.set(hub, at)
    adj.set(hub, [])
    const [cx, cy] = cell(at).split(',').map(Number)
    const r = Math.ceil(hubM / 40)
    for (let dx = -r; dx <= r; dx += 1)
      for (let dy = -r; dy <= r; dy += 1)
        for (const k of grid.get(`${cx + dx},${cy + dy}`) || []) {
          const d = haversine(at, coords.get(k))
          if (d > hubM) continue
          adj.get(hub).push([k, d])
          adj.get(k).push([hub, d])
        }
    return hub
  }
  function shortest(from, to) {
    const dist = new Map([[from, 0]])
    const prev = new Map()
    const done = new Set()
    // simple binary heap
    const heap = [[0, from]]
    const push = (item) => {
      heap.push(item)
      let i = heap.length - 1
      while (i > 0) {
        const p = (i - 1) >> 1
        if (heap[p][0] <= heap[i][0]) break
        ;[heap[p], heap[i]] = [heap[i], heap[p]]
        i = p
      }
    }
    const pop = () => {
      const top = heap[0]
      const last = heap.pop()
      if (heap.length) {
        heap[0] = last
        let i = 0
        for (;;) {
          const l = 2 * i + 1
          const r = l + 1
          let m = i
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r
          if (m === i) break
          ;[heap[m], heap[i]] = [heap[i], heap[m]]
          i = m
        }
      }
      return top
    }
    while (heap.length) {
      const [d, k] = pop()
      if (done.has(k)) continue
      done.add(k)
      if (k === to) break
      for (const [n, w] of adj.get(k) || []) {
        const nd = d + w
        if (nd < (dist.get(n) ?? Infinity)) {
          dist.set(n, nd)
          prev.set(n, k)
          push([nd, n])
        }
      }
    }
    if (!done.has(to)) return null
    const path = []
    for (let k = to; k; k = prev.get(k)) path.push(coords.get(k))
    return path.reverse()
  }
  // Two or more names: the path is chained through each in turn, so a long
  // service can be pinned to the route it really takes.
  const keys = names.map((n) => {
    const k = findStation(n)
    if (!k && names.length > 2 && n !== names[0] && n !== names[names.length - 1])
      console.error(`  pathBetween: skipping waypoint not found (${n})`)
    return k
  })
  if (!keys[0] || !keys[keys.length - 1]) {
    console.error(`  pathBetween: station not found (${names.join(' → ')})`)
    return null
  }
  const way = keys.filter(Boolean)
  const full = []
  for (let s = 1; s < way.length; s += 1) {
    const seg = shortest(way[s - 1], way[s])
    if (!seg) {
      console.error(`  pathBetween: no track connection (${names.join(' → ')})`)
      return null
    }
    if (process.env.DEBUG_PATH) {
      let m = 0
      for (let i = 1; i < seg.length; i += 1) m += haversine(seg[i - 1], seg[i])
      console.error(`    seg ${s}: ${(m / 1000).toFixed(1)} km straight ${(haversine(coords.get(way[s - 1]), coords.get(way[s])) / 1000).toFixed(1)} km`)
    }
    full.push(...(full.length ? seg.slice(1) : seg))
  }
  return full
}

/** Stations within trackStationDistance of a polyline, in order along it. */
function stationsAlongPath(path, idx, spec) {
  const cum = [0]
  for (let i = 1; i < path.length; i += 1)
    cum.push(cum[i - 1] + haversine(path[i - 1], path[i]))
  const maxD = spec.trackStationDistance ?? 80
  const found = []
  for (const st of idx.stations) {
    if (st.tags.railway === 'tram_stop') continue
    if (spec.bbox && !inBbox(st.coordinates, spec.bbox)) continue
    let best = Infinity
    let at = 0
    for (let i = 1; i < path.length; i += 1) {
      const [d, f] = pointSegment(st.coordinates, path[i - 1], path[i])
      if (d < best) {
        best = d
        at = cum[i - 1] + f * (cum[i] - cum[i - 1])
      }
    }
    if (best <= maxD) found.push({ st, at })
  }
  found.sort((a, b) => a.at - b.at)
  const out = []
  for (const { st } of found) {
    const { name, alternates } = stationLabel(spec, st.tags)
    if (out.some((x) => normName(x.name) === normName(name))) continue
    out.push({ name, alternates, coordinates: st.coordinates })
  }
  return out
}

/** Rail stations within a few metres of the line's track, ordered along the longest relation. */
function stationsAlongTrack(rels, idx, spec, mode) {
  const rel = [...rels].sort(
    (a, b) => trackWays(b, idx).length - trackWays(a, idx).length,
  )[0]
  if (!rel) return []
  // Chain the member ways end to end. Relations often list them out of
  // order, so start from a dangling end and keep taking the way whose end is
  // nearest the current tip (flipping it to follow on).
  const pieces = trackWays(rel, idx).map((w) =>
    w.geometry.map((p) => [p.lon, p.lat]),
  )
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`
  const degree = new Map()
  for (const pts of pieces)
    for (const p of [pts[0], pts[pts.length - 1]])
      degree.set(key(p), (degree.get(key(p)) || 0) + 1)
  let startIdx = pieces.findIndex(
    (pts) =>
      degree.get(key(pts[0])) === 1 || degree.get(key(pts[pts.length - 1])) === 1,
  )
  if (startIdx < 0) startIdx = 0
  const path = []
  const used = new Set()
  if (pieces.length) {
    let first = pieces[startIdx]
    if (degree.get(key(first[0])) !== 1 && degree.get(key(first[first.length - 1])) === 1)
      first = [...first].reverse()
    path.push(...first)
    used.add(startIdx)
    while (used.size < pieces.length) {
      const end = path[path.length - 1]
      let best = -1
      let bestD = Infinity
      let flip = false
      pieces.forEach((pts, i) => {
        if (used.has(i)) return
        const d0 = haversine(end, pts[0])
        const d1 = haversine(end, pts[pts.length - 1])
        if (d0 < bestD) [best, bestD, flip] = [i, d0, false]
        if (d1 < bestD) [best, bestD, flip] = [i, d1, true]
      })
      used.add(best)
      const pts = flip ? [...pieces[best]].reverse() : pieces[best]
      path.push(...pts)
    }
  }
  if (path.length < 2) return []
  const cum = [0]
  for (let i = 1; i < path.length; i += 1)
    cum.push(cum[i - 1] + haversine(path[i - 1], path[i]))
  const maxD = spec.trackStationDistance ?? 80
  const found = []
  for (const st of idx.stations) {
    const t = st.tags
    if (t.railway === 'tram_stop') continue
    if (
      mode === 'train' &&
      (t.station === 'subway' || t.station === 'light_rail') &&
      t.train !== 'yes'
    )
      continue
    if (spec.bbox && !inBbox(st.coordinates, spec.bbox)) continue
    let best = Infinity
    let at = 0
    for (let i = 1; i < path.length; i += 1) {
      const [d, f] = pointSegment(st.coordinates, path[i - 1], path[i])
      if (d < best) {
        best = d
        at = cum[i - 1] + f * (cum[i] - cum[i - 1])
      }
    }
    if (best <= maxD) found.push({ st, at })
  }
  found.sort((a, b) => a.at - b.at)
  const out = []
  for (const { st } of found) {
    const { name, alternates } = stationLabel(spec, st.tags)
    if (out.some((x) => normName(x.name) === normName(name))) continue
    out.push({ name, alternates, coordinates: st.coordinates })
  }
  return out
}

/** Split strings wherever `keep(point)` is false (no-op without a predicate). */
function keepNear(strings, keep) {
  if (!keep) return strings
  const out = []
  for (const line of strings) {
    let run = []
    for (const p of line) {
      if (keep(p)) run.push(p)
      else {
        if (run.length > 1) out.push(run)
        run = []
      }
    }
    if (run.length > 1) out.push(run)
  }
  return out
}

/** Distance in metres from p to segment ab, and the fraction along ab of the closest point. */
function pointSegment(p, a, b) {
  const k = Math.cos((p[1] * Math.PI) / 180) * 111320
  const [px, py] = [p[0] * k, p[1] * 110540]
  const [ax, ay] = [a[0] * k, a[1] * 110540]
  const [bx, by] = [b[0] * k, b[1] * 110540]
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const f = len2
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
    : 0
  return [Math.hypot(px - (ax + f * dx), py - (ay + f * dy)), f]
}

// ------------------------------------------------------------------ code generation

const tsString = (s) =>
  `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function boundsOf(features, padRatio = 0.08) {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const f of features) {
    const [x, y] = f.geometry.coordinates
    w = Math.min(w, x)
    e = Math.max(e, x)
    s = Math.min(s, y)
    n = Math.max(n, y)
  }
  const px = (e - w) * padRatio + 0.01
  const py = (n - s) * padRatio + 0.01
  return {
    bounds: [
      [w - px, s - py],
      [e + px, n + py],
    ],
    maxBounds: [
      [w - px * 4 - 0.1, s - py * 4 - 0.1],
      [e + px * 4 + 0.1, n + py * 4 + 0.1],
    ],
  }
}

function writeCode(spec, dir, features) {
  const fmt = (v) => Math.round(v * 1000) / 1000
  const { bounds, maxBounds } = boundsOf(features)
  const groups = spec.lineGroups.map(
    (g) => `  {
    title: ${tsString(g.title)},
    items: [
      {
        type: 'lines',
        lines: [${g.lines.map(tsString).join(', ')}],
      },
    ],
  },`,
  )
  const url = `https://metro-memory.xyz/${spec.path}`
  const meta = `  icons: {
    icon: '/api/city-icon/${spec.slug}',
    apple: '/api/city-icon/${spec.slug}',
  },
  title: ${tsString(spec.gameTitle)},
  description: ${tsString(spec.description)},
  openGraph: {
    title: ${tsString(spec.gameTitle)},
    description: ${tsString(spec.description)},
    type: 'website',
    locale: ${tsString(spec.locale || 'en_US')},
    url: ${tsString(url)},
  },`

  fs.writeFileSync(
    path.join(dir, 'config.ts'),
    `// Generated by scripts/cities/osm-city.js from city-specs/${spec.slug}.json.
import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
${groups.join('\n')}
]

export const METADATA: Metadata = {
${meta}
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [${fmt(bounds[0][0])}, ${fmt(bounds[0][1])}],
    [${fmt(bounds[1][0])}, ${fmt(bounds[1][1])}],
  ],
  maxBounds: [
    [${fmt(maxBounds[0][0])}, ${fmt(maxBounds[0][1])}],
    [${fmt(maxBounds[1][0])}, ${fmt(maxBounds[1][1])}],
  ],
  minZoom: ${spec.minZoom ?? 8},
  fadeDuration: 50,
}

export const CITY_NAME = ${tsString(spec.slug)}

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

const config: Config = {
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
`,
  )
  fs.writeFileSync(
    path.join(dir, 'metadata.ts'),
    `import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata(${tsString(spec.slug)}, {
${meta}
})
`,
  )
  const component = spec.slug
    .replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/[^A-Za-z0-9]/g, '')
  fs.writeFileSync(
    path.join(dir, 'page.tsx'),
    `export { metadata } from './metadata'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'
import CityDataGamePage from '@/components/CityDataGamePage'
import { Provider } from '@/lib/configContext'
import Main from '@/components/Main'

export default function ${component}Page() {
  return (
    <Provider value={config}>
      <Main className="min-h-screen">
        <CityDataGamePage slug=${JSON.stringify(spec.slug)} />
      </Main>
    </Provider>
  )
}
`,
  )
}

// ------------------------------------------------------------------ main

async function buildCity(spec, args, osmCache) {
  const dir = path.join(GAME_ROOT, spec.path)
  const dataDir = path.join(dir, 'data')
  const hash = crypto
    .createHash('sha1')
    .update(`${BUILDER_VERSION}:${JSON.stringify(spec)}`)
    .digest('hex')
    .slice(0, 12)
  const hashFile = path.join(dataDir, '.spec-hash')
  if (
    !args.force &&
    fs.existsSync(hashFile) &&
    fs.readFileSync(hashFile, 'utf8').trim() === hash
  ) {
    return `- ${spec.slug}: unchanged (spec hash ${hash}) — skipped`
  }

  const key = JSON.stringify(spec.bbox)
  let osm = osmCache.get(key)
  if (!osm) {
    const t0 = Date.now()
    console.error(`${spec.slug}: querying Overpass…`)
    const fixture =
      args.fixture ||
      (args['osm-dir'] && path.join(args['osm-dir'], `${spec.slug}.json`))
    osm = fixture
      ? JSON.parse(fs.readFileSync(fixture, 'utf8'))
      : await fetchOverpass(spec.query || buildQuery(spec.bbox))
    console.error(
      `${spec.slug}: ${(osm.elements || []).length} elements in ${Math.round((Date.now() - t0) / 1000)}s`,
    )
    osmCache.set(key, osm)
  }
  const idx = indexOsm(osm)
  // Optional station filters, e.g. keep only the national operator's stops
  // ("stationTagsInclude": {"operator": "臺灣鐵路|^$"}) or drop metro ones.
  if (spec.stationTagsInclude || spec.stationTagsExclude) {
    idx.stations = idx.stations.filter((st) => {
      const t = st.tags || {}
      for (const [k, re] of Object.entries(spec.stationTagsInclude || {}))
        if (!new RegExp(re, 'i').test(String(t[k] ?? ''))) return false
      for (const [k, re] of Object.entries(spec.stationTagsExclude || {}))
        if (new RegExp(re, 'i').test(String(t[k] ?? ''))) return false
      return true
    })
  }

  const report = [`## ${spec.slug}`]
  const features = []
  const routes = []
  const lines = {}
  const used = new Set()
  let id = 0
  spec.lines.forEach((line, order) => {
    const rels = idx.rels.filter((r) =>
      matches(line.match, { ...(r.tags || {}), '@id': String(r.id) }),
    )
    rels.forEach((r) => used.add(r.id))
    const built = buildLine(line, rels, idx, spec)
    const color =
      line.color || osmColour(rels) || PALETTE[order % PALETTE.length]
    lines[line.id] = {
      name: line.name,
      color,
      backgroundColor: line.backgroundColor || color,
      textColor: line.textColor || '#FFFFFF',
      order,
      ...(line.icon ? { icon: line.icon } : {}),
    }
    built.stations.forEach((s, i) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: round(s.coordinates) },
        properties: {
          id,
          name: s.name,
          ...(s.alternates?.length ? { alternate_names: s.alternates } : {}),
          line: line.id,
          order: i,
        },
        id,
      })
      id += 1
    })
    if (built.strings.length) {
      routes.push({
        type: 'Feature',
        geometry: { type: 'MultiLineString', coordinates: built.strings },
        properties: { line: line.id, name: line.name, color, order },
      })
    }
    const warn = !rels.length
      ? ' ⚠️ no OSM route relation matched'
      : !built.stations.length
        ? ' ⚠️ no stations found'
        : ''
    report.push(
      `- ${line.id} (${line.name}): ${rels.length} relation(s), ${built.stations.length} stations, ${(built.lengthM / 1000).toFixed(1)} km of track${warn}`,
    )
    if (rels.length) {
      const names = [
        ...new Set(
          rels.map((r) => r.tags?.name || r.tags?.ref || `relation ${r.id}`),
        ),
      ]
      report.push(
        `  - via: ${names.slice(0, 6).join(' / ')}${names.length > 6 ? ` (+${names.length - 6} more)` : ''}`,
      )
    }
    if (built.stations.length)
      report.push(`  - ${built.stations.map((s) => s.name).join(' · ')}`)
  })

  // An answer shared by differently named stations ("Tijuca" for four
  // stations in Tijuca) would find all of them at once: drop it.
  const owners = new Map()
  for (const f of features) {
    for (const a of f.properties.alternate_names || []) {
      const k = normName(a)
      if (!owners.has(k)) owners.set(k, new Set())
      owners.get(k).add(normName(f.properties.name))
    }
  }
  for (const f of features) {
    const keep = (f.properties.alternate_names || []).filter(
      (a) =>
        owners.get(normName(a)).size === 1 &&
        normName(a) !== normName(f.properties.name),
    )
    if (keep.length) f.properties.alternate_names = keep
    else delete f.properties.alternate_names
  }

  // Route relations in the area that no line claimed (helps fix the spec).
  const unused = idx.rels
    .filter((r) => !used.has(r.id))
    .filter(
      (r) =>
        !spec.ignoreUnmatched ||
        !new RegExp(spec.ignoreUnmatched, 'i').test(
          `${r.tags?.network} ${r.tags?.name}`,
        ),
    )
    .map(
      (r) =>
        `${r.tags?.route} | ${r.tags?.network || '-'} | ${r.tags?.ref || '-'} | ${r.tags?.name || '-'}`,
    )
  const uniqueUnused = [...new Set(unused)].sort()
  if (uniqueUnused.length) {
    report.push(
      `- Unmatched route relations in the area (${uniqueUnused.length}):`,
    )
    for (const u of uniqueUnused.slice(0, 80)) report.push(`  - ${u}`)
  }

  if (!args['dry-run']) {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(
      path.join(dataDir, 'features.json'),
      `${JSON.stringify({ type: 'FeatureCollection', features }, null, 2)}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'routes.json'),
      `${JSON.stringify({ type: 'FeatureCollection', features: routes })}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'lines.json'),
      `${JSON.stringify(lines, null, 2)}\n`,
    )
    fs.writeFileSync(
      path.join(dataDir, 'SOURCE.md'),
      `Generated by \`scripts/cities/osm-city.js\` from \`city-specs/${spec.slug}.json\`.\n\nStation and route data © OpenStreetMap contributors, available under the Open Database License (ODbL).\n`,
    )
    if (features.length) writeCode(spec, dir, features)
    fs.writeFileSync(hashFile, `${hash}\n`)
  }
  return report.join('\n')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = args.all
    ? fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.json'))
    : String(args.spec || '')
        .split(',')
        .filter(Boolean)
        .map((s) => `${s}.json`)
  if (!files.length) throw new Error('use --spec=<slug>[,<slug>] or --all')
  const cache = new Map()
  const out = []
  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, file), 'utf8'))
    try {
      out.push(await buildCity(spec, args, cache))
    } catch (error) {
      out.push(
        `## ${spec.slug}\n- ⚠️ build failed: ${String(error.message).split('\n')[0].slice(0, 160)}`,
      )
    }
  }
  const report = `# OSM city build\n\n${out.join('\n\n')}\n`
  if (typeof args.report === 'string') fs.writeFileSync(args.report, report)
  console.log(report)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  romanizeKorean,
  transliterate,
  buildQuery,
  fetchOverpass,
  cleanStationName,
  matches,
  buildLine,
  indexOsm,
  relationStops,
}
