// Opening-date parsing. Every parsed date carries the earliest and latest day
// it could mean, so "2027" never counts as due before 1 Jan 2027 and a station
// is only treated as a firm same-day opening when the source gives a full day.

const pad = (n) => String(n).padStart(2, '0')

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function yearRange(y) {
  return { date: `${y}-01-01`, latest: `${y}-12-31`, precision: 'year' }
}

function monthRange(y, m) {
  return {
    date: `${y}-${pad(m)}-01`,
    latest: `${y}-${pad(m)}-${pad(lastDayOfMonth(y, m))}`,
    precision: 'month',
  }
}

function dayRange(y, m, d) {
  const v = `${y}-${pad(m)}-${pad(d)}`
  return { date: v, latest: v, precision: 'day' }
}

/**
 * Parses OSM `opening_date` style values: 2027-06-15, 2027-06, 2027, ~2027,
 * 2027-Q2, "2027..2028", "late 2027", "summer 2027". Unknown -> date null.
 */
function parseLooseDate(raw, source = 'osm') {
  const original = raw == null ? '' : String(raw).trim()
  const base = { raw: original, source }
  if (!original) return { ...base, date: null, latest: null, precision: 'unknown' }

  let s = original.toLowerCase().replace(/^(~|approx\.?|circa|ca\.?|c\.)\s*/, '')
  // Ranges: take the whole span.
  const range = s.match(/^(\d{4}(?:-\d{2}){0,2})\s*(?:\.\.|–|—|\/)\s*(\d{4}(?:-\d{2}){0,2})$/)
  if (range) {
    const a = parseLooseDate(range[1], source)
    const b = parseLooseDate(range[2], source)
    if (a.date && b.latest) {
      return { ...base, date: a.date, latest: b.latest, precision: 'range' }
    }
  }

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return { ...base, ...dayRange(+m[1], +m[2], +m[3]) }

  m = s.match(/^(\d{4})-q([1-4])$/) || s.match(/^q([1-4])\s+(\d{4})$/)
  if (m) {
    const [y, q] = s.startsWith('q') ? [+m[2], +m[1]] : [+m[1], +m[2]]
    const startMonth = (q - 1) * 3 + 1
    return {
      ...base,
      date: `${y}-${pad(startMonth)}-01`,
      latest: monthRange(y, startMonth + 2).latest,
      precision: 'quarter',
    }
  }

  m = s.match(/^(\d{4})-(\d{2})$/)
  if (m) return { ...base, ...monthRange(+m[1], +m[2]) }

  m = s.match(/^(early|spring|mid|summer|late|autumn|fall|winter|end of)?\s*(\d{4})$/)
  if (m) {
    const y = +m[2]
    const season = m[1]
    const spans = {
      early: [1, 4],
      spring: [3, 5],
      mid: [5, 8],
      summer: [6, 8],
      late: [9, 12],
      autumn: [9, 11],
      fall: [9, 11],
      winter: [12, 12],
      'end of': [10, 12],
    }
    if (season && spans[season]) {
      const [a, b] = spans[season]
      return { ...base, date: `${y}-${pad(a)}-01`, latest: monthRange(y, b).latest, precision: 'season' }
    }
    return { ...base, ...yearRange(y) }
  }

  return { ...base, date: null, latest: null, precision: 'unknown' }
}

/** Wikidata time value + precision (9 year, 10 month, 11 day). */
function parseWikidataTime(value, precision) {
  const m = String(value || '').match(/^\+?(\d{4})-(\d{2})-(\d{2})/)
  const raw = String(value || '')
  if (!m) return { raw, source: 'wikidata', date: null, latest: null, precision: 'unknown' }
  const p = Number(precision)
  const y = +m[1]
  if (p >= 11) return { raw: `${m[1]}-${m[2]}-${m[3]}`, source: 'wikidata', ...dayRange(y, +m[2], +m[3]) }
  if (p === 10) return { raw: `${m[1]}-${m[2]}`, source: 'wikidata', ...monthRange(y, +m[2]) }
  return { raw: m[1], source: 'wikidata', ...yearRange(y) }
}

const PRECISION_RANK = { day: 5, month: 4, quarter: 3, season: 3, range: 2, year: 1, unknown: 0 }

/** Picks the more precise of two parsed dates (ties keep `current`). */
function morePrecise(current, next) {
  if (!next || !next.date) return current
  if (!current || !current.date) return next
  return PRECISION_RANK[next.precision] > PRECISION_RANK[current.precision] ? next : current
}

function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(fromIso, toIso) {
  return Math.round(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000,
  )
}

function sameDate(a, b) {
  return Boolean(a && b && a.date === b.date && a.latest === b.latest)
}

module.exports = {
  parseLooseDate,
  parseWikidataTime,
  morePrecise,
  todayIso,
  addDays,
  daysBetween,
  sameDate,
  PRECISION_RANK,
}
