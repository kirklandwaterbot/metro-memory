#!/usr/bin/env node

const {
  ENGLISH_LOCALE,
  buildCombinedCatalog,
  loadGeneratedOverrides,
  parseI18nSource,
} = require('./i18n-shared')

const fs = require('fs')
const path = require('path')

// --warn: report problems but exit 0 (used before `npm run dev`).
const warnOnly = process.argv.includes('--warn')
const SAME_AS_ENGLISH_FILE = path.join(__dirname, 'i18n-same-as-english.json')
const sameAsEnglish = (() => {
  try {
    return JSON.parse(fs.readFileSync(SAME_AS_ENGLISH_FILE, 'utf8'))
  } catch {
    return {}
  }
})()
const isAllowedSameAsEnglish = (key, locale) =>
  Array.isArray(sameAsEnglish[key]) && sameAsEnglish[key].includes(locale)

const issues = []
const warnings = []

const { supportedLanguages, locales } = parseI18nSource()
const overrides = loadGeneratedOverrides()
const combined = buildCombinedCatalog(locales, overrides)
const baseEntries = combined[ENGLISH_LOCALE] ?? {}
const baseKeys = Object.keys(baseEntries)

supportedLanguages.forEach((language) => {
  const locale = language.code
  const entries = combined[locale] ?? {}
  const keys = new Set(Object.keys(entries))

  const missingKeys = baseKeys.filter((key) => !keys.has(key))
  if (missingKeys.length > 0) {
    issues.push({
      type: 'missing',
      locale,
      keys: missingKeys,
    })
  }

  // A "translation" identical to the English usually means it was never
  // translated (e.g. copied as a placeholder). Real exceptions live in
  // scripts/i18n-same-as-english.json.
  if (locale !== ENGLISH_LOCALE) {
    const copies = baseKeys.filter((key) => {
      const source = baseEntries[key]
      const entry = entries[key]
      return (
        source.kind === 'text' &&
        entry?.kind === 'text' &&
        /\p{L}/u.test(source.value) &&
        entry.value === source.value &&
        !isAllowedSameAsEnglish(key, locale)
      )
    })
    if (copies.length > 0) {
      issues.push({
        type: 'untranslated (same as English)',
        locale,
        keys: copies,
      })
    }
  }

  const extraKeys = Object.keys(locales[locale] ?? {}).filter((key) => !baseEntries[key])
  if (extraKeys.length > 0) {
    warnings.push({
      type: 'extra',
      locale,
      keys: extraKeys,
    })
  }
})

Object.entries(overrides.locales ?? {}).forEach(([locale, table]) => {
  const flatOverrideEntries = {}
  const walk = (node, prefix = '') => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return
    }
    Object.entries(node).forEach(([key, value]) => {
      const pathKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'string') {
        flatOverrideEntries[pathKey] = value
        return
      }
      walk(value, pathKey)
    })
  }
  walk(table)

  Object.entries(flatOverrideEntries).forEach(([key, value]) => {
    if (!baseEntries[key]) {
      issues.push({
        type: 'unknown-override-key',
        locale,
        keys: [key],
      })
      return
    }
    if (baseEntries[key].kind !== 'text') {
      issues.push({
        type: 'non-text-override-key',
        locale,
        keys: [key],
      })
    }
    const sourcePlaceholders = new Set(baseEntries[key].placeholders ?? [])
    const targetPlaceholders = new Set((value.match(/\{([A-Za-z0-9_]+)\}/g) ?? []).map((match) => match.slice(1, -1)))
    const missingPlaceholders = [...sourcePlaceholders].filter((placeholder) => !targetPlaceholders.has(placeholder))
    if (missingPlaceholders.length > 0) {
      issues.push({
        type: 'placeholder-drift',
        locale,
        keys: [`${key} -> missing {${missingPlaceholders.join('}, {')}}`],
      })
    }
  })
})

warnings.forEach((warning) => {
  console.warn(
    `[warn] ${warning.locale} has ${warning.keys.length} extra source key(s): ${warning.keys.join(', ')}`,
  )
})

if (issues.length > 0) {
  issues.forEach((issue) => {
    console.error(
      `[error] ${issue.locale} ${issue.type}: ${issue.keys.join(', ')}`,
    )
  })
  console.error(
    '\nEvery UI string needs a real translation in all supported languages.\n' +
      'Add plain text to src/lib/i18nAutoOverrides.json (per language) and strings\n' +
      'with logic (plurals, counts) to each language block in src/lib/i18n.tsx.\n' +
      'See "Translations" in AGENTS.md.',
  )
  process.exit(warnOnly ? 0 : 1)
}

console.log(
  `i18n check passed for ${supportedLanguages.length} supported languages using src/lib/i18n.tsx + src/lib/i18nAutoOverrides.json`,
)
