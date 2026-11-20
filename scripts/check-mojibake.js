#!/usr/bin/env node
/**
 * Mojibake detector + fixer.
 *
 * Mojibake is UTF-8 text that was read as Windows-1252 / Latin-1 and saved
 * again: one accented letter, dash, Chinese character or emoji turns into
 * two to four junk Latin characters (and more if it happens twice).
 * On Windows this usually comes from Windows PowerShell 5.1 (Get-Content /
 * Set-Content / Out-File / `>`)
 * or an editor opening a UTF-8 file as "Western (Windows 1252)".
 *
 * How the repair works: it finds each garbled *sequence* (the characters
 * that a single UTF-8 character turned into), turns those characters back
 * into bytes and decodes them as UTF-8. Passes repeat until nothing changes,
 * so double- and triple-garbled text is repaired too. Lines that also hold
 * correct accents, Chinese characters or emoji are repaired piece by piece.
 *
 * Usage:
 *   node scripts/check-mojibake.js               check the whole repo (exit 1 if any)
 *   node scripts/check-mojibake.js --write       repair in place
 *   node scripts/check-mojibake.js --staged      check only files staged for commit
 *   node scripts/check-mojibake.js a.ts b.json   check specific files
 *
 * A line containing the text "mojibake-ignore" is skipped by the scanner.
 * In source code, write intentional mojibake samples with \u escapes.
 *
 * Keep the algorithm in sync with src/lib/repairMojibake.ts
 * (tests/automation/mojibake.test.ts checks that both agree).
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

// Windows-1252 characters for bytes 0x80-0x9F (the rest map 1:1 to Latin-1).
const WIN1252_SPECIALS = {
  '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84,
  '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88,
  '\u2030': 0x89, '\u0160': 0x8a, '\u2039': 0x8b, '\u0152': 0x8c,
  '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
  '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b,
  '\u0153': 0x9c, '\u017e': 0x9e, '\u0178': 0x9f,
}

// A UTF-8 continuation byte (0x80-0xBF) as it looks after a 1252/Latin-1 misread.
const CONT = `[\\u0080-\\u00bf${Object.keys(WIN1252_SPECIALS).join('')}]`
const SEQUENCE_SOURCE =
  `[\\u00c2-\\u00df]${CONT}` + // 2-byte character (accented Latin, Greek, Cyrillic, ...)
  `|[\\u00e0-\\u00ef]${CONT}{2}` + // 3-byte character (dashes, curly quotes, CJK, symbols, ...)
  `|[\\u00f0-\\u00f4]${CONT}{3}` // 4-byte character (emoji, rare CJK)

const decoder = new TextDecoder('utf-8', { fatal: true })

const toByte = (char) => {
  const code = char.codePointAt(0)
  if (code <= 0xff) return code
  return WIN1252_SPECIALS[char] ?? null
}

const isControl = (code) => code >= 0x80 && code <= 0x9f

// Characters a garbled sequence may plausibly have been. Anything else
// (Syriac, N'Ko, private use, ...) is treated as legitimate text and left alone.
const isPlausible = (code) =>
  (code >= 0x00a0 && code <= 0x052f) || // Latin-1 .. Cyrillic
  (code >= 0x0590 && code <= 0x06ff) || // Hebrew, Arabic
  (code >= 0x0900 && code <= 0x0e7f) || // Indic, Thai
  (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
  (code >= 0x1e00 && code <= 0x2bff) || // Vietnamese, punctuation, symbols, arrows
  (code >= 0x2e80 && code <= 0x9fff) || // CJK
  (code >= 0xa960 && code <= 0xa97f) ||
  (code >= 0xac00 && code <= 0xd7af) || // Hangul
  (code >= 0xf900 && code <= 0xfaff) ||
  (code >= 0xfe30 && code <= 0xfe4f) ||
  (code >= 0xff00 && code <= 0xffef) || // fullwidth forms
  (code >= 0x1f000 && code <= 0x1faff) || // emoji
  (code >= 0x20000 && code <= 0x3ffff) // CJK extensions

const decodeSequence = (sequence, allowControl) => {
  const bytes = []
  for (const char of sequence) {
    const byte = toByte(char)
    if (byte === null) return sequence
    bytes.push(byte)
  }
  let decoded
  try {
    decoded = decoder.decode(new Uint8Array(bytes))
  } catch {
    return sequence
  }
  const code = decoded.codePointAt(0)
  if (isControl(code)) return allowControl ? decoded : sequence
  return isPlausible(code) ? decoded : sequence
}

// Real text such as "\u00c9\u201d" can have a word-initial capital followed by a
// curly quote, so that pair is left alone. Exceptions that are always
// repaired: A-circumflex and A-tilde (never real text before a curly quote;
// that pair is a garbled N-tilde) and C-cedilla (word-initial pinyin tone
// vowels such as the o-caron in "Ou" garble into C-cedilla + curly quote).
const QUOTES = new Set(['\u2018', '\u2019', '\u201c', '\u201d'])
const isWordInitialQuote = (sequence, offset, whole) =>
  sequence.length === 2 &&
  QUOTES.has(sequence[1]) &&
  sequence[0] !== '\u00c2' &&
  sequence[0] !== '\u00c3' &&
  sequence[0] !== '\u00c7' &&
  (offset === 0 || /[\x00-\x40\x5b-\x60\x7b-\x7f]/.test(whole[offset - 1]))

const repairPass = (value, allowControl) =>
  value.replace(new RegExp(SEQUENCE_SOURCE, 'gu'), (sequence, offset, whole) =>
    isWordInitialQuote(sequence, offset, whole)
      ? sequence
      : decodeSequence(sequence, allowControl),
  )

const countControls = (value) => {
  let count = 0
  for (const char of value) if (isControl(char.codePointAt(0))) count += 1
  return count
}

/** Repair mojibake in a string. Returns the input unchanged when there is none. */
const repairMojibakeString = (value) => {
  if (!value || typeof value !== 'string') return value
  const baseControls = countControls(value)
  let current = value
  for (let pass = 0; pass < 5; pass += 1) {
    let next = repairPass(current, true)
    if (next === current) break
    // A pass may surface invisible control characters that only become a real
    // character after the next pass. Keep them only if the next pass resolves them.
    if (countControls(next) > baseControls) {
      const resolved = repairPass(next, true)
      if (resolved !== next && countControls(resolved) <= baseControls) {
        next = resolved
      } else {
        next = repairPass(current, false)
        if (next === current) break
      }
    }
    current = next
  }
  return current
}

