#!/usr/bin/env node

const path = require('path')
const fs = require('fs/promises')
const crypto = require('crypto')
const fg = require('fast-glob')

const ROOT = process.cwd()
const ROUTE_ROOT = path.join(ROOT, 'src', 'app', '(game)')
const DEST_ROOT = path.join(ROOT, 'public', 'images')
const LEGACY_CANONICAL_ROOT = path.join(ROOT, 'public', 'city-assets')
const LEGACY_ICON_ROOT = path.join(ROOT, 'public', 'city-icons')
const MANIFEST_PATH = path.join(ROOT, 'src', 'lib', 'cityAssetManifest.json')
const MINI_CITY_REGISTRY_PATH = path.join(
  ROOT,
  'src',
  'lib',
  'miniCitiesRegistry.json',
)
const DRY_RUN = process.argv.includes('--dry-run')
const CLEAN_ROUTE_ASSETS = process.argv.includes('--clean-route-assets')
const CLEAN_LEGACY_CITY_ASSETS = process.argv.includes(
  '--clean-legacy-city-assets',
)

const ICON_PATTERNS = ['**/icon.ico', '**/favicon.ico']
const OPEN_GRAPH_PATTERNS = [
  '**/opengraph-image.jpg',
  '**/opengraph-image.jpeg',
  '**/opengraph-image.png',
  '**/opengraph-image.webp',
]

