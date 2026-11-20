import { Suspense } from 'react'

import StandaloneSidebarNav from '@/components/StandaloneSidebarNav'
import { getAutomationAdminUser, isAutomationAdminConfigured } from '@/lib/adminAuth'
import { getCurrentUser } from '@/lib/auth'
import { loadUpcomingBoard } from '@/lib/upcomingBoard'

import UpcomingBoard from './UpcomingBoard'
import UpcomingSignIn from './UpcomingSignIn'

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
  const reason = !isAutomationAdminConfigured() ? 'off' : !user ? 'signed-out' : 'not-admin'
  return <UpcomingSignIn reason={reason} email={user?.email} />
}
