import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BarChart3, MessageCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FeedPost } from '@/types/feed'
import { isPollPost } from '@/types/feed'

import { PollBlock } from '@/components/feed/poll-block'
import { cardAccentByType, typeBadgeClass } from '@/components/feed/post-type-styles'
import { StatusBadge } from '@/components/feed/status-badge'

type Props = {
  post: FeedPost
}

export function PostCard({ post }: Props) {
  const navigate = useNavigate()
  const isPoll = isPollPost(post)

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer gap-0 py-0 shadow-sm ring-black/5 transition hover:shadow-md dark:ring-white/10',
        cardAccentByType(post.type),
        isPoll && 'ring-1 ring-indigo-500/15'
      )}
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <CardContent className="space-y-3 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
          <Badge
            className={cn(
              'h-6 rounded-full px-2.5 text-[0.7rem] font-semibold',
              typeBadgeClass(post.type)
            )}
          >
            {post.type}
          </Badge>
          <StatusBadge status={post.status} />
          {post.type === 'דיווח' && (
            <AlertTriangle
              className="size-3.5 shrink-0 text-amber-600/90 dark:text-amber-400/90"
              aria-hidden
            />
          )}
          <span className="ms-auto tabular-nums text-muted-foreground">
            {post.relativeTime}
          </span>
        </div>

        <div>
          <h2 className="text-[1.05rem] leading-snug font-semibold tracking-tight text-foreground">
            {post.title}
          </h2>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/90">{post.author}</span>
            <span aria-hidden> | </span>
            <span>דירה {post.apartment}</span>
            {post.location && (
              <>
                <span aria-hidden> | </span>
                <span
                  className={cn(
                    post.type === 'דיווח' && 'font-medium text-amber-900/90 dark:text-amber-100'
                  )}
                >
                  {post.location}
                </span>
              </>
            )}
          </p>
        </div>

        {post.bodyPreview && (
          <p className="line-clamp-2 text-[0.9rem] leading-relaxed text-foreground/90">
            {post.bodyPreview}
            {post.bodyPreview.length > 90 && (
              <span className="ms-1 text-[0.75rem] font-medium text-primary/80">
                קרא עוד
              </span>
            )}
          </p>
        )}

        {post.hasImage && (
          <div
            className="h-36 w-full overflow-hidden rounded-xl bg-gradient-to-br from-neutral-200/90 via-neutral-100 to-neutral-300/80 ring-1 ring-black/5 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-900 dark:ring-white/10"
            aria-hidden
          />
        )}

        {isPoll && (
          <div
            className="rounded-xl border border-indigo-200/60 bg-white/70 p-3 dark:border-indigo-500/25 dark:bg-indigo-950/20"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <PollBlock postId={post.id} poll={post.poll} />
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-0 flex flex-wrap items-center gap-2 border-t border-border/60 bg-muted/40 py-3 text-[0.8rem] text-muted-foreground">
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1">
          <MessageCircle className="size-4" aria-hidden />
          {post.comments} תגובות
        </span>
        {post.views != null && (
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 tabular-nums">
            <BarChart3 className="size-4 opacity-70" aria-hidden />
            {post.views} צפיות
          </span>
        )}
        {isPoll && !post.poll.isClosed && (
          <span className="ms-auto inline-flex min-h-9 items-center rounded-full bg-indigo-600/10 px-3 text-[0.75rem] font-semibold text-indigo-900 dark:bg-indigo-400/15 dark:text-indigo-50">
            הצבעה פתוחה
          </span>
        )}
        {isPoll && post.poll.isClosed && (
          <span className="ms-auto inline-flex min-h-9 items-center rounded-full bg-muted px-3 text-[0.75rem] font-medium">
            הוחלט
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
