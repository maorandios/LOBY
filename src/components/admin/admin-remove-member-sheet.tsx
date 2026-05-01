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

/* Sheet mount/animation + ref mirrors match {@link DeleteAccountSheet}; eslint ref/update rules conflict with that pattern. */
/* eslint-disable react-hooks/refs -- busy/onOpenChange refs for escape + backdrop without stale closures */
/* eslint-disable react-hooks/set-state-in-effect -- controlled enter/exit mount sequencing for the portal */

const SHEET_TRANSITION_MS = 320
const ADMIN_MENU_ICON_STROKE = 2 as const

const DESTRUCTIVE_CONFIRM_ROW = cn(
  'flex h-auto min-h-[4.25rem] w-full touch-manipulation items-center gap-3 rounded-2xl border px-3 py-3 text-start shadow-none',
  'border-[#FF0019] bg-[#FFDEE5] text-[#FF0019]',
  'hover:bg-[#fccede] hover:text-[#FF0019]',
  'dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  'dark:hover:bg-rose-950/65 dark:hover:text-rose-200'
)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy: boolean
  error: string | null
  displayName: string
  /** e.g. "39" or "—" */
  apartmentLabel: string
  onConfirmRemove: () => void | Promise<void>
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

/** Bottom sheet — same interaction pattern as {@link DeleteAccountSheet} for removing a member from the building. */
export function AdminRemoveMemberSheet({
  open,
  onOpenChange,
  busy,
  error,
  displayName,
  apartmentLabel,
  onConfirmRemove,
}: Props) {
  const busyRef = useRef(busy)
  busyRef.current = busy
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

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
      data-loby-admin-remove-member-sheet=""
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
        aria-labelledby="admin-remove-member-sheet-title"
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
                id="admin-remove-member-sheet-title"
                className="font-heading text-lg font-medium text-foreground"
              >
                הסרת דייר
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
                strokeWidth={ADMIN_MENU_ICON_STROKE}
                aria-hidden
              />
            </Button>
          </div>

          <div className="mt-10 flex flex-col gap-5 px-4 pb-5 pt-0">
            {error ? (
              <p
                className="rounded-xl bg-destructive/10 px-3 py-2 text-start text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <p className="text-start text-[0.9375rem] leading-relaxed text-foreground">
              להסיר את <span className="font-semibold">{displayName}</span>
              {apartmentLabel !== '—' ? (
                <>
                  {' '}
                  (דירה {apartmentLabel})
                </>
              ) : null}
              ? הדייר יוסר מהבניין ולא יוכל לצפות בפיד או בפעילות הבניין עד להצטרפות מחדש עם קישור
              הזמנה.
            </p>

            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className={cn(
                DESTRUCTIVE_CONFIRM_ROW,
                'flex items-center justify-center gap-2 px-5 py-4 text-base font-semibold'
              )}
              onClick={() => void onConfirmRemove()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                  מסירים…
                </>
              ) : (
                'הסר מהבניין'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
