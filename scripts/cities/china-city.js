#!/usr/bin/env node
/**
 * Builds a mainland-China city's game data from an OSM probe snapshot.
 *
 *   node scripts/cities/china-city.js --spec=shanghai --probe=/path/to/shanghai.json
 *   node scripts/cities/china-city.js --spec=beijing --probe=... --dry-run
 *
 * The snapshot comes from the "OSM Probe" Action (request files in
 * data-sources/probes/requests/ with "routeGeometry": true); the results live
 * on the `osm-probes` branch. The spec, data-sources/china/<slug>.json, lists
 * the lines, how to recognise their OSM route relations, and English names.
 *
 * Station names follow the "Pinyin (汉字)" style used by the other China
 * cities. The English name is the spec's override, else an official-style
 * English name made from the Chinese (pinyin, with the city's conventions for
 * roads and compass suffixes). Answers accept the Chinese (simplified and
 * traditional), the pinyin with or without spaces, and OSM's English name.
 *
 * Writes src/app/(game)/<path>/data/{features,routes,lines}.json.
 * Data © OpenStreetMap contributors (ODbL).
 */
const fs = require('fs')
const path = require('path')
const { pinyin } = require('pinyin-pro')
const OpenCC = require('opencc-js')

const ROOT = path.resolve(__dirname, '..', '..')
const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' })
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  return args
}

const R = (v) => Math.round(v * 1e6) / 1e6
const toRad = (d) => (d * Math.PI) / 180
function haversine([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(a))
}

// ------------------------------------------------------------------ names

const HAN = /[㐀-鿿]/
const PALETTE = [
  '#E4002B',
  '#0072CE',
  '#009B3A',
  '#F2A900',
  '#8A2BE2',
  '#00A3AD',
  '#E87722',
  '#C6007E',
]

/** "东大桥站" / "东大桥（地铁站）" / "東大橋" -> "东大桥" */
function cleanZh(raw) {
  let s = toSimplified(String(raw || '').trim())
  s = s.replace(/[（(][^）)]*[）)]\s*$/, '')
  s = s.replace(/\s*\d+号?站台$/, '') // "火车东站 1站台
  // keep 站 where it is part of the name: railway stations ("北京南站",
  // "火车北站", "成都东客站") and one-character names ("西站")
  const keep =
    /(火车[东西南北]?站|客站|^[^\s]{2,3}[东西南北]站|^.站)$/.test(s) &&
    !/(地铁站|轻轨站)$/.test(s)
  if (!keep) s = s.replace(/(地铁站|轻轨站|有轨电车站|电车站|站)$/, '')
  return s.trim()
}

const VOWEL_START = /^[aoe]/

// Readings pinyin-pro gets wrong in place names.
const PLACE_READINGS = {
  广: 'guang',
  莘: 'xin',
  陂: 'pi',
  闵行: 'min hang',
  浦: 'pu',
  虬: 'qiu',
  泗泾: 'si jing',
  陕西: 'shan xi',
  长寿: 'chang shou',
  长清: 'chang qing',
  长江: 'chang jiang',
  长阳: 'chang yang',
  长椿街: 'chang chun jie',
  行知: 'xing zhi',
  会: 'hui',
  六: 'liu',
  柏: 'bai',
  曲阳: 'qu yang',
  大柏树: 'da bai shu',
  厦门: 'xia men',
  重庆: 'chong qing',
  蚌埠: 'beng bu',
  洪: 'hong',
  饶乐府: 'rao le fu',
  乐园: 'le yuan',
  欢乐: 'huan le',
}
const READING_KEYS = Object.keys(PLACE_READINGS).sort(
  (a, b) => b.length - a.length,
)

