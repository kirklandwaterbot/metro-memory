import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

import { repairMojibakeString as repairRuntime } from '../../src/lib/repairMojibake.ts'

const require = createRequire(import.meta.url)
const scanner = require('../../scripts/check-mojibake.js')

// Reproduce the corruption the way Windows does: read UTF-8 bytes as
// Windows-1252 (undefined bytes become the matching control character).
const WIN1252: Record<number, string> = {
  0x80: '\u20ac', 0x82: '\u201a', 0x83: '\u0192', 0x84: '\u201e', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02c6', 0x89: '\u2030', 0x8a: '\u0160',
  0x8b: '\u2039', 0x8c: '\u0152', 0x8e: '\u017d', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201c', 0x94: '\u201d', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02dc', 0x99: '\u2122', 0x9a: '\u0161', 0x9b: '\u203a', 0x9c: '\u0153',
  0x9e: '\u017e', 0x9f: '\u0178',
}
const garble1252 = (value: string) =>
  [...Buffer.from(value, 'utf8')].map((b) => WIN1252[b] ?? String.fromCharCode(b)).join('')
const garbleLatin1 = (value: string) => Buffer.from(value, 'utf8').toString('latin1')

const SAMPLES = [
  'Vous n\'avez encore aucun progr\u00e8s enregistr\u00e9.',
  'Caf\u00e9 \u2014 dash',
  '\u5317\u4eac\u897f\u7ad9 Beijing West',
  '\u2705 Ran research \u2014 3 claims',
  '\u6771\u4eac T\u014dky\u014d',
  'Sh\u00edzh\u00edm\u00e9n \u897f\u76f4\u95e8',
  'H\u01d2u \u01cd \u01d0 \u01d4 \u01da',
  'S\u00e3o Paulo',
  '\u00d1u\u00f1oa',
  '\uad7f \uc11c\uc6b8',
  '\u{1f687} metro',
  'Stra\u00dfe',
  '\u0645\u062d\u0637\u0629 \u062f\u0628\u064a',
  '\u041c\u043e\u0441\u043a\u0432\u0430',
  'H\u00e0 N\u1ed9i',
  '\u201cquoted\u201d \u2018single\u2019 \u2026',
  '(\u3008x\u3009)',
]

const LEGIT = [
  'Caf\u00e9',
  'na\u00efve r\u00e9sum\u00e9',
  'Stra\u00dfe\u2019s',
  '\u00c9\u201c test',
  '\u00b0C',
  'S\u00e3o Paulo \u2014 Brasil',
  '\u5317\u4eac \u2013 Shanghai',
  '\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5 \u00e0\u00e1\u00e2\u00e3\u00e4\u00e5',
  '\u041c\u043e\u0441\u043a\u0432\u0430',
  '\u0395\u03bb\u03bb\u03ac\u03b4\u03b1',
  'x \u2192 y \u2264 z',
  'N\u00ba 5',
  '\u00a9\u00ae\u2122 \u00bd \u00bc',
]

for (const [name, repair] of [
  ['scanner', scanner.repairMojibakeString],
  ['runtime', repairRuntime],
] as const) {
  test(`${name}: repairs text garbled 1-3 times`, () => {
    for (const sample of SAMPLES) {
      let viaWin1252 = sample
      let viaLatin1 = sample
      for (let layer = 1; layer <= 3; layer += 1) {
        viaWin1252 = garble1252(viaWin1252)
        viaLatin1 = garbleLatin1(viaLatin1)
        assert.equal(repair(viaWin1252), sample, `${layer}x Windows-1252: ${sample}`)
        assert.equal(repair(viaLatin1), sample, `${layer}x Latin-1: ${sample}`)
      }
    }
  })

  test(`${name}: repairs garbled text mixed with correct text on one line`, () => {
    const line = `title: 'Caf\u00e9', name: '${garble1252('\u5317\u4eac')}', note: '${garble1252('progr\u00e8s')}' \u{1f687}`
    assert.equal(repair(line), "title: 'Caf\u00e9', name: '\u5317\u4eac', note: 'progr\u00e8s' \u{1f687}")
  })

  test(`${name}: leaves correct text alone`, () => {
    for (const sample of [...SAMPLES, ...LEGIT]) {
      assert.equal(repair(sample), sample, sample)
    }
  })
}

test('scanner and runtime agree', () => {
  for (const sample of SAMPLES) {
    const garbled = garble1252(garble1252(sample))
    assert.equal(repairRuntime(garbled), scanner.repairMojibakeString(garbled))
  }
})

test('scanner flags lossy garbling instead of guessing', () => {
  assert.equal(scanner.hasLossyMojibake('\u00e6\ufffd\u00b1\u4eac'), true)
  assert.equal(scanner.hasLossyMojibake('Caf\u00e9 \ufffd'), false)
})

test('scanner finds and fixes files, including UTF-16 from PowerShell', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mojibake-'))
  const garbledFile = path.join(dir, 'a.ts')
  const utf16File = path.join(dir, 'b.txt')
  const cleanFile = path.join(dir, 'c.json')
  fs.writeFileSync(garbledFile, `export const x = '${garble1252('estaci\u00f3n')}'\r\nexport const y = 1\r\n`)
  fs.writeFileSync(utf16File, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('lint \u2705\n', 'utf16le')]))
  fs.writeFileSync(cleanFile, '{"name": "\u5317\u4eac"}\n')

  const files = [garbledFile, utf16File, cleanFile]
  const found = scanner.scanFiles({ files })
  assert.deepEqual(
    found.issues.map((issue: { relativePath: string; kind: string }) => [path.basename(issue.relativePath), issue.kind]),
    [['a.ts', 'mojibake'], ['b.txt', 'utf16']],
  )

  scanner.scanFiles({ files, write: true })
  assert.equal(fs.readFileSync(garbledFile, 'utf8'), "export const x = 'estaci\u00f3n'\r\nexport const y = 1\r\n")
  assert.equal(fs.readFileSync(utf16File, 'utf8'), 'lint \u2705\n')
  assert.equal(fs.readFileSync(cleanFile, 'utf8'), '{"name": "\u5317\u4eac"}\n')
  assert.equal(scanner.scanFiles({ files }).issues.length, 0)
})
