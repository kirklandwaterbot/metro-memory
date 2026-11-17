// upcoming/<city>.json: the tracked list of future stations for one city.
// Hand-editable: set "status": "ignored" to dismiss a false positive, or set
// "lineOverride" / "nameOverride" to correct the automatic choices.

const fs = require('fs')
const path = require('path')

const { ROOT } = require('./city')

const STORE_DIR = path.join(ROOT, 'upcoming')

function storePath(slug) {
  return path.join(STORE_DIR, `${slug}.json`)
}

function loadStore(slug) {
  try {
    const data = JSON.parse(fs.readFileSync(storePath(slug), 'utf8'))
    if (data && Array.isArray(data.entries)) return data
  } catch {
    // no store yet
  }
  return { city: slug, entries: [] }
}

/** Writes only when the content changed, so quiet days produce no diff. */
function saveStore(slug, store) {
  const file = storePath(slug)
  const next = `${JSON.stringify({ city: slug, entries: store.entries }, null, 2)}\n`
  let prev = null
  try {
    prev = fs.readFileSync(file, 'utf8')
  } catch {
    // new file
  }
  if (prev === next) return false
  if (!store.entries.length && prev === null) return false
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(file, next)
  return true
}

function listStoreSlugs() {
  try {
    return fs
      .readdirSync(STORE_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
  } catch {
    return []
  }
}

module.exports = { STORE_DIR, storePath, loadStore, saveStore, listStoreSlugs }