/** Toneless pinyin syllables, with ü written as v for typing and u for display. */
function syllables(zh, spec) {
  const custom = spec.pinyin?.[zh]
  if (custom) return custom.split(/\s+/)
  const out = []
  let i = 0
  while (i < zh.length) {
    const k = READING_KEYS.find((w) => zh.startsWith(w, i))
    if (k) {
      out.push(...PLACE_READINGS[k].split(' '))
      i += k.length
      continue
    }
    // read the rest up to the next known word in context
    let j = i + 1
    while (j < zh.length && !READING_KEYS.some((w) => zh.startsWith(w, j)))
      j += 1
    out.push(
      ...pinyin(zh.slice(i, j), {
        toneType: 'none',
        type: 'array',
        v: false,
      }).map((s) => s.replace(/ü/g, 'u')),
    )
    i = j
  }
  return out
}

/** ["tian","an","men"] -> "Tian'anmen" */
function joinSyllables(syl) {
  let out = ''
  syl.forEach((s, i) => {
    if (!/^[a-z]+$/i.test(s)) {
      out += s
      return
    }
    if (i > 0 && VOWEL_START.test(s) && /[a-z]$/i.test(out)) out += "'"
    out += s
  })
  return out.charAt(0).toUpperCase() + out.slice(1)
}

const COMPASS = { 东: 'East', 西: 'West', 南: 'South', 北: 'North' }
const SH_COMPASS_ROAD = {
  东: 'East',
  西: 'West',
  南: 'South',
  北: 'North',
  中: 'Middle',
}

/**
 * Official-style English from the Chinese name.
 *  beijing:  place names in pinyin as one word ("Dongdaqiao", "Yuquanlu"),
 *            a trailing compass character as a word ("Wangjing West").
 *  shanghai: roads in English ("Longyang Road", "East Nanjing Road",
 *            "Shendu Highway"), other names in pinyin.
 */
function englishFor(zh, spec) {
  if (spec.english?.[zh]) return spec.english[zh]
  // double names: "一大会址·黄陂南路"
  if (/[·・]/.test(zh))
    return zh
      .split(/[·・]/)
      .map((part) => englishFor(part.trim(), spec))
      .join(' · ')
  const pin = (s) => joinSyllables(syllables(s, spec))
  const style = spec.style || 'beijing'
  if (style === 'shanghai') {
    // tram stops named after a crossing: "荣乐路西林北路" -> "Rongle Road & North Xilin Road"
    const crossing = zh.match(/^(.{2,}?路)(.{2,})$/)
    if (
      crossing &&
      !/^(公路|大道)/.test(crossing[2]) &&
      !/^[东西南北中]路$/.test(crossing[2])
    )
      return `${englishFor(crossing[1], spec)} & ${englishFor(crossing[2], spec)}`
    let m
    if ((m = zh.match(/^(.+)火车站$/)))
      return `${englishFor(m[1], spec)} Railway Station`
    if ((m = zh.match(/^(.{2,})新村$/))) return `${pin(m[1])} Xincun`
    if ((m = zh.match(/^(.{2,})镇$/))) return `${pin(m[1])} Town`
    if ((m = zh.match(/^(.{2,})新城$/))) return `${pin(m[1])} Xincheng`
    if ((m = zh.match(/^(.+?)(公路)$/))) return `${pin(m[1])} Highway`
    if ((m = zh.match(/^(.+?)(大道)$/))) return `${pin(m[1])} Avenue`
    if ((m = zh.match(/^(.{2,}?)([东西南北中])路$/)))
      return `${SH_COMPASS_ROAD[m[2]]} ${pin(m[1])} Road`
    if ((m = zh.match(/^(.+?)路$/))) return `${pin(m[1])} Road`
    if ((m = zh.match(/^(.{2,})([东西南北])$/)))
      return `${englishFor(m[1], spec)} ${COMPASS[m[2]]}`
    return pin(zh)
  }
  if (style === 'generic') return genericEnglish(zh, spec, pin)
  let m = zh.match(/^(.{2,})([东西南北])$/)
  if (m && !spec.keepCompassInPinyin?.includes(zh))
    return `${englishFor(m[1], spec)} ${COMPASS[m[2]]}`
  // district prefixes as their own word: "Haidian Huangzhuang", "Tongzhou Beiyuan"
  const prefix = (spec.prefixWords || []).find(
    (w) => zh.startsWith(w) && zh.length - w.length >= 2,
  )
  if (prefix)
    return `${pin(prefix)} ${englishFor(zh.slice(prefix.length), { ...spec, prefixWords: [] })}`
  // "Huilongguan Dongdajie", "Qinghuadonglu Xikou", "Hepingli Beijie"
  const tail = zh.match(/^(.{2,}?)([东西南北]?大街|[东西南北]街|[东西南北]口)$/)
  if (tail) return `${pin(tail[1])} ${pin(tail[2])}`
  if ((m = zh.match(/^(.+)火车站$/)))
    return `${englishFor(m[1], spec)} Railway Station`
  return pin(zh)
}

