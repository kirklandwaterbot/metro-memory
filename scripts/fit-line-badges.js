#!/usr/bin/env node
/**
 * Line badge auto-fit.
 *
 * Many line badge images are a solid "plate" (a coloured tile or sign) with a
 * white or transparent border/margin around it. Shown inside a badge, that
 * margin leaves a gap or a white hairline between the plate and the progress
 * ring, and the plate's corners don't match the ring's rounded corners.
 *
 * This script measures every raster badge image used by a square, wide or
 * capsule badge, finds the plate inside it, and writes the plate's position to
 * src/lib/lineBadgeFit.json. LineBadge then crops each image to its plate and
 * rounds its corners to match the ring, so every badge fits its frame exactly.
 *
 * Images that are not a solid plate (a free-form logo on a transparent
 * background, a white sign with no outline, ...) are left as they are.
 *
 * Usage:
 *   node scripts/fit-line-badges.js            update src/lib/lineBadgeFit.json
 *   node scripts/fit-line-badges.js --check    exit 1 if the file is out of date
 *   node scripts/fit-line-badges.js --trim a.png b.png
 *                                              crop image files to their plate
 *
 * Runs before `npm run dev`. Images that are missing locally keep their
 * existing entry, so a partial checkout never wipes the file.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GAME_ROOT = path.join(ROOT, 'src', 'app', '(game)')
const IMAGES_ROOT = path.join(ROOT, 'public', 'images')
const MANIFEST_PATH = path.join(ROOT, 'src', 'lib', 'lineBadgeFit.json')
const RASTER = /\.(png|jpe?g|webp)$/i

// A pixel is "background" if it is (nearly) transparent or (nearly) white.
const isBackground = (r, g, b, a) => a < 24 || (r >= 232 && g >= 232 && b >= 232)

// A row/column that is at least this full of non-background pixels is a plate edge.
const SOLID = 0.6
// Plate edges are searched for within this fraction of the image from each side.
const MAX_MARGIN = 0.18
// Rows/columns that are this empty count as pure margin.
const EMPTY = 0.02

const loadRaw = async (file) => {
  const sharp = require('sharp')
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/**
 * Find the plate inside an image. Returns { plate, box: [x, y, w, h] } in
 * pixels, where plate is false when the image has no solid plate on all four
 * sides.
 */
const detectPlate = ({ data, width, height }) => {
  const at = (x, y) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }
  const fill = (horizontal, index) => {
    const length = horizontal ? width : height
    let solid = 0
    for (let k = 0; k < length; k += 1) {
      const [r, g, b, a] = horizontal ? at(k, index) : at(index, k)
      if (!isBackground(r, g, b, a)) solid += 1
    }
    return solid / length
  }
  // How far a row/column is from white/transparent on average (0..255).
  const strength = (horizontal, index) => {
    const length = horizontal ? width : height
    let total = 0
    for (let k = 0; k < length; k += 1) {
      const [r, g, b, a] = horizontal ? at(k, index) : at(index, k)
      total += ((255 - Math.min(r, g, b)) * a) / 255
    }
    return total / length
  }

  // Scan from one side towards the middle for the plate edge.
  const findEdge = (horizontal, start, step) => {
    const size = horizontal ? height : width
    const limit = Math.max(2, Math.floor(size * MAX_MARGIN))
    let firstInk = -1
    for (let n = 0; n < limit; n += 1) {
      const index = start + step * n
      const coverage = fill(horizontal, index)
      if (coverage > EMPTY && firstInk < 0) firstInk = n
      if (coverage >= SOLID) {
        // Anything between the margin and the edge must be the plate's own
        // anti-aliasing or rounded corner, not separate content (text, icons).
        if (firstInk >= 0 && n - firstInk > Math.max(2, size * 0.04)) return null
        // Drop pale anti-aliased rows that blend the plate into the white border.
        let edge = n
        const inner = strength(horizontal, start + step * Math.min(edge + 3, limit))
        for (let extra = 0; extra < 2; extra += 1) {
          const current = strength(horizontal, start + step * edge)
          if (inner > 0 && current < inner * 0.75) edge += 1
          else break
        }
        return edge
      }
    }
    return null
  }

  const top = findEdge(true, 0, 1)
  const bottom = findEdge(true, height - 1, -1)
  const left = findEdge(false, 0, 1)
  const right = findEdge(false, width - 1, -1)
  if ([top, bottom, left, right].some((edge) => edge === null)) {
    return { plate: false, box: [0, 0, width, height] }
  }
  return {
    plate: true,
    box: [left, top, width - left - right, height - top - bottom],
  }
}

