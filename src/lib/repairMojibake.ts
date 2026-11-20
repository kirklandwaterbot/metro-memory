/**
 * Runtime mojibake repair for station names and other strings.
 *
 * Same algorithm as scripts/check-mojibake.js (keep the two in sync;
 * tests/automation/mojibake.test.ts checks that they agree). See that file
 * for a full explanation. Written with \u escapes only, so this file stays
 * pure ASCII and cannot itself be garbled.
 */

const WIN1252_SPECIALS: Record<string, number> = {
  '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84,
  '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88,
  '\u2030': 0x89, '\u0160': 0x8a, '\u2039': 0x8b, '\u0152': 0x8c,
  '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
  '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b,
  '\u0153': 0x9c, '\u017e': 0x9e, '\u0178': 0x9f,
}

const CONT = `[\\u0080-\\u00bf${Object.keys(WIN1252_SPECIALS).join('')}]`
const SEQUENCE_SOURCE =
  `[\\u00c2-\\u00df]${CONT}` +
  `|[\\u00e0-\\u00ef]${CONT}{2}` +
  `|[\\u00f0-\\u00f4]${CONT}{3}`
const QUICK_PATTERN = new RegExp(`[\\u00c2-\\u00f4]${CONT}`, 'u')

const decoder = new TextDecoder('utf-8', { fatal: true })

const toByte = (char: string): number | null => {
  const code = char.codePointAt(0) ?? 0
  if (code <= 0xff) return code
  return WIN1252_SPECIALS[char] ?? null
}

const isControl = (code: number) => code >= 0x80 && code <= 0x9f

const isPlausible = (code: number) =>
  (code >= 0x00a0 && code <= 0x052f) ||
  (code >= 0x0590 && code <= 0x06ff) ||
  (code >= 0x0900 && code <= 0x0e7f) ||
  (code >= 0x1100 && code <= 0x11ff) ||
  (code >= 0x1e00 && code <= 0x2bff) ||
  (code >= 0x2e80 && code <= 0x9fff) ||
  (code >= 0xa960 && code <= 0xa97f) ||
  (code >= 0xac00 && code <= 0xd7af) ||
  (code >= 0xf900 && code <= 0xfaff) ||
  (code >= 0xfe30 && code <= 0xfe4f) ||
  (code >= 0xff00 && code <= 0xffef) ||
  (code >= 0x1f000 && code <= 0x1faff) ||
  (code >= 0x20000 && code <= 0x3ffff)

const decodeSequence = (sequence: string, allowControl: boolean) => {
  const bytes: number[] = []
  for (const char of sequence) {
    const byte = toByte(char)
    if (byte === null) return sequence
    bytes.push(byte)
  }
  let decoded: string
  try {
    decoded = decoder.decode(new Uint8Array(bytes))
  } catch {
    return sequence
  }
  const code = decoded.codePointAt(0) ?? 0
  if (isControl(code)) return allowControl ? decoded : sequence
  return isPlausible(code) ? decoded : sequence
}

const QUOTES = new Set(['\u2018', '\u2019', '\u201c', '\u201d'])
const isWordInitialQuote = (sequence: string, offset: number, whole: string) =>
  sequence.length === 2 &&
  QUOTES.has(sequence[1]) &&
  sequence[0] !== '\u00c2' &&
  sequence[0] !== '\u00c3' &&
  sequence[0] !== '\u00c7' &&
  (offset === 0 || /[\x00-\x40\x5b-\x60\x7b-\x7f]/.test(whole[offset - 1]))

const repairPass = (value: string, allowControl: boolean) =>
  value.replace(
    new RegExp(SEQUENCE_SOURCE, 'gu'),
    (sequence: string, offset: number, whole: string) =>
      isWordInitialQuote(sequence, offset, whole)
        ? sequence
        : decodeSequence(sequence, allowControl),
  )

const countControls = (value: string) => {
  let count = 0
  for (const char of value) if (isControl(char.codePointAt(0) ?? 0)) count += 1
  return count
}

export const repairMojibakeString = (value: string) => {
  if (!value || typeof value !== 'string' || !QUICK_PATTERN.test(value)) {
    return value
  }
  const baseControls = countControls(value)
  let current = value
  for (let pass = 0; pass < 5; pass += 1) {
    let next = repairPass(current, true)
    if (next === current) break
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

export const repairMojibakeArray = (values: string[]) =>
  values.map((value) => repairMojibakeString(value))
