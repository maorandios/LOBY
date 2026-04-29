import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PostAdminSheet } from '@/components/feed/post-admin-sheet'
import { PollBlock } from '@/components/feed/poll-block'
import {
  cardAccentByType,
  postTypeChipLabel,
  postTypeLucideIcon,
  typeBadgeClass,
} from '@/components/feed/post-type-styles'
import { AuthorNameWithAdminBadge } from '@/components/feed/author-name-with-admin'
import { StatusBadge } from '@/components/feed/status-badge'
import { cn } from '@/lib/utils'
import { isPollPost, type FeedPost } from '@/types/feed'

const CHIP =
  'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-tight'

type Props = {
  post: FeedPost
  onPollVote?: (
    postId: string,
    optionId: string
  ) => Promise<{ ok: boolean; message?: string }>
  isAdmin?: boolean
  onAdminSuccess?: () => void
  /** When set, after delete the parent runs this (e.g. navigate away). */
  onAdminDelete?: () => void
}

export function PostCard({
  post,
  onPollVote,
  isAdmin,
  onAdminSuccess,
  onAdminDelete,
}: Props) {
  const navigate = useNavigate()
  const [adminSheetOpen, setAdminSheetOpen] = useState(false)
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

  const metaEnd = (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {post.pinned ? (
        <span
          className={cn(
            CHIP,
            'border border-primary/25 bg-primary/10 text-primary'
          )}
        >
          נעוץ
        </span>
      ) : null}
      {typeChip}
      {isAdmin ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 rounded-full border border-zinc-300/90 bg-transparent shadow-none hover:bg-muted/30 dark:border-zinc-500 dark:hover:bg-muted/20"
          aria-label="פעולות ניהול פוסט"
          onClick={(e) => {
            e.stopPropagation()
            setAdminSheetOpen(true)
          }}
        >
          <Settings2 className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  )

  const residentMeta = (
    <>
      <AuthorNameWithAdminBadge
        name={post.author}
        authorIsAdmin={post.authorIsAdmin}
      />
      <span aria-hidden className="text-muted-foreground/80">
        ·
      </span>
      <span className="text-muted-foreground">דירה {post.apartment}</span>
      <span aria-hidden className="text-muted-foreground/80">
        ·
      </span>
      <span className="tabular-nums text-muted-foreground">
        {post.relativeTime}
      </span>
    </>
  )

  return (
    <article
      className={cn(
        'flex cursor-pointer touch-manipulation flex-col overflow-hidden p-5',
        'transition-[box-shadow,transform] duration-150 motion-reduce:transition-colors',
        'active:scale-[0.993] hover:-translate-y-px hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]',
        cardAccentByType(post.type)
      )}
      onClick={goToPost}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-start text-[0.8rem] leading-snug text-foreground">
          {residentMeta}
        </p>
        {metaEnd}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isReport || isPoll ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <h2 className="min-w-0 text-start text-[1.06rem] leading-tight font-semibold tracking-tight text-foreground">
              {post.title}
            </h2>
            <span className="inline-flex shrink-0">
              <StatusBadge status={post.status} />
            </span>
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

        {post.imageUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
            <img
              src={post.imageUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        {isPoll && !isUpdate && (
          <div
            className="rounded-2xl bg-muted/45 p-3 dark:bg-muted/25"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <PollBlock
              postId={post.id}
              poll={post.poll}
              onVote={
                onPollVote
                  ? (optionId) => onPollVote(post.id, optionId)
                  : undefined
              }
            />
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
              variant="ghost"
              className="h-10 min-w-0 flex-1 rounded-full border border-zinc-300 bg-transparent font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
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
              variant="ghost"
              className="h-10 flex-1 rounded-full gap-2 border border-zinc-300 bg-transparent font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
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

      {isAdmin ? (
        <PostAdminSheet
          post={post}
          open={adminSheetOpen}
          onOpenChange={setAdminSheetOpen}
          onSuccess={onAdminSuccess ?? (() => {})}
          onDeleted={onAdminDelete}
        />
      ) : null}
    </article>
  )
}
