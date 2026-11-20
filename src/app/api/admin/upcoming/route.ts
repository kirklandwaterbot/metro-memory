import { spawn } from 'child_process'
import path from 'path'

import { NextResponse } from 'next/server'

import { isAutomationAdminAuthenticated } from '@/lib/adminAuth'
import { loadUpcomingBoard, upcomingCanEdit } from '@/lib/upcomingBoard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SLUG = /^[a-z0-9-]+$/
const ID = /^[a-z]+:[\w/.-]+$/i
const LINE = /^[\w .-]+$/

function run(args: string[], timeoutMs: number): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), env: process.env })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const timer = setTimeout(() => child.kill(), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, out })
    })
  })
}

export async function GET() {
  if (!(await isAutomationAdminAuthenticated()))
    return NextResponse.json({ error: 'Not signed in as an admin.' }, { status: 403 })
  return NextResponse.json(loadUpcomingBoard())
}

/**
 * Body: { action: 'add' | 'ignore' | 'restore' | 'line', city, id, line? }
 *    or { action: 'check', city }   (re-research one city now)
 */
export async function POST(request: Request) {
  if (!(await isAutomationAdminAuthenticated()))
    return NextResponse.json({ error: 'Not signed in as an admin.' }, { status: 403 })
  if (!upcomingCanEdit())
    return NextResponse.json(
      { error: 'Changes can only be made from the local dev server (npm run dev).' },
      { status: 409 },
    )

  const body = (await request.json().catch(() => ({}))) as Record<string, string>
  const { action, city, id, line } = body
  if (!city || !SLUG.test(city)) return NextResponse.json({ error: 'Bad city.' }, { status: 400 })

  const scripts = path.join(process.cwd(), 'scripts', 'upcoming')
  let result: { code: number; out: string }
  if (action === 'check') {
    result = await run([path.join(scripts, 'run.js'), `--cities=${city}`, '--delay-ms=0'], 300_000)
  } else if (['add', 'ignore', 'restore', 'line'].includes(action)) {
    if (!id || !ID.test(id)) return NextResponse.json({ error: 'Bad station id.' }, { status: 400 })
    const args = [path.join(scripts, 'act.js'), `--city=${city}`, `--id=${id}`, `--action=${action}`]
    if (action === 'line') {
      if (!line || !LINE.test(line)) return NextResponse.json({ error: 'Bad line.' }, { status: 400 })
      args.push(`--line=${line}`)
    }
    result = await run(args, 120_000)
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }

  if (result.code !== 0) {
    const last = result.out.trim().split('\n').pop() || ''
    let message = last
    try {
      message = JSON.parse(last).error || last
    } catch {
      // plain text
    }
    return NextResponse.json({ error: message || 'Failed.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, board: loadUpcomingBoard() })
}
