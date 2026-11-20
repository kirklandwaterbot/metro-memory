import Link from 'next/link'
import { Suspense } from 'react'

import StandaloneSidebarNav from '@/components/StandaloneSidebarNav'
import { getAutomationAdminUser, isAutomationAdminConfigured } from '@/lib/adminAuth'
import { getCurrentUser } from '@/lib/auth'
import { loadUpcomingBoard } from '@/lib/upcomingBoard'

import UpcomingBoard from './UpcomingBoard'

export const metadata = {
  title: 'Upcoming stations | Metro Memory',
}

export const dynamic = 'force-dynamic'

export default async function UpcomingAdminPage() {
  const admin = await getAutomationAdminUser()

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="relative z-10 mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:pl-24">
        <Suspense fallback={null}>
          <StandaloneSidebarNav />
        </Suspense>
        {admin ? <UpcomingBoard initial={loadUpcomingBoard()} /> : <SignIn />}
      </div>
    </div>
  )
}

async function SignIn() {
  const user = await getCurrentUser()
  const message = !isAutomationAdminConfigured()
    ? 'Admin access is off. Set AUTOMATION_ADMIN_ALLOWED_EMAILS to turn it on.'
    : !user
      ? 'Sign in with an admin Metro Memory account to see upcoming stations.'
      : `${user.email} isn't on the admin list.`
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Upcoming stations</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{message}</p>
        {!user && (
          <Link
            href="/account"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  )
}
