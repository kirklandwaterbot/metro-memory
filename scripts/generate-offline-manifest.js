const fs = require('fs/promises')
const path = require('path')

const ROOTS = [
  { dir: path.join(process.cwd(), 'public', 'city-data'), prefix: '/city-data/' },
  { dir: path.join(process.cwd(), 'public', 'city-icons'), prefix: '/city-icons/' },
  { dir: path.join(process.cwd(), 'public', 'city-cards'), prefix: '/city-cards/' },
  { dir: path.join(process.cwd(), 'public', 'images'), prefix: '/images/' },
]

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

// slug -> 'continent/country/city', read from the generated route map.
async function readCityPaths() {
  const source = await fs.readFile(
    path.join(process.cwd(), 'src', 'lib', 'cityPathMap.ts'),
    'utf8',
  )
  const map = {}
  for (const match of source.matchAll(/^\s*'?([a-z0-9-]+)'?\s*:\s*'([^']+)'/gm)) {
    map[match[1]] = match[2]
  }
  return map
}

async function main() {
  const cityPaths = await readCityPaths()
  const slugs = Object.keys(cityPaths)
  // Longest path first so 'usa/nyc/regional-rail' wins over 'usa/nyc'.
  const pathEntries = Object.entries(cityPaths).sort((a, b) => b[1].length - a[1].length)

  // File base name -> city slug. Split files such as nyc-features.json belong
  // to the longest slug they start with.
  const slugForBaseName = (baseName) => {
    if (cityPaths[baseName]) return baseName
    let best = null
    for (const slug of slugs) {
      if (baseName.startsWith(`${slug}-`) && (!best || slug.length > best.length)) {
        best = slug
      }
    }
    return best
  }

  // '/images/<city path>/...' -> every slug whose path contains the file.
  const slugsForImage = (rel) => {
    const dir = path.posix.dirname(rel)
    return pathEntries
      .filter(([, cityPath]) => dir === cityPath || dir.startsWith(`${cityPath}/`))
      .map(([slug]) => slug)
  }

  const assets = ['/']
  const cityAssets = {}
  const add = (slug, assetPath) => {
    if (!slug) return
    cityAssets[slug] = cityAssets[slug] || []
    cityAssets[slug].push(assetPath)
  }

  for (const root of ROOTS) {
    try {
      const files = await listFiles(root.dir)
      for (const file of files) {
        const rel = path.relative(root.dir, file).split(path.sep).join('/')
        const assetPath = `${root.prefix}${rel}`
        assets.push(assetPath)
        if (root.prefix === '/images/') {
          for (const slug of slugsForImage(rel)) add(slug, assetPath)
        } else {
          add(slugForBaseName(path.basename(file, path.extname(file))), assetPath)
        }
      }
    } catch (error) {
      console.warn(`offline manifest: skipped ${root.dir}`, error)
    }
  }

  for (const [slug, cityPath] of Object.entries(cityPaths)) {
    add(slug, `/${cityPath}`)
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    assets,
    cityPaths,
    cityAssets,
  }

  const target = path.join(process.cwd(), 'public', 'offline-manifest.json')
  await fs.writeFile(target, JSON.stringify(manifest, null, 2))
  console.log(`offline manifest wrote ${assets.length} assets to ${target}`)
}

main().catch((error) => {
  console.error('Failed to build offline manifest', error)
  process.exitCode = 1
})
