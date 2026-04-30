import { CornerLeftDown, CornerRightDown, Heart } from 'lucide-react'

import { cn } from '@/lib/utils'

/** On canvas above a pinned feed/post — corner icons hint toward the post below. */
export function PinnedPostNotice({ className }: { className?: string }) {
  return (
    <p
      dir="rtl"
      lang="he"
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 text-center text-[1.016rem] font-medium leading-snug tracking-tight text-muted-foreground sm:text-[1.094rem]',
        className
      )}
      role="note"
    >
      <CornerRightDown
        className="size-[1em] shrink-0 text-muted-foreground opacity-90"
        strokeWidth={2}
        aria-hidden
      />
      <span className="inline-flex min-w-0 flex-wrap items-center justify-center gap-x-1.5">
        <span className="shrink-0">כל הדיירים שימו</span>
        <span className="inline-flex items-center" title="לב">
          <Heart
            className="size-[1em] shrink-0 fill-transparent stroke-current"
            strokeWidth={2}
            aria-hidden
          />
          <span className="sr-only">לב</span>
        </span>
        <span className="shrink-0">לפוסט הבא</span>
      </span>
      <CornerLeftDown
        className="size-[1em] shrink-0 text-muted-foreground opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    </p>
  )
}
