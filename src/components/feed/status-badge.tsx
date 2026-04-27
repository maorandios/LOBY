import { Badge } from '@/components/ui/badge'
import type { PostStatusHe } from '@/types/feed'
import { cn } from '@/lib/utils'

const statusClass: Record<PostStatusHe, string> = {
  פתוח: 'border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
  בטיפול:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
  נסגר:
    'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
  הוחלט:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100',
}

export function StatusBadge({ status }: { status: PostStatusHe }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 rounded-full px-2.5 text-[0.7rem] font-medium',
        statusClass[status]
      )}
    >
      {status}
    </Badge>
  )
}