const hasMojibake = (value) => repairMojibakeString(value) !== value

// Garbling that already lost bytes (they became U+FFFD, the replacement character) cannot be undone
// automatically; the scanner reports it so the text can be re-entered by hand.
const LOSSY_PATTERN = new RegExp(`[\\u00c2-\\u00f4](?:${CONT}|\\ufffd)*\\ufffd`, 'u')
const hasLossyMojibake = (value) => LOSSY_PATTERN.test(value)

// Anything that could start a garbled sequence; used to skip clean files quickly.
const QUICK_PATTERN = new RegExp(`[\\u00c2-\\u00f4](?:${CONT}|\\ufffd)`, 'u')

const IGNORE_MARKER = 'mojibake-ignore'

/** Repair every line of a file's text, keeping line endings and ignored lines. */
const repairMojibakeContent = (content) =>
  content
    .split(/(\r?\n)/)
    .map((part) =>
      part === '\n' || part === '\r\n' || part.includes(IGNORE_MARKER)
        ? part
        : repairMojibakeString(part),
    )
    .join('')

// ---------------------------------------------------------------------------
// File scanning

const ROOT = path.resolve(__dirname, '..')

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.next-mobile', 'out', 'build', 'coverage',
  'playwright-report', 'test-results', '.vercel', '.wrangler', '.cache', '.tmp',
  '.npm', '.dev-server', '.codex-history', 'metro-memory-old', 'android', 'ios',
])
const SKIP_DIR_PREFIXES = ['.next-build-']
const EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonc', '.geojson',
  '.md', '.mdx', '.txt', '.csv', '.tsv', '.yml', '.yaml', '.toml', '.css',
  '.scss', '.html', '.svg', '.xml', '.py', '.sh', '.ps1', '.prisma', '.sql',
])
const MAX_BYTES = 50 * 1024 * 1024

const isScannable = (filePath) =>
  EXTENSIONS.has(path.extname(filePath).toLowerCase())

const walk = (dir, results) => {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      if (SKIP_DIR_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue
      walk(entryPath, results)
    } else if (entry.isFile() && isScannable(entry.name)) {
      results.push(entryPath)
    }
  }
}

const stagedFiles = () => {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  return output
    .split('\0')
    .filter(Boolean)
    .map((file) => path.join(ROOT, file))
    .filter(isScannable)
}

const readStaged = (absolutePath) => {
  const relative = path.relative(ROOT, absolutePath).split(path.sep).join('/')
  return execFileSync('git', ['show', `:${relative}`], {
    cwd: ROOT,
    maxBuffer: MAX_BYTES,
  })
}