const round4 = (value) => Math.round(value * 10000) / 10000

const measure = async (file) => {
  const raw = await loadRaw(file)
  const { plate, box } = detectPlate(raw)
  if (!plate) return { plate: false }
  const [x, y, w, h] = box
  return {
    plate: true,
    crop: [round4(x / raw.width), round4(y / raw.height), round4(w / raw.width), round4(h / raw.height)],
    aspectRatio: round4(w / h),
  }
}

// ---------------------------------------------------------------------------

const findLinesFiles = (dir, results = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) findLinesFiles(entryPath, results)
    else if (entry.name === 'lines.json' && path.basename(dir) === 'data') results.push(entryPath)
  }
  return results
}

const collectIcons = () => {
  const icons = new Set()
  for (const file of findLinesFiles(GAME_ROOT)) {
    let lines
    try {
      lines = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      continue
    }
    for (const line of Object.values(lines)) {
      if (!line || typeof line !== 'object') continue
      const shape = line.badgeShape ?? 'circle'
      if (shape === 'circle' || shape === 'diamond' || typeof line.icon !== 'string') continue
      if (!line.icon.includes('/') || !RASTER.test(line.icon)) continue
      icons.add(line.icon.replace(/^\/+/, '').replace(/^images\//, ''))
    }
  }
  return [...icons].sort()
}

const readManifest = () => {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
  } catch {
    return {}
  }
}

const buildManifest = async () => {
  const previous = readManifest()
  const next = {}
  let measured = 0
  for (const icon of collectIcons()) {
    const file = path.join(IMAGES_ROOT, icon)
    if (!fs.existsSync(file)) {
      if (previous[icon]) next[icon] = previous[icon]
      continue
    }
    try {
      const result = await measure(file)
      measured += 1
      if (result.plate) next[icon] = { crop: result.crop, aspectRatio: result.aspectRatio }
    } catch (error) {
      if (previous[icon]) next[icon] = previous[icon]
      console.warn(`fit-line-badges: could not read ${icon}: ${error.message}`)
    }
  }
  return { manifest: next, measured }
}

const serialize = (manifest) => {
  const body = Object.entries(manifest)
    .map(([icon, entry]) => `  ${JSON.stringify(icon)}: ${JSON.stringify(entry)}`)
    .join(',\n')
  return `{\n${body}\n}\n`
}

const trimFiles = async (files) => {
  const sharp = require('sharp')
  for (const file of files) {
    const raw = await loadRaw(file)
    const { plate, box } = detectPlate(raw)
    const [x, y, w, h] = box
    if (!plate) {
      console.log(`- ${file}: no solid plate found, left unchanged`)
      continue
    }
    if (w === raw.width && h === raw.height) {
      console.log(`- ${file}: already edge to edge`)
      continue
    }
    const output = await sharp(file)
      .extract({ left: x, top: y, width: w, height: h })
      .png({ compressionLevel: 9 })
      .toBuffer()
    fs.writeFileSync(file, output)
    console.log(`- ${file}: ${raw.width}x${raw.height} -> ${w}x${h}`)
  }
}

const main = async () => {
  const args = process.argv.slice(2)
  try {
    require.resolve('sharp')
  } catch {
    console.warn('fit-line-badges: sharp is not installed; skipping (run npm install).')
    return
  }

  if (args[0] === '--trim') {
    await trimFiles(args.slice(1).map((file) => path.resolve(file)))
    return
  }

  const { manifest, measured } = await buildManifest()
  const text = serialize(manifest)
  const current = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, 'utf8') : ''

  if (args.includes('--check')) {
    if (current.replace(/\r\n/g, '\n') !== text) {
      console.error('src/lib/lineBadgeFit.json is out of date. Run `npm run badges:fit`.')
      process.exit(1)
    }
    console.log('Line badge fit data is up to date.')
    return
  }

  if (current.replace(/\r\n/g, '\n') !== text) {
    fs.writeFileSync(MANIFEST_PATH, text, 'utf8')
    console.log(
      `Line badge fit: ${Object.keys(manifest).length} plate badge(s) of ${measured} measured; updated src/lib/lineBadgeFit.json.`,
    )
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { detectPlate, measure }
