import Link from 'next/link'
import DevNotFoundAutoRetry from '@/components/DevNotFoundAutoRetry'

// Catches URLs that no route group handles (otherwise Next shows its bare
// default 404). In dev it reloads automatically, like the website 404 page.
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <DevNotFoundAutoRetry />
      <div className="flex flex-col items-center text-center">
        <p className="text-base font-semibold text-zinc-400 dark:text-zinc-500">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Go back home
        </Link>
      </div>
    </main>
  )
}
