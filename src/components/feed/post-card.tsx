import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, MoveLeft, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PostAdminSheet } from '@/components/feed/post-admin-sheet'
import { PollBlock } from '@/components/feed/poll-block'
import { ResidentMetaUserIcon } from '@/components/feed/resident-meta-user-icon'
import {
  cardAccentByType,
  pinnedPostCardGlowClass,
  PINNED_POST_BORDER_HEX,
  postTypeChipLabel,
  postTypeLucideIcon,
  typeBadgeClass,
} from '@/components/feed/post-type-styles'
import { AuthorNameWithAdminBadge } from '@/components/feed/author-name-with-admin'
import { StatusLabel, StatusMarker } from '@/components/feed/status-badge'
import { cn } from '@/lib/utils'
import { isPollPost, type FeedPost } from '@/types/feed'

const CHIP =
  'inline-flex max-w-full items-center gap-[0.21rem] rounded-full px-[0.425rem] py-[5px] text-[0.595rem] font-semibold tracking-tight'

type Props = {
  post: FeedPost
  /** Feed list vs detail: detail keeps same card chrome but no tap-through navigation and hides «תגובה». */
  variant?: 'feed' | 'detail'
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
  variant = 'feed',
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
  const pinned = post.pinned
  const isDetail = variant === 'detail'

  function goToPost() {
    navigate(`/post/${post.id}`)
  }

  const TypeIcon = postTypeLucideIcon[post.type]

  const typeChip = (
    <span
      className={cn(CHIP, 'shrink-0 text-foreground', typeBadgeClass(post.type))}
    >
      <TypeIcon
        className="size-[0.744rem] shrink-0 opacity-90"
        strokeWidth={1.75}
        aria-hidden
      />
      {postTypeChipLabel(post.type)}
    </span>
  )

  const metaEnd = (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
          <Settings className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  )

  const residentMeta = (
    <>
      {!post.authorIsAdmin ? <ResidentMetaUserIcon /> : null}
      <AuthorNameWithAdminBadge
        name={post.author}
        authorIsAdmin={post.authorIsAdmin}
        adminClusterClassName="gap-0.5"
        badgeClassName="size-[0.93rem]"
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
        'flex touch-manipulation flex-col overflow-hidden px-5 pb-7 pt-6 sm:px-6',
        'transition-[box-shadow,transform] duration-150 motion-reduce:transition-colors',
        !isDetail && 'cursor-pointer active:scale-[0.993]',
        isDetail && 'cursor-default',
        cardAccentByType(post.type),
        pinned && 'border-2 border-solid',
        pinned
          ? pinnedPostCardGlowClass()
          : 'hover:-translate-y-px hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]'
      )}
      style={
        pinned ? { borderColor: PINNED_POST_BORDER_HEX } : undefined
      }
      onClick={(e) => {
        if (adminSheetOpen) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (isDetail) return
        goToPost()
      }}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-0.5 text-start text-[0.736rem] leading-snug text-foreground">
          {residentMeta}
        </p>
        {metaEnd}
      </div>

      <div className="mt-7 flex flex-col gap-5">
        {isReport || isPoll ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-[5px] gap-y-2">
            <StatusLabel status={post.status} />
            <StatusMarker status={post.status} />
            <div className="min-w-0 flex-1 basis-0">
              <h2 className="text-start text-[1.06rem] leading-snug font-medium tracking-tight text-foreground">
                {post.title}
              </h2>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-[1.06rem] leading-snug font-medium tracking-tight text-foreground">
              {post.title}
            </h2>
          </div>
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

        {isPoll && (
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
        className="mt-8 flex gap-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {compactCommentFooter ? (
          <div
            className={cn(
              'flex w-full items-stretch gap-2',
              isDetail && 'justify-end'
            )}
          >
            {!isDetail ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 min-w-0 flex-1 rounded-full gap-2 border border-zinc-300 bg-transparent font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                תגובה
                <MoveLeft className="size-4 shrink-0 opacity-90" aria-hidden />
              </Button>
            ) : null}
            <div
              className="inline-flex h-10 shrink-0 items-center gap-1.5 px-4 text-sm font-semibold text-foreground sm:px-0"
              aria-label={`${post.comments} תגובות`}
            >
              <MessageCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="tabular-nums">{post.comments}</span>
            </div>
          </div>
        ) : (
          <>
            {!isDetail ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 flex-1 rounded-full gap-2 border border-zinc-300 bg-transparent font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                תגובה
                <MoveLeft className="size-4 shrink-0 opacity-90" aria-hidden />
              </Button>
            ) : null}
            <Button
              type="button"
              variant={liked ? 'default' : 'secondary'}
              className={cn(
                'h-10 flex-1 rounded-full gap-2 font-semibold shadow-none',
                isDetail && '!flex-none min-w-[8.5rem]',
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
