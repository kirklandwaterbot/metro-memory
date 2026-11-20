#!/usr/bin/env node

const OpenCC = require('opencc-js')
const {
  ENGLISH_LOCALE,
  GENERATED_OVERRIDES_FILE,
  buildCombinedCatalog,
  buildNestedTextEntries,
  deepMerge,
  loadGeneratedOverrides,
  normalizeLanguageCode,
  parseArgs,
  parseI18nSource,
  writeJson,
} = require('./i18n-shared')

const SORT_ACHIEVED_ALIAS_KEY = 'sortAchieved'
const SIMPLIFIED_TO_TRADITIONAL = OpenCC.Converter({ from: 'cn', to: 'tw' })

const LANGUAGE_NAMES = {
  ar: 'Arabic',
  ca: 'Catalan',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  hu: 'Hungarian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pt: 'Portuguese',
  sv: 'Swedish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese (Taiwan)',
}

function sanitizeModelJson(raw) {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
}

function protectPlaceholders(text) {
  const replacements = []
  let index = 0
  const protectedText = text.replace(/\{[A-Za-z0-9_]+\}/g, (match) => {
    const token = `__PLACEHOLDER_${index}__`
    replacements.push([token, match])
    index += 1
    return token
  })
  return { protectedText, replacements }
}

function restorePlaceholders(text, replacements) {
  return replacements.reduce(
    (current, [token, original]) => current.replaceAll(token, original),
    text,
  )
}

async function translateWithOllama(text, locale, model, ollamaUrl) {
  const { protectedText, replacements } = protectPlaceholders(text)
  const languageName = LANGUAGE_NAMES[locale] ?? locale

  const prompt = [
    `Translate the following Metro Memory UI text from English to ${languageName}.`,
    'Rules:',
    '- Return JSON only.',
    '- Use the shape {"translation":"..."}',
    '- Preserve placeholder tokens like __PLACEHOLDER_0__ exactly.',
    '- Preserve brand names such as Metro Memory.',
    '- Keep the text short and natural for a button, tab, heading, or UI label.',
    '',
    `Text: ${protectedText}`,
  ].join('\n')

  const response = await fetch(ollamaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ollama request failed (${response.status}): ${body}`)
  }

  const payload = await response.json()
  const parsed = JSON.parse(sanitizeModelJson(String(payload.response ?? '')))
  const translated = typeof parsed.translation === 'string' ? parsed.translation.trim() : ''

  if (!translated) {
    throw new Error(`Ollama returned an empty translation for locale ${locale}`)
  }

  return restorePlaceholders(translated, replacements)
}

function getAliasTranslation(localeEntries, key) {
  if (key !== 'sortAchievedInOrder') {
    return null
  }
  const aliasEntry = localeEntries[SORT_ACHIEVED_ALIAS_KEY]
  if (!aliasEntry || aliasEntry.kind !== 'text') {
    return null
  }
  return aliasEntry.value
}

async function resolveTranslation({
  backend,
  englishValue,
  locale,
  localeEntries,
  combinedCatalog,
  model,
  ollamaUrl,
}) {
  const aliasValue = getAliasTranslation(localeEntries, englishValue.key)
  if (aliasValue) {
    return { value: aliasValue, source: 'alias' }
  }

  if (locale === 'zh-TW') {
    const zhCnEntry = combinedCatalog['zh-CN']?.[englishValue.key]
    if (zhCnEntry?.kind === 'text' && zhCnEntry.value) {
      return {
        value: SIMPLIFIED_TO_TRADITIONAL(zhCnEntry.value),
        source: 'opencc',
      }
    }
  }

  if (backend === 'copy') {
    // Copying the English made untranslated text look translated and hid gaps
    // from i18n-check. Translations are now written by hand or by a coding agent
    // (see "Translations" in AGENTS.md); Ollama remains as an optional helper.
    throw new Error(
      'The "copy" backend was removed: it filled languages with English text. ' +
        'Add real translations (see AGENTS.md) or use --backend=ollama.',
    )
  }

  if (backend === 'ollama') {
    return {
      value: await translateWithOllama(englishValue.value, locale, model, ollamaUrl),
      source: 'ollama',
    }
  }

  throw new Error(`Unsupported backend: ${backend}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const backend = String(args.backend || 'ollama')
  const model = String(args.model || 'qwen2.5:7b-instruct')
  const ollamaUrl = String(args['ollama-url'] || 'http://127.0.0.1:11434/api/generate')
  const dryRun = Boolean(args['dry-run'])
  const force = Boolean(args.force)

  const { supportedLanguages, locales } = parseI18nSource()
  const overrides = loadGeneratedOverrides()
  const combinedCatalog = buildCombinedCatalog(locales, overrides)
  const englishEntries = combinedCatalog[ENGLISH_LOCALE] ?? {}
  const targetLocales = args.locales
    ? String(args.locales)
        .split(',')
        .map((locale) => normalizeLanguageCode(locale))
        .filter(Boolean)
    : supportedLanguages.map((language) => language.code).filter((locale) => locale !== ENGLISH_LOCALE)

  const nextOverrides = {
    ...overrides,
    generatedAt: new Date().toISOString(),
    locales: { ...(overrides.locales ?? {}) },
  }

  for (const locale of targetLocales) {
    const localeEntries = combinedCatalog[locale] ?? {}
    const generatedFlatEntries = {}

    for (const [key, englishEntry] of Object.entries(englishEntries)) {
      const alreadyExists = localeEntries[key]
      if (alreadyExists && !force) {
        continue
      }

      if (englishEntry.kind !== 'text') {
        continue
      }

      const translation = await resolveTranslation({
        backend,
        englishValue: { key, value: englishEntry.value },
        locale,
        localeEntries: locales[locale] ?? {},
        combinedCatalog,
        model,
        ollamaUrl,
      })

      generatedFlatEntries[key] = translation.value
      console.log(`[${locale}] ${key} <- ${translation.source}`)
    }

    if (Object.keys(generatedFlatEntries).length === 0) {
      continue
    }

    const currentTable =
      nextOverrides.locales[locale] &&
      typeof nextOverrides.locales[locale] === 'object' &&
      !Array.isArray(nextOverrides.locales[locale])
        ? nextOverrides.locales[locale]
        : {}

    nextOverrides.locales[locale] = deepMerge(
      { ...currentTable },
      buildNestedTextEntries(generatedFlatEntries),
    )
  }

  if (dryRun) {
    console.log(JSON.stringify(nextOverrides, null, 2))
    return
  }

  writeJson(GENERATED_OVERRIDES_FILE, nextOverrides)
  console.log(`Wrote generated overrides to ${GENERATED_OVERRIDES_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
