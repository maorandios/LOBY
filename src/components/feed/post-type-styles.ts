import type { PostTypeHe } from '@/types/feed'
import { cn } from '@/lib/utils'

export function cardAccentByType(type: PostTypeHe) {
  return cn(
    'shadow-sm transition-colors',
    type === 'דיווח' &&
      'border-s-[3px] border-amber-500/80 bg-amber-50/45 dark:border-amber-500/60 dark:bg-amber-950/25',
    type === 'הצבעה' &&
      'border-s-[3px] border-indigo-500/75 bg-indigo-50/50 dark:border-indigo-400/70 dark:bg-indigo-950/30',
    type === 'עדכון' &&
      'border-s-[3px] border-neutral-300 bg-card dark:border-neutral-600',
    type === 'בקשה' &&
      'border-s-[3px] border-emerald-600/55 bg-emerald-50/40 dark:border-emerald-500/55 dark:bg-emerald-950/20'
  )
}

export function typeBadgeClass(type: PostTypeHe) {
  switch (type) {
    case 'דיווח':
      return 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-50'
    case 'הצבעה':
      return 'bg-indigo-100 text-indigo-950 dark:bg-indigo-900/50 dark:text-indigo-50'
    case 'עדכון':
      return 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
    case 'בקשה':
      return 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-50'
    default:
      return ''
  }
}
