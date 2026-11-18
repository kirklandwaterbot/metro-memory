import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { getAutomationAdminUser } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { hasValidSolutionsCookie } from '@/lib/solutionsCookie'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const citySchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/i)

const missedGuessSchema = z.object({
  city: citySchema,
  rawInput: z.string().trim().min(1).max(160),
  normalizedInput: z.string().trim().max(160).default(''),
  suggestions: z
    .array(z.string().trim().min(1).max(160))
    .max(5)
    .default([]),
})

const readQuerySchema = z.object({
  city: citySchema.optional(),
  limit: z.coerce.number().int().min(1).max(250).default(100),
})

type MissedGuessRow = {
  id: string
  citySlug: string
  rawInput: string
  normalizedInput: string
  suggestions: Prisma.JsonValue
  createdAt: Date
}

type MissedGuessAggregateRow = {
  rawInput: string
  normalizedInput: string
  count: number | bigint
  lastSeenAt: Date
}

type MissedGuessTableProbeRow = {
  tableName: string | null
}

const MISSED_GUESS_TABLE_NAME = 'MissedGuessInput'
const MISSED_GUESS_TABLE_CACHE_MS = 60_000
const MAX_SERVER_MISSED_GUESS_ROWS = 100_000
// The trim is a sorted OFFSET scan, so run it only on a small fraction of
// inserts instead of every POST. The table can drift ~1/this above the cap
// between trims, which is negligible against a 100k ceiling.
const MISSED_GUESS_TRIM_PROBABILITY = 0.01

let missedGuessTableCache:
  | {
      checkedAt: number
      exists: boolean
    }
  | null = null

const isSolutionsPasswordValid = (request: NextRequest) => {
  const expected = process.env.SOLUTIONS_PASSWORD?.trim()
  if (!expected) return false
  const provided = request.headers.get('x-solutions-password')?.trim()
  return Boolean(provided) && provided === expected
}

const canReadMissedGuesses = async (request: NextRequest) => {
  if (isSolutionsPasswordValid(request)) return true
  if (hasValidSolutionsCookie(request)) return true
  return Boolean(await getAutomationAdminUser())
}

const normalizeSuggestions = (value: Prisma.JsonValue): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

const serializeRow = (row: MissedGuessRow) => ({
  id: row.id,
  city: row.citySlug,
  rawInput: row.rawInput,
  normalizedInput: row.normalizedInput,
  suggestions: normalizeSuggestions(row.suggestions),
  createdAt: row.createdAt.toISOString(),
})

const isMissingMissedGuessTableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('42P01') &&
    message.includes(`relation "${MISSED_GUESS_TABLE_NAME}" does not exist`)
  )
}

