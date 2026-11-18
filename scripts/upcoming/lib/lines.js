// Works out which of a city's existing lines an upcoming station belongs to,
// from free-text evidence (OSM route names/refs, Wikidata "connecting line").

const { normalizeLineText } = require('./names')

function refOf(text) {
  // "Line 5", "5号线", "U5", "M2" -> "5" / "u5" / "m2"
  const core = normalizeLineText(text)
  if (/^([a-z]{1,2}\d{0,3}[a-z]?|\d{1,3}[a-z]?)$/.test(core)) return core
  return null
}

/**
 * Builds the match terms for every line: the id, display name, registry
 * keywords, plus bare refs ("5" for "Line 5").
 */
function buildLineIndex(city) {
  const registryLines = new Map(
    (city.registry?.lines || []).filter((l) => l && l.id).map((l) => [l.id, l]),
  )
  const index = []
  for (const [id, meta] of Object.entries(city.lines || {})) {
    const terms = new Set()
    const refs = new Set()
    const add = (t) => {
      const n = normalizeLineText(t)
      if (n && n.length >= 1) terms.add(n)
      const r = refOf(t)
      if (r) refs.add(r)
    }
    add(meta?.name)
    add(id)
    // Split CamelCase ids like "MBTATMetroRedLine" into words.
    add(String(id).replace(/([a-z])([A-Z])/g, '$1 $2'))
    for (const k of registryLines.get(id)?.keywords || []) add(k)
    index.push({
      id,
      terms: [...terms],
      refs: [...refs],
      color: String(meta?.color || '').toLowerCase(),
    })
  }
  return index
}

function containsPhrase(haystack, phrase) {
  if (!phrase) return false
  return ` ${haystack} `.includes(` ${phrase} `)
}

/** Lines whose terms appear in `text` (or whose ref equals `ref`). */
function matchLines(index, { text, ref }) {
  const hay = normalizeLineText(text || '')
  const refNorm = ref ? normalizeLineText(ref) : null
  const hits = []
  for (const line of index) {
    let hit = false
    if (refNorm && line.refs.includes(refNorm)) hit = true
    if (!hit && hay) {
      for (const t of line.terms) {
        // Single-character terms ("b", "5") only count as an exact match.
        if (t.length <= 2 ? hay === t : containsPhrase(hay, t)) {
          hit = true
          break
        }
      }
    }
    if (hit) hits.push(line.id)
  }
  return hits
}

/**
 * Scores evidence items `{ text, ref, colour, weight }` against the city's lines.
 * Lines listed in `exclude` (already serving this station) are skipped.
 * Returns ranked candidates and a decision: a line id when one line clearly wins.
 */
function scoreLines(index, evidence, exclude = new Set()) {
  const scores = new Map()
  for (const item of evidence) {
    const hits = matchLines(index, item).filter((id) => !exclude.has(id))
    if (!hits.length) continue
    // Evidence that matches several lines is split between them.
    const share = (item.weight || 1) / hits.length
    for (const id of hits) scores.set(id, (scores.get(id) || 0) + share)
    const colour = String(item.colour || '').toLowerCase()
    if (colour) {
      for (const id of hits) {
        const line = index.find((l) => l.id === id)
        if (line && line.color === colour) scores.set(id, scores.get(id) + 0.5)
      }
    }
  }
  const ranked = [...scores.entries()]
    .map(([line, score]) => ({ line, score: Math.round(score * 100) / 100 }))
    .sort((a, b) => b.score - a.score)
  const decided =
    ranked.length && (ranked.length === 1 || ranked[0].score > ranked[1].score) ? ranked[0].line : null
  return { ranked, line: decided }
}

module.exports = { buildLineIndex, matchLines, scoreLines, refOf }
