// Name normalisation shared by discovery, de-duplication and line matching.

const STATION_WORDS =
  /\b(station|stn|metro station|subway station|halt|stop|bahnhof|bf|gare|estacion|estação|estacao|stazione)\b/g

function stripAccents(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Reduces a station name to a comparable key: lower case, no accents, no
 * bracketed native-script suffix, no generic "station" words, no punctuation.
 * "Nakano-sakaue (中野坂上)" -> "nakano sakaue"; "中野坂上駅" -> "中野坂上".
 */
function normalizeStationName(value) {
  let s = stripAccents(value).trim()
  const bracket = s.search(/[(（]/)
  if (bracket > 0) s = s.slice(0, bracket)
  s = s
    .toLowerCase()
    .replace(/(站|駅|역|驛)$/u, '')
    .replace(STATION_WORDS, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  return s
}

/** Every comparable key a station is known by (name, display name, aliases). */
function stationKeys(properties) {
  const keys = new Set()
  const add = (v) => {
    const k = normalizeStationName(v)
    if (k) {
      keys.add(k)
      keys.add(k.replace(/\s+/g, ''))
    }
    // Also index the bracketed native part of "Roman (Native)" names.
    const m = String(v ?? '').match(/[(（]([^)）]+)[)）]\s*$/)
    if (m) {
      const n = normalizeStationName(m[1])
      if (n) keys.add(n)
    }
  }
  add(properties?.name)
  add(properties?.display_name)
  for (const alt of properties?.alternate_names || []) add(alt)
  return keys
}

function namesOverlap(keysA, keysB) {
  for (const k of keysA) if (keysB.has(k)) return true
  return false
}

function keysForNames(names) {
  return stationKeys({ name: names[0], alternate_names: names.slice(1) })
}

/** Normalises a line name to its distinctive core: "MBTA Red Line" -> "mbta red". */
function normalizeLineText(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/号线|號線|호선|線/gu, ' line ')
    .replace(/\b(line|linie|ligne|linea|linha|lijn|route|train|service)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function isAscii(value) {
  return /^[\x00-\x7F]*$/.test(String(value ?? ''))
}

module.exports = {
  normalizeStationName,
  stationKeys,
  keysForNames,
  namesOverlap,
  normalizeLineText,
  isAscii,
}
