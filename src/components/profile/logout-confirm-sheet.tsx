import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Loader2, MoveLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Keep in sync with delete-account-sheet / create-post-sheet. */
const SHEET_TRANSITION_MS = 320
const MENU_ICON_STROKE = 2 as const

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy: boolean
  onConfirmLogout: () => void | Promise<void>
}

function consumeGhostPointerAfterBackdropClose() {
  const block = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  window.setTimeout(() => {
    window.addEventListener('pointerdown', block, { capture: true, once: true })
    window.addEventListener('pointerup', block, { capture: true, once: true })
    window.addEventListener('click', block, { capture: true, once: true })
  }, 0)
}

/** Bottom sheet — confirm disconnect / logout. */
export function LogoutConfirmSheet({
  open,
  onOpenChange,
  busy,
  onConfirmLogout,
}: Props) {
  const busyRef = useRef(busy)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  /* Sheet mount/exit timing — same as delete-account-sheet (exit animation after unmount delay). */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (open) {
      setMounted(true)
      setEntered(false)
      const rf = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setEntered(true))
      )
      return () => window.cancelAnimationFrame(rf)
    }

    setEntered(false)
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false)
      closeTimerRef.current = null
    }, SHEET_TRANSITION_MS)

    return undefined
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (busyRef.current) return
      e.preventDefault()
      onOpenChangeRef.current(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mounted])

  function closeBackdrop() {
    if (busyRef.current) return
    onOpenChange(false)
    consumeGhostPointerAfterBackdropClose()
  }

  function backdropPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (busyRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target !== e.currentTarget) return
    e.stopPropagation()
    closeBackdrop()
  }

  if (!mounted) return null

  return createPortal(
    <div
      data-loby-logout-sheet=""
      className="fixed inset-0 z-[2147483000]"
      style={{ isolation: 'isolate' }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 z-0 bg-black/[0.58] backdrop-blur-md backdrop-saturate-75 [-webkit-backdrop-filter:blur(12px)]',
          'transition-[opacity,backdrop-filter] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          'motion-reduce:transition-opacity motion-reduce:duration-[200ms]',
          entered ? 'opacity-100' : 'opacity-0'
        )}
        onPointerDown={backdropPointerDown}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-sheet-title"
        dir="rtl"
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-popover shadow-lg',
          'max-h-[min(92vh,100dvh)]',
          'transform-gpu will-change-transform',
          'transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'motion-reduce:transition-transform motion-reduce:duration-[200ms]',
          entered ? 'translate-y-0' : 'translate-y-[105%]'
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 w-full flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[max(env(safe-area-inset-top,0px),0.75rem)] text-sm text-popover-foreground">
          <div className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-4 pb-1 pt-4">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
              <span
                id="logout-sheet-title"
                className="font-heading text-lg font-medium text-foreground"
              >
                האם לנתק אתכם מהאפליקציה?
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="סגירה"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              <MoveLeft
                className="size-5"
                strokeWidth={MENU_ICON_STROKE}
                aria-hidden
              />
            </Button>
          </div>

          <div className="mt-10 flex flex-col gap-5 px-4 pb-5 pt-0">
            <Button
              type="button"
              variant="default"
              disabled={busy}
              className="inline-flex h-auto min-h-[3.25rem] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold shadow-none"
              onClick={() => void onConfirmLogout()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                  מתנתקים…
                </>
              ) : (
                'רוצה להתנתק'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
