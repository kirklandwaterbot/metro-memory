// Wikidata research via the public SPARQL endpoint (free, no key).
//
// Finds stations inside the city's box that are "under construction" (P5817)
// or have an official opening date (P1619) in the past year or the future,
// with their connecting lines (P81) and labels in the city's local languages.

const { fetchWithTimeout, sleep } = require('./http')
const { parseWikidataTime, addDays, morePrecise } = require('./dates')

const ENDPOINT = process.env.UPCOMING_WIKIDATA_ENDPOINT || 'https://query.wikidata.org/sparql'

const STATION_CLASSES = [
  'wd:Q55488', // railway station
  'wd:Q928830', // metro station
  'wd:Q2175765', // tram stop
  'wd:Q22808404', // light rail station
  'wd:Q1793804', // station (generic transport stop / stop area)
  'wd:Q18516630', // underground station
]

const KIND_BY_CLASS = {
  Q928830: 'subway',
  Q18516630: 'subway',
  Q22808404: 'light_rail',
  Q2175765: 'tram',
}

function buildQuery(bbox, { today, languages = [] }) {
  const [s, w, n, e] = bbox
  const since = `${addDays(today, -365)}T00:00:00Z`
  const langs = [...new Set(['en', ...languages])].map((l) => `"${l}"`).join(', ')
  return `SELECT ?item ?clsId ?coord ?opening ?openingPrecision ?underConstruction ?line ?lineLabel ?label ?labelLang ?osmNode WHERE {
  SERVICE wikibase:box {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerSouthWest "Point(${w} ${s})"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerNorthEast "Point(${e} ${n})"^^geo:wktLiteral .
  }
  {
    ?item p:P1619/psv:P1619 ?openNode .
    ?openNode wikibase:timeValue ?opening ; wikibase:timePrecision ?openingPrecision .
    FILTER(?opening >= "${since}"^^xsd:dateTime)
  } UNION {
    ?item wdt:P5817 wd:Q12377751 .
    BIND(true AS ?underConstruction)
    OPTIONAL {
      ?item p:P1619/psv:P1619 ?openNode2 .
      ?openNode2 wikibase:timeValue ?opening ; wikibase:timePrecision ?openingPrecision .
    }
  }
  ?item wdt:P31 ?cls .
  VALUES ?cls { ${STATION_CLASSES.join(' ')} }
  BIND(STRAFTER(STR(?cls), "entity/") AS ?clsId)
  OPTIONAL { ?item wdt:P81 ?line . ?line rdfs:label ?lineLabel . FILTER(LANG(?lineLabel) IN (${langs})) }
  OPTIONAL { ?item rdfs:label ?label . BIND(LANG(?label) AS ?labelLang) FILTER(LANG(?label) IN (${langs})) }
  OPTIONAL { ?item wdt:P11693 ?osmNode . }
}
LIMIT 3000`
}

function parseCoord(wkt) {
  const m = String(wkt || '').match(/Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i)
  return m ? [Number(m[1]), Number(m[2])] : null
}

/** Groups SPARQL rows by item into candidate records. */
function parseResponse(json) {
  const rows = Array.isArray(json?.results?.bindings) ? json.results.bindings : []
  const byItem = new Map()
  for (const row of rows) {
    const uri = row.item?.value
    if (!uri) continue
    const qid = uri.split('/').pop()
    let c = byItem.get(qid)
    if (!c) {
      const coordinates = parseCoord(row.coord?.value)
      if (!coordinates) continue
      c = {
        source: 'wikidata',
        ref: `wd:${qid}`,
        url: `https://www.wikidata.org/wiki/${qid}`,
        coordinates,
        names: {},
        state: 'unknown',
        kind: KIND_BY_CLASS[row.clsId?.value] || 'rail',
        opening: null,
        lineEvidence: [],
        osmRefs: [],
        _lines: new Set(),
      }
      byItem.set(qid, c)
    }
    const kind = KIND_BY_CLASS[row.clsId?.value]
    if (kind && c.kind === 'rail') c.kind = kind
    if (row.underConstruction?.value === 'true') c.state = 'construction'
    if (row.opening?.value) {
      c.opening = morePrecise(
        c.opening,
        parseWikidataTime(row.opening.value, row.openingPrecision?.value),
      )
    }
    if (row.label?.value) {
      const lang = row.labelLang?.value || row.label['xml:lang'] || 'und'
      c.names[lang === 'en' ? 'name:en' : `name:${lang}`] = row.label.value
    }
    if (row.lineLabel?.value && !c._lines.has(row.lineLabel.value)) {
      c._lines.add(row.lineLabel.value)
      c.lineEvidence.push({ text: row.lineLabel.value, weight: 3 })
    }
    if (row.osmNode?.value) c.osmRefs.push(`osm:node/${row.osmNode.value}`)
  }
  return [...byItem.values()].map(({ _lines, ...rest }) => rest)
}

async function queryWikidata(query, { retries = 3 } = {}) {
  let lastError = null
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/sparql-results+json' } },
        90000,
      )
      if (res.ok) return await res.json()
      lastError = new Error(`Wikidata HTTP ${res.status}`)
      await sleep(res.status === 429 ? 20000 : 5000)
    } catch (error) {
      lastError = error
      await sleep(5000)
    }
  }
  throw lastError || new Error('Wikidata failed')
}

module.exports = { buildQuery, parseResponse, queryWikidata }