const scanFile = (absolutePath, { write = false, staged = false } = {}) => {
  const relativePath = path.relative(ROOT, absolutePath).split(path.sep).join('/')
  let buffer
  try {
    buffer = staged ? readStaged(absolutePath) : fs.readFileSync(absolutePath)
  } catch {
    return { relativePath, issues: [], changed: false }
  }
  if (buffer.length > MAX_BYTES) return { relativePath, issues: [], changed: false }

  const issues = []
  let text
  const isUtf16 =
    buffer.length >= 2 &&
    ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff))
  if (isUtf16) {
    // Windows PowerShell 5.1 writes UTF-16 with `>` and Out-File.
    const label = buffer[0] === 0xff ? 'utf-16le' : 'utf-16be'
    text = new TextDecoder(label).decode(buffer.subarray(2))
    issues.push({ relativePath, lineNumber: 0, kind: 'utf16' })
  } else {
    // Binary files (images saved with a text extension, etc.) are not text.
    if (buffer.subarray(0, 8000).includes(0)) {
      return { relativePath, issues: [], changed: false }
    }
    try {
      text = decoder.decode(buffer)
    } catch {
      issues.push({ relativePath, lineNumber: 0, kind: 'not-utf8' })
      return { relativePath, issues, changed: false }
    }
  }

  const hasBom = text.charCodeAt(0) === 0xfeff
  if (hasBom) issues.push({ relativePath, lineNumber: 1, kind: 'bom' })
  const body = hasBom ? text.slice(1) : text

  // Fast path: most files contain nothing that could be mojibake.
  if (!QUICK_PATTERN.test(body)) {
    return finishFile({ absolutePath, relativePath, issues, body, text, write, staged, isUtf16 })
  }

  const lines = body.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (line.includes(IGNORE_MARKER)) return
    const repaired = repairMojibakeString(line)
    if (hasLossyMojibake(repaired)) {
      issues.push({ relativePath, lineNumber: index + 1, kind: 'lossy', original: line.trim() })
      return
    }
    if (repaired !== line) {
      issues.push({
        relativePath,
        lineNumber: index + 1,
        kind: 'mojibake',
        original: line.trim(),
        repaired: repaired.trim(),
      })
    }
  })

  return finishFile({ absolutePath, relativePath, issues, body, text, write, staged, isUtf16 })
}

function finishFile({ absolutePath, relativePath, issues, body, text, write, staged, isUtf16 }) {
  let changed = false
  const fixable = issues.some((issue) => issue.kind !== 'not-utf8' && issue.kind !== 'lossy')
  if (write && !staged && fixable) {
    const repairedBody = repairMojibakeContent(body)
    if (isUtf16 || repairedBody !== text) {
      fs.writeFileSync(absolutePath, repairedBody, 'utf8')
      changed = true
    }
  }
  return { relativePath, issues, changed }
}

const scanFiles = ({ write = false, staged = false, files = null } = {}) => {
  let targets
  if (files && files.length > 0) {
    targets = files.map((file) => path.resolve(file)).filter(isScannable)
  } else if (staged) {
    targets = stagedFiles()
  } else {
    targets = []
    walk(ROOT, targets)
  }

  const issues = []
  const updatedFiles = []
  for (const filePath of targets) {
    const result = scanFile(filePath, { write, staged })
    issues.push(...result.issues)
    if (result.changed) updatedFiles.push(result.relativePath)
  }
  return { issues, updatedFiles, scanned: targets.length }
}

const shorten = (value, max = 160) =>
  value.length > max ? `${value.slice(0, max)}\u2026` : value

const main = () => {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const staged = args.includes('--staged')
  const files = args.filter((arg) => !arg.startsWith('--'))

  const { issues, updatedFiles, scanned } = scanFiles({ write, staged, files })

  if (write) {
    if (updatedFiles.length > 0) {
      console.log(`Repaired mojibake in ${updatedFiles.length} file(s):`)
      updatedFiles.forEach((file) => console.log(`- ${file}`))
    }
    const remaining = scanFiles({ write: false, files: issues.map((i) => path.join(ROOT, i.relativePath)) })
      .issues
    if (remaining.length > 0) {
      console.error('These problems need a manual fix:')
      remaining.forEach((issue) => console.error(`- ${issue.relativePath}:${issue.lineNumber} (${issue.kind})`))
      process.exit(1)
    }
    if (updatedFiles.length === 0) console.log(`No mojibake found (${scanned} files checked).`)
    return
  }

  if (issues.length > 0) {
    const label = {
      'not-utf8': 'file is not valid UTF-8',
      bom: 'file starts with a byte-order mark (BOM)',
      lossy: 'garbled text lost bytes (shows \ufffd) and must be retyped by hand',
      utf16: 'file is UTF-16 (usually from a PowerShell `>` redirect); fix converts it to UTF-8',
    }
    console.error(`Mojibake / encoding problems found (${issues.length}):`)
    issues.forEach((issue) => {
      console.error(`- ${issue.relativePath}:${issue.lineNumber}`)
      if (issue.kind === 'mojibake') {
        console.error(`    current: ${shorten(issue.original)}`)
        console.error(`    fixed  : ${shorten(issue.repaired)}`)
      } else {
        console.error(`    ${label[issue.kind]}`)
        if (issue.original) console.error(`    current: ${shorten(issue.original)}`)
      }
    })
    console.error('\nRun `npm run fix:mojibake` to repair, then review the changes.')
    process.exit(1)
  }

  console.log(`No mojibake found (${scanned} files checked).`)
}

if (require.main === module) {
  main()
}

module.exports = {
  repairMojibakeString,
  repairMojibakeContent,
  hasMojibake,
  hasLossyMojibake,
  scanFiles,
}
