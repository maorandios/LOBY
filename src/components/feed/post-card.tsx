import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'

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
  const isUpdate = post.type === 'עדכון'
  const isReport = post.type === 'דיווח'
  const isRequest = post.type === 'בקשה'
  const compactCommentFooter = isUpdate || isReport || isPoll || isRequest
  const [liked, setLiked] = useState(false)

  function goToPost() {
    navigate(`/post/${post.id}`)
  }

  const TypeIcon = postTypeLucideIcon[post.type]

  const typeChip = (
    <span
      className={cn(CHIP, 'shrink-0 text-foreground', typeBadgeClass(post.type))}
    >
      <TypeIcon className="size-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      {postTypeChipLabel(post.type)}
    </span>
  )

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
        'flex cursor-pointer touch-manipulation flex-col overflow-hidden p-5 transition-[box-shadow,transform] duration-200',
        'hover:-translate-y-px hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]',
        cardAccentByType(post.type)
      )}
      onClick={goToPost}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-start text-[0.8rem] leading-snug text-foreground">
          {residentMeta}
        </p>
        {typeChip}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isReport || isPoll ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={post.status} />
            <span aria-hidden className="text-muted-foreground/80">
              ·
            </span>
            <h2 className="min-w-0 flex-1 text-start text-[1.06rem] leading-snug font-semibold tracking-tight text-foreground">
              {post.title}
            </h2>
          </div>
        ) : (
          <div>
            <h2 className="text-[1.06rem] leading-snug font-semibold tracking-tight text-foreground">
              {post.title}
            </h2>
          </div>
        )}

        {post.bodyPreview && (
          <p
            className={cn(
              'text-[0.9rem] leading-relaxed text-foreground/90',
              isUpdate ? '' : 'line-clamp-2'
            )}
          >
            {post.bodyPreview}
            {!isUpdate && post.bodyPreview.length > 90 && (
              <span className="ms-1 text-[0.75rem] font-medium text-primary/80">
                קרא עוד
              </span>
            )}
          </p>
        )}

        {post.hasImage && !isUpdate && !isPoll && (
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted"
            aria-hidden
          />
        )}

        {isPoll && !isUpdate && (
          <div
            className="rounded-2xl bg-muted/45 p-3 dark:bg-muted/25"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <PollBlock postId={post.id} poll={post.poll} />
          </div>
        )}
      </div>

      <div
        className="mt-4 flex gap-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {compactCommentFooter ? (
          <div className="flex w-full items-stretch gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10 min-w-0 flex-1 rounded-full font-semibold shadow-none"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              תגובה
            </Button>
            <div
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-muted/70 px-4 text-sm font-semibold text-foreground dark:bg-muted/50"
              aria-label={`${post.comments} תגובות`}
            >
              <MessageCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="tabular-nums">{post.comments}</span>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </article>
  )
}
