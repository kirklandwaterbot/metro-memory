'use client'

import Link from 'next/link'

import useTranslation from '@/hooks/useTranslation'

export default function UpcomingSignIn({
  reason,
  email,
}: {
  reason: 'off' | 'signed-out' | 'not-admin'
  email?: string | null
}) {
  const { t } = useTranslation()
  const message =
    reason === 'off'
      ? t('upcomingAdminOff')
      : reason === 'signed-out'
        ? t('upcomingSignInPrompt')
        : String(t('upcomingNotAdmin')).replace('{email}', email || '')

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t('upcomingTitle')}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{message}</p>
        {reason === 'signed-out' && (
          <Link
            href="/account"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t('upcomingSignIn')}
          </Link>
        )}
      </div>
    </div>
  )
}
