'use client'

import classNames from 'classnames'
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import { useAuth } from '@/context/AuthContext'

type CollapsibleSectionProps = {
  sectionId: string
  title: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  headingClassName?: string
  contentClassName?: string
  /**
   * Open or close the section from outside (an "Expand all" / "Collapse all"
   * button). Applied whenever `nonce` changes; the caller saves the account
   * preference for all sections in one request.
   */
  command?: { open: boolean; nonce: number } | null
}

const STORAGE_PREFIX = 'metro-memory:section:'

function ArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
      aria-hidden
    >
      {direction === 'up' ? (
        <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export default function CollapsibleSection({
  sectionId,
  title,
  defaultOpen = true,
  children,
  titleAs = 'h2',
  className,
  headingClassName,
  contentClassName,
  command,
}: CollapsibleSectionProps) {
  const { user, uiPreferences, setCollapsedSectionPreference } = useAuth()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const userTogglePendingRef = useRef(false)
  const baseId = useMemo(
    () => (sectionId ? sectionId.replace(/[^a-zA-Z0-9_-]/g, '-') : 'section'),
    [sectionId],
  )
  const titleId = `${baseId}-title`
  const contentId = `${baseId}-content`
  const HeadingTag = titleAs

  const storageKey = useMemo(() => `${STORAGE_PREFIX}${sectionId}`, [sectionId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedValue = window.localStorage.getItem(storageKey)
    if (storedValue === 'true' || storedValue === 'false') {
      setIsOpen(storedValue !== 'true')
    }
  }, [storageKey])

  useEffect(() => {
    const collapsed = uiPreferences.collapsedSections?.[sectionId]
    if (typeof collapsed === 'boolean') {
      setIsOpen(!collapsed)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, collapsed ? 'true' : 'false')
      }
    }
  }, [sectionId, storageKey, uiPreferences])

  useEffect(() => {
    if (!command) return
    setIsOpen(command.open)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, command.open ? 'false' : 'true')
    }
    // `command` is a fresh object per Expand/Collapse click, so this only
    // re-runs on a new command, not on the section's own toggles.
  }, [command, storageKey])

  const toggleSection = useCallback(() => {
    userTogglePendingRef.current = true
    setIsOpen((prev) => {
      const nextOpen = !prev
      const collapsed = !nextOpen
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, collapsed ? 'true' : 'false')
      }
      return nextOpen
    })
  }, [storageKey])

  useEffect(() => {
    if (!user) {
      userTogglePendingRef.current = false
      return
    }
    if (!userTogglePendingRef.current) return

    userTogglePendingRef.current = false
    void setCollapsedSectionPreference(sectionId, !isOpen)
  }, [isOpen, sectionId, setCollapsedSectionPreference, user])

  return (
    <section
      id={baseId}
      className={classNames('scroll-mt-28', className)}
      aria-labelledby={titleId}
    >
      <HeadingTag
        id={titleId}
        className={
          headingClassName ??
          'mt-12 text-4xl font-bold text-zinc-900 dark:text-zinc-100'
        }
      >
        <button
          type="button"
          onClick={toggleSection}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>{title}</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white">
            <ArrowIcon direction={isOpen ? 'down' : 'up'} />
          </span>
        </button>
      </HeadingTag>
      <div
        id={contentId}
        aria-hidden={!isOpen}
        className={classNames(contentClassName ?? 'mt-6', {
          hidden: !isOpen,
        })}
      >
        {children}
      </div>
    </section>
  )
}
