// Decides when a tracked station has really opened and writes it into the
// city's game data (features.json, plus a connector in routes.json when the
// line's drawn route doesn't reach the new station yet).

const { haversine, nearestOnRoutes } = require('./geo')
const { stationKeys, namesOverlap, keysForNames } = require('./names')

const ROUTE_STUB_MIN_M = 250

function opened(d, today) {
  if (!d?.date) return false
  // A full day is firm; a vaguer value only counts once the whole window passed.
  return d.precision === 'day' ? d.date <= today : (d.latest || d.date) <= today
}

/**
 * @returns {{ ok: boolean, confidence?: 'confirmed'|'scheduled', reason: string }}
 */
function promotionDecision(entry, city, today) {
  if (['promoted', 'ignored', 'in-game'].includes(entry.status)) {
    return { ok: false, reason: entry.status }
  }
  const line = entry.lineOverride || entry.line
  if (!line || !city.lines[line]) return { ok: false, reason: 'no known line' }
  if (!Array.isArray(entry.coordinates) || !entry.name) return { ok: false, reason: 'missing name/coordinates' }
  if (entry.osmState === 'disused' || entry.missingSince) return { ok: false, reason: 'needs a human check' }

  // 1. OSM mappers switched it to an operational station.
  if (entry.osmState === 'operational') {
    const d = entry.osmOpening
    if (!d?.date || opened(d, today)) {
      return { ok: true, confidence: 'confirmed', reason: 'OpenStreetMap now tags it as an operating station' }
    }
  }

  // 2. A web source (tier 1-2) says it's open.
  const w = entry.webCheck
  if (w?.opened === true && w.tier <= 2 && (!w.openedOn || w.openedOn <= today)) {
    return { ok: true, confidence: 'confirmed', reason: `web source confirms opening (${w.url})` }
  }

  // 3. Two independent sources agree on an exact opening day that has passed.
  const o = entry.osmOpening
  const k = entry.wikidataOpening
  if (o?.precision === 'day' && k?.precision === 'day' && o.date === k.date && o.date <= today) {
    if (w?.opened === false || (w?.announcedDate && w.announcedDate > today)) {
      return { ok: false, reason: 'scheduled day passed but a web check says it is not open yet' }
    }
    return {
      ok: true,
      confidence: 'scheduled',
      reason: `OSM and Wikidata both give ${o.date} as the opening day`,
    }
  }

  return { ok: false, reason: 'waiting for confirmation it opened' }
}

function nextId(features) {
  let max = -1
  for (const f of features) {
    for (const v of [f.id, f?.properties?.id]) {
      if (typeof v === 'number' && v > max) max = v
    }
  }
  return max + 1
}

/** Adds the station to city.features (and maybe a route connector). Mutates `city`. */
function applyEntry(entry, city, { routeStubs = true } = {}) {
  const line = entry.lineOverride || entry.line
  const features = city.features.features
  const id = nextId(features)
  const coordinates = entry.coordinates.map((n) => Math.round(n * 1e6) / 1e6)
  const notes = []

  const props = { id, name: entry.name }
  if (city.nameStyle.displayName) props.display_name = entry.name
  props.line = line
  if (city.nameStyle.order) {
    const orders = features
      .filter((f) => f.properties?.line === line && typeof f.properties.order === 'number')
      .map((f) => f.properties.order)
    props.order = orders.length ? Math.max(...orders) + 1 : 0
    notes.push('`order` was appended at the end of the line; adjust if the station sits mid-line')
  }
  if (entry.alternateNames?.length) props.alternate_names = [...entry.alternateNames]

  // Interchanges: reuse the cluster_key of a same-named station next door.
  const keys = keysForNames([entry.name, ...(entry.alternateNames || [])])
  const neighbour = features.find(
    (f) =>
      f.properties?.cluster_key &&
      haversine(f.geometry.coordinates, coordinates) < 300 &&
      namesOverlap(keys, stationKeys(f.properties)),
  )
  if (neighbour) props.cluster_key = neighbour.properties.cluster_key

  features.push({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: props, id })

  let routeChanged = false
  if (routeStubs && city.routes && Array.isArray(city.routes.features)) {
    const lineRoutes = city.routes.features.filter((f) => f?.properties?.line === line)
    const nearest = lineRoutes.length ? nearestOnRoutes(coordinates, lineRoutes) : null
    if (nearest && nearest.distance > ROUTE_STUB_MIN_M) {
      const from = nearest.point.map((n) => Math.round(n * 1e6) / 1e6)
      city.routes.features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [from, coordinates] },
        properties: { ...nearest.feature.properties, auto_generated: 'upcoming-stations' },
      })
      routeChanged = true
      notes.push(
        `route drawn as a straight ${Math.round(nearest.distance)} m connector — replace with real track geometry when convenient`,
      )
    } else if (!lineRoutes.length) {
      notes.push('line has no route geometry to extend')
    }
  }

  return { featureId: id, routeChanged, notes }
}

module.exports = { promotionDecision, applyEntry, nextId }
