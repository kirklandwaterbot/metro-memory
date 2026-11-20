# Notes for coding agents (Codex, Claude, etc.)

## Text encoding: UTF-8 only (prevents mojibake)

Every text file in this repo is UTF-8 without a BOM. This project is full of
non-ASCII text (Chinese, Japanese and Korean station names, pinyin tone marks,
accented UI strings in many languages), so a wrong encoding garbles real data.

This machine runs **Windows PowerShell 5.1**, whose defaults are NOT UTF-8:
`Get-Content` reads UTF-8 files as Windows-1252, and `Set-Content`,
`Out-File`, `Add-Content` and the `>` / `>>` redirects write Windows-1252 or
UTF-16. Round-tripping a file through them corrupts it.

- Edit files with your own file-editing tools, or with Node/Python scripts that
  read and write `utf8` explicitly. Do not rewrite source files through
  PowerShell cmdlets or `>` redirects.
- If you must use PowerShell, use .NET with an explicit encoding:
  `[IO.File]::ReadAllText($p, [Text.UTF8Encoding]::new($false))` and
  `[IO.File]::WriteAllText($p, $text, [Text.UTF8Encoding]::new($false))`.
- In Python, always pass `encoding="utf-8"` to `open()`.
- In code, write intentional mojibake samples with `\u` escapes, never raw.

After editing, run:

```
npm run check:mojibake   # exits 1 if anything is garbled
npm run fix:mojibake     # repairs it in place; review the diff
```

A git pre-commit hook (`.githooks/pre-commit`) blocks commits that contain
mojibake. Don't bypass it with `--no-verify`.

## Translations: every UI string in all 17 languages

Metro Memory's interface is translated into 17 languages (see
`supportedLanguages` in `src/lib/i18n.tsx`). Never ship a UI string in
English only, and never fill a language with the English text as a
placeholder.

When you add or change any user-facing text:

1. Never hardcode it in a component. Add a key to the `en` block in
   `src/lib/i18n.tsx` and use `t('key')`.
2. Add a real translation for every other language, in the same change:
   - Plain text (including `{placeholder}` values): add it under that
     language in `src/lib/i18nAutoOverrides.json`.
   - Text with logic (plurals, counts, conditionals): add a function with the
     same signature to that language's block in `src/lib/i18n.tsx`.
     Japanese's block is named `jp`. Use each language's own plural rules;
     languages without plurals (ja, ko, zh, vi, tr, hu) use one form.
   - Traditional Chinese (zh-TW) uses Taiwan wording, not a character-by-
     character conversion of zh-CN.
3. When you change the English meaning of an existing string, update every
   language too, not just English.
4. If the English word really is correct in another language (a brand,
   "px", a city name), add the key and language to
   `scripts/i18n-same-as-english.json`.
5. Run `npm run i18n:check`. It must pass. It fails on missing strings and on
   translations identical to the English. The pre-commit hook and the GitHub
   "Text checks" workflow run it too.

Translation style: short and natural for UI labels, matching the tone of the
existing strings in that language; keep brand names (Metro Memory, GitHub,
Mapbox, AMap) and `{placeholders}` unchanged.
