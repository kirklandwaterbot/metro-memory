import test from 'node:test'
import assert from 'node:assert/strict'

// Minimal browser stand-ins for localStorage + events.
const store = new Map<string, string>()
const events: string[] = []
;(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  dispatchEvent: (e: { type: string }) => events.push(e.type),
}
;(globalThis as any).CustomEvent ??= class {
  type: string
  constructor(type: string) {
    this.type = type
  }
}

const lib = await import('../../src/lib/customLayouts.ts')

test('links round-trip through the /custom query string', () => {
  const path = lib.buildCustomLayoutPath({ parentSlug: 'nyc', lines: ['NewYorkSubwayA', 'NewYorkSubwayC'], title: '  8 Av  ' })
  assert.equal(path, '/custom?parent=nyc&lines=NewYorkSubwayA%2CNewYorkSubwayC&title=8+Av')
  const parsed = lib.parseCustomLayout(new URL(`https://x${path}`).searchParams)
  assert.deepEqual(parsed, { parentSlug: 'nyc', lines: ['NewYorkSubwayA', 'NewYorkSubwayC'], title: '8 Av' })
  assert.equal(lib.parseCustomLayout(new URLSearchParams('parent=nyc')), null)
})

test('saving the same lines updates instead of duplicating; edits keep their id', () => {
  store.clear()
  const a = lib.saveCustomLayout({ parentSlug: 'nyc', lines: ['A', 'C'], title: 'First' }, new Date('2026-11-17T10:00:00Z'))
  const again = lib.saveCustomLayout({ parentSlug: 'nyc', lines: ['C', 'A'], title: 'Renamed' }, new Date('2026-11-17T11:00:00Z'))
  assert.equal(again.id, a.id)
  assert.equal(again.createdAt, a.createdAt)
  assert.equal(lib.readCustomLayouts('nyc').length, 1)
  assert.equal(lib.readCustomLayouts('nyc')[0].title, 'Renamed')

  // Editing a saved layout's lines keeps it the same entry.
  const edited = lib.saveCustomLayout({ id: a.id, parentSlug: 'nyc', lines: ['A', 'C', 'E'], title: 'Renamed' })
  assert.equal(edited.id, a.id)
  assert.equal(lib.readCustomLayouts('nyc').length, 1)

  lib.saveCustomLayout({ parentSlug: 'boston', lines: ['Red'], title: 'Red only' })
  assert.equal(lib.readCustomLayouts('nyc').length, 1)
  assert.equal(lib.readCustomLayouts().length, 2)
  assert.equal(lib.findSavedLayout({ parentSlug: 'nyc', lines: ['E', 'C', 'A'], title: '' })?.id, a.id)

  lib.deleteCustomLayout(a.id)
  assert.equal(lib.readCustomLayouts('nyc').length, 0)
  assert.ok(events.includes(lib.CUSTOM_LAYOUTS_UPDATED_EVENT))
})

test('corrupt storage reads as empty instead of crashing', () => {
  store.set('metro-memory-custom-layouts-v1', '{not json')
  assert.deepEqual(lib.readCustomLayouts(), [])
})
