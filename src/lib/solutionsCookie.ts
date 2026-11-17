// Server-only: a long-lived, HttpOnly cookie proving this browser unlocked
// solutions. Its value is an HMAC of SOLUTIONS_PASSWORD, so the password itself
// is never stored client-side, and changing the password invalidates old cookies.

import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

export const SOLUTIONS_COOKIE = 'mm_solutions'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400 // browsers cap cookies at ~400 days

function expectedValue(): string | null {
  const password = process.env.SOLUTIONS_PASSWORD?.trim()
  if (!password) return null
  return createHmac('sha256', password).update('metro-memory:solutions:v1').digest('hex')
}

export function setSolutionsCookie(response: NextResponse) {
  const value = expectedValue()
  if (!value) return
  response.cookies.set(SOLUTIONS_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function hasValidSolutionsCookie(request: NextRequest): boolean {
  const expected = expectedValue()
  const provided = request.cookies.get(SOLUTIONS_COOKIE)?.value
  if (!expected || !provided || provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}
