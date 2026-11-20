'use client'

import { useEffect } from 'react'

// In dev, a page can 404 for a few seconds while Next compiles it or after
// files change. Keep reloading, backing off, until it shows up (or give up
// after about a minute, so a real 404 doesn't reload forever).
const RETRY_WINDOW_MS = 60000
const RETRY_DELAYS_MS = [250, 750, 1500, 2500, 4000, 6000, 8000, 10000, 12000]
const MAX_RETRIES = RETRY_DELAYS_MS.length
const RETRY_STATE_PREFIX = 'metro-memory:dev-not-found-retry:'
const TOAST_STORAGE_KEY = 'metro-memory:dev-site-refresh-toast'

function writeToastPayload() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(
    TOAST_STORAGE_KEY,
    JSON.stringify({ shownAt: Date.now() }),
  )
}

export default function DevNotFoundAutoRetry() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const retryKey = `${RETRY_STATE_PREFIX}${window.location.pathname}`
    const now = Date.now()

    let retries = 0
    let firstAttemptAt = now

    try {
      const raw = window.sessionStorage.getItem(retryKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { retries?: number; firstAttemptAt?: number }
        retries = typeof parsed?.retries === 'number' ? parsed.retries : 0
        firstAttemptAt =
          typeof parsed?.firstAttemptAt === 'number' ? parsed.firstAttemptAt : now
      }
    } catch {
      retries = 0
      firstAttemptAt = now
    }

    if (now - firstAttemptAt > RETRY_WINDOW_MS) {
      retries = 0
      firstAttemptAt = now
    }

    if (retries >= MAX_RETRIES) {
      return
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(
        retryKey,
        JSON.stringify({ retries: retries + 1, firstAttemptAt }),
      )
      writeToastPayload()
      window.location.reload()
    }, RETRY_DELAYS_MS[retries])

    return () => window.clearTimeout(timeout)
  }, [])

  return null
}