const normalizeRoutePath = (value) =>
  value.split(path.sep).join('/').replace(/^\//, '')

const splitRouteParts = (value) => value.split(/[\\/]+/).filter(Boolean)

const isValidRouteParts = (parts) =>
  parts.length >= 3 &&
  parts.every(
    (part) =>
      part &&
      !part.startsWith('_') &&
      !part.startsWith('(') &&
      !part.startsWith('['),
  )

const ensureDir = async (dirPath) => {
  if (!DRY_RUN) {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const readJsonIfPresent = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const hashFileIfPresent = async (filePath) => {
  if (!(await fileExists(filePath))) {
    return null
  }

  const buffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

const copyIfPresent = async (sourcePath, destPath) => {
  if (!sourcePath || !(await fileExists(sourcePath))) {
    return false
  }

  if (await fileExists(destPath)) {
    return false
  }

  await ensureDir(path.dirname(destPath))
  if (!DRY_RUN) {
    await fs.copyFile(sourcePath, destPath)
  }
  return true
}

const removeFileIfPresent = async (filePath) => {
  try {
    if (!DRY_RUN) {
      await fs.unlink(filePath)
    }
    return true
  } catch {
    return false
  }
}

const collectRoutePaths = async () => {
  const matches = await fg('**/page.tsx', { cwd: ROUTE_ROOT })
  const bySlug = new Map()

  for (const relPath of matches) {
    const routeDir = path.dirname(relPath)
    const parts = splitRouteParts(routeDir)
    if (!isValidRouteParts(parts)) {
      continue
    }

    const slug = parts[parts.length - 1]
    if (slug === 'custom') {
      continue
    }

    bySlug.set(slug, normalizeRoutePath(routeDir))
  }

  return bySlug
}

const collectRouteIcons = async () => {
  const matches = await fg(ICON_PATTERNS, { cwd: ROUTE_ROOT })
  const bySlug = new Map()

  for (const relPath of matches) {
    const slug = splitRouteParts(path.dirname(relPath)).at(-1)
    if (!slug) {
      continue
    }
    const fileName = path.basename(relPath)
    const entry = bySlug.get(slug) ?? {}

    if (fileName === 'icon.ico') {
      entry.icon = relPath
    } else if (!entry.icon) {
      entry.favicon = relPath
    }

    bySlug.set(slug, entry)
  }

  return bySlug
}

const buildManifest = async (routePaths) => {
  const manifest = {}

  for (const [slug, routePath] of routePaths.entries()) {
    const entry = {}
    const cityDir = path.join(DEST_ROOT, ...routePath.split('/'))

    if (await fileExists(path.join(cityDir, 'icon.ico'))) {
      entry.icon = true
      // the browser tab shows tab-icon.ico when the city has one (see sync-city-icons.js)
      const tabIconPath = path.join(cityDir, 'tab-icon.ico')
      const iconHash = await hashFileIfPresent(
        (await fileExists(tabIconPath)) ? tabIconPath : path.join(cityDir, 'icon.ico'),
      )
      if (iconHash) {
        entry.iconVersion = iconHash.slice(0, 12)
      }
    }

    for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
      const openGraphPath = path.join(cityDir, `opengraph-image.${extension}`)
      if (await fileExists(openGraphPath)) {
        entry.openGraphExtension = extension
        const openGraphHash = await hashFileIfPresent(openGraphPath)
        if (openGraphHash) {
          entry.openGraphVersion = openGraphHash.slice(0, 12)
        }
        break
      }
    }

    if (Object.keys(entry).length > 0) {
      manifest[slug] = entry
    }
  }

  const sortedManifest = Object.fromEntries(
    Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)),
  )

  if (!DRY_RUN) {
    await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(sortedManifest, null, 2)}\n`)
  }

  return Object.keys(sortedManifest).length
}

// "/asia/japan/tokyo-metro/" -> "asia/japan/tokyo-metro"
const normalizePathFromLink = (link) =>
  String(link || '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '')

const syncMiniCityAssetSourceSlugs = async (routePaths) => {
  const registry = await readJsonIfPresent(MINI_CITY_REGISTRY_PATH)
  if (!registry || !Array.isArray(registry.parents)) {
    return 0
  }

  let updatedChildren = 0

  for (const parent of registry.parents) {
    if (!Array.isArray(parent.children)) {
      continue
    }

    for (const child of parent.children) {
      if (!child || typeof child.slug !== 'string') {
        continue
      }

      const routePath =
        routePaths.get(child.slug) ??
        normalizePathFromLink(typeof child.link === 'string' ? child.link : '')
      if (!routePath) {
        continue
      }

      const cityDir = path.join(DEST_ROOT, ...routePath.split('/'))
      const hasOwnIcon = await fileExists(path.join(cityDir, 'icon.ico'))

      let hasOwnOpenGraph = false
      for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
        if (await fileExists(path.join(cityDir, `opengraph-image.${extension}`))) {
          hasOwnOpenGraph = true
          break
        }
      }

      if (!hasOwnIcon && !hasOwnOpenGraph) {
        continue
      }

      if (child.assetSourceSlug !== child.slug) {
        child.assetSourceSlug = child.slug
        updatedChildren += 1
      }
    }
  }

  if (updatedChildren > 0 && !DRY_RUN) {
    await fs.writeFile(
      MINI_CITY_REGISTRY_PATH,
      `${JSON.stringify(registry, null, 2)}\n`,
    )
  }

  return updatedChildren
}

async function main() {
  await ensureDir(DEST_ROOT)

  const routePaths = await collectRoutePaths()
  const routeIcons = await collectRouteIcons()
  const routeOpenGraphMatches = await fg(OPEN_GRAPH_PATTERNS, {
    cwd: ROUTE_ROOT,
  })

  let copiedIcons = 0
  let copiedOpenGraph = 0
  let removedRouteAssets = 0

  for (const [slug, routePath] of routePaths.entries()) {
    const cityDir = path.join(DEST_ROOT, ...routePath.split('/'))
    const routeIconFiles = routeIcons.get(slug)
    const routeIconPath = routeIconFiles?.icon ?? routeIconFiles?.favicon

    if (
      (await copyIfPresent(
        routeIconPath ? path.join(ROUTE_ROOT, routeIconPath) : null,
        path.join(cityDir, 'icon.ico'),
      )) ||
      (await copyIfPresent(
        path.join(LEGACY_CANONICAL_ROOT, slug, 'icon.ico'),
        path.join(cityDir, 'icon.ico'),
      )) ||
      (await copyIfPresent(
        path.join(LEGACY_ICON_ROOT, `${slug}.ico`),
        path.join(cityDir, 'icon.ico'),
      ))
    ) {
      copiedIcons += 1
    }

    for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
      const copied = await copyIfPresent(
        path.join(LEGACY_CANONICAL_ROOT, slug, `opengraph-image.${extension}`),
        path.join(cityDir, `opengraph-image.${extension}`),
      )
      if (copied) {
        copiedOpenGraph += 1
        break
      }
    }
  }

  for (const relPath of routeOpenGraphMatches) {
    const routePath = normalizeRoutePath(path.dirname(relPath))
    const routeParts = routePath.split('/')
    if (!isValidRouteParts(routeParts)) {
      continue
    }

    const extension = path.extname(relPath)
    const copied = await copyIfPresent(
      path.join(ROUTE_ROOT, relPath),
      path.join(DEST_ROOT, ...routePath.split('/'), `opengraph-image${extension}`),
    )
    if (copied) {
      copiedOpenGraph += 1
    }
  }

  if (await fileExists(path.join(LEGACY_CANONICAL_ROOT, '_default', 'icon.ico'))) {
    await ensureDir(path.join(DEST_ROOT, '_default'))
    await copyIfPresent(
      path.join(LEGACY_CANONICAL_ROOT, '_default', 'icon.ico'),
      path.join(DEST_ROOT, '_default', 'icon.ico'),
    )
  }

  if (CLEAN_ROUTE_ASSETS) {
    const routeAssetsToRemove = [...routeOpenGraphMatches]
    for (const files of routeIcons.values()) {
      if (files.icon) {
        routeAssetsToRemove.push(files.icon)
      }
      if (files.favicon) {
        routeAssetsToRemove.push(files.favicon)
      }
    }

    for (const relPath of routeAssetsToRemove) {
      const removed = await removeFileIfPresent(path.join(ROUTE_ROOT, relPath))
      if (removed) {
        removedRouteAssets += 1
      }
    }
  }

  const updatedAssetSources = await syncMiniCityAssetSourceSlugs(routePaths)
  const manifestEntries = await buildManifest(routePaths)
  console.log(
    `City assets synced to public/images: ${copiedIcons} icons, ${copiedOpenGraph} OG images, manifest entries ${manifestEntries}`,
  )
  if (updatedAssetSources > 0) {
    console.log(`Updated mini-city assetSourceSlug entries: ${updatedAssetSources}`)
  }
  if (CLEAN_ROUTE_ASSETS) {
    console.log(`Removed route-local assets: ${removedRouteAssets}`)
  }
  if (CLEAN_LEGACY_CITY_ASSETS && !DRY_RUN) {
    await fs.rm(LEGACY_CANONICAL_ROOT, { recursive: true, force: true })
    console.log('Removed legacy public/city-assets directory')
  }
  if (DRY_RUN) {
    console.log('Dry run only; no files were written.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
