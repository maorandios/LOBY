import {
  BadgeCheck,
  CircleDot,
  Lock,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { PostStatusHe } from '@/types/feed'
import { cn } from '@/lib/utils'

/** Text color per status; no fill, no border. */
const statusChipClass: Record<PostStatusHe, string> = {
  פתוח: 'text-neutral-800 dark:text-neutral-100',
  בטיפול: 'text-amber-950 dark:text-amber-50',
  נסגר: 'text-neutral-600 dark:text-neutral-300',
  הוחלט: 'text-emerald-900 dark:text-emerald-50',
}

const statusLucideIcon: Record<PostStatusHe, LucideIcon> = {
  פתוח: CircleDot,
  בטיפול: Wrench,
  נסגר: Lock,
  הוחלט: BadgeCheck,
}

export function StatusBadge({ status }: { status: PostStatusHe }) {
  const Icon = statusLucideIcon[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-tight',
        statusChipClass[status]
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      {status}
    </span>
  )
}
