import { CircleX } from 'lucide-react'

import { COMMENT_GRAY_CHIP_BASE } from '@/components/feed/comment-shared'
import { cn } from '@/lib/utils'

type Props = {
  disabled?: boolean
  onClick: () => void
  /** Tighter pill in the comment meta row (next to the timestamp). */
  compact?: boolean
}

export function CommentDeleteChip({ disabled, onClick, compact }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        COMMENT_GRAY_CHIP_BASE,
        'shrink-0 touch-manipulation',
        compact && 'py-[3px] text-[0.55rem]',
        disabled && 'pointer-events-none opacity-60'
      )}
      aria-label="מחיקת תגובה"
    >
      <CircleX
        className={cn(
          'shrink-0 opacity-90',
          compact ? 'size-[0.65rem]' : 'size-[0.744rem]'
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      מחיקת תגובה
    </button>
  )
}
