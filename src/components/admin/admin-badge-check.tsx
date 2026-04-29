import { BadgeCheck } from 'lucide-react'

import { POST_CREATE_BUTTON_HEX } from '@/components/feed/post-type-styles'
import { cn } from '@/lib/utils'

/** Lucide `badge-check` (brand accent red) for admin-only labels. */
export function AdminBadgeCheck({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn('size-4 shrink-0', className)}
      style={{ color: POST_CREATE_BUTTON_HEX }}
      strokeWidth={2}
      aria-hidden
    />
  )
}
