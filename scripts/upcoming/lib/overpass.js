// OpenStreetMap research via the Overpass API (free, no key).
//
// Finds stations that are under construction, planned with an opening date,
// recently opened, or already tracked (by id, so we notice when OSM mappers flip
// them to operational). For each candidate it also returns nearby route
// relations / track ways so we can work out which line it belongs to.

const { fetchWithTimeout, sleep } = require('./http')
const { parseLooseDate } = require('./dates')

const ENDPOINTS = (
  process.env.UPCOMING_OVERPASS_ENDPOINTS ||
  'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const RAIL_ROUTES = new Set([
  'subway',
  'light_rail',
  'train',
  'tram',
  'monorail',
  'railway',
  'funicular',
])

/**
 * @param {number[]} bbox [minLat, minLon, maxLat, maxLon]
 * @param {{ knownIds?: string[], today: string }} opts knownIds like "node/123"
 */
function buildQuery(bbox, { knownIds = [], today }) {
  const [s, w, n, e] = bbox.map((v) => Number(v.toFixed(5)))
  const year = Number(today.slice(0, 4))
  const recentStart = `^(${year - 1}|${year})`
  const byType = { node: [], way: [], relation: [] }
  for (const id of knownIds) {
    const [type, num] = id.split('/')
    if (byType[type] && /^\d+$/.test(num)) byType[type].push(num)
  }
  const known = Object.entries(byType)
    .filter(([, ids]) => ids.length)
    .map(([type, ids]) => `  ${type === 'relation' ? 'rel' : type}(id:${ids.join(',')});`)
    .join('\n')

  return `[out:json][timeout:180][bbox:${s},${w},${n},${e}];
(
  nwr["railway"="construction"]["construction:railway"~"^(station|halt|stop|tram_stop)$"];
  nwr["construction:railway"~"^(station|halt|tram_stop)$"];
  nwr["railway"~"^(station|halt|tram_stop)$"]["construction"];
  nwr["public_transport"="station"]["construction"];
  nwr["construction:public_transport"="station"];
  nwr["railway"~"^(station|halt|tram_stop)$"]["opening_date"];
  nwr["public_transport"="station"]["opening_date"];
  nwr["proposed:railway"~"^(station|halt)$"]["opening_date"];
  nwr["railway"~"^(station|halt|tram_stop)$"]["start_date"~"${recentStart}"];
)->.cands;
(
.cands;
${known}
)->.cands;
foreach.cands->.c(
  make mm_sep part="candidate"; out;
  .c out center;
  rel(bn.c)["type"="route"]; out tags;
  make mm_sep part="stops"; out;
  (
    node(around.c:150)["public_transport"="stop_position"];
    node(around.c:150)["railway"="stop"];
  )->.stops;
  .stops out tags;
  rel(bn.stops)["type"="route"]; out tags;
  make mm_sep part="ways"; out;
  way(around.c:40)["railway"~"^(construction|subway|light_rail|rail|tram|monorail|narrow_gauge|proposed)$"]->.ways;
  .ways out tags;
  rel(bw.ways)["type"="route"]; out tags;
);`
}

function stateOf(tags) {
  if (
    tags.railway === 'construction' ||
    tags['construction:railway'] ||
    tags['construction:public_transport'] ||
    (tags.construction && tags.construction !== 'no')
  ) {
    return 'construction'
  }
  if (tags.railway === 'proposed' || tags['proposed:railway'] || tags['proposed:public_transport']) {
    return 'proposed'
  }
  if (tags.railway === 'abandoned' || tags.railway === 'disused' || tags['disused:railway']) {
    return 'disused'
  }
  return 'operational'
}

function kindOf(tags) {
  const st = tags.station || tags['construction:station'] || ''
  if (st === 'subway' || tags.subway === 'yes') return 'subway'
  if (st === 'light_rail' || tags.light_rail === 'yes') return 'light_rail'
  if (st === 'monorail' || tags.monorail === 'yes') return 'monorail'
  if (
    tags.railway === 'tram_stop' ||
    tags['construction:railway'] === 'tram_stop' ||
    tags.tram === 'yes'
  ) {
    return 'tram'
  }
  if (st === 'funicular') return 'funicular'
  return 'rail'
}

function lineTagEvidence(tags, weight) {
  const out = []
  for (const key of ['line', 'subway:line', 'route_ref', 'railway:ref:lines', 'lines']) {
    if (!tags[key]) continue
    for (const part of String(tags[key]).split(/[;,]/)) {
      const v = part.trim()
      if (v) out.push({ text: v, ref: v, weight })
    }
  }
  return out
}

