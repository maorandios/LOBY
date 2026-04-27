import type { PostTypeHe } from '@/types/feed'
import { cn } from '@/lib/utils'

export function cardAccentByType(_type: PostTypeHe) {
  return cn(
    'rounded-3xl bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.45)]'
  )
}

export function typeBadgeClass(type: PostTypeHe) {
  switch (type) {
    case 'דיווח':
      return 'bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-50'
    case 'הצבעה':
      return 'bg-indigo-500/15 text-indigo-950 dark:bg-indigo-400/20 dark:text-indigo-50'
    case 'עדכון':
      return 'bg-neutral-500/12 text-neutral-900 dark:bg-neutral-400/15 dark:text-neutral-100'
    case 'בקשה':
      return 'bg-emerald-500/15 text-emerald-950 dark:bg-emerald-400/18 dark:text-emerald-50'
    default:
      return ''
  }
}