// Common place-name endings with a standard English form on Chinese metro maps.
const GENERIC_SUFFIXES = [
  ['国际机场', 'International Airport'],
  ['火车站', 'Railway Station'],
  ['高铁站', 'Railway Station'],
  ['客运站', 'Bus Station'],
  ['汽车站', 'Bus Station'],
  ['体育中心', 'Sports Center'],
  ['会展中心', 'Exhibition Center'],
  ['博物馆', 'Museum'],
  ['大学城', 'University Town'],
  ['大学', 'University'],
  ['医院', 'Hospital'],
  ['公园', 'Park'],
  ['广场', 'Square'],
  ['机场', 'Airport'],
  ['公路', 'Highway'],
  ['大道', 'Avenue'],
  ['大街', 'Street'],
  ['路', 'Road'],
]

/**
 * Most Chinese metros sign English names as pinyin with a translated ending:
 * "Chunxi Road", "Tianfu Square", "Zhongshan Park", "Wuchang Railway Station".
 * A compass character after a road goes after it ("Shuhan Road East"), as on
 * most systems outside Shanghai.
 */
function genericEnglish(zh, spec, pin) {
  let m
  const crossing = zh.match(/^(.{2,}?路)(.{2,}路)$/)
  if (crossing)
    return `${genericEnglish(crossing[1], spec, pin)} & ${genericEnglish(crossing[2], spec, pin)}`
  if ((m = zh.match(/^(.{2,}?)([东西南北中])(路|大道|大街|街)$/)))
    return `${pin(m[1])} ${genericEnglish(m[3], spec, pin).replace(/^\S+ ?/, '') || { 路: 'Road', 大道: 'Avenue', 大街: 'Street', 街: 'Street' }[m[3]]} ${{ 东: 'East', 西: 'West', 南: 'South', 北: 'North', 中: 'Middle' }[m[2]]}`
  // "双流机场1航站楼", "天府机场1号2号航站楼", "江北机场T2航站楼"
  if ((m = zh.match(/^(.*?)((?:T\d+)+)$/))) m = [m[0], m[1], m[2]]
  else m = zh.match(/^(.*?)((?:T?\d+号?)+)航站楼$/)
  if (m) {
    const nums = m[2].match(/\d+/g).join(' & ')
    return m[1]
      ? `${englishFor(m[1], spec)} Terminal ${nums}`
      : `Terminal ${nums}`
  }
  if ((m = zh.match(/^(.*?)(?:火车)?([东西南北])客?站$/)))
    return `${m[1] ? `${englishFor(m[1], spec)} ` : ''}${COMPASS[m[2]]} Railway Station`
  if ((m = zh.match(/^(.{2,})([东西南北])站$/)))
    return `${englishFor(m[1], spec)} ${COMPASS[m[2]]} Railway Station`
  if ((m = zh.match(/^(.*?)火车([东西南北])站$/)))
    return `${m[1] ? `${englishFor(m[1], spec)} ` : ''}${COMPASS[m[2]]} Railway Station`
  const ORD = {
    一: '1st',
    二: '2nd',
    三: '3rd',
    四: '4th',
    五: '5th',
    六: '6th',
    七: '7th',
    八: '8th',
    九: '9th',
    十: '10th',
  }
  if ((m = zh.match(/^(.{2,}?)([一二三四五六七八九十])(路|街|大道)$/)))
    return `${pin(m[1])} ${ORD[m[2]]} ${{ 路: 'Road', 街: 'Street', 大道: 'Avenue' }[m[3]]}`
  for (const [suf, en] of GENERIC_SUFFIXES) {
    if (zh.endsWith(suf) && zh.length > suf.length) {
      const stem = zh.slice(0, -suf.length)
      if (suf === '路' && stem.length < 1) break
      return `${englishFor(stem, spec)} ${en}`
    }
  }
  if ((m = zh.match(/^(.{2,})([东西南北])$/)))
    return `${englishFor(m[1], spec)} ${COMPASS[m[2]]}`
  return pin(zh)
}

