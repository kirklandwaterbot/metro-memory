'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  MdAutorenew,
  MdDarkMode,
  MdHome,
  MdLaptopMac,
  MdLightMode,
  MdPerson,
  MdSettings,
} from 'react-icons/md'

const NAV_ITEMS = [
  {
    href: '/?tab=cities',
    label: 'Home',
    icon: MdHome,
    match: (pathname: string) => pathname === '/',
  },
  {
    href: '/account',
    label: 'Account',
    icon: MdPerson,
    match: (pathname: string) => pathname === '/account',
  },
  {
    href: '/?tab=settings',
    label: 'Settings',
    icon: MdSettings,
    match: (pathname: string, search: string) =>
      pathname === '/' && new URLSearchParams(search).get('tab') === 'settings',
  },
  {
    href: '/admin/upcoming',
    label: 'Upcoming',
    icon: MdAutorenew,
    match: (pathname: string) => pathname.startsWith('/admin/upcoming'),
  },
] as const

const THEME_ITEMS = [
  { value: 'light', label: 'Light theme', icon: MdLightMode },
  { value: 'dark', label: 'Dark theme', icon: MdDarkMode },
  { value: 'system', label: 'System theme', icon: MdLaptopMac },
] as const

type SidebarTooltipState = {
  label: string
  top: number
}

export default function StandaloneSidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarTooltip, setSidebarTooltip] = useState<SidebarTooltipState | null>(null)
  const search = searchParams?.toString() || ''
  const currentTheme = mounted ? theme ?? 'system' : 'system'
  const currentThemeIndex = THEME_ITEMS.findIndex((item) => item.value === currentTheme)
  const normalizedThemeIndex = currentThemeIndex >= 0 ? currentThemeIndex : 0
  const activeThemeItem = THEME_ITEMS[normalizedThemeIndex]
  const nextThemeItem = THEME_ITEMS[(normalizedThemeIndex + 1) % THEME_ITEMS.length]
  const ActiveThemeIcon = activeThemeItem.icon

  useEffect(() => {
    setMounted(true)
  }, [])

  const showSidebarTooltip = useCallback((label: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setSidebarTooltip({
      label,
      top: rect.top + rect.height / 2,
    })
  }, [])

  const hideSidebarTooltip = useCallback(() => {
    setSidebarTooltip((current) => (current ? null : current))
  }, [])

  return (
    <>
      {sidebarTooltip ? (
        <div
          className="pointer-events-none fixed left-24 z-[70] hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-lg ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100 dark:ring-white/10 lg:block"
          style={{ top: sidebarTooltip.top }}
          role="tooltip"
        >
          {sidebarTooltip.label}
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-20 border-r border-zinc-200 bg-white/80 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 lg:flex">
        <div className="flex h-full w-full min-h-0 flex-col items-center">
          <div className="flex-1 overflow-y-auto overflow-x-visible px-2">
            <div className="flex flex-col items-center gap-4 pb-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.match(pathname, search)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isActive
                        ? 'bg-[var(--accent-600)] text-white shadow-md hover:bg-[var(--accent-700)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                    aria-label={item.label}
                    title={item.label}
                    onMouseEnter={(event) => showSidebarTooltip(item.label, event.currentTarget)}
                    onMouseLeave={hideSidebarTooltip}
                    onFocus={(event) => showSidebarTooltip(item.label, event.currentTarget)}
                    onBlur={hideSidebarTooltip}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="mx-auto h-px w-10 bg-zinc-200 dark:bg-zinc-800" />

            <button
              type="button"
              onClick={() => setTheme(nextThemeItem.value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-md transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              aria-label={mounted ? `Switch to ${nextThemeItem.label.toLowerCase()}` : 'Cycle theme'}
              title={mounted ? activeThemeItem.label : 'Theme'}
              onMouseEnter={(event) =>
                showSidebarTooltip(
                  mounted
                    ? `${activeThemeItem.label} - next ${nextThemeItem.label.toLowerCase()}`
                    : 'Theme',
                  event.currentTarget,
                )
              }
              onMouseLeave={hideSidebarTooltip}
              onFocus={(event) =>
                showSidebarTooltip(
                  mounted
                    ? `${activeThemeItem.label} - next ${nextThemeItem.label.toLowerCase()}`
                    : 'Theme',
                  event.currentTarget,
                )
              }
              onBlur={hideSidebarTooltip}
            >
              <ActiveThemeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
