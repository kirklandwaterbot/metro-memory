// Merges research candidates (OSM + Wikidata) into a city's upcoming store:
// combines duplicate sightings, skips stations the game already has, picks a
// line, tracks the expected opening date (and every change to it), and sets a
// status for each entry.

const { haversine } = require('./geo')
const { keysForNames, namesOverlap, stationKeys, isAscii } = require('./names')
const { buildLineIndex, scoreLines } = require('./lines')
const { PRECISION_RANK, sameDate, daysBetween } = require('./dates')

const METRO_KINDS = new Set(['subway', 'light_rail', 'monorail', 'tram'])
const STICKY = new Set(['promoted', 'ignored', 'in-game'])
const OVERDUE_DAYS = 30

function cleanName(value) {
  return String(value || '')
    .replace(
      /\s+(metro |subway |underground |light rail |railway |train |tram )?(station|stop|halt)$/i,
      '',
    )
    .replace(/(駅|站|역)$/u, '')
    .trim()
}

/** Chooses a game-style display name + alternates from collected names. */
function chooseNames(names, city) {
  const langs = city.localLanguages.filter((l) => l !== 'en')
  const raw = names.name
  const en = names['name:en'] || null
  const latin =
    en ||
    langs
      .map((l) => names[`name:${l}-Latn`] || names[`name:${l}_rm`])
      .find(Boolean) ||
    (raw && isAscii(raw) ? raw : null)
  const native =
    langs.map((l) => names[`name:${l}`]).find(Boolean) ||
    (raw && !isAscii(raw) ? raw : null)

  let name
  if (
    city.nameStyle.style === 'bilingual' &&
    latin &&
    native &&
    cleanName(latin) !== cleanName(native)
  ) {
    name = `${cleanName(latin)} (${cleanName(native)})`
  } else if (city.nameStyle.style === 'native') {
    name = cleanName(native || latin || raw)
  } else {
    name = cleanName(latin || raw || native)
  }
  const alternates = []
  for (const v of [raw, en, native, ...langs.map((l) => names[`name:${l}`])]) {
    const c = cleanName(v)
    if (c && c !== name && !alternates.includes(c)) alternates.push(c)
  }
  return { name, alternates }
}

/** Combines OSM and Wikidata sightings of the same station. */
function combineCandidates(osm, wikidata) {
  const merged = osm.map((c) => ({
    refs: [c.ref],
    sources: [{ type: 'osm', url: c.url }],
    coordinates: c.coordinates,
    names: { ...c.names },
    kind: c.kind,
    osm: {
      state: c.state,
      opening: c.opening?.date ? c.opening : null,
      started: c.started || null,
    },
    wikidata: null,
    lineEvidence: [...c.lineEvidence],
  }))
  for (const w of wikidata) {
    const wKeys = keysForNames(Object.values(w.names))
    const match = merged.find((m) => {
      // An explicit OSM link on the Wikidata item is an identity match.
      if (w.osmRefs?.some((r) => m.refs.includes(r))) return true
      // Otherwise nearby is not enough: two different stations can sit under 120 m apart
      // (interchange complexes, rebuilt stations). Names must overlap, unless one side
      // has no usable names at all and the two points practically coincide.
      const d = haversine(m.coordinates, w.coordinates)
      const mKeys = keysForNames(Object.values(m.names))
      if (namesOverlap(wKeys, mKeys)) return d < 400
      return d < 40 && (wKeys.size === 0 || mKeys.size === 0)
    })
    const wd = { state: w.state, opening: w.opening?.date ? w.opening : null }
    if (match) {
      match.refs.push(w.ref)
      match.sources.push({ type: 'wikidata', url: w.url })
      for (const [k, v] of Object.entries(w.names))
        if (!match.names[k]) match.names[k] = v
      match.wikidata = wd
      match.lineEvidence.push(...w.lineEvidence)
    } else {
      merged.push({
        refs: [w.ref],
        sources: [{ type: 'wikidata', url: w.url }],
        coordinates: w.coordinates,
        names: {
          ...w.names,
          ...(w.names['name:en'] ? { name: w.names['name:en'] } : {}),
        },
        kind: w.kind || 'rail',
        osm: null,
        wikidata: wd,
        lineEvidence: [...w.lineEvidence],
      })
    }
  }
  return merged
}

