import {
  BadgeCheck,
  CircleDot,
  Lock,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { PostStatusHe } from '@/types/feed'
import { cn } from '@/lib/utils'

const statusChipClass: Record<PostStatusHe, string> = {
  פתוח: 'bg-neutral-500/12 text-neutral-800 dark:bg-neutral-400/15 dark:text-neutral-100',
  בטיפול:
    'bg-amber-500/15 text-amber-950 dark:bg-amber-400/18 dark:text-amber-50',
  נסגר: 'bg-neutral-500/10 text-neutral-600 dark:bg-neutral-500/15 dark:text-neutral-300',
  הוחלט:
    'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/18 dark:text-emerald-50',
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
