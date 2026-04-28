import { BadgeCheck } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Lucide `badge-check` at brand blue for admin-only labels. */
export function AdminBadgeCheck({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn(
        'size-4 shrink-0 text-[#0077FF]',
        className
      )}
      strokeWidth={2}
      aria-hidden
    />
  )
}
