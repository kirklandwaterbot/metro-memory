'use client'

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Transition } from '@headlessui/react'
import CloseButton from './CloseButton'

const POLL_INTERVAL_MS = 3000
const TOAST_DURATION_MS = 15000
const VERSION_STORAGE_KEY = 'metro-memory:dev-site-version'
const SOURCE_VERSION_STORAGE_KEY = 'metro-memory:dev-site-source-version'
const ASSET_VERSION_STORAGE_KEY = 'metro-memory:dev-site-asset-version'
const TOAST_STORAGE_KEY = 'metro-memory:dev-site-refresh-toast'

function readToastPayload(): { shownAt: number } | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.sessionStorage.getItem(TOAST_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as { shownAt?: number }
    if (typeof parsed?.shownAt !== 'number') {
      window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
      return null
    }
    return { shownAt: parsed.shownAt }
  } catch {
    window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
    return null
  }
}

function writeToastPayload(shownAt = Date.now()) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(
    TOAST_STORAGE_KEY,
    JSON.stringify({ shownAt }),
  )
}

export default function DevSiteRefreshWatcher() {
  const [open, setOpen] = useState(false)
  const [visibleUntil, setVisibleUntil] = useState<number | null>(null)
  const [pendingRefresh, setPendingRefresh] = useState(false)
  // While hovered, the countdown is paused and this holds the time that was left.
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null)

  // Countdown bar timing, fixed each time the countdown (re)starts so that
  // pausing on hover only freezes the bar instead of re-timing it.
  const countdown = useMemo(() => {
    const durationMs = visibleUntil ? Math.max(0, visibleUntil - Date.now()) : 0
    return { durationMs, startFraction: Math.min(1, durationMs / TOAST_DURATION_MS) }
  }, [visibleUntil])

  const pauseCountdown = () => {
    if (!visibleUntil || pausedRemaining !== null) return
    setPausedRemaining(Math.max(0, visibleUntil - Date.now()))
  }
  const resumeCountdown = () => {
    if (pausedRemaining === null) return
    const nextVisibleUntil = Date.now() + pausedRemaining
    writeToastPayload(nextVisibleUntil - TOAST_DURATION_MS)
    setVisibleUntil(nextVisibleUntil)
    setPausedRemaining(null)
  }

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const payload = readToastPayload()
    if (!payload) {
      return
    }

    const nextVisibleUntil = payload.shownAt + TOAST_DURATION_MS
    if (nextVisibleUntil <= Date.now()) {
      window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
      return
    }

    setVisibleUntil(nextVisibleUntil)
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open || !visibleUntil || pausedRemaining !== null) {
      return
    }

    const remaining = Math.max(0, visibleUntil - Date.now())
    if (remaining === 0) {
      setOpen(false)
      window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
      return
    }

    const timeout = window.setTimeout(() => {
      setOpen(false)
      window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
    }, remaining)

    return () => window.clearTimeout(timeout)
  }, [open, visibleUntil, pausedRemaining])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    let disposed = false
    let requestInFlight = false

    const pollVersion = async () => {
      if (disposed || requestInFlight) {
        return
      }

      requestInFlight = true
      try {
        const response = await fetch('/api/dev/site-version', {
          cache: 'no-store',
          headers: { 'cache-control': 'no-store' },
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          version?: string
          sourceVersion?: string
          assetVersion?: string
        }
        const nextVersion = String(payload.version ?? '')
        const nextSourceVersion = String(payload.sourceVersion ?? '')
        const nextAssetVersion = String(payload.assetVersion ?? '')
        if (!nextVersion) {
          return
        }

        const previousVersion = window.sessionStorage.getItem(VERSION_STORAGE_KEY)
        const previousSourceVersion = window.sessionStorage.getItem(SOURCE_VERSION_STORAGE_KEY)
        const previousAssetVersion = window.sessionStorage.getItem(ASSET_VERSION_STORAGE_KEY)
        if (!previousVersion) {
          window.sessionStorage.setItem(VERSION_STORAGE_KEY, nextVersion)
          if (nextSourceVersion) {
            window.sessionStorage.setItem(SOURCE_VERSION_STORAGE_KEY, nextSourceVersion)
          }
          if (nextAssetVersion) {
            window.sessionStorage.setItem(ASSET_VERSION_STORAGE_KEY, nextAssetVersion)
          }
          return
        }

        if (previousVersion !== nextVersion) {
          window.sessionStorage.setItem(VERSION_STORAGE_KEY, nextVersion)
          if (nextSourceVersion) {
            window.sessionStorage.setItem(SOURCE_VERSION_STORAGE_KEY, nextSourceVersion)
          }
          if (nextAssetVersion) {
            window.sessionStorage.setItem(ASSET_VERSION_STORAGE_KEY, nextAssetVersion)
          }

          const sourceChanged =
            !!nextSourceVersion &&
            !!previousSourceVersion &&
            previousSourceVersion !== nextSourceVersion
          const assetOnlyChanged =
            !sourceChanged &&
            !!nextAssetVersion &&
            !!previousAssetVersion &&
            previousAssetVersion !== nextAssetVersion

          if (sourceChanged) {
            writeToastPayload()
            setVisibleUntil(Date.now() + TOAST_DURATION_MS)
            setOpen(true)
            setPendingRefresh(true)
            return
          }

          if (!assetOnlyChanged) {
            writeToastPayload()
            setVisibleUntil(Date.now() + TOAST_DURATION_MS)
            setOpen(true)
            setPendingRefresh(true)
            return
          }

          writeToastPayload()
          setVisibleUntil(Date.now() + TOAST_DURATION_MS)
          setOpen(true)
          setPendingRefresh(true)
          return
        }
      } catch {
        return
      } finally {
        requestInFlight = false
      }
    }

    void pollVersion()
    const interval = window.setInterval(() => {
      void pollVersion()
    }, POLL_INTERVAL_MS)

    return () => {
      disposed = true
      window.clearInterval(interval)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development' || !visibleUntil) {
    return null
  }

  const remainingMs = pausedRemaining ?? countdown.durationMs

  return (
    <Transition
      show={open}
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="translate-y-4 opacity-0 scale-95"
      enterTo="translate-y-0 opacity-100 scale-100"
      leave="transform transition ease-in duration-150"
      leaveFrom="translate-y-0 opacity-100 scale-100"
      leaveTo="translate-y-4 opacity-0 scale-95"
    >
      <div
        className="pointer-events-auto fixed bottom-24 right-6 z-[65] w-full max-w-xs sm:max-w-sm"
        onMouseEnter={pauseCountdown}
        onMouseLeave={resumeCountdown}
        onFocus={pauseCountdown}
        onBlur={resumeCountdown}
      >
        <style>{`@keyframes mm-dev-toast-countdown { from { transform: scaleX(var(--mm-countdown-from)); } to { transform: scaleX(0); } }`}</style>
        <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-sky-200 bg-white/95 p-4 pt-5 text-left shadow-2xl backdrop-blur dark:border-sky-500/60 dark:bg-zinc-900/95">
          <div
            className="absolute inset-x-0 top-0 h-1 bg-sky-100 dark:bg-sky-950"
            role="progressbar"
            aria-label={pausedRemaining !== null ? 'Auto-close paused' : 'Time until this notification closes'}
            aria-valuemin={0}
            aria-valuemax={Math.round(TOAST_DURATION_MS / 1000)}
            aria-valuenow={Math.round(remainingMs / 1000)}
          >
            <div
              key={visibleUntil}
              className="h-full w-full origin-left bg-sky-500 dark:bg-sky-400"
              style={
                {
                  '--mm-countdown-from': countdown.startFraction,
                  transform: `scaleX(${countdown.startFraction})`,
                  animation: `mm-dev-toast-countdown ${countdown.durationMs}ms linear forwards`,
                  animationPlayState: pausedRemaining !== null ? 'paused' : 'running',
                } as React.CSSProperties
              }
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Data updated</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {pendingRefresh
                ? 'A local file changed. Refresh when you are ready.'
                : 'The page refreshed automatically after a local file change.'}
            </p>
            {pendingRefresh && (
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
                  window.location.reload()
                }}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                Refresh now
              </button>
            )}
          </div>
          <CloseButton
            ariaLabel="Dismiss data changed notification"
            onClick={() => {
              setOpen(false)
              setPendingRefresh(false)
              window.sessionStorage.removeItem(TOAST_STORAGE_KEY)
            }}
            className="ml-2 h-7 w-7 text-zinc-500 hover:text-zinc-800 focus:ring-sky-400 dark:text-zinc-300 dark:hover:text-white"
            iconClassName="h-4 w-4"
          />
        </div>
      </div>
    </Transition>
  )
}
