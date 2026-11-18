'use client'

import {
  MISSED_GUESSES_UPDATED_EVENT,
  clearAllMissedGuesses,
  clearMissedGuessesForCity,
  mergeMissedGuesses,
  readMissedGuesses,
  type MissedGuessEntry,
} from '@/lib/missedGuesses'
import { Dialog, Transition } from '@headlessui/react'
import { FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CloseButton from './CloseButton'

type MissedGuessInputsModalProps = {
  city: string
  open: boolean
  accessPassword?: string
  scope?: 'city' | 'all'
  onClose: () => void
}

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

type TopInput = { rawInput: string; normalizedInput: string; count: number; lastSeenAt: string }
type LiveStatus = 'loading' | 'ok' | 'locked' | 'error' | 'unavailable'

const LIVE_REFRESH_MS = 30_000

export default function MissedGuessInputsModal({
  city,
  open,
  accessPassword,
  scope = 'all',
  onClose,
}: MissedGuessInputsModalProps) {
  const scopedCity = scope === 'city' ? city : undefined
  const [localEntries, setLocalEntries] = useState<MissedGuessEntry[]>([])
  // Live (everyone's) entries are kept separately from the local log, so a new
  // local guess never replaces what other players typed.
  const [liveEntries, setLiveEntries] = useState<MissedGuessEntry[]>([])
  const [topInputs, setTopInputs] = useState<TopInput[]>([])
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('loading')
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockError, setUnlockError] = useState(false)
  const requestIdRef = useRef(0)

  const loadLive = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const query = new URLSearchParams({ limit: '250' })
    if (scopedCity) query.set('city', scopedCity)
    try {
      const response = await fetch(`/api/missed-guesses?${query.toString()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: accessPassword ? { 'x-solutions-password': accessPassword } : undefined,
      })
      if (requestId !== requestIdRef.current) return
      if (response.status === 401) {
        setLiveStatus('locked')
        return
      }
      const json = response.ok ? await response.json().catch(() => null) : null
      if (requestId !== requestIdRef.current) return
      if (!json) {
        // Keep whatever we showed last time; just flag the failed refresh.
        setLiveStatus('error')
        return
      }
      if (json.unavailable) {
        setLiveStatus('unavailable')
        return
      }
      if (Array.isArray(json.recent)) setLiveEntries(json.recent)
      if (Array.isArray(json.top)) setTopInputs(json.top)
      setLiveStatus('ok')
      setLastLoadedAt(new Date())
    } catch {
      if (requestId === requestIdRef.current) setLiveStatus('error')
    }
  }, [accessPassword, scopedCity])

  useEffect(() => {
    if (!open) return
    setLocalEntries(readMissedGuesses(scopedCity))
    setLiveStatus((status) => (status === 'ok' ? status : 'loading'))
    void loadLive()

    let pendingLiveRefresh: ReturnType<typeof setTimeout> | null = null
    const onLocalChange = () => {
      setLocalEntries(readMissedGuesses(scopedCity))
      // The guess is also posted to the server; pick up the shared copy shortly.
      if (pendingLiveRefresh) clearTimeout(pendingLiveRefresh)
      pendingLiveRefresh = setTimeout(() => void loadLive(), 2500)
    }
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadLive()
    }, LIVE_REFRESH_MS)

    window.addEventListener(MISSED_GUESSES_UPDATED_EVENT, onLocalChange)
    window.addEventListener('storage', onLocalChange)
    return () => {
      clearInterval(interval)
      if (pendingLiveRefresh) clearTimeout(pendingLiveRefresh)
      requestIdRef.current += 1 // ignore in-flight responses after closing
      window.removeEventListener(MISSED_GUESSES_UPDATED_EVENT, onLocalChange)
      window.removeEventListener('storage', onLocalChange)
    }
  }, [loadLive, open, scopedCity])

  const entries = useMemo(
    () => mergeMissedGuesses(localEntries, liveStatus === 'locked' ? [] : liveEntries),
    [liveEntries, liveStatus, localEntries],
  )

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = unlockPassword.trim()
    if (!password) return
    try {
      // Validating the password also sets the long-lived unlock cookie.
      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || !json?.success) {
        setUnlockError(true)
        return
      }
      setUnlockPassword('')
      setUnlockError(false)
      setLiveStatus('loading')
      await loadLive()
    } catch {
      setUnlockError(true)
    }
  }

  const statusText = (() => {
    const where = scope === 'city' ? 'for this city' : 'across all cities'
    switch (liveStatus) {
      case 'ok':
        return `Everyone's wrong guesses ${where} · updated ${lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : 'just now'}`
      case 'loading':
        return `Loading everyone's wrong guesses ${where}…`
      case 'locked':
        return `Only your own wrong guesses ${where} — unlock below to see other players'`
      case 'unavailable':
        return `Only your own wrong guesses ${where} — the shared log isn't set up on this server`
      default:
        return liveEntries.length
          ? `Couldn't refresh just now — showing the last loaded list ${where}`
          : `Couldn't load other players' guesses — showing your own ${where}`
    }
  })()

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-2 opacity-0 scale-95"
              enterTo="translate-y-0 opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100 scale-100"
              leaveTo="translate-y-2 opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
                  <div className="min-w-0">
                    <Dialog.Title className="text-xl font-black text-zinc-950 dark:text-zinc-50">
                      Missed guess inputs
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {statusText}
                    </p>
                  </div>
                  <CloseButton
                    ariaLabel="Close missed guess inputs"
                    onClick={onClose}
                    className="h-10 w-10 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus:ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-zinc-700"
                  />
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
                  {liveStatus === 'locked' && (
                    <form
                      onSubmit={handleUnlock}
                      className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
                    >
                      <p className="mb-3 text-sm font-bold text-amber-900 dark:text-amber-200">
                        Enter the solutions password to see what other players typed. You
                        only need to do this once per browser.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={unlockPassword}
                          onChange={(event) => {
                            setUnlockPassword(event.target.value)
                            setUnlockError(false)
                          }}
                          aria-label="Solutions password"
                          className="min-w-0 flex-1 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
                        >
                          Unlock
                        </button>
                      </div>
                      {unlockError && (
                        <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-300">
                          That password didn&apos;t work.
                        </p>
                      )}
                    </form>
                  )}
                  {liveStatus === 'error' && (
                    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                      <span>The shared log didn&apos;t load. It retries every 30 seconds.</span>
                      <button
                        type="button"
                        onClick={() => void loadLive()}
                        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 dark:bg-zinc-950 dark:text-red-200 dark:ring-red-500/30"
                      >
                        Retry now
                      </button>
                    </div>
                  )}
                  {topInputs.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <p className="mb-3 text-sm font-black text-zinc-950 dark:text-zinc-50">
                        Most common missed inputs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {topInputs.slice(0, 15).map((entry) => (
                          <span
                            key={`${entry.rawInput}-${entry.normalizedInput}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800"
                          >
                            {entry.rawInput} ×{entry.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                      {scope === 'city'
                        ? 'No missed guesses logged for this city yet.'
                        : 'No missed guesses logged across all cities yet.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-base font-black text-zinc-950 dark:text-zinc-50">
                                ❌ {entry.rawInput}
                                {entry.mine && (
                                  <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 align-middle text-[10px] font-black uppercase tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                    You
                                  </span>
                                )}
                              </p>
                              {scope === 'all' && (
                                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                                  {entry.city}
                                </p>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">
                              {formatTimestamp(entry.createdAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                            Normalized: {entry.normalizedInput || 'empty'}
                          </p>
                          {entry.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entry.suggestions.map((suggestion) => (
                                <span
                                  key={suggestion}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800"
                                >
                                  {suggestion}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      // Only this browser's copy is cleared; the shared log stays.
                      if (scope === 'city') {
                        clearMissedGuessesForCity(city)
                      } else {
                        clearAllMissedGuesses()
                      }
                      setLocalEntries([])
                    }}
                    className="rounded-full px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    {scope === 'city' ? 'Clear my log for this city' : 'Clear my local log'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadLive()}
                    className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Refresh
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
