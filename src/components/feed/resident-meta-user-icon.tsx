import { CircleUserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Same nominal size as ShieldUser caption in {@link AuthorNameWithAdminBadge}; gray stroke. */
export function ResidentMetaUserIcon({
  className,
}: {
  className?: string
}) {
  return (
    <CircleUserRound
      className={cn(
        'inline-block size-[0.93rem] shrink-0 text-muted-foreground',
        className
      )}
      strokeWidth={2}
      aria-hidden
    />
  )
}
