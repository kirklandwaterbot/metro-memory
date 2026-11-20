'use client'

import { useAuth } from '@/context/AuthContext'
import {
  CUSTOM_FONT_FAMILY_ID,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  getCustomFontSizeValue,
  getFontSizeNumericValue,
  isPresetFontSize,
  useSettings,
} from '@/context/SettingsContext'
import useTranslation from '@/hooks/useTranslation'
import {
  ACCENT_COLOR_OPTIONS,
  type AccentColorOption,
  type AccentColorValue,
  getCustomAccentColorValue,
  isPresetAccentColor,
  normalizeHexColor,
  resolveAccentColorOption,
} from '@/lib/accentColors'
import { cities } from '@/lib/citiesConfig'
import { formatLocalizedCityName } from '@/lib/cityNameDisplay'
import { GLOBAL_ACHIEVEMENT_SLUGS } from '@/lib/globalAchievements'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import {
  readSolutionsAccess,
  readSolutionsSelection,
  writeSolutionsAccess,
  writeSolutionsSelection,
} from '@/lib/solutionsAccess'
import { apiFetch } from '@/lib/apiClient'
import { isNativeMobileRuntime } from '@/lib/capacitorMapboxOffline'
import {
  deleteOfflineCity,
  listOfflineCities,
  type OfflineCityRecord,
} from '@/lib/offlineCityManager'
import { STATION_TOTALS } from '@/lib/stationTotals'
import {
  readUnavailableCityAccess,
  writeUnavailableCityAccess,
} from '@/lib/unavailableCityAccess'
import { getCityFlagEmojiFromPath } from '@/lib/countryFlags'
import classNames from 'classnames'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import KeybindingRecorder from './KeybindingRecorder'

type SettingsPanelProps = {
  className?: string
  showHeading?: boolean
  onClose?: () => void
  disableScroll?: boolean
}

const THEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'system', label: 'systemDefault' },
  { value: 'light', label: 'light' },
  { value: 'dark', label: 'dark' },
]

const FONT_SIZE_LABEL_KEYS = {
  sm: 'fontSizeSmall',
  md: 'fontSizeMedium',
  lg: 'fontSizeLarge',
  xl: 'fontSizeExtraLarge',
} as const

const FONT_FAMILY_LABEL_KEYS = {
  system: 'fontFamilySystem',
  humanist: 'fontFamilyHumanist',
  geometric: 'fontFamilyGeometric',
  rounded: 'fontFamilyRounded',
  slab: 'fontFamilySlab',
  condensed: 'fontFamilyCondensed',
  serif: 'fontFamilySerif',
  mono: 'fontFamilyMonospace',
  helveticaBold: 'fontFamilyHelveticaBold',
} as const

const CURATED_TIMEZONES: string[] = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Bogota',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Warsaw',
  'Europe/Athens',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Jerusalem',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const LOCAL_PROGRESS_EVENT = 'local-progress-refresh'

const unlockAllAchievements = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('mm-achievements-earned')
    const parsed = raw ? JSON.parse(raw) : []
    const entries = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
    const set = new Set(entries)
    GLOBAL_ACHIEVEMENT_SLUGS.forEach((slug) => set.add(slug))
    window.localStorage.setItem('mm-achievements-earned', JSON.stringify(Array.from(set)))
    window.dispatchEvent(new Event('storage'))
  } catch {
    // ignore
  }
}

