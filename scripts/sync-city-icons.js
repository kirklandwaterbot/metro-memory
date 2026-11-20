const path = require('path')
const fs = require('fs/promises')
const fg = require('fast-glob')

const SOURCE_ROOT = path.join(process.cwd(), 'public', 'images')
const DEST_ROOT = path.join(process.cwd(), 'public', 'city-icons')
const FALLBACK_CANDIDATES = [
  path.join(SOURCE_ROOT, '_default', 'icon.ico'),
  path.join(process.cwd(), 'public', 'favicon.ico'),
]

async function ensureDestDir() {
  await fs.mkdir(DEST_ROOT, { recursive: true })
}

async function findFallback() {
  for (const candidate of FALLBACK_CANDIDATES) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // continue
    }
  }
  return null
}

async function main() {
  await ensureDestDir()

  const matches = await fg('**/icon.ico', { cwd: SOURCE_ROOT })

  let copied = 0
  for (const relPath of matches) {
    const slug = path.basename(path.dirname(relPath))
    if (slug === '_default') continue
    // A city can keep a wide logo as icon.ico (used as its line-group header)
    // and put a square tab-icon.ico next to it for the browser tab.
    const tabIcon = path.join(SOURCE_ROOT, path.dirname(relPath), 'tab-icon.ico')
    const src = (await fs
      .access(tabIcon)
      .then(() => true)
      .catch(() => false))
      ? tabIcon
      : path.join(SOURCE_ROOT, relPath)
    const dest = path.join(DEST_ROOT, `${slug}.ico`)
    await fs.copyFile(src, dest)
    copied++
  }

  const fallback = await findFallback()
  if (fallback) {
    await fs.copyFile(fallback, path.join(DEST_ROOT, '_default.ico'))
  }

  console.log(`Copied ${copied} icons to ${DEST_ROOT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