function namesFor(zh, spec, extras = []) {
  const en = englishFor(zh, spec)
  const syl = syllables(zh, spec)
  const alts = [
    en,
    zh,
    toTraditional(zh),
    en.endsWith(' Railway Station')
      ? en.replace(/ Railway Station$/, '')
      : null,
    joinSyllables(syl),
    syl.join(' '),
    ...(spec.alternates?.[zh] || []),
    // each half of a double name on its own ("黄陂南路", "South Huangpi Road")
    ...(/[·・]/.test(zh)
      ? zh.split(/[·・]/).flatMap((part) => {
          const z = part.trim()
          return [z, englishFor(z, spec), joinSyllables(syllables(z, spec))]
        })
      : []),
    ...extras,
  ]
  const seen = new Set()
  const alternate_names = []
  for (const a of alts) {
    const v = String(a || '').trim()
    if (!v) continue
    const k = v.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    alternate_names.push(v)
  }
  return { name: en, display_name: `${en} (${zh})`, alternate_names }
}

// ------------------------------------------------------------------ lines

function matches(rule, tags) {
  for (const [key, pattern] of Object.entries(rule || {})) {
    if (key === 'exclude') continue
    const re = new RegExp(pattern, 'i')
    const v =
      key === 'name'
        ? [tags.name, tags['name:zh'], tags['name:en'], tags.ref]
            .filter(Boolean)
            .join(' | ')
        : String(tags[key] ?? '')
    if (!re.test(v)) return false
  }
  if (rule?.exclude) {
    const hay = [tags.name, tags['name:en'], tags.ref]
      .filter(Boolean)
      .join(' | ')
    if (new RegExp(rule.exclude, 'i').test(hay)) return false
  }
  return true
}

/**
 * Stops of one relation, in order, as { zh, point, nameEn }. Stop positions
 * and platforms are read together (tram relations often list only the
 * terminals as stops and the rest as platforms); repeats are merged.
 */
function relationStops(rel, spec = {}) {
  const stops = rel.stops.filter((s) =>
    /^(stop|forward_stop|backward_stop|platform)/.test(s.role || ''),
  )
  const out = []
  for (const s of stops) {
    let zh = cleanZh(s.name)
    zh = spec.renameZh?.[zh] || zh
    if (!zh || !HAN.test(zh)) continue
    if (out.some((x) => x.zh === zh)) {
      // prefer the stop position over the platform for the point
      if (
        /^(stop|forward|backward)/.test(s.role || '') &&
        out[out.length - 1].zh === zh
      )
        out[out.length - 1].point = [s.lon, s.lat]
      if (out[out.length - 1].zh === zh || !spec.allowRevisit) continue
    }
    out.push({ zh, point: [s.lon, s.lat], nameEn: s.nameEn })
  }
  return out
}

