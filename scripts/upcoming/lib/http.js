// Fetch with timeout + polite User-Agent. Free public APIs (Overpass, Wikidata)
// require an identifying UA and ask clients to back off on 429/504.

const USER_AGENT =
  process.env.UPCOMING_USER_AGENT ||
  'MetroMemoryUpcomingBot/1.0 (+https://github.com/kirklandwaterbot/metro-memory)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...options,
      headers: { 'User-Agent': USER_AGENT, ...(options.headers || {}) },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { fetchWithTimeout, sleep, USER_AGENT }