function existingIndex(city) {
  return city.features.features
    .filter((f) => Array.isArray(f?.geometry?.coordinates))
    .map((f) => ({
      keys: stationKeys(f.properties),
      line: f.properties?.line,
      coordinates: f.geometry.coordinates,
      feature: f,
    }))
}

/** Lines that already have a station with this name within `radius` metres. */
function linesServing(existing, keys, coordinates, radius = 500) {
  const lines = new Set()
  for (const e of existing) {
    if (
      e.line &&
      namesOverlap(keys, e.keys) &&
      haversine(e.coordinates, coordinates) < radius
    ) {
      lines.add(e.line)
    }
  }
  return lines
}

/** Best expected date: most precise source wins; on ties the later date (delays). */
function pickExpected(entry) {
  const options = [
    entry.osmOpening,
    entry.wikidataOpening,
    entry.webAnnounced,
  ].filter((d) => d && d.date)
  if (!options.length) return null
  options.sort(
    (a, b) =>
      PRECISION_RANK[b.precision] - PRECISION_RANK[a.precision] ||
      (b.date > a.date ? 1 : b.date < a.date ? -1 : 0),
  )
  return options[0]
}

function computeStatus(entry, city, today) {
  if (STICKY.has(entry.status))
    return { status: entry.status, reason: entry.statusReason }
  const line = entry.lineOverride || entry.line
  if (entry.osmState === 'disused') {
    return {
      status: 'check',
      reason: 'OSM now tags this as disused/abandoned — possibly cancelled',
    }
  }
  if (entry.missingSince) {
    return {
      status: 'check',
      reason: `no longer found in OSM since ${entry.missingSince}`,
    }
  }
  if (!line || !city.lines[line]) {
    return {
      status: 'needs-line',
      reason: entry.lineCandidates?.length
        ? 'line evidence is ambiguous'
        : 'no matching line in this city — probably a new line that needs setting up',
    }
  }
  const exp = entry.expected
  if (exp?.date && exp.date <= today) {
    const latest = exp.latest || exp.date
    if (daysBetween(latest, today) > OVERDUE_DAYS) {
      return {
        status: 'overdue',
        reason: `expected by ${latest}; no confirmation it opened yet`,
      }
    }
    return { status: 'due', reason: `opening window started ${exp.date}` }
  }
  if (entry.osmState === 'operational' && !exp?.date) {
    return { status: 'due', reason: 'OSM shows it operational' }
  }
  return {
    status: 'scheduled',
    reason: exp?.date
      ? `expected ${exp.raw || exp.date}`
      : 'under construction, no date yet',
  }
}

/**
 * Re-derives an entry's expected date and status (after new evidence arrived).
 * Records date changes into ctx.dateChanges and closures into ctx.closed.
 */
function refreshEntry(entry, city, today, ctx = {}) {
  if (STICKY.has(entry.status)) return
  const existing = ctx.existing || existingIndex(city)

  // Someone added it to the game by hand: close it out.
  const line = entry.lineOverride || entry.line
  if (line) {
    const keys = keysForNames([entry.name, ...(entry.alternateNames || [])])
    if (linesServing(existing, keys, entry.coordinates).has(line)) {
      entry.status = 'in-game'
      entry.statusReason = `already in the game data on ${line}`
      ctx.closed?.push(entry)
      return
    }
  }

  const next = pickExpected(entry)
  if (!sameDate(entry.expected, next) && (entry.expected || next)) {
    if (entry.expected && next) {
      entry.dateHistory.push({
        on: today,
        from: entry.expected.raw || entry.expected.date,
        to: next.raw || next.date,
        source: next.source,
      })
      ctx.dateChanges?.push({ entry, from: entry.expected, to: next })
    }
    entry.expected = next
  }
  const { status, reason } = computeStatus(entry, city, today)
  entry.status = status
  entry.statusReason = reason
}

/**
 * @returns {{ added: object[], dateChanges: object[], closed: object[] }}
 */