/** Merge several stop sequences into one ordered list (longest first). */
function mergeSequences(seqs) {
  seqs = seqs.filter((s) => s.length).sort((a, b) => b.length - a.length)
  const out = []
  for (const seq of seqs) {
    for (let i = 0; i < seq.length; i += 1) {
      if (out.some((x) => x.zh === seq[i].zh)) continue
      let at = out.length
      for (let j = i - 1; j >= 0; j -= 1) {
        const k = out.findIndex((x) => x.zh === seq[j].zh)
        if (k >= 0) {
          at = k + 1
          break
        }
      }
      if (at === out.length) {
        // no earlier neighbour known: put it before the next known one
        for (let j = i + 1; j < seq.length; j += 1) {
          const k = out.findIndex((x) => x.zh === seq[j].zh)
          if (k >= 0) {
            at = k
            break
          }
        }
      }
      out.splice(at, 0, seq[i])
    }
  }
  return out
}

/** Join way geometries that share end points into longer strings. */
function joinWays(ways) {
  const key = (p) => `${p[0]},${p[1]}`
  const pool = ways.filter((w) => w.length >= 2).map((w) => w.slice())
  const out = []
  while (pool.length) {
    let cur = pool.pop()
    let grown = true
    while (grown) {
      grown = false
      for (let i = 0; i < pool.length; i += 1) {
        const w = pool[i]
        const [a, b] = [key(cur[0]), key(cur[cur.length - 1])]
        const [c, d] = [key(w[0]), key(w[w.length - 1])]
        if (b === c) cur = cur.concat(w.slice(1))
        else if (b === d) cur = cur.concat(w.slice().reverse().slice(1))
        else if (a === d) cur = w.concat(cur.slice(1))
        else if (a === c) cur = w.slice().reverse().concat(cur.slice(1))
        else continue
        pool.splice(i, 1)
        grown = true
        break
      }
    }
    out.push(cur)
  }
  return out
}

/** Named open stations within radiusM of the strings, ordered along the longest string. */
function stationsAlong(strings, stations, radiusM, spec) {
  const lat0 = strings[0][0][1]
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320
  const P = ([lon, lat]) => [lon * kx, lat * 110540]
  const segs = []
  for (const s of strings)
    for (let i = 1; i < s.length; i += 1) segs.push([P(s[i - 1]), P(s[i])])
  const project = (p, list) => {
    let best = { d: Infinity, at: 0 }
    for (const { a, b, start } of list) {
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const L = dx * dx + dy * dy
      const t = L
        ? Math.max(
            0,
            Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L),
          )
        : 0
      const d = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
      if (d < best.d) best = { d, at: start + t * Math.sqrt(L) }
    }
    return best
  }
  const all = segs.map(([a, b]) => ({ a, b, start: 0 }))
  // the axis: the longest string, with distance along it
  const axisPts = strings
    .slice()
    .sort((a, b) => b.length - a.length)[0]
    .map(P)
  const axis = []
  let run = 0
  for (let i = 1; i < axisPts.length; i += 1) {
    axis.push({ a: axisPts[i - 1], b: axisPts[i], start: run })
    run += Math.hypot(
      axisPts[i][0] - axisPts[i - 1][0],
      axisPts[i][1] - axisPts[i - 1][1],
    )
  }
  const seen = new Map()
  for (const st of stations) {
    if (st.state !== 'open') continue
    let zh = cleanZh(st.tags['name:zh'] || st.tags.name)
    if (!zh || !HAN.test(zh)) continue
    zh = spec.renameZh?.[zh] || zh
    const p = P([st.lon, st.lat])
    const { d } = project(p, all)
    if (d > radiusM) continue
    if (seen.has(zh) && seen.get(zh).d <= d) continue
    seen.set(zh, {
      zh,
      point: [st.lon, st.lat],
      nameEn: st.tags['name:en'],
      d,
      pos: project(p, axis).at,
    })
  }
  return [...seen.values()].sort((a, b) => a.pos - b.pos)
}