const SettingsPanel = ({ className, showHeading = true, disableScroll = false }: SettingsPanelProps) => {
  const {
    settings,
    customFont,
    setConfettiEnabled,
    setAchievementToastsEnabled,
    setAchievementToastDurationSec,
    setStopConfettiAfterCompletion,
    setAutoSubmitOnMatch,
    setZoomToNewStations,
    setStationMatchingMode,
    setAccentColor,
    setFontSize,
    setFontFamily,
    setCustomFont,
    setLanguage,
    setTimezone,
    setHourFormat,
    setKeybinding,
    notifySettingsSaved,
  } = useSettings()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const auth = useAuth()
  const currentTheme = theme ?? 'system'
  const customAccentSelected = !isPresetAccentColor(settings.accentColor)
  const currentAccentOption = useMemo(
    () => resolveAccentColorOption(settings.accentColor),
    [settings.accentColor],
  )
  const customFontSizeSelected = !isPresetFontSize(settings.fontSize)
  const [customAccentInput, setCustomAccentInput] = useState(currentAccentOption.palette[500])
  const [customFontSizeInput, setCustomFontSizeInput] = useState(
    String(getFontSizeNumericValue(settings.fontSize)),
  )
  const [customFontStatus, setCustomFontStatus] = useState<string | null>(null)
  const timezoneOptions = useMemo(() => {
    const supportedValuesOf =
      typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
        ? (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
        : undefined
    const supportedTimezones =
      typeof supportedValuesOf === 'function' ? supportedValuesOf('timeZone') ?? [] : []
    const combined = [...CURATED_TIMEZONES, ...supportedTimezones]
    const withCurrent =
      settings.timezone && !combined.includes(settings.timezone)
        ? [settings.timezone, ...combined]
        : combined
    return Array.from(new Set(withCurrent))
  }, [settings.timezone])
  const [isLocating, setIsLocating] = useState(false)
  const [timezoneStatus, setTimezoneStatus] = useState<string | null>(null)
  const [showMobileOffline, setShowMobileOffline] = useState(false)

  useEffect(() => {
    setShowMobileOffline(isNativeMobileRuntime())
  }, [])

  useEffect(() => {
    if (customAccentSelected) {
      setCustomAccentInput(currentAccentOption.palette[500])
    }
  }, [currentAccentOption.palette, customAccentSelected])

  useEffect(() => {
    if (customFontSizeSelected) {
      setCustomFontSizeInput(String(getFontSizeNumericValue(settings.fontSize)))
    }
  }, [customFontSizeSelected, settings.fontSize])

  const handleThemeChange = useCallback(
    (nextTheme: string) => {
      if (nextTheme === currentTheme) {
        return
      }
      setTheme(nextTheme)
      notifySettingsSaved()
    },
    [currentTheme, notifySettingsSaved, setTheme],
  )
  const handleGetTimezone = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setTimezoneStatus(t('getTimezoneError'))
      return
    }
    setIsLocating(true)
    setTimezoneStatus(t('getTimezoneRequest'))
    navigator.geolocation.getCurrentPosition(
      () => {
        const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
        setTimezone(resolvedTimezone)
        setTimezoneStatus(t('getTimezoneSuccess', { timezone: resolvedTimezone }))
        setIsLocating(false)
      },
      () => {
        setTimezoneStatus(t('getTimezoneError'))
        setIsLocating(false)
      },
      { timeout: 10000 },
    )
  }, [setTimezone, t])

  const applyCustomAccent = useCallback(
    (value: string) => {
      setCustomAccentInput(value)
      const normalized = normalizeHexColor(value)
      if (!normalized) {
        return
      }
      const customAccent = getCustomAccentColorValue(normalized)
      if (customAccent) {
        setAccentColor(customAccent)
      }
    },
    [setAccentColor],
  )

  const applyCustomFontSize = useCallback(
    (value: string) => {
      setCustomFontSizeInput(value)
      const customFontSize = getCustomFontSizeValue(value)
      if (customFontSize) {
        setFontSize(customFontSize)
      }
    },
    [setFontSize],
  )

  const handleCustomFontUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) {
        return
      }
      const lowerName = file.name.toLowerCase()
      const supported = /\.(woff2?|ttf|otf)$/.test(lowerName)
      if (!supported) {
        setCustomFontStatus('Use a .woff, .woff2, .ttf, or .otf font file.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : null
        if (!dataUrl) {
          setCustomFontStatus('Could not read that font file.')
          return
        }
        void setCustomFont({
          name: file.name,
          dataUrl,
          mimeType: file.type || 'font/woff2',
          sizeBytes: file.size,
        }).then((result) => {
          if (result.ok) {
            setCustomFontStatus(`${file.name} uploaded on this device only.`)
            return
          }
          if (result.reason === 'quota_exceeded') {
            setCustomFontStatus(
              `The browser storage quota was exceeded while saving ${file.name}. IndexedDB allows much larger fonts than localStorage, but browser/device limits still apply.`,
            )
            return
          }
          setCustomFontStatus(
            'The browser blocked local font storage. Check private mode, storage settings, or browser restrictions.',
          )
        })
      }
      reader.onerror = () => {
        setCustomFontStatus('Could not read that font file.')
      }
      reader.readAsDataURL(file)
    },
    [setCustomFont],
  )

  return (
    <div
      className={classNames(
        'space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#18181b] dark:bg-zinc-900',
        !disableScroll && 'max-h-[70vh] overflow-y-auto',
        'w-full',
        className,
      )}
    >
      {showHeading && (
        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t('settings')}</h3>
      )}
      <div className="space-y-4">
        <SettingToggle
          label={t('celebrationConfetti')}
          description={t('celebrationConfettiDesc')}
          checked={settings.confettiEnabled}
          onChange={setConfettiEnabled}
        />
        <SettingToggle
          label={t('hideConfetti')}
          description={t('hideConfettiDesc')}
          checked={settings.stopConfettiAfterCompletion}
          onChange={setStopConfettiAfterCompletion}
        />
        <SettingToggle
          label={t('achievementToasts')}
          description={t('achievementToastsDesc')}
          checked={settings.achievementToastsEnabled}
          onChange={setAchievementToastsEnabled}
        />
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('achievementToastDurationLabel')}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('achievementToastDurationDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={3}
              max={120}
              step={1}
              value={settings.achievementToastDurationSec}
              onChange={(event) =>
                setAchievementToastDurationSec(Number(event.target.value || 0))
              }
              className="w-20 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('secondsAbbrev')}</span>
          </div>
        </div>
        <SettingToggle
          label={t('autoSubmitOnMatch')}
          description={t('autoSubmitOnMatchDesc')}
          checked={settings.autoSubmitOnMatch}
          onChange={setAutoSubmitOnMatch}
        />
        <SettingToggle
          label="Zoom to newly found stations"
          description="Move the map to each new station you enter correctly."
          checked={settings.zoomToNewStations}
          onChange={setZoomToNewStations}
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('stationMatching')}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('stationMatchingDesc')}
            </p>
          </div>
          <select
            value={settings.stationMatchingMode}
            onChange={(event) =>
              setStationMatchingMode(
                event.target.value as typeof settings.stationMatchingMode,
              )
            }
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="normal">{t('stationMatchingNormal')}</option>
            <option value="forgiving">{t('stationMatchingForgiving')}</option>
            <option value="strict">{t('stationMatchingStrict')}</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('language')}
        </p>
        <div className="grid grid-cols-2 gap-2 justify-items-center sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={classNames(
                'w-full rounded-full px-4 py-2 text-center text-sm font-semibold transition',
                settings.language === lang.code
                  ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('timezone')}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('timezoneDesc')}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:flex-1">
            <select
              value={settings.timezone}
              onChange={(event) => {
                setTimezone(event.target.value)
                setTimezoneStatus(null)
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-left text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
            >
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={handleGetTimezone}
            disabled={isLocating}
            className={classNames(
              'w-full rounded-xl px-4 py-3 text-sm font-semibold transition sm:w-auto',
              isLocating
                ? 'bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                : 'bg-[var(--accent-600)] text-white hover:bg-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]',
            )}
          >
            {isLocating ? t('gettingTimezone') : t('getTimezone')}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = settings.hourFormat === '24h' ? '12h' : '24h'
              setHourFormat(next)
              setTimezoneStatus(null)
            }}
            className={classNames(
              'w-full rounded-xl px-4 py-3 text-sm font-semibold transition sm:w-auto',
              'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]',
            )}
          >
            {settings.hourFormat === '24h' ? t('switchTo12Hour') : t('switchTo24Hour')}
          </button>
        </div>
        {timezoneStatus && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {timezoneStatus}
          </p>
        )}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('theme')}
        </p>
        <div className="grid grid-cols-2 gap-2 justify-items-center sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeChange(option.value)}
              className={classNames(
                'w-full rounded-full px-4 py-2 text-center text-sm font-semibold transition',
                currentTheme === option.value
                  ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {t(option.label)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('accentColor')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCENT_COLOR_OPTIONS.map((option: AccentColorOption) => {
            const selected = settings.accentColor === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={classNames(
                  'flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]',
                  selected
                    ? 'border-[var(--accent-600)] bg-[color:var(--accent-50)] shadow-inner dark:border-[var(--accent-500)] dark:bg-[rgb(var(--accent-600-rgb)_/_0.25)]'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#18181b] dark:bg-zinc-900 dark:hover:border-zinc-700',
                )}
                aria-pressed={selected}
                onClick={() => setAccentColor(option.id as AccentColorValue)}
              >
                <span
                  className="h-8 w-8 rounded-full border border-white/50 shadow-sm"
                  style={{ backgroundColor: option.palette[600] }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(option.translationKey ?? option.label)}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            className={classNames(
              'flex flex-col gap-3 rounded-2xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]',
              customAccentSelected
                ? 'border-[var(--accent-600)] bg-[color:var(--accent-50)] shadow-inner dark:border-[var(--accent-500)] dark:bg-[rgb(var(--accent-600-rgb)_/_0.25)]'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#18181b] dark:bg-zinc-900 dark:hover:border-zinc-700',
            )}
            aria-pressed={customAccentSelected}
            onClick={() => {
              const customAccent = getCustomAccentColorValue(customAccentInput)
              if (customAccent) {
                setAccentColor(customAccent)
              }
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: currentAccentOption.palette[600] }}
                aria-hidden="true"
              />
              <div>
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('customOption')}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {t('customAccentDesc')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="color"
                value={normalizeHexColor(customAccentInput) ?? currentAccentOption.palette[500]}
                onChange={(event) => applyCustomAccent(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="h-11 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900 sm:w-16"
                aria-label="Choose a custom accent color"
              />
              <input
                type="text"
                value={customAccentInput}
                onChange={(event) => applyCustomAccent(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder="#33c0ff"
                spellCheck={false}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                aria-label="Custom accent hex color"
              />
            </div>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('fontSize')}
        </p>
        <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[0.9fr_1fr_1.1fr_1.2fr] lg:grid-cols-[0.8fr_0.95fr_1.1fr_1.25fr_1.45fr]">
          {FONT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFontSize(option.id)}
              className={classNames(
                'w-full self-end rounded-full px-4 py-2 text-center text-sm font-semibold transition',
                settings.fontSize === option.id
                  ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
              style={{ fontSize: option.value }}
            >
              {t(FONT_SIZE_LABEL_KEYS[option.id])}
            </button>
          ))}
          <div className="col-span-2 flex items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-self-start">
            <button
              type="button"
              onClick={() => {
                const customFontSize = getCustomFontSizeValue(customFontSizeInput)
                if (customFontSize) {
                  setFontSize(customFontSize)
                }
              }}
              className={classNames(
                'shrink-0 text-sm font-semibold transition',
                customFontSizeSelected
                  ? 'text-[var(--accent-600)] dark:text-[var(--accent-300)]'
                  : 'text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300',
              )}
            >
              {t('customOption')}
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                type="number"
                min={10}
                max={40}
                step={1}
                value={customFontSizeInput}
                onChange={(event) => applyCustomFontSize(event.target.value)}
                className={classNames(
                  'min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-900 dark:text-zinc-100',
                  customFontSizeSelected
                    ? 'border-[var(--accent-600)] dark:border-[var(--accent-500)]'
                    : 'border-zinc-200 dark:border-zinc-700',
                )}
                aria-label="Custom font size in pixels"
              />
              <span className="shrink-0 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('pixelsAbbrev')}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('fontType')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...FONT_FAMILY_OPTIONS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFontFamily(option.id)}
              className={classNames(
                'flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]',
                settings.fontFamily === option.id
                  ? 'border-[var(--accent-600)] bg-[color:var(--accent-50)] shadow-inner dark:border-[var(--accent-500)] dark:bg-[rgb(var(--accent-600-rgb)_/_0.25)]'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#18181b] dark:bg-zinc-900 dark:hover:border-zinc-700',
              )}
            >
              <span
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                style={{ fontFamily: option.stack }}
              >
                {t(
                  FONT_FAMILY_LABEL_KEYS[option.id as keyof typeof FONT_FAMILY_LABEL_KEYS] ??
                    option.label,
                )}
              </span>
            </button>
          ))}
          <div
            className={classNames(
              'flex flex-col gap-3 rounded-2xl border px-3 py-3 transition',
              settings.fontFamily === CUSTOM_FONT_FAMILY_ID
                ? 'border-[var(--accent-600)] bg-[color:var(--accent-50)] shadow-inner dark:border-[var(--accent-500)] dark:bg-[rgb(var(--accent-600-rgb)_/_0.25)]'
                : 'border-zinc-200 bg-white dark:border-[#18181b] dark:bg-zinc-900',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  style={customFont ? { fontFamily: 'var(--ui-font)' } : undefined}
                >
                  {t('customUpload')}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('customUploadDesc')}
                </p>
                {customFont && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {customFont.name}
                  </p>
                )}
              </div>
              {customFont && (
                <button
                  type="button"
                  onClick={() => setFontFamily(CUSTOM_FONT_FAMILY_ID)}
                  className={classNames(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    settings.fontFamily === CUSTOM_FONT_FAMILY_ID
                      ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
                  )}
                >
                  {t('useLabel')}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 focus-within:ring-2 focus-within:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600">
                <input
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                  onChange={handleCustomFontUpload}
                  className="sr-only"
                />
                {t('uploadFont')}
              </label>
              {customFont && (
                <button
                  type="button"
                  onClick={() => {
                    void setCustomFont(null).then((result) => {
                      if (result.ok) {
                        setCustomFontStatus('Custom font removed from this browser.')
                        return
                      }
                      setCustomFontStatus(
                        'The browser blocked local font removal. Check private mode, storage settings, or browser restrictions.',
                      )
                    })
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {t('removeUploadedFont')}
                </button>
              )}
            </div>
            {customFontStatus && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{customFontStatus}</p>
            )}
          </div>
        </div>
      </div>
      <SolutionsAccessPanel onSettingsChange={notifySettingsSaved} />
      <UnavailableCitiesAccessPanel onSettingsChange={notifySettingsSaved} />
      <AchievementsUnlockPanel />
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('keybindings')}
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-[#18181b] dark:bg-zinc-900/40">
            <KeybindingRecorder
                label={t('keybindingFocusSearch')}
                value={settings.keybindings.FOCUS_INPUT}
                onChange={(val) => setKeybinding('FOCUS_INPUT', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingClearClose')}
                value={settings.keybindings.CLEAR_INPUT}
                onChange={(val) => setKeybinding('CLEAR_INPUT', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleZenMode')}
                value={settings.keybindings.TOGGLE_ZEN_MODE}
                onChange={(val) => setKeybinding('TOGGLE_ZEN_MODE', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleSidebar')}
                value={settings.keybindings.TOGGLE_SIDEBAR}
                onChange={(val) => setKeybinding('TOGGLE_SIDEBAR', val)}
            />
             <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleSolutions')}
                value={settings.keybindings.TOGGLE_SOLUTIONS}
                onChange={(val) => setKeybinding('TOGGLE_SOLUTIONS', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleStationLabels')}
                value={settings.keybindings.TOGGLE_LABELS}
                onChange={(val) => setKeybinding('TOGGLE_LABELS', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleMapNames')}
                value={settings.keybindings.TOGGLE_MAP_NAMES}
                onChange={(val) => setKeybinding('TOGGLE_MAP_NAMES', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingToggleSatellite')}
                value={settings.keybindings.TOGGLE_SATELLITE}
                onChange={(val) => setKeybinding('TOGGLE_SATELLITE', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingOpenCityStats')}
                value={settings.keybindings.OPEN_CITY_STATS}
                onChange={(val) => setKeybinding('OPEN_CITY_STATS', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingOpenAchievements')}
                value={settings.keybindings.OPEN_ACHIEVEMENTS}
                onChange={(val) => setKeybinding('OPEN_ACHIEVEMENTS', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingOpenAccount')}
                value={settings.keybindings.OPEN_ACCOUNT}
                onChange={(val) => setKeybinding('OPEN_ACCOUNT', val)}
            />
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <KeybindingRecorder
                label={t('keybindingOpenSettings')}
                value={settings.keybindings.OPEN_SETTINGS}
                onChange={(val) => setKeybinding('OPEN_SETTINGS', val)}
            />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('adminTools')}
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t('adminToolsDesc')}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {t('adminToolsAccess')}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/upcoming"
              className="inline-flex rounded-xl bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-500)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]"
            >
              {t('openAutomationAdminPanel')}
            </Link>
          </div>
        </div>
      </div>
      {showMobileOffline && (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Mobile and offline
          </p>
          <MobileOfflinePanel />
        </div>
      )}
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
          {t('dangerZone')}
        </p>
        <ResetProgressButton
          disabled={auth.loading}
          onResetComplete={auth.refresh}
          onLogout={auth.logoutLocally}
          isAuthenticated={!!auth.user}
          progressSummaries={auth.progressSummaries}
        />
      </div>
    </div>
  )
}

const SettingToggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) => (
  <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
    <div>
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={classNames(
        'relative inline-flex h-8 w-14 items-center rounded-full transition',
        checked
          ? 'bg-[var(--accent-500)] dark:bg-[var(--accent-400)]'
          : 'bg-zinc-300 dark:bg-zinc-700',
      )}
    >
      <span
        className={classNames(
          'inline-block h-6 w-6 transform rounded-full bg-white transition',
          checked ? 'translate-x-7' : 'translate-x-1',
        )}
      />
      <span className="sr-only">{label}</span>
    </button>
  </label>
)

const MobileOfflinePanel = () => {
  const [autoDownloadDataUpdates, setAutoDownloadDataUpdates] = useState(false)
  const [offlineCities, setOfflineCities] = useState<OfflineCityRecord[]>([])
  const [syncStatus, setSyncStatus] = useState<string>('Not synced in this session')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setAutoDownloadDataUpdates(
      window.localStorage.getItem('mm-auto-download-data-updates') === '1',
    )
    setOfflineCities(listOfflineCities())
    const refreshOfflineCities = () => setOfflineCities(listOfflineCities())
    const refreshSyncStatus = () => {
      const raw = window.localStorage.getItem('mm-progress-sync-status')
      if (!raw) {
        setSyncStatus('Not synced in this session')
        return
      }
      try {
        const parsed = JSON.parse(raw) as {
          state?: string
          lastSyncedAt?: string | null
          error?: string
        }
        setSyncStatus(
          parsed.state === 'synced' && parsed.lastSyncedAt
            ? `Last synced ${new Date(parsed.lastSyncedAt).toLocaleString()}`
            : parsed.state === 'error'
              ? `Sync error${parsed.error ? `: ${parsed.error}` : ''}`
              : parsed.state === 'syncing'
                ? 'Syncing progress...'
                : 'Not synced in this session',
        )
      } catch {
        setSyncStatus('Not synced in this session')
      }
    }
    refreshSyncStatus()
    window.addEventListener('metro-offline-cities-change', refreshOfflineCities)
    window.addEventListener('metro-progress-sync-status', refreshSyncStatus)
    return () => {
      window.removeEventListener('metro-offline-cities-change', refreshOfflineCities)
      window.removeEventListener('metro-progress-sync-status', refreshSyncStatus)
    }
  }, [])

  const toggleAutoDownload = useCallback((next: boolean) => {
    setAutoDownloadDataUpdates(next)
    window.localStorage.setItem('mm-auto-download-data-updates', next ? '1' : '0')
  }, [])

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
      <SettingToggle
        label="Auto-download city data updates"
        description="When a downloaded city has a newer data pack, refresh its data while online."
        checked={autoDownloadDataUpdates}
        onChange={toggleAutoDownload}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Progress sync</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{syncStatus}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">App updates</p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Checks the mobile update manifest and prompts for store updates.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => window.dispatchEvent(new Event('metro-check-mobile-updates'))}
          >
            Check updates
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Downloaded cities</p>
        {offlineCities.length === 0 ? (
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            No cities have been downloaded for offline use on this device.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {offlineCities.map((city) => (
              <div
                key={city.citySlug}
                className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {city.citySlug}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {city.assetCount} assets, map {city.mapDownloaded ? 'downloaded' : 'pending native support'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                  onClick={() => void deleteOfflineCity(city.citySlug)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SolutionsAccessPanel = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [hasAccess, setHasAccess] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [solutionsMode, setSolutionsMode] = useState<'all' | 'custom'>('custom')
  const [solutionsCities, setSolutionsCities] = useState<string[]>([])
  const [solutionsInitialized, setSolutionsInitialized] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const selectionHydratedRef = useRef(false)
  const allCityOptions = useMemo(
    () =>
      cities
        .map((city) => ({
          slug: city.link.replace(/^\//, ''),
          name: formatLocalizedCityName(city.name, city.link, settings.language),
          originalName: city.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [settings.language],
  )

  const applySolutionsProgress = useCallback(
    (mode?: 'all' | 'custom', customCities?: string[]) => {
      if (!hasAccess || typeof window === 'undefined') return
      const effectiveMode = mode ?? solutionsMode
      const targetSlugs =
        effectiveMode === 'all'
          ? allCityOptions.map((city) => city.slug)
          : customCities ?? solutionsCities
      targetSlugs.forEach((slug) => {
        const total = STATION_TOTALS[slug]
        if (!total || total <= 0) return
        try {
          window.localStorage.setItem(`${slug}-station-total`, String(total))
          window.localStorage.setItem(`${slug}-stations`, JSON.stringify(total))
          window.localStorage.setItem(`${slug}-stations-found-at`, '{}')
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Unable to persist solutions progress for ${slug}`, error)
          }
        }
      })
      window.dispatchEvent(new Event(LOCAL_PROGRESS_EVENT))
    },
    [allCityOptions, hasAccess, solutionsCities, solutionsMode],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const access = readSolutionsAccess()
    setHasAccess(access)
    const selection = readSolutionsSelection()
    const validCities = selection.cities.filter((slug) =>
      allCityOptions.some((city) => city.slug === slug),
    )
    setSolutionsMode(selection.mode)
    setSolutionsCities(validCities)
    setSolutionsInitialized(true)
  }, [allCityOptions])

  useEffect(() => {
    if (!solutionsInitialized || !hasAccess) return
    writeSolutionsSelection({
      mode: solutionsMode,
      cities: solutionsMode === 'custom' ? solutionsCities : [],
    })
    if (selectionHydratedRef.current) {
      onSettingsChange?.()
      applySolutionsProgress()
    } else {
      selectionHydratedRef.current = true
    }
  }, [
    applySolutionsProgress,
    hasAccess,
    onSettingsChange,
    solutionsCities,
    solutionsInitialized,
    solutionsMode,
  ])

  useEffect(() => {
    if (!hasAccess) {
      selectionHydratedRef.current = false
    }
  }, [hasAccess])

  const filteredCities = useMemo(() => {
    const normalizedFilter = cityFilter.trim().toLowerCase()
    if (!normalizedFilter) {
      return allCityOptions
    }
    return allCityOptions.filter((city) =>
      city.name.toLowerCase().includes(normalizedFilter) ||
      city.originalName.toLowerCase().includes(normalizedFilter),
    )
  }, [allCityOptions, cityFilter])

  const toggleSolutionsCity = useCallback((slug: string) => {
    setSolutionsCities((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((entry) => entry !== slug)
      }
      return [...prev, slug]
    })
  }, [])

  const handleSolutionsPasswordSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const password = passwordInput.trim()
      if (!password) {
        return
      }
      setPasswordError(null)
      try {
        const response = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.success) {
          setPasswordError('Incorrect password. Try again.')
          return
        }
        setHasAccess(true)
        writeSolutionsAccess(true)
        setPasswordInput('')
        setPasswordError(null)
        if (!solutionsInitialized) {
          setSolutionsInitialized(true)
        }
        onSettingsChange?.()
        applySolutionsProgress(solutionsMode, solutionsCities)
      } catch (error) {
        setPasswordError('Unable to verify password. Please try again.')
        if (process.env.NODE_ENV !== 'production') {
          console.error(error)
        }
      }
    },
    [
      applySolutionsProgress,
      onSettingsChange,
      passwordInput,
      solutionsCities,
      solutionsInitialized,
      solutionsMode,
    ],
  )

  const handleModeChange = useCallback((mode: 'all' | 'custom') => {
    setSolutionsMode(mode)
  }, [])

  const handleSelectAllCities = useCallback(() => {
    setSolutionsCities(allCityOptions.map((city) => city.slug))
  }, [allCityOptions])

  const handleClearAllCities = useCallback(() => {
    setSolutionsCities([])
  }, [])

  const isCustomMode = solutionsMode === 'custom'
  const selectedCount = solutionsCities.length

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('solutions')}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {t('solutionsDesc')}
        </p>
      </div>
      {!hasAccess ? (
        <form className="space-y-2" onSubmit={handleSolutionsPasswordSubmit}>
          <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            {t('enterPassword')}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder={t('password')}
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-500)] disabled:opacity-60 dark:bg-[var(--accent-600)] dark:hover:bg-[var(--accent-500)]"
              disabled={!passwordInput.trim()}
            >
              {t('unlock')}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 dark:text-red-300">{passwordError}</p>
          )}
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className={classNames(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                solutionsMode === 'all'
                  ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {t('revealEveryCity')}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('custom')}
              className={classNames(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                solutionsMode === 'custom'
                  ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {t('selectSpecificCities')}
            </button>
          </div>
          {isCustomMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  {t('selectedCount', { count: selectedCount, total: allCityOptions.length })}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-[var(--accent-600)] underline-offset-2 hover:underline dark:text-[var(--accent-300)]"
                    onClick={handleSelectAllCities}
                  >
                    {t('selectAll')}
                  </button>
                  <button
                    type="button"
                    className="text-[var(--accent-600)] underline-offset-2 hover:underline dark:text-[var(--accent-300)]"
                    onClick={handleClearAllCities}
                  >
                    {t('clearAll')}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder={t('searchCities')}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                {filteredCities.length === 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('noCitiesMatch')}
                  </p>
                )}
                {filteredCities.map((city) => {
                  const checked = solutionsCities.includes(city.slug)
                  return (
                    <label
                      key={city.slug}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-800 dark:text-zinc-100"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-[var(--accent-600)] focus:ring-[var(--accent-ring)] dark:border-zinc-700 dark:bg-zinc-900"
                        checked={checked}
                        onChange={() => toggleSolutionsCity(city.slug)}
                      />
                      <span>{city.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('solutionsAutoMark')}
          </p>
        </div>
      )}
    </div>
  )
}

const UnavailableCitiesAccessPanel = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
  const { t } = useTranslation()
  const [hasAccess, setHasAccess] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    setHasAccess(readUnavailableCityAccess())
  }, [])

  const handleUnlockSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const password = passwordInput.trim()
      if (!password) {
        return
      }

      setPasswordError(null)
      try {
        const response = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.success) {
          setPasswordError(t('incorrectPassword'))
          return
        }

        writeUnavailableCityAccess(true)
        setHasAccess(true)
        setPasswordInput('')
        setPasswordError(null)
        onSettingsChange?.()
      } catch (error) {
        setPasswordError('Unable to verify password. Please try again.')
        if (process.env.NODE_ENV !== 'production') {
          console.error(error)
        }
      }
    },
    [onSettingsChange, passwordInput, t],
  )

  const handleLock = useCallback(() => {
    writeUnavailableCityAccess(false)
    setHasAccess(false)
    setPasswordInput('')
    setPasswordError(null)
    onSettingsChange?.()
  }, [onSettingsChange])

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Preview unavailable cities
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Enter the password to play unavailable cities that are still being prepared.
        </p>
      </div>
      {hasAccess ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Preview access is enabled on this browser.
          </p>
          <button
            type="button"
            onClick={handleLock}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Lock unavailable cities
          </button>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={handleUnlockSubmit}>
          <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            {t('enterPassword')}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder={t('password')}
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-500)] disabled:opacity-60 dark:bg-[var(--accent-600)] dark:hover:bg-[var(--accent-500)]"
              disabled={!passwordInput.trim()}
            >
              {t('unlock')}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 dark:text-red-300">{passwordError}</p>
          )}
        </form>
      )}
    </div>
  )
}

const AchievementsUnlockPanel = () => {
  const { t } = useTranslation()
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleUnlockSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const password = passwordInput.trim()
      if (!password) {
        return
      }
      setPasswordError(null)
      setSuccessMessage(null)
      try {
        const response = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.success) {
          setPasswordError(t('incorrectPassphrase'))
          return
        }
        unlockAllAchievements()
        setSuccessMessage(t('allAchievementsUnlocked'))
        setPasswordInput('')
      } catch (error) {
        setPasswordError(t('verifyPassphraseError'))
        if (process.env.NODE_ENV !== 'production') {
          console.error(error)
        }
      }
    },
    [passwordInput, t],
  )

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#18181b] dark:bg-zinc-900/40">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('unlockAllAchievements')}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {t('unlockAllAchievementsDesc')}
        </p>
      </div>
      <form className="space-y-2" onSubmit={handleUnlockSubmit}>
        <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          {t('passphrase')}
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder={t('passphrase')}
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-60"
            disabled={!passwordInput.trim()}
          >
            {t('unlock')}
          </button>
        </div>
        {passwordError && (
          <p className="text-xs text-red-600 dark:text-red-300">{passwordError}</p>
        )}
        {successMessage && (
          <p className="text-xs text-emerald-600 dark:text-emerald-300">{successMessage}</p>
        )}
      </form>
    </div>
  )
}

const CITY_NAME_LOOKUP = new Map<string, string>()
const CITY_FLAG_LOOKUP = new Map<string, string>()
cities.forEach((city) => {
  const full = city.link.replace(/^\//, '')
  CITY_NAME_LOOKUP.set(full, city.name)
  CITY_FLAG_LOOKUP.set(full, getCityFlagEmojiFromPath(city.link))
  const lastSegment = full.split('/').pop()
  if (lastSegment) {
    // also index by slug (e.g., "lr", "ny") so reset dialogs show full names
    if (!CITY_NAME_LOOKUP.has(lastSegment)) {
      CITY_NAME_LOOKUP.set(lastSegment, city.name)
    }
    if (!CITY_FLAG_LOOKUP.has(lastSegment)) {
      CITY_FLAG_LOOKUP.set(lastSegment, getCityFlagEmojiFromPath(city.link))
    }
  }
})

const getCityName = (slug: string) => {
  if (CITY_NAME_LOOKUP.has(slug)) {
    return CITY_NAME_LOOKUP.get(slug)!
  }
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const getCityFlag = (slug: string) => CITY_FLAG_LOOKUP.get(slug) ?? '\u{1F310}'

const getSlugFromLink = (link: string) => {
  if (!link.startsWith('/')) {
    return null
  }
  const path = link.replace(/^\//, '').split(/[?#]/)[0]
  const segments = path.split('/').filter(Boolean)
  return segments.length ? segments[segments.length - 1] : null
}

const readLocalFoundCount = (slug: string) => {
  if (typeof window === 'undefined') {
    return 0
  }
  try {
    const stored = window.localStorage.getItem(`${slug}-stations`)
    if (!stored) return 0
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((value) => typeof value === 'number')).size
    }
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      return parsed
    }
  } catch {
    return 0
  }
  return 0
}

const LOCAL_PROGRESS_SUFFIXES = [
  '-stations',
  '-stations-found-at',
  '-stations-is-new-player',
  '-sidebar-open',
]

const LONG_PRESS_DURATION_MS = 5_000

const clearLocalProgressStorage = (slugs?: string[]) => {
  if (typeof window === 'undefined') {
    return 0
  }
  const slugFilter = slugs && slugs.length > 0 ? new Set(slugs) : null
  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    const progressPrefix = 'mm-progress-v1:'
    const suffix = LOCAL_PROGRESS_SUFFIXES.find((candidate) => key.endsWith(candidate))
    if (!suffix && !key.startsWith(progressPrefix)) {
      continue
    }
    const slug = key.startsWith(progressPrefix)
      ? key.slice(progressPrefix.length)
      : key.slice(0, -(suffix?.length ?? 0))
    if (slugFilter && !slugFilter.has(slug)) {
      continue
    }
    keysToRemove.push(key)
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  return keysToRemove.length
}

const ACHIEVEMENT_STORAGE_KEYS = [
  'mm-achievements-earned',
  'mm-completions',
  'mm-play-days',
  'mm-last-play-date',
  'mm-play-months',
  'mm-line-master-keys',
  'mm-map-names-toggles',
  'mm-global-unique-stations',
  'mm-favorites-completed',
  'mm-stats-opened',
]

const ACHIEVEMENT_STORAGE_PREFIXES = [
  'mm-city-unique-stations-',
]

const clearAchievementStorage = () => {
  if (typeof window === 'undefined') {
    return 0
  }
  let removed = 0
  ACHIEVEMENT_STORAGE_KEYS.forEach((key) => {
    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key)
      removed += 1
    }
  })
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (ACHIEVEMENT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key)
      removed += 1
    }
  }
  return removed
}

const ResetProgressButton = ({
  disabled,
  onResetComplete,
  onLogout,
  isAuthenticated,
  progressSummaries,
}: {
  disabled?: boolean
  onResetComplete?: () => Promise<void>
  onLogout?: () => void
  isAuthenticated: boolean
  progressSummaries: Record<string, number>
}) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [holdProgress, setHoldProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [statusVariant, setStatusVariant] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const [localProgressVersion, setLocalProgressVersion] = useState(0)
  const cityOptions = useMemo(() => {
    const entries = new Map<string, { slug: string; name: string; flag: string; found: number }>()

    Object.entries(progressSummaries ?? {}).forEach(([slug, found]) => {
        if ((found ?? 0) > 0) {
          const originalName = getCityName(slug)
          entries.set(slug, {
            slug,
            name: formatLocalizedCityName(originalName, slug, settings.language),
            flag: getCityFlag(slug),
            found,
          })
        }
      })

    if (typeof window !== 'undefined') {
      cities.forEach((city) => {
        const slug = getSlugFromLink(city.link)
        if (!slug) {
          return
        }
        const found = readLocalFoundCount(slug)
        if (found > 0) {
          const existing = entries.get(slug)
          const originalName = getCityName(slug)
          entries.set(slug, {
            slug,
            name: formatLocalizedCityName(originalName, slug, settings.language),
            flag: getCityFlag(slug),
            found: existing ? Math.max(existing.found, found) : found,
          })
        }
      })
    }

    return Array.from(entries.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [localProgressVersion, progressSummaries, settings.language])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [citySelectionInitialized, setCitySelectionInitialized] = useState(false)

  useEffect(() => {
    if (!citySelectionInitialized) {
      if (cityOptions.length > 0) {
        setSelectedCities(cityOptions.map((city) => city.slug))
        setCitySelectionInitialized(true)
      }
      return
    }
    setSelectedCities((prev) => {
      const available = new Set(cityOptions.map((city) => city.slug))
      const filtered = prev.filter((slug) => available.has(slug))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [cityOptions, citySelectionInitialized])

  const toggleCity = useCallback((slug: string) => {
    setSelectedCities((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((item) => item !== slug)
      }
      return [...prev, slug]
    })
  }, [])

  const selectAllCities = useCallback(() => {
    setSelectedCities(cityOptions.map((city) => city.slug))
  }, [cityOptions])

  const clearAllCities = useCallback(() => {
    setSelectedCities([])
  }, [])

  const resetTargets = useMemo(() => {
    if (selectedCities.length > 0) {
      return selectedCities
    }
    if (cityOptions.length > 0) {
      return cityOptions.map((city) => city.slug)
    }
    return []
  }, [cityOptions, selectedCities])

  const holdStartRef = useRef<number | null>(null)
  const holdTimeoutRef = useRef<number | null>(null)
  const holdRafRef = useRef<number | null>(null)

  const clearHoldTracking = useCallback(() => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdRafRef.current) {
      window.cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
    holdStartRef.current = null
  }, [])

  useEffect(
    () => () => {
      clearHoldTracking()
    },
    [clearHoldTracking],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleProgressChange = () => {
      setLocalProgressVersion((prev) => prev + 1)
    }
    window.addEventListener('storage', handleProgressChange)
    window.addEventListener('focus', handleProgressChange)
    window.addEventListener(LOCAL_PROGRESS_EVENT, handleProgressChange as EventListener)
    return () => {
      window.removeEventListener('storage', handleProgressChange)
      window.removeEventListener('focus', handleProgressChange)
      window.removeEventListener(LOCAL_PROGRESS_EVENT, handleProgressChange as EventListener)
    }
  }, [])

  const runReset = useCallback(async () => {
    setIsResetting(true)
    setStatusVariant('idle')
    setStatusMessage(null)
    try {
      const targets = resetTargets
      const clearedKeys = clearLocalProgressStorage(
        targets.length > 0 ? targets : undefined,
      )
      clearAchievementStorage()
      if (isAuthenticated) {
        const response = await apiFetch('/api/progress/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:
            targets.length > 0
              ? JSON.stringify({ citySlugs: targets })
              : JSON.stringify({}),
        })
        if (response.status === 401) {
          onLogout?.()
          setStatusVariant('error')
          setStatusMessage(t('signInToClear'))
        } else if (!response.ok) {
          throw new Error('Failed to reset progress')
        } else {
          await onResetComplete?.()
          setStatusVariant('success')
          setStatusMessage(t('resetStatusSuccess'))
        }
      } else {
        setStatusVariant('success')
        setStatusMessage(t('resetStatusLocalSuccess'))
      }
    } catch (error) {
      setStatusVariant('error')
      setStatusMessage(t('resetStatusError'))
      if (process.env.NODE_ENV !== 'production') {
        console.error(error)
      }
    } finally {
      setIsResetting(false)
      setHoldProgress(0)
    }
  }, [isAuthenticated, onLogout, onResetComplete, resetTargets, t])

  const completeHold = useCallback(() => {
    clearHoldTracking()
    setHoldProgress(1)
    void runReset()
  }, [clearHoldTracking, runReset])

  const startHold = useCallback(() => {
    if (
      disabled ||
      isResetting ||
      holdTimeoutRef.current !== null ||
      (isAuthenticated && cityOptions.length > 0 && resetTargets.length === 0)
    ) {
      return
    }
    setStatusMessage(null)
    setStatusVariant('idle')
    holdStartRef.current = performance.now()
    holdTimeoutRef.current = window.setTimeout(completeHold, LONG_PRESS_DURATION_MS)

    const tick = () => {
      if (holdStartRef.current === null) {
        return
      }
      const elapsed = performance.now() - holdStartRef.current
      setHoldProgress(Math.min(elapsed / LONG_PRESS_DURATION_MS, 1))
      if (elapsed < LONG_PRESS_DURATION_MS && holdTimeoutRef.current !== null) {
        holdRafRef.current = window.requestAnimationFrame(tick)
      }
    }
    holdRafRef.current = window.requestAnimationFrame(tick)
  }, [
    completeHold,
    disabled,
    isAuthenticated,
    isResetting,
    cityOptions.length,
    resetTargets.length,
  ])

  const cancelHold = useCallback(() => {
    clearHoldTracking()
    setHoldProgress(0)
  }, [clearHoldTracking])

  const handlePointerDown = useCallback(() => {
    startHold()
  }, [startHold])

  const handlePointerUp = useCallback(() => {
    cancelHold()
  }, [cancelHold])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        startHold()
      }
    },
    [startHold],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        cancelHold()
      }
    },
    [cancelHold],
  )

  return (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/60 dark:bg-red-950/40">
      <div>
        <p className="text-base font-semibold text-red-900 dark:text-red-200">
          {t('resetSavedProgressTitle')}
        </p>
        <p className="text-red-700 dark:text-red-300">
          {t('resetSavedProgressDesc')}
        </p>
      </div>
      <div className="space-y-2">
        {cityOptions.length === 0 ? (
          <p className="text-xs text-red-600 dark:text-red-300">
            {t('resetNoProgress')}
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold text-red-700 dark:text-red-200">
              {t('resetChooseCities')}
            </p>
            <div className="space-y-2">
              {cityOptions.map((city) => {
                const checked = selectedCities.includes(city.slug)
                return (
                  <label
                    key={city.slug}
                    className="flex items-center justify-between rounded-xl border border-red-200 bg-white/80 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-100"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 dark:border-red-700 dark:bg-red-900"
                        checked={checked}
                        onChange={() => toggleCity(city.slug)}
                        disabled={isResetting}
                      />
                      <span aria-hidden="true">{city.flag}</span>
                      <span>{city.name}</span>
                    </div>
                    <span className="text-xs text-red-600 dark:text-red-300">
                      {t('resetFoundLabel', { count: city.found })}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="text-red-700 underline-offset-2 hover:underline disabled:opacity-60 dark:text-red-200"
                onClick={selectAllCities}
                disabled={isResetting}
              >
                {t('selectAll')}
              </button>
              <button
                type="button"
                className="text-red-700 underline-offset-2 hover:underline disabled:opacity-60 dark:text-red-200"
                onClick={clearAllCities}
                disabled={isResetting}
              >
                {t('clearAll')}
              </button>
            </div>
            {isAuthenticated && cityOptions.length > 0 && resetTargets.length === 0 && (
              <p className="text-xs text-red-600 dark:text-red-300">
                {t('resetSelectPrompt')}
              </p>
            )}
          </>
        )}
      </div>
      <div>
        <button
          type="button"
          className={classNames(
            'relative w-full rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900',
            'border-red-500 bg-red-600 text-white dark:border-red-400 dark:bg-red-500',
          )}
          disabled={
            disabled ||
            isResetting ||
            (isAuthenticated && cityOptions.length > 0 && resetTargets.length === 0)
          }
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          {isResetting ? t('resetButtonResetting') : t('resetButtonHold')}
        </button>
        <div className="mt-2 h-1 w-full rounded-full bg-red-200 dark:bg-red-900/40">
          <div
            className="h-full rounded-full bg-red-600 transition-[width] dark:bg-red-400"
            style={{ width: `${Math.min(holdProgress, 1) * 100}%` }}
          />
        </div>
      </div>
      {statusMessage && (
        <p
          className={classNames(
            'text-xs',
            statusVariant === 'success'
              ? 'text-emerald-700 dark:text-emerald-400'
              : statusVariant === 'error'
                ? 'text-red-700 dark:text-red-300'
                : 'text-zinc-700 dark:text-zinc-300',
          )}
          aria-live="polite"
        >
          {statusMessage}
        </p>
      )}
    </div>
  )
}

export default SettingsPanel