function mergeIntoStore({ city, store, osm, wikidata, today, checkedRefs }) {
  const index = buildLineIndex(city)
  const existing = existingIndex(city)
  const added = []
  const dateChanges = []
  const closed = []
  const seenEntryIds = new Set()

  for (const cand of combineCandidates(osm, wikidata)) {
    const { name, alternates } = chooseNames(cand.names, city)
    if (!name) continue
    const keys = keysForNames([
      name,
      ...alternates,
      ...Object.values(cand.names),
    ])
    const served = linesServing(existing, keys, cand.coordinates)
    const scored = scoreLines(index, cand.lineEvidence, served)

    let entry = store.entries.find(
      (e) =>
        e.refs?.some((r) => cand.refs.includes(r)) ||
        (haversine(e.coordinates, cand.coordinates) < 300 &&
          namesOverlap(
            keysForNames([e.name, ...(e.alternateNames || [])]),
            keys,
          )),
    )

    if (!entry) {
      // New sighting: skip what the game already has / pure noise.
      const operational =
        (cand.osm?.state || 'operational') === 'operational' &&
        cand.wikidata?.state !== 'construction'
      if (cand.osm?.state === 'disused') continue
      if (!scored.line) {
        // Without a matching line we only keep metro/light-rail/tram stations the
        // city actually plays (plain rail halts in a big box are mostly noise).
        if (served.size) continue // existing station (renovation, new entrance, etc.)
        if (!METRO_KINDS.has(cand.kind)) continue
        if (city.modes && !city.modes.includes(cand.kind)) continue
        if (operational && !cand.osm?.opening && !cand.wikidata?.opening)
          continue
      }
      entry = {
        id: cand.refs[0],
        refs: [],
        name,
        alternateNames: alternates,
        coordinates: cand.coordinates,
        line: null,
        lineOverride: null,
        nameOverride: null,
        lineCandidates: [],
        kind: cand.kind,
        osmState: null,
        wikidataState: null,
        osmOpening: null,
        wikidataOpening: null,
        webAnnounced: null,
        expected: null,
        dateHistory: [],
        status: 'scheduled',
        statusReason: '',
        sources: [],
        webCheck: null,
        firstSeen: today,
        promotedOn: null,
        featureId: null,
      }
      store.entries.push(entry)
      added.push(entry)
    }
    seenEntryIds.add(entry.id)
    if (STICKY.has(entry.status)) continue

    for (const r of cand.refs) if (!entry.refs.includes(r)) entry.refs.push(r)
    for (const s of cand.sources)
      if (!entry.sources.some((x) => x.url === s.url)) entry.sources.push(s)
    entry.name = entry.nameOverride || name
    entry.alternateNames = alternates.filter((a) => a !== entry.name)
    entry.coordinates = cand.coordinates.map((n) => Math.round(n * 1e6) / 1e6)
    entry.kind = cand.kind !== 'rail' ? cand.kind : entry.kind
    entry.line = scored.line || (scored.ranked.length ? null : entry.line)
    entry.lineCandidates = scored.ranked.slice(0, 4)
    if (cand.osm) {
      entry.osmState = cand.osm.state
      entry.osmOpening = cand.osm.opening
      if (
        cand.osm.state === 'operational' &&
        !cand.osm.opening &&
        cand.osm.started?.date
      ) {
        entry.osmOpening = { ...cand.osm.started, source: 'osm:start_date' }
      }
    }
    if (cand.wikidata) {
      entry.wikidataState = cand.wikidata.state
      entry.wikidataOpening = cand.wikidata.opening
    }
    delete entry.missingSince
  }

  // Tracked entries we asked OSM about by id but didn't get back were deleted.
  for (const entry of store.entries) {
    if (STICKY.has(entry.status) || seenEntryIds.has(entry.id)) continue
    const osmRefs = (entry.refs || []).filter((r) => r.startsWith('osm:'))
    if (
      osmRefs.length &&
      osmRefs.every((r) => checkedRefs.has(r)) &&
      !entry.missingSince
    ) {
      entry.missingSince = today
    }
  }

  for (const entry of store.entries)
    refreshEntry(entry, city, today, { existing, dateChanges, closed })

  return { added, dateChanges, closed }
}

module.exports = {
  mergeIntoStore,
  refreshEntry,
  existingIndex,
  chooseNames,
  cleanName,
  combineCandidates,
  computeStatus,
  pickExpected,
}
