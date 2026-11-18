// Markdown report used as the pull-request body.

function lineLabel(entry, city) {
  const id = entry.lineOverride || entry.line
  if (!id) return 'line unknown'
  return city?.lines?.[id]?.name ? `${city.lines[id].name} (\`${id}\`)` : `\`${id}\``
}

const SOURCE_LABELS = { osm: 'OSM', wikidata: 'Wikidata' }

// Source links plus an OpenRailwayMap view of the spot. ORM renders the same
// OSM data, but its railway layer shows construction/proposed track and
// stations clearly, which makes reviewing a find much quicker.
function link(entry) {
  const parts = (entry.sources || []).map((s) => `[${SOURCE_LABELS[s.type] || s.type}](${s.url})`)
  if (entry.webCheck?.url) parts.push(`[web](${entry.webCheck.url})`)
  const [lon, lat] = entry.coordinates || []
  if (typeof lat === 'number' && typeof lon === 'number') {
    parts.push(
      `[OpenRailwayMap](https://www.openrailwaymap.org/?style=standard&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&zoom=16)`,
    )
  }
  return parts.length ? ` — ${parts.join(' · ')}` : ''
}

function buildReport({ today, results, errors, webEnabled }) {
  const out = []
  out.push(`# Upcoming stations update — ${today}`)
  out.push('')
  out.push(
    `Cities researched: ${results.length}. Sources: OpenStreetMap, Wikidata${webEnabled ? ', web search + LLM check' : ''}.`,
  )
  out.push('')

  const section = (title, rows) => {
    if (!rows.length) return
    out.push(`## ${title}`)
    out.push('')
    out.push(...rows)
    out.push('')
  }

  const promoted = []
  const blocked = []
  const due = []
  const delays = []
  const added = []
  const checks = []

  for (const r of results) {
    for (const p of r.promoted) {
      promoted.push(
        `- **${r.slug}** — ${p.entry.name} on ${lineLabel(p.entry, r.city)} · ${p.decision.reason}${
          p.decision.confidence === 'scheduled' ? ' ⚠️ *scheduled date only, not yet confirmed open*' : ''
        }${link(p.entry)}`,
      )
      for (const n of p.notes) promoted.push(`  - ${n}`)
    }
    for (const e of r.store.entries) {
      if (e.status === 'needs-line' && (e.expected?.date || e.osmState === 'construction')) {
        const cands = e.lineCandidates?.length
          ? ` (candidates: ${e.lineCandidates.map((c) => `\`${c.line}\` ${c.score}`).join(', ')})`
          : ''
        blocked.push(`- **${r.slug}** — ${e.name}, expected ${e.expected?.raw || 'n/a'}: ${e.statusReason}${cands}${link(e)}`)
      }
      if (e.status === 'due' || e.status === 'overdue') {
        due.push(`- **${r.slug}** — ${e.name} on ${lineLabel(e, r.city)}: ${e.statusReason}${link(e)}`)
      }
      if (e.status === 'check') checks.push(`- **${r.slug}** — ${e.name}: ${e.statusReason}${link(e)}`)
    }
    for (const c of r.dateChanges) {
      delays.push(
        `- **${r.slug}** — ${c.entry.name}: ${c.from.raw || c.from.date} → ${c.to.raw || c.to.date} (${c.to.source})`,
      )
    }
    for (const e of r.added) {
      if (e.status === 'in-game' || e.status === 'promoted') continue
      added.push(
        `- **${r.slug}** — ${e.name} on ${lineLabel(e, r.city)}, expected ${e.expected?.raw || 'no date yet'} [${e.status}]${link(e)}`,
      )
    }
  }

  section('✅ Added to the game (opened)', promoted)
  section('📅 Opening date changes', delays)
  section('⏳ Due or overdue — waiting for confirmation', due)
  section('🆕 Newly tracked upcoming stations', added)
  section('🧭 Needs a line before it can be added', blocked)
  section('🔍 Needs a human check', checks)
  if (errors.length) section('⚠️ Errors', errors.map((e) => `- ${e}`))

  out.push('---')
  out.push(
    'Tracked stations live in `upcoming/<city>.json`. Set `"status": "ignored"` to dismiss one, or `"lineOverride"` / `"nameOverride"` to correct it. See `upcoming/README.md`.',
  )
  return out.join('\n')
}

module.exports = { buildReport }