const hasMissedGuessTable = async () => {
  const now = Date.now()
  if (
    missedGuessTableCache &&
    now - missedGuessTableCache.checkedAt < MISSED_GUESS_TABLE_CACHE_MS
  ) {
    return missedGuessTableCache.exists
  }

  try {
    const rows = await prisma.$queryRaw<MissedGuessTableProbeRow[]>`
      SELECT to_regclass('public."MissedGuessInput"')::text AS "tableName"
    `
    const exists = typeof rows[0]?.tableName === 'string' && rows[0].tableName.length > 0
    missedGuessTableCache = {
      checkedAt: now,
      exists,
    }
    return exists
  } catch (error) {
    // A failed probe (e.g. the database waking from a cold start) is not proof
    // the table is missing. Don't cache it — try the real query, whose own
    // error handling detects a genuinely missing table.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Unable to verify MissedGuessInput table availability:', error)
    }
    return true
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = missedGuessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid missed guess payload.' }, { status: 400 })
  }

  const data = parsed.data
  if (!(await hasMissedGuessTable())) {
    return NextResponse.json({ ok: true, stored: false, unavailable: true })
  }

  const insert = () => prisma.$executeRaw`
    INSERT INTO "MissedGuessInput"
      ("id", "citySlug", "rawInput", "normalizedInput", "suggestions", "createdAt")
    VALUES
      (${crypto.randomUUID()}, ${data.city}, ${data.rawInput}, ${data.normalizedInput}, ${JSON.stringify(data.suggestions)}::jsonb, NOW())
  `

  const write = async () => {
    if (Math.random() < MISSED_GUESS_TRIM_PROBABILITY) {
      await prisma.$transaction([
        insert(),
        prisma.$executeRaw`
          DELETE FROM "MissedGuessInput"
          WHERE "id" IN (
            SELECT "id"
            FROM "MissedGuessInput"
            ORDER BY "createdAt" DESC, "id" DESC
            OFFSET ${MAX_SERVER_MISSED_GUESS_ROWS}
          )
        `,
      ])
    } else {
      await insert()
    }
  }

  try {
    try {
      await write()
    } catch (error) {
      if (isMissingMissedGuessTableError(error)) throw error
      // One retry for transient failures (connection drop, cold start).
      await new Promise((resolve) => setTimeout(resolve, 400))
      await write()
    }
  } catch (error) {
    if (isMissingMissedGuessTableError(error)) {
      missedGuessTableCache = {
        checkedAt: Date.now(),
        exists: false,
      }
      return NextResponse.json({ ok: true, stored: false, unavailable: true })
    }
    console.warn('Unable to persist missed guess input:', error)
    return NextResponse.json({ ok: true, stored: false })
  }

  return NextResponse.json({ ok: true, stored: true })
}

export async function GET(request: NextRequest) {
  if (!(await canReadMissedGuesses(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = readQuerySchema.safeParse({
    city: request.nextUrl.searchParams.get('city') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid missed guess query.' }, { status: 400 })
  }

  const { city, limit } = parsed.data
  if (!(await hasMissedGuessTable())) {
    return NextResponse.json({ recent: [], top: [], unavailable: true })
  }

  try {
    const recent = city
      ? await prisma.$queryRaw<MissedGuessRow[]>`
          SELECT "id", "citySlug", "rawInput", "normalizedInput", "suggestions", "createdAt"
          FROM "MissedGuessInput"
          WHERE "citySlug" = ${city}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<MissedGuessRow[]>`
          SELECT "id", "citySlug", "rawInput", "normalizedInput", "suggestions", "createdAt"
          FROM "MissedGuessInput"
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `

    const top = city
      ? await prisma.$queryRaw<MissedGuessAggregateRow[]>`
          SELECT
            "rawInput",
            "normalizedInput",
            COUNT(*)::int AS "count",
            MAX("createdAt") AS "lastSeenAt"
          FROM "MissedGuessInput"
          WHERE "citySlug" = ${city}
          GROUP BY "rawInput", "normalizedInput"
          ORDER BY "count" DESC, "lastSeenAt" DESC
          LIMIT 50
        `
      : await prisma.$queryRaw<MissedGuessAggregateRow[]>`
          SELECT
            "rawInput",
            "normalizedInput",
            COUNT(*)::int AS "count",
            MAX("createdAt") AS "lastSeenAt"
          FROM "MissedGuessInput"
          GROUP BY "rawInput", "normalizedInput"
          ORDER BY "count" DESC, "lastSeenAt" DESC
          LIMIT 50
        `

    return NextResponse.json(
      {
        recent: recent.map(serializeRow),
        top: top.map((row) => ({
          rawInput: row.rawInput,
          normalizedInput: row.normalizedInput,
          count: Number(row.count),
          lastSeenAt: row.lastSeenAt.toISOString(),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (isMissingMissedGuessTableError(error)) {
      missedGuessTableCache = {
        checkedAt: Date.now(),
        exists: false,
      }
      return NextResponse.json({ recent: [], top: [], unavailable: true })
    }
    console.error('Unable to read missed guess inputs:', error)
    return NextResponse.json(
      { error: 'Missed guesses could not be loaded right now.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
