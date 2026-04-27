import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Heart, MessageCircle, Vote } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PollBlock } from '@/components/feed/poll-block'
import {
  cardAccentByType,
  postTypeChipLabel,
  postTypeLucideIcon,
  typeBadgeClass,
} from '@/components/feed/post-type-styles'
import { StatusBadge } from '@/components/feed/status-badge'
import { cn } from '@/lib/utils'
import { isPollPost, type FeedPost } from '@/types/feed'

const CHIP =
  'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-tight'

type Props = {
  post: FeedPost
}

export function PostCard({ post }: Props) {
  const navigate = useNavigate()
  const isPoll = isPollPost(post)
  const [liked, setLiked] = useState(false)

  function goToPost() {
    navigate(`/post/${post.id}`)
  }

  const TypeIcon = postTypeLucideIcon[post.type]

  const residentMeta = (
    <>
      <span className="font-semibold text-foreground">{post.author}</span>
      <span aria-hidden className="text-muted-foreground/80">
        {' '}
        ·{' '}
      </span>
      <span className="text-muted-foreground">דירה {post.apartment}</span>
      <span aria-hidden className="text-muted-foreground/80">
        {' '}
        ·{' '}
      </span>
      <span className="tabular-nums text-muted-foreground">
        {post.relativeTime}
      </span>
    </>
  )

  return (
    <article
      className={cn(
        'cursor-pointer touch-manipulation overflow-hidden p-4 transition-[box-shadow,transform] duration-200',
        'hover:-translate-y-px hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]',
        cardAccentByType(post.type)
      )}
      onClick={goToPost}
    >
      {/* RTL: first child → physical right; second → physical left */}
      <div className="flex w-full items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-start text-[0.8rem] leading-snug text-foreground">
          {residentMeta}
        </p>
        <span
          className={cn(
            CHIP,
            'shrink-0 text-foreground',
            typeBadgeClass(post.type)
          )}
        >
          <TypeIcon className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          {postTypeChipLabel(post.type)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <h2 className="text-[1.06rem] leading-snug font-semibold tracking-tight text-foreground">
          {post.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          {isPoll && !post.poll.isClosed && (
            <span
              className={cn(
                CHIP,
                'bg-indigo-500/15 text-indigo-900 dark:text-indigo-100'
              )}
            >
              <Vote className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              הצבעה פתוחה
            </span>
          )}
          {isPoll && post.poll.isClosed && (
            <span className={cn(CHIP, 'bg-muted text-muted-foreground')}>
              <CheckCircle2 className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              הוחלט
            </span>
          )}
        </div>
        {post.location && (
          <p
            className={cn(
              'text-[0.85rem] leading-relaxed text-muted-foreground',
              post.type === 'דיווח' &&
                'font-medium text-amber-900/85 dark:text-amber-100'
            )}
          >
            {post.location}
          </p>
        )}
      </div>

      {post.bodyPreview && (
        <p className="mt-3 line-clamp-2 text-[0.9rem] leading-relaxed text-foreground/90">
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
          className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-muted"
          aria-hidden
        />
      )}

      {isPoll && (
        <div
          className="mt-4 rounded-2xl bg-muted/45 p-3 dark:bg-muted/25"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <PollBlock postId={post.id} poll={post.poll} />
        </div>
      )}

      <div
        className="mt-4 flex gap-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="secondary"
          className="h-10 flex-1 rounded-full gap-2 font-semibold shadow-none"
          onClick={() => navigate(`/post/${post.id}`)}
        >
          <MessageCircle className="size-4" aria-hidden />
          תגובה
        </Button>
        <Button
          type="button"
          variant={liked ? 'default' : 'secondary'}
          className={cn(
            'h-10 flex-1 rounded-full gap-2 font-semibold shadow-none',
            liked && 'bg-rose-600 text-white hover:bg-rose-600/90 dark:bg-rose-600'
          )}
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
        >
          <Heart
            className={cn('size-4', liked && 'fill-current')}
            aria-hidden
          />
          לייק
        </Button>
      </div>
    </article>
  )
}
