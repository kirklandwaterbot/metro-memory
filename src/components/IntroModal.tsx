import { Fragment, useEffect } from 'react'
import { Transition } from '@headlessui/react'

export default function IntroModal({
  open,
  setOpen,
  inputRef,
  children,
}: {
  open?: boolean
  setOpen: (open: boolean) => void
  inputRef: React.RefObject<HTMLInputElement>
  children: React.ReactNode
}) {
  // Focus the station input when the intro opens. This used to run on every
  // render, which pulled focus (and typing) away from other fields such as
  // "Search found stations" whenever the game page re-rendered.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement as HTMLElement | null
    const typingElsewhere =
      active &&
      active !== inputRef.current &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable)
    if (!typingElsewhere) inputRef.current?.focus()
  }, [open, inputRef])

  return (
    <Transition.Root show={!!open} as={Fragment}>
      <div className="relative z-30 font-sans" onClick={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-700 bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left font-sans text-white transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <p className="text-2xl">{children}</p>
              </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition.Root>
  )
}
