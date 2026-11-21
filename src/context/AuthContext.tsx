'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import { useSettings } from '@/context/SettingsContext'
import {
    mergeCollapsedSections,
    normalizeUiPreferences,
    type UiPreferences,
} from '@/lib/preferences'
import { apiFetch } from '@/lib/apiClient'
import { syncDirtyProgressFromStorage } from '@/lib/progressRepository'

type AuthUser = {
  id: string
  email: string
  adFree?: boolean
}

type ProgressSummaries = Record<string, number>

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  progressSummaries: ProgressSummaries
  updateProgressSummary: (citySlug: string, foundCount: number) => void
  logoutLocally: () => void
  uiPreferences: UiPreferences
  setCollapsedSectionPreference: (
    sectionId: string,
    collapsed: boolean,
  ) => Promise<void>
  /** Several sections at once (one request), e.g. "Expand all" / "Collapse all". */
  setCollapsedSectionsPreference: (sections: Record<string, boolean>) => Promise<void>
  updateUiPreferences: (updates: Partial<UiPreferences>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { settings, setLanguage, setTimezone, setHourFormat } = useSettings()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [progressSummaries, setProgressSummaries] = useState<ProgressSummaries>({})
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>({})
  const preferencesInitializedRef = useRef(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/session', { cache: 'no-store' })
      if (!response.ok) {
        setUser(null)
        setProgressSummaries({})
        setUiPreferences({})
        return
      }
      const data = await response.json()
      setUser(data.user)
      if (Array.isArray(data.progressSummaries)) {
        const summaries: ProgressSummaries = {}
        data.progressSummaries.forEach(
          (entry: { citySlug?: string; foundCount?: number }) => {
            if (entry?.citySlug) {
              summaries[entry.citySlug] = entry.foundCount ?? 0
            }
          },
        )
        setProgressSummaries(summaries)
      } else {
        setProgressSummaries({})
      }
      setUiPreferences(normalizeUiPreferences(data.uiPreferences))
    } catch {
      setUser(null)
      setProgressSummaries({})
      setUiPreferences({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateProgressSummary = useCallback(
    (citySlug: string, foundCount: number) => {
      setProgressSummaries((prev) => ({
        ...prev,
        [citySlug]: foundCount,
      }))
    },
    [],
  )

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false
    const sync = async () => {
      try {
        const result = await syncDirtyProgressFromStorage()
        if (cancelled || !result.ok) {
          return
        }
        result.records.forEach((record) => {
          updateProgressSummary(record.citySlug, record.foundCount)
        })
      } catch {
        // Network failures are expected offline; records stay dirty locally.
      }
    }

    void sync()
    const handleOnline = () => void sync()
    const handleFocus = () => void sync()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sync()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [updateProgressSummary, user])

  const logoutLocally = useCallback(() => {
    setUser(null)
    setProgressSummaries({})
    setUiPreferences({})
  }, [])

  const setCollapsedSectionsPreference = useCallback(
    async (sections: Record<string, boolean>) => {
      if (Object.keys(sections).length === 0) return
      if (!user) return

      setUiPreferences((prev) => ({
        ...prev,
        collapsedSections: mergeCollapsedSections(prev.collapsedSections, sections),
      }))

      try {
        const response = await apiFetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collapsedSections: sections,
          }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            setUser(null)
            setProgressSummaries({})
            setUiPreferences({})
          }
          return
        }

        const payload = await response.json().catch(() => ({}))
        setUiPreferences((prev) =>
          normalizeUiPreferences({
            ...prev,
            ...(payload?.preferences ?? {}),
          }),
        )
      } catch {
        // ignore network errors; local optimistic state already applied
      }
    },
    [user],
  )

  const setCollapsedSectionPreference = useCallback(
    (sectionId: string, collapsed: boolean) =>
      setCollapsedSectionsPreference({ [sectionId]: collapsed }),
    [setCollapsedSectionsPreference],
  )

  const updateUiPreferences = useCallback(
    async (updates: Partial<UiPreferences>) => {
      if (!user) return

      setUiPreferences((prev) => {
        const merged = {
          ...prev,
          ...updates,
          ...(updates.homeScrollPositions
            ? {
                homeScrollPositions: {
                  ...(prev.homeScrollPositions ?? {}),
                  ...updates.homeScrollPositions,
                },
              }
            : {}),
          ...(updates.mapViewByCity
            ? {
                mapViewByCity: {
                  ...(prev.mapViewByCity ?? {}),
                  ...updates.mapViewByCity,
                },
              }
            : {}),
        }
        return normalizeUiPreferences(merged)
      })

      try {
        const response = await apiFetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          if (response.status === 401) {
            setUser(null)
            setProgressSummaries({})
            setUiPreferences({})
          }
          return
        }

        const payload = await response.json().catch(() => ({}))
        setUiPreferences((prev) =>
          normalizeUiPreferences({
            ...prev,
            ...(payload?.preferences ?? {}),
          }),
        )
      } catch {
        // ignore network errors; local optimistic state already applied
      }
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      progressSummaries,
      updateProgressSummary,
      logoutLocally,
      uiPreferences,
      setCollapsedSectionPreference,
      setCollapsedSectionsPreference,
      updateUiPreferences,
    }),
    [
      user,
      loading,
      refresh,
      progressSummaries,
      updateProgressSummary,
      logoutLocally,
      uiPreferences,
      setCollapsedSectionPreference,
      setCollapsedSectionsPreference,
      updateUiPreferences,
    ],
  )

  useEffect(() => {
    if (!user) {
      preferencesInitializedRef.current = false
      return
    }

    if (!preferencesInitializedRef.current) {
      let hydrated = false
      if (
        uiPreferences.language &&
        uiPreferences.language !== settings.language
      ) {
        setLanguage(uiPreferences.language, { silent: true })
        hydrated = true
      }
      if (
        uiPreferences.timezone &&
        uiPreferences.timezone !== settings.timezone
      ) {
        setTimezone(uiPreferences.timezone, { silent: true })
        hydrated = true
      }
      if (
        uiPreferences.hourFormat &&
        uiPreferences.hourFormat !== settings.hourFormat
      ) {
        setHourFormat(uiPreferences.hourFormat, { silent: true })
        hydrated = true
      }

      if (!hydrated) {
        preferencesInitializedRef.current = true
      }
      return
    }
  }, [
    setHourFormat,
    setLanguage,
    setTimezone,
    settings.hourFormat,
    settings.language,
    settings.timezone,
    uiPreferences.hourFormat,
    uiPreferences.language,
    uiPreferences.timezone,
    user,
  ])

  useEffect(() => {
    if (!user || !preferencesInitializedRef.current) {
      return
    }

    const changes: Partial<UiPreferences> = {}

    if (uiPreferences.language !== settings.language) {
      changes.language = settings.language
    }
    if (uiPreferences.timezone !== settings.timezone) {
      changes.timezone = settings.timezone
    }
    if (uiPreferences.hourFormat !== settings.hourFormat) {
      changes.hourFormat = settings.hourFormat
    }

    if (Object.keys(changes).length === 0) {
      return
    }

    const controller = new AbortController()
    const persistLanguage = async () => {
      try {
        const response = await apiFetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
          signal: controller.signal,
        })

        if (!response.ok) {
          if (response.status === 401) {
            setUser(null)
            setProgressSummaries({})
            setUiPreferences({})
          }
          return
        }

        const payload = await response.json().catch(() => ({}))
        setUiPreferences(normalizeUiPreferences(payload.preferences))
        preferencesInitializedRef.current = true
      } catch {
        // ignore network errors; local optimistic state already applied
      }
    }

    void persistLanguage()

    return () => controller.abort()
  }, [
    setProgressSummaries,
    setUser,
    settings.language,
    settings.timezone,
    settings.hourFormat,
    uiPreferences.language,
    uiPreferences.timezone,
    uiPreferences.hourFormat,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
