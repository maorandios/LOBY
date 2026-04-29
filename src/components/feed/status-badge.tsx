import { CircleCheckBig } from 'lucide-react'

import type { PostStatusHe } from '@/types/feed'
import { cn } from '@/lib/utils'

const CLOSED_UI_LABEL = 'סגור'

/** Text color per status; נסגר והוחלט merge visually as סגור (muted gray). */
const statusChipClass: Record<PostStatusHe, string> = {
  פתוח: 'text-neutral-800 dark:text-neutral-100',
  בטיפול: 'text-amber-950 dark:text-amber-50',
  נסגר: 'text-neutral-600 dark:text-neutral-300',
  הוחלט: 'text-neutral-600 dark:text-neutral-300',
}

/** `size-2` ÷ 1.25 (default 8px → 6.4px). */
const DOT_BOX = 'size-[calc(0.5rem/1.25)]'

const STATUS_ICON_SIZE = 'size-[calc(14px/1.25)]'

function statusDisplayText(status: PostStatusHe): string {
  if (status === 'נסגר' || status === 'הוחלט') return CLOSED_UI_LABEL
  return status
}

function BlinkDot({
  variant,
}: {
  variant: 'open' | 'in_progress'
}) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full animate-loby-status-dot-blink',
        DOT_BOX,
        variant === 'open' &&
          'bg-green-400 shadow-[0_0_5px_1px_rgba(74,222,128,0.75)] dark:bg-green-400 dark:shadow-[0_0_6px_1px_rgba(134,239,172,0.55)]',
        variant === 'in_progress' &&
          'bg-orange-400 shadow-[0_0_5px_1px_rgba(251,146,60,0.75)] dark:bg-orange-400 dark:shadow-[0_0_6px_1px_rgba(253,186,116,0.55)]',
      )}
      aria-hidden
    />
  )
}

/** Label only — no padding-inline-end so flex `gap` is the real space marker↔glyph. */
export function StatusLabel({ status }: { status: PostStatusHe }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full py-0 ps-3 pe-0 text-[0.75rem] font-semibold leading-none tracking-tight',
        statusChipClass[status],
      )}
    >
      {statusDisplayText(status)}
    </span>
  )
}

/** Blinking dot or check icon — sits between label and title. */
export function StatusMarker({ status }: { status: PostStatusHe }) {
  if (status === 'פתוח') {
    return (
      <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
        <BlinkDot variant="open" />
      </span>
    )
  }
  if (status === 'בטיפול') {
    return (
      <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
        <BlinkDot variant="in_progress" />
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        statusChipClass[status],
      )}
      aria-hidden
    >
      <CircleCheckBig
        className={cn(STATUS_ICON_SIZE, 'shrink-0')}
        strokeWidth={2}
      />
    </span>
  )
}

/** Compact label + marker only (no title). Uneven spacing vs title — prefer `StatusLabel` + `StatusMarker` in the card row. */
export function StatusBadge({ status }: { status: PostStatusHe }) {
  return (
    <span className="inline-flex items-center gap-1">
      <StatusLabel status={status} />
      <StatusMarker status={status} />
    </span>
  )
}