function relationEvidence(tags, weight) {
  if (!RAIL_ROUTES.has(tags.route)) return []
  return [
    {
      text: [tags.name, tags['name:en']].filter(Boolean).join(' '),
      ref: tags.ref || null,
      colour: tags.colour || tags.color || null,
      weight,
    },
  ]
}

/**
 * Turns an Overpass JSON response into candidate records.
 * Elements arrive as: sep(candidate), the candidate (with coordinates), its own
 * route relations, sep(stops), nearby stop positions + their routes, sep(ways),
 * nearby track ways + their routes.
 */
function parseResponse(json, { today, keepRefs = new Set() }) {
  const elements = Array.isArray(json?.elements) ? json.elements : []
  const candidates = []
  let current = null
  let part = null

  for (const el of elements) {
    if (el.type === 'mm_sep') {
      part = el.tags?.part
      if (part === 'candidate') current = null
      continue
    }
    const tags = el.tags || {}
    if (part === 'candidate' && !current) {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (typeof lat !== 'number' || typeof lon !== 'number') continue
      current = {
        source: 'osm',
        ref: `osm:${el.type}/${el.id}`,
        url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        coordinates: [lon, lat],
        tags,
        names: collectNames(tags),
        state: stateOf(tags),
        kind: kindOf(tags),
        opening: parseLooseDate(tags.opening_date || tags['construction:opening_date'], 'osm'),
        started: tags.start_date ? parseLooseDate(tags.start_date, 'osm') : null,
        lineEvidence: lineTagEvidence(tags, 3),
      }
      candidates.push(current)
      continue
    }
    if (!current) continue
    if (part === 'candidate' && el.type === 'relation') {
      current.lineEvidence.push(...relationEvidence(tags, 3))
    } else if (part === 'stops') {
      if (el.type === 'relation') current.lineEvidence.push(...relationEvidence(tags, 2))
      else current.lineEvidence.push(...lineTagEvidence(tags, 2))
    } else if (part === 'ways') {
      if (el.type === 'relation') current.lineEvidence.push(...relationEvidence(tags, 1))
      else if (el.type === 'way') {
        const text = [tags.name, tags['name:en'], tags.description].filter(Boolean).join(' ')
        if (text || tags.ref) current.lineEvidence.push({ text, ref: tags.ref || null, weight: 1 })
        current.lineEvidence.push(...lineTagEvidence(tags, 1))
      }
    }
  }

  // Keep candidates that matter now: under construction / proposed with a date,
  // operational ones whose opening date is in the future or within the last
  // year, or whose start_date is this or last year.
  const year = Number(today.slice(0, 4))
  return candidates.filter((c) => {
    if (keepRefs.has(c.ref)) return true // tracked: always report its current state
    if (c.state === 'construction' || c.state === 'proposed') return true
    if (c.state === 'disused') return true // reported so tracked entries can be closed out
    const openYear = c.opening?.date ? Number(c.opening.date.slice(0, 4)) : null
    const startYear = c.started?.date ? Number(c.started.date.slice(0, 4)) : null
    return (openYear && openYear >= year - 1) || (startYear && startYear >= year - 1)
  })
}

function collectNames(tags) {
  const names = {}
  for (const [k, v] of Object.entries(tags)) {
    if (k === 'name' || k.startsWith('name:') || k === 'official_name' || k === 'alt_name') {
      if (typeof v === 'string' && v.trim()) names[k] = v.trim()
    }
  }
  return names
}

async function queryOverpass(query, { retries = ENDPOINTS.length * 2 } = {}) {
  let lastError = null
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length]
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        200000,
      )
      if (res.ok) return await res.json()
      lastError = new Error(`Overpass ${endpoint} HTTP ${res.status}`)
      if (res.status === 400) {
        const body = await res.text().catch(() => '')
        throw new Error(`Overpass rejected query: ${body.slice(0, 400)}`)
      }
      await sleep(res.status === 429 || res.status === 504 ? 15000 : 4000)
    } catch (error) {
      if (String(error?.message || '').startsWith('Overpass rejected')) throw error
      lastError = error
      await sleep(4000)
    }
  }
  throw lastError || new Error('Overpass failed')
}

module.exports = { buildQuery, parseResponse, queryOverpass, stateOf, kindOf }
