import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function PostCardSkeleton() {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 overflow-hidden rounded-3xl border border-border/50 bg-white/20 p-5 dark:bg-card/20',
        'shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-[58%] max-w-xs" />
          <Skeleton className="h-3 w-[40%] max-w-[10rem]" />
        </div>
        <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-[82%] max-w-sm" />
      <div className="mt-1 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
      </div>
    </div>
  )
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-2" aria-busy="true" aria-label="טוען פוסטים">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <PostCardSkeleton />
        </li>
      ))}
    </ul>
  )
}
