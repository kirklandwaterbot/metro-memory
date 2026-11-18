'use client'

import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import type { IconType } from 'react-icons'

/**
 * Round map-toolbar button (same look as the theme button) whose label slides
 * out on hover and which opens a small panel underneath when clicked.
 */
export default function ToolbarPopoverButton({
  icon: Icon,
  label,
  children,
  panelClassName = 'w-80',
}: {
  icon: IconType
  label: string
  children: ReactNode
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={label}
        className={`group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full px-3 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${
          open
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="pointer-events-none hidden max-w-0 shrink-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100 lg:inline-block">
          {label}
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          className={`absolute right-0 top-full z-[60] mt-2 max-h-[70vh] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700 ${panelClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
