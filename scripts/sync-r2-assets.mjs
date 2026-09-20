#!/usr/bin/env node

import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const BASE_URL = process.env.METRO_ASSET_BASE_URL?.trim().replace(/\/+$/, '')
const TOKEN = process.env.R2_SYNC_TOKEN?.trim()
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const CONCURRENCY = Math.max(1, Number(process.env.R2_SYNC_CONCURRENCY ?? 12))
const MANIFEST_PATH = '_metro-memory-assets-manifest-v1.json'
const RETRY_DELAYS_MS = [1000, 2000, 4000]

const roots = [
  { directory: path.join(ROOT, 'public', 'images'), prefix: 'images', maxAge: 86_400 },
  {
    directory: path.join(ROOT, 'public', 'city-cards'),
    prefix: 'city-cards',
    maxAge: 86_400,
  },
  {
    directory: path.join(ROOT, 'public', 'city-data'),
    prefix: 'city-data',
    maxAge: 300,
  },
]

const contentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const assetUrl = (pathname) =>
  `${BASE_URL}/${pathname.split('/').map(encodeURIComponent).join('/')}`

async function request(url, init = {}) {
  for (let attempt = 0; ; attempt += 1) {
    let response
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(120_000),
      })
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length) throw error
      await sleep(RETRY_DELAYS_MS[attempt])
      continue
    }

    const retryable =
      response.status === 408 ||
      response.status === 425 ||
      response.status === 429 ||
      response.status >= 500
    if (!retryable || attempt >= RETRY_DELAYS_MS.length) return response
    await response.arrayBuffer()
    await sleep(RETRY_DELAYS_MS[attempt])
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolutePath)))
    else if (entry.isFile()) files.push(absolutePath)
  }
  return files
}

const assets = []
for (const root of roots) {
  const files = await walk(root.directory)
  for (const file of files) {
    const relativePath = path.relative(root.directory, file).replaceAll(path.sep, '/')
    const stat = await fs.stat(file)
    assets.push({
      file,
      pathname: `${root.prefix}/${relativePath}`,
      size: stat.size,
      maxAge: root.maxAge,
    })
  }
}
assets.sort((left, right) => left.pathname.localeCompare(right.pathname))

const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)
console.log(
  `[r2-sync] Scanned ${assets.length} files (${totalBytes} bytes)${DRY_RUN ? ' (dry run)' : ''}`,
)

if (DRY_RUN) process.exit(0)
if (!BASE_URL) throw new Error('METRO_ASSET_BASE_URL is missing')
if (!TOKEN) throw new Error('R2_SYNC_TOKEN is missing')

let previousManifest = null
const manifestResponse = await request(assetUrl(MANIFEST_PATH), { cache: 'no-store' })
if (manifestResponse.ok) {
  previousManifest = await manifestResponse.json()
} else if (manifestResponse.status !== 404) {
  throw new Error(`[r2-sync] Manifest request failed with HTTP ${manifestResponse.status}`)
}

let hashed = 0
const hashQueue = [...assets]
async function hashWorker() {
  while (hashQueue.length > 0) {
    const asset = hashQueue.shift()
    const body = await fs.readFile(asset.file)
    asset.sha256 = createHash('sha256').update(body).digest('hex')
    hashed += 1
    if (hashed % 250 === 0 || hashed === assets.length) {
      console.log(`[r2-sync] Hashed ${hashed}/${assets.length}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => hashWorker()))

const pending = assets.filter((asset) => {
  if (FORCE) return true
  const previous = previousManifest?.files?.[asset.pathname]
  return previous?.size !== asset.size || previous?.sha256 !== asset.sha256
})
const localPaths = new Set(assets.map((asset) => asset.pathname))
const removedPaths = Object.keys(previousManifest?.files ?? {}).filter(
  (pathname) => !localPaths.has(pathname),
)

console.log(
  `[r2-sync] ${pending.length} changed/new, ${removedPaths.length} removed, ${assets.length - pending.length} unchanged`,
)

let completed = 0
const uploadQueue = [...pending]
async function uploadWorker() {
  while (uploadQueue.length > 0) {
    const asset = uploadQueue.shift()
    const body = await fs.readFile(asset.file)
    const response = await request(assetUrl(asset.pathname), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Cache-Control': `public, max-age=${asset.maxAge}`,
        'Content-Type': contentTypes.get(path.extname(asset.file).toLowerCase()) ?? 'application/octet-stream',
        'X-Metro-Sha256': asset.sha256,
      },
      body,
    })
    if (!response.ok) {
      throw new Error(`[r2-sync] Upload failed for ${asset.pathname}: HTTP ${response.status}`)
    }
    completed += 1
    if (completed % 50 === 0 || completed === pending.length) {
      console.log(`[r2-sync] Uploaded ${completed}/${pending.length}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => uploadWorker()))

for (const pathname of removedPaths) {
  const response = await request(assetUrl(pathname), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!response.ok && response.status !== 404) {
    throw new Error(`[r2-sync] Delete failed for ${pathname}: HTTP ${response.status}`)
  }
}
if (removedPaths.length > 0) console.log(`[r2-sync] Deleted ${removedPaths.length} files`)

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  files: Object.fromEntries(
    assets.map((asset) => [
      asset.pathname,
      { size: asset.size, sha256: asset.sha256, maxAge: asset.maxAge },
    ]),
  ),
}

if (FORCE || pending.length > 0 || removedPaths.length > 0 || !previousManifest) {
  const response = await request(assetUrl(MANIFEST_PATH), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Cache-Control': 'public, max-age=60',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(manifest),
  })
  if (!response.ok) throw new Error(`[r2-sync] Manifest upload failed: HTTP ${response.status}`)
}

const inventoryResponse = await request(`${BASE_URL}/_sync/inventory`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
  cache: 'no-store',
})
if (!inventoryResponse.ok) {
  throw new Error(`[r2-sync] Inventory request failed: HTTP ${inventoryResponse.status}`)
}
const inventory = await inventoryResponse.json()
const remote = new Map(inventory.objects.map((object) => [object.key, object.size]))
const mismatches = assets.filter((asset) => remote.get(asset.pathname) !== asset.size)
if (mismatches.length > 0) {
  throw new Error(`[r2-sync] Verification failed for ${mismatches.length} files`)
}

console.log(`[r2-sync] Verified ${assets.length} files in Cloudflare R2`)
console.log(`[r2-sync] METRO_ASSET_BASE_URL=${BASE_URL}`)
