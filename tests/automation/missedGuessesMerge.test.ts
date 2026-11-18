import test from 'node:test'
import assert from 'node:assert/strict'

import { mergeMissedGuesses } from '../../src/lib/missedGuesses.ts'

const entry = (id: string, rawInput: string, createdAt: string, city = 'nyc') => ({
  id,
  city,
  rawInput,
  normalizedInput: rawInput.toLowerCase(),
  suggestions: [],
  createdAt,
})

test('live guesses from other players stay when you have local guesses', () => {
  const live = [
    entry('s1', 'Grand Centrl', '2026-11-17T10:00:00Z'),
    entry('s2', 'Times Sq', '2026-11-17T10:05:00Z'),
  ]
  const local = [entry('l1', 'Fulton Stret', '2026-11-17T10:06:00Z')]
  const merged = mergeMissedGuesses(local, live)
  assert.deepEqual(
    merged.map((e) => [e.rawInput, e.mine]),
    [
      ['Fulton Stret', true],
      ['Times Sq', false],
      ['Grand Centrl', false],
    ],
  )
})

test('your guess and its server copy show once, marked as yours', () => {
  const live = [entry('s1', 'Fulton Stret', '2026-11-17T10:06:01Z')]
  const local = [entry('l1', 'Fulton Stret', '2026-11-17T10:06:00Z')]
  const merged = mergeMissedGuesses(local, live)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].mine, true)
  assert.equal(merged[0].live, true)
})

test('same text typed by someone else at a different time is kept separately', () => {
  const live = [entry('s1', 'Fulton Stret', '2026-11-17T09:00:00Z')]
  const local = [entry('l1', 'Fulton Stret', '2026-11-17T10:06:00Z')]
  assert.equal(mergeMissedGuesses(local, live).length, 2)
})