/**
 * For specs with "groups": write the city's config.ts, metadata.ts and
 * page.tsx (replacing the "coming soon" placeholder).
 */
function writeCity(spec, features) {
  const dir = path.join(ROOT, 'src', 'app', '(game)', spec.path)
  let [w, s, e, n] = [180, 90, -180, -90]
  for (const f of features) {
    const [x, y] = f.geometry.coordinates
    w = Math.min(w, x)
    e = Math.max(e, x)
    s = Math.min(s, y)
    n = Math.max(n, y)
  }
  const px = (e - w) * 0.08 + 0.01
  const py = (n - s) * 0.08 + 0.01
  const r3 = (v) => Math.round(v * 1000) / 1000
  const span = Math.max(e - w, n - s)
  const minZoom = span > 1 ? 7.5 : span > 0.5 ? 8.5 : span > 0.2 ? 9.5 : 10.5
  const q = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  const title = spec.gameTitle || `${spec.cityName} Metro Memory`
  const description =
    spec.description ||
    `How many of the ${spec.cityName} rail transit stations can you name from memory?`
  const meta = `  icons: {
    icon: '/api/city-icon/${spec.slug}',
    apple: '/api/city-icon/${spec.slug}',
  },
  title: ${q(title)},
  description: ${q(description)},
  openGraph: {
    title: ${q(title)},
    description: ${q(description)},
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/${spec.path}',
  },`
  const groups = spec.groups
    .map(
      (g) => `  {
    title: ${q(g.title)},${g.titleImage ? `\n    titleImage: ${q(g.titleImage)},` : ''}
    items: [
      {
        type: 'lines',
        lines: [${g.lines.map(q).join(', ')}],
      },
    ],
  },`,
    )
    .join('\n')
  fs.writeFileSync(
    path.join(dir, 'config.ts'),
    `// Generated by scripts/cities/china-city.js from data-sources/china/${spec.slug}.json.
import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
${groups}
]

export const METADATA: Metadata = {
${meta}
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [${r3(w - px)}, ${r3(s - py)}],
    [${r3(e + px)}, ${r3(n + py)}],
  ],
  maxBounds: [
    [${r3(w - px * 4 - 0.1)}, ${r3(s - py * 4 - 0.1)}],
    [${r3(e + px * 4 + 0.1)}, ${r3(n + py * 4 + 0.1)}],
  ],
  minZoom: ${minZoom},
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: '${spec.slug}',
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

export const metadata: Metadata = withCityAssetMetadata('${spec.slug}', {
${meta}
})
`,
  )
  const component = `${spec.slug.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}Page`
  fs.writeFileSync(
    path.join(dir, 'page.tsx'),
    `export { metadata } from './metadata'
import CityDataGamePage from '@/components/CityDataGamePage'
import Main from '@/components/Main'
import { Provider } from '@/lib/configContext'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'

export default function ${component}() {
  return (
    <Provider value={config}>
      <Main className="min-h-screen">
        <CityDataGamePage slug="${spec.slug}" />
      </Main>
    </Provider>
  )
}
`,
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const specPath = path.join(ROOT, 'data-sources', 'china', `${args.spec}.json`)
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  const probe = JSON.parse(fs.readFileSync(args.probe, 'utf8'))
  const log = (...m) => console.log(...m)

  // OSM station nodes by Chinese name, for stable station positions
  const stationsByZh = new Map()
  for (const st of probe.stations) {
    if (st.state !== 'open') continue
    let zh = cleanZh(st.tags['name:zh'] || st.tags.name)
    if (!zh) continue
    zh = spec.renameZh?.[zh] || zh
    if (!stationsByZh.has(zh)) stationsByZh.set(zh, [])
    stationsByZh.get(zh).push(st)
  }
  const nearestStation = (zh, point, maxM) => {
    let best = null
    for (const st of stationsByZh.get(zh) || []) {
      const d = haversine(point, [st.lon, st.lat])
      if (d <= maxM && (!best || d < best.d)) best = { d, st }
    }
    return best?.st || null
  }

  const dataDir = path.join(ROOT, 'src', 'app', '(game)', spec.path, 'data')
  const readOld = (f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'))
    } catch {
      return null
    }
  }
  // Keep the badges/colours already set up, and keep accepting every English
  // answer the old data accepted (e.g. "Dongda Bridge" for 东大桥).
  const oldLines = (spec.inheritLines && readOld('lines.json')) || {}
  const oldAnswers = new Map()
  for (const f of readOld('features.json')?.features || []) {
    const p = f.properties || {}
    const zh = (p.alternate_names || []).find((a) => HAN.test(a))
    if (!zh) continue
    const key = cleanZh(zh)
    if (!oldAnswers.has(key)) oldAnswers.set(key, new Set())
    for (const a of [p.name, ...(p.alternate_names || [])])
      if (a && !HAN.test(a)) oldAnswers.get(key).add(a)
  }

  const features = []
  const routes = []
  const lines = {}
  const report = []
  const used = new Set()
  let id = 1
  spec.lines.forEach((line, order) => {
    const rels = probe.relations.filter((r) => matches(line.match, r.tags))
    rels.forEach((r) => used.add(r.id))
    const rename = (seq) =>
      seq.map((x) =>
        spec.renameZh?.[x.zh] ? { ...x, zh: spec.renameZh[x.zh] } : x,
      )
    let seqs = rels.map((r) => rename(relationStops(r, spec)))
    if (line.between) {
      // only the part of each service between two stations, e.g. Line 1
      // out of the Line 1 / Batong through service
      const [a, b] = line.between
      seqs = seqs
        .map((seq) => {
          const i = seq.findIndex((x) => x.zh === a)
          const j = seq.findIndex((x) => x.zh === b)
          if (i < 0 || j < 0) return []
          return i <= j ? seq.slice(i, j + 1) : seq.slice(j, i + 1).reverse()
        })
        .filter((x) => x.length)
    }
    let stops = mergeSequences(seqs)
    if (line.stations) {
      // explicit order (OSM relation incomplete or out of order)
      const byZh = new Map(stops.map((x) => [x.zh, x]))
      stops = line.stations
        .map((zh) => {
          if (byZh.has(zh)) return byZh.get(zh)
          const st = (stationsByZh.get(zh) || [])[0]
          if (!st) report.push(`  ⚠️ ${line.id}: no OSM station for ${zh}`)
          return st ? { zh, point: [st.lon, st.lat] } : null
        })
        .filter(Boolean)
    }
    for (const zh of line.removeStations || [])
      stops = stops.filter((s) => s.zh !== zh)
    for (const extra of line.addStations || []) {
      if (stops.some((s) => s.zh === extra.zh)) continue
      const st = extra.point ? null : (stationsByZh.get(extra.zh) || [])[0]
      const point = extra.point || (st && [st.lon, st.lat])
      if (!point) {
        report.push(
          `  ⚠️ ${line.id}: no position for added station ${extra.zh}`,
        )
        continue
      }
      const item = { zh: extra.zh, point }
      const k = stops.findIndex((s) => s.zh === (extra.after || extra.before))
      if (k < 0) stops.push(item)
      else stops.splice(extra.after ? k + 1 : k, 0, item)
    }
    const wayIds = new Set()
    for (const r of rels) for (const w of r.ways || []) wayIds.add(w)
    const strings = joinWays(
      [...wayIds].map((w) => probe.routeWays[w]).filter(Boolean),
    )
    if (line.fromTrack || (stops.length < 2 && strings.length)) {
      // relations that list no stops (common for trams): take the named
      // stations along the line's own track, in order along it
      stops = stationsAlong(
        strings,
        probe.stations,
        line.trackRadius ?? 60,
        spec,
      )
      report.push(
        `  (${line.id}: ${stops.length} stations taken from the track)`,
      )
    }
    if (line.reverse) stops.reverse()

    const old = oldLines[line.id] || {}
    const osmColour = rels
      .map((r) => r.tags.colour)
      .find((c) => /^#[0-9a-f]{6}$/i.test(c || ''))
    const color =
      line.color || old.color || osmColour || PALETTE[order % PALETTE.length]
    line.color = color
    lines[line.id] = {
      ...old,
      name: line.name || old.name,
      color,
      backgroundColor: line.backgroundColor || old.backgroundColor || color,
      textColor: line.textColor || old.textColor || '#ffffff',
      order: order + 1,
      ...(line.icon || old.icon ? { icon: line.icon || old.icon } : {}),
      ...(line.extra || {}),
    }
    stops.forEach((s, i) => {
      const st = nearestStation(s.zh, s.point, spec.stationRadius ?? 400)
      const coords = st ? [st.lon, st.lat] : s.point
      const osmEn = [st?.tags?.['name:en'], s.nameEn].filter(
        (v) => v && !HAN.test(v),
      )
      const names = namesFor(s.zh, spec, [
        ...osmEn.map((v) => v.replace(/\s+(Railway\s+)?(Station|Stn)$/i, '')),
        ...(oldAnswers.get(s.zh) || []),
      ])
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [R(coords[0]), R(coords[1])] },
        properties: { id, ...names, line: line.id, order: i },
        id,
      })
      id += 1
    })

    if (strings.length)
      routes.push({
        type: 'Feature',
        geometry: { type: 'MultiLineString', coordinates: strings },
        properties: {
          line: line.id,
          name: line.name,
          color: line.color,
          order: order + 1,
        },
      })
    const warn = !rels.length
      ? ' ⚠️ no OSM relation'
      : !stops.length
        ? ' ⚠️ no stations'
        : ''
    report.push(
      `- ${line.id} ${line.name}: ${rels.length} rel, ${stops.length} stations, ${strings.length} strings${warn}`,
    )
    report.push(`  ${stops.map((s) => s.zh).join(' · ')}`)
  })
  const unused = probe.relations
    .filter(
      (r) =>
        !used.has(r.id) &&
        /subway|light_rail|tram|monorail/.test(r.tags.route || ''),
    )
    .map(
      (r) =>
        `${r.tags.route} | ${r.tags.network || '-'} | ${r.tags.ref || '-'} | ${r.tags.name || '-'}`,
    )
  if (unused.length)
    report.push(
      'Unmatched metro/tram relations:',
      ...[...new Set(unused)].map((u) => `  ${u}`),
    )

  // English names that differ from OSM's, for review
  if (args.review) {
    const seen = new Set()
    for (const f of features) {
      const p = f.properties
      const osm = p.alternate_names.find(
        (a) =>
          !HAN.test(a) &&
          a !== p.name &&
          a.toLowerCase().replace(/[^a-z]/g, '') !==
            p.name.toLowerCase().replace(/[^a-z]/g, '') &&
          /[A-Z]/.test(a) &&
          a.includes(' '),
      )
      if (osm && !seen.has(p.name)) {
        seen.add(p.name)
        report.push(`  name: ${p.display_name}  | OSM: ${osm}`)
      }
    }
  }
  console.log(report.join('\n'))
  if (args['dry-run']) return

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
  if (spec.groups) writeCity(spec, features)
  log(
    `wrote ${features.length} stations, ${routes.length} routes to ${dataDir}`,
  )
}

if (require.main === module) main()

module.exports = {
  cleanZh,
  englishFor,
  namesFor,
  joinSyllables,
  mergeSequences,
  joinWays,
}
