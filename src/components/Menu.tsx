'use client'

import useTranslation from '@/hooks/useTranslation'
import { Menu, Transition } from '@headlessui/react'
import classNames from 'classnames'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import AboutModal from './AboutModal'
import MenuIcon from './MenuIcon'

const MENU_TOGGLE_EVENT = 'metro-memory:menu-toggle'

export default function MenuComponent({
  setHideLabels,
  hideLabels,
  onRevealSolutions,
  foundProportion,
  onOpenSettings,
  onOpenCityStats,
  onOpenAccount,
  onOpenPrivacy,
  onOpenMissedGuessInputs,
  showMissedGuessInputs,
  zenMode,
  onToggleZen,
  showSatellite,
  onToggleSatellite,
  showMapNames,
  onToggleMapNames,
  achievementsHref = '/?tab=achievements',
}: {
  hideLabels: boolean
  setHideLabels: (hide: boolean) => void
  onRevealSolutions: () => void
  foundProportion: number
  onOpenSettings?: () => void
  onOpenCityStats?: () => void
  onOpenAccount?: () => void
  onOpenPrivacy?: () => void
  onOpenMissedGuessInputs?: () => void
  showMissedGuessInputs?: boolean
  zenMode?: boolean
  onToggleZen?: () => void
  showSatellite: boolean
  onToggleSatellite: () => void
  showMapNames: boolean
  onToggleMapNames: () => void
  achievementsHref?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { t } = useTranslation()
  const getLabel = (key: string, fallback: string) => {
    const value = t(key)
    return typeof value === 'string' && value.trim() && value !== key ? value : fallback
  }
  const menuButtonLabel = getLabel('menuButtonLabel', 'Menu')
  const showSolutionsDisabled = foundProportion >= 1
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Avoid server/client useId mismatches from Headless UI during SSR.
    return null
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          className="group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-lg outline-none ring-zinc-800 transition hover:bg-gray-50 focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          aria-label={menuButtonLabel}
          title={menuButtonLabel}
          onClick={() => {
            window.dispatchEvent(new Event(MENU_TOGGLE_EVENT))
          }}
        >
          <MenuIcon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="pointer-events-none inline-block max-w-0 shrink-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100">
            {menuButtonLabel}
          </span>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-white/10">
          <div className="py-1">
            <Menu.Item>
              {({ active }) =>
                onOpenSettings ? (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onOpenSettings}
                  >
                    {t('settings')}
                  </button>
                ) : (
                  <Link
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    href="/?tab=settings"
                  >
                    {t('settings')}
                  </Link>
                )
              }
            </Menu.Item>
            <Menu.Item disabled={showSolutionsDisabled}>
              {({ active, disabled }) => (
                <button
                  type="button"
                  className={classNames(
                    'block w-full px-4 py-2 text-left text-sm transition',
                    disabled
                      ? 'cursor-not-allowed opacity-60 text-gray-500 dark:text-zinc-400'
                      : active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                  )}
                  onClick={() => {
                    if (!disabled) {
                      onRevealSolutions()
                    }
                  }}
                  disabled={disabled}
                  title={
                    disabled ? 'You already found all the stations!' : undefined
                  }
                >
                  {t('showSolutions')}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  onClick={onToggleSatellite}
                >
                  {showSatellite
                    ? getLabel('hideSatelliteMenu', 'Hide satellite')
                    : getLabel('showSatelliteMenu', 'Show satellite')}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  onClick={onToggleMapNames}
                >
                  {showMapNames
                    ? getLabel('hideMapNamesMenu', 'Hide map names')
                    : getLabel('showMapNamesMenu', 'Show map names')}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  onClick={() => setHideLabels(!hideLabels)}
                >
                  {hideLabels ? t('showLabels') : t('hideLabels')}
                </button>
              )}
            </Menu.Item>
            {onOpenCityStats && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onOpenCityStats}
                  >
                    {t('cityStats')}
                  </button>
                )}
              </Menu.Item>
            )}
            <Menu.Item>
              {({ active }) => (
                <Link
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  href={achievementsHref}
                >
                  {t('tabAchievements')}
                </Link>
              )}
            </Menu.Item>
            {showMissedGuessInputs && onOpenMissedGuessInputs && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onOpenMissedGuessInputs}
                >
                    {getLabel('seeMissedGuessInputs', 'See missed guess inputs')}
                  </button>
                )}
              </Menu.Item>
            )}
            <Menu.Item>
              {({ active }) => (
                <button
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  onClick={() => setModalOpen(true)}
                >
                  {t('about')}
                </button>
              )}
            </Menu.Item>
            {onToggleZen && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onToggleZen}
                  >
                    {zenMode
                      ? getLabel('exitZenMode', 'Exit Zen Mode')
                      : getLabel('enterZenMode', 'Enter Zen Mode')}
                  </button>
                )}
              </Menu.Item>
            )}
            <Menu.Item>
              {({ active }) =>
                onOpenAccount ? (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onOpenAccount}
                  >
                    {t('account')}
                  </button>
                ) : (
                  <Link
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    href="/?tab=account"
                  >
                    {t('account')}
                  </Link>
                )
              }
            </Menu.Item>
            <Menu.Item>
              {({ active }) =>
                onOpenPrivacy ? (
                  <button
                    type="button"
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    onClick={onOpenPrivacy}
                  >
                    {t('privacy')}
                  </button>
                ) : (
                  <Link
                    className={classNames(
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-gray-700 dark:text-zinc-100',
                      'block w-full px-4 py-2 text-left text-sm transition',
                    )}
                    href="/?tab=privacy"
                  >
                    {t('privacy')}
                  </Link>
                )
              }
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-gray-700 dark:text-zinc-100',
                    'block w-full px-4 py-2 text-left text-sm transition',
                  )}
                  href="/"
                >
                  {t('goToMain')}
                </Link>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
      <AboutModal open={modalOpen} setOpen={setModalOpen} />
    </Menu>
  )
}
