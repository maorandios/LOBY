import { cn } from '@/lib/utils'
import type { FeedFilterId } from '@/types/feed'

const FILTERS: FeedFilterId[] = [
  'הכל',
  'דיווחים',
  'הצבעות',
  'עדכונים',
  'בקשות',
]

type Props = {
  value: FeedFilterId
  onChange: (next: FeedFilterId) => void
  className?: string
}

export function FilterChips({ value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      role="tablist"
      aria-label="סינון פוסטים"
    >
      {FILTERS.map((id) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'min-h-10 shrink-0 touch-manipulation rounded-full border px-4 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border/80 bg-background/80 text-foreground/80 hover:bg-muted/80'
            )}
          >
            {id}
          </button>
        )
      })}
    </div>
  )
}
