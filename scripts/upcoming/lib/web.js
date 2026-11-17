// Optional web check for stations whose opening window has arrived (or is
// close): searches the web and asks the configured LLM whether the station has
// opened, or what its announced opening date is. Uses the same env vars as the
// existing research engine (SERPAPI_API_KEY, AUTOMATION_LLM_*). If they are not
// set, this module does nothing and the updater relies on OSM + Wikidata only.

const { fetchWithTimeout } = require('./http')

function config() {
  const serp = process.env.SERPAPI_API_KEY?.trim() || ''
  const apiKey =
    process.env.AUTOMATION_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || ''
  const model = process.env.AUTOMATION_LLM_MODEL?.trim() || ''
  const baseUrl = (process.env.AUTOMATION_LLM_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  )
  return { enabled: Boolean(serp && apiKey && model), serp, apiKey, model, baseUrl }
}

function isWebCheckEnabled() {
  return config().enabled
}

const TIER1 = [/\.gov(\.[a-z]{2})?$/, /\.gouv\./, /\.gob\./, /metro/, /transit/, /transport/, /subway/, /rail/, /mta\./, /tfl\./]
const TIER2 = [/wikipedia\.org$/, /railwaygazette|urbanrail|masstransit|railjournal|trains\.com/, /reuters|apnews|bbc|nytimes|theguardian|scmp|nhk|xinhua/]

function tierOf(url) {
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return 3
  }
  if (TIER1.some((re) => re.test(host))) return 1
  if (TIER2.some((re) => re.test(host))) return 2
  return 3
}

async function search(query, cfg) {
  const params = new URLSearchParams({ engine: 'google', q: query, api_key: cfg.serp, num: '6' })
  const res = await fetchWithTimeout(`https://serpapi.com/search.json?${params}`, {}, 20000)
  if (!res.ok) return []
  const data = await res.json().catch(() => null)
  return (data?.organic_results || [])
    .map((r) => ({ title: r.title || '', url: r.link || '', snippet: r.snippet || '', date: r.date || null }))
    .filter((r) => r.url)
}

async function pageText(url) {
  try {
    const res = await fetchWithTimeout(url, {}, 20000)
    if (!res.ok || !/html|text/.test(res.headers.get('content-type') || '')) return ''
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 6000)
  } catch {
    return ''
  }
}

async function askModel(system, user, cfg) {
  const res = await fetchWithTimeout(
    `${cfg.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    },
    60000,
  )
  if (!res.ok) return null
  const payload = await res.json().catch(() => null)
  try {
    return JSON.parse(payload?.choices?.[0]?.message?.content || 'null')
  } catch {
    return null
  }
}

/**
 * Returns { checkedOn, opened, openedOn, announcedDate, url, tier, quote } or null.
 * `openedOn`/`announcedDate` are YYYY-MM-DD strings or null.
 */
async function webCheck(entry, cityLabel, today) {
  const cfg = config()
  if (!cfg.enabled) return null
  const queries = [
    `"${entry.name}" station ${cityLabel} opening date`,
    `"${entry.name}" station ${cityLabel} opened`,
  ]
  const results = []
  const seen = new Set()
  for (const q of queries) {
    for (const r of await search(q, cfg)) {
      if (seen.has(r.url)) continue
      seen.add(r.url)
      results.push(r)
    }
  }
  if (!results.length) return null
  const top = results.slice(0, 6)
  for (const r of top.slice(0, 3)) r.text = await pageText(r.url)

  const system = `You check transit station openings for a map game. Today is ${today}.
Answer ONLY from the provided sources. Return JSON:
{"opened": true|false|null, "opened_on": "YYYY-MM-DD"|null, "announced_date": "YYYY-MM-DD"|"YYYY-MM"|"YYYY"|null, "evidence_url": "<one of the source URLs>"|null, "quote": "<short supporting quote>"|null}
- opened=true only if a source clearly says the station is open to passengers now.
- announced_date is the currently announced opening date if the station is not open yet (use the most recent announcement; delays replace earlier dates).
- Use null when the sources do not say.`
  const user = `Station: ${entry.name}\nCity: ${cityLabel}\nLine: ${entry.lineName || entry.line || 'unknown'}\nCurrently expected: ${entry.expected?.raw || 'unknown'}\n\nSources:\n${top
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nDate: ${r.date || 'unknown'}\n${r.snippet} ${r.text || ''}`.slice(0, 3500))
    .join('\n\n')}`

  const answer = await askModel(system, user, cfg)
  if (!answer || typeof answer !== 'object') return null
  const url = top.some((r) => r.url === answer.evidence_url) ? answer.evidence_url : null
  const iso = (v) => (typeof v === 'string' && /^\d{4}(-\d{2}){0,2}$/.test(v) ? v : null)
  return {
    checkedOn: today,
    opened: answer.opened === true ? true : answer.opened === false ? false : null,
    openedOn: iso(answer.opened_on),
    announcedDate: iso(answer.announced_date),
    url,
    tier: url ? tierOf(url) : 3,
    quote: typeof answer.quote === 'string' ? answer.quote.slice(0, 300) : null,
  }
}

module.exports = { webCheck, isWebCheckEnabled, tierOf }
