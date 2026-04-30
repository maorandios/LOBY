import { Heart } from 'lucide-react'

import { cn } from '@/lib/utils'

/** On canvas above a pinned feed/post — «לב» replaced by a heart outline. */
export function PinnedPostNotice({ className }: { className?: string }) {
  return (
    <p
      dir="rtl"
      lang="he"
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-2 text-center text-[1.016rem] font-medium leading-snug tracking-tight text-muted-foreground sm:text-[1.094rem]',
        className
      )}
      role="note"
    >
      <span className="shrink-0">שימו</span>
      <Heart
        className="size-[1em] shrink-0 fill-transparent stroke-current"
        strokeWidth={2}
        aria-hidden
      />
      <span className="min-w-0 shrink">דיירי הבניין לפוסט הבא</span>
    </p>
  )
}
