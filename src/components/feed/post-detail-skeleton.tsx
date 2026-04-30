import { Skeleton } from '@/components/ui/skeleton'

function CommentSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
      <Skeleton className="mb-3 h-3 w-[55%]" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-[92%]" />
    </div>
  )
}

export function PostDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="טוען פוסט">
      <div className="rounded-2xl border border-border/50 bg-card/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-3.5 w-[60%]" />
          <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-5 w-[88%]" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-[75%]" />
        <div className="mt-4 flex justify-end gap-2">
          <Skeleton className="h-10 w-[5.5rem] rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-3">
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
        <Skeleton className="h-[88px] w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  )
}
