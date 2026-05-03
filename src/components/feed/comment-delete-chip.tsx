import { CircleX } from 'lucide-react'

import { COMMENT_GRAY_CHIP_BASE } from '@/components/feed/comment-shared'
import { cn } from '@/lib/utils'

type Props = {
  disabled?: boolean
  onClick: () => void
}

export function CommentDeleteChip({ disabled, onClick }: Props) {
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
        disabled && 'pointer-events-none opacity-60'
      )}
      aria-label="מחיקת תגובה"
    >
      <CircleX
        className="size-[0.744rem] shrink-0 opacity-90"
        strokeWidth={1.75}
        aria-hidden
      />
      מחיקת תגובה
    </button>
  )
}
