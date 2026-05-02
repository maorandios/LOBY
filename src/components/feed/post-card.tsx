import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, HatGlasses, MessageCircle, MessageCircleCheck, MessageCirclePlus, MessagesSquare, Settings, ShieldUser } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PostAdminSheet } from '@/components/feed/post-admin-sheet'
import { PollBlock } from '@/components/feed/poll-block'
import { ResidentMetaUserIcon } from '@/components/feed/resident-meta-user-icon'
import {
  COMMENT_COMPOSER_MAX_HEIGHT_PX,
  COMMENT_COMPOSER_TEXTAREA_CLASS,
  normalizeCommentSnippetLine,
} from '@/components/feed/comment-shared'
import {
  cardAccentByType,
  pinnedPostCardGlowClass,
  PINNED_POST_BORDER_HEX,
  POST_CREATE_BUTTON_HEX,
  postTypeChipLabel,
  postTypeLucideIcon,
  typeBadgeClass,
} from '@/components/feed/post-type-styles'
import { AuthorNameWithAdminBadge } from '@/components/feed/author-name-with-admin'
import { postStatusDisplayText } from '@/components/feed/status-badge'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { insertComment } from '@/lib/feed-queries'
import { cn } from '@/lib/utils'
import { isPollPost, type FeedPost, type PostComment } from '@/types/feed'

const CHIP =
  'inline-flex max-w-full items-center gap-[0.21rem] rounded-full px-[0.425rem] py-[5px] text-[0.595rem] font-semibold tracking-tight'

/** Bordered feed actions — match `Button` + «תגובה» (text-sm, semibold) */
const FEED_REPLY_WA_PILL =
  'inline-flex h-10 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-full border border-zinc-300 bg-transparent px-3 text-sm font-semibold text-foreground shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25'

type Props = {
  post: FeedPost
  /** Feed list vs detail: detail keeps same card chrome but no tap-through navigation and hides «תגובה». */
  variant?: 'feed' | 'detail'
  onPollVote?: (
    postId: string,
    optionId: string
  ) => Promise<{ ok: boolean; message?: string }>
  onPollVoteChange?: (
    postId: string,
    optionId: string
  ) => Promise<{ ok: boolean; message?: string }>
  isAdmin?: boolean
  onAdminSuccess?: () => void
  /** When set, after delete the parent runs this (e.g. navigate away). */
  onAdminDelete?: () => void
  /** Feed: after inline «תגובה» composer succeeds, merge count + preview. */
  onCommentPosted?: (postId: string, comment: PostComment) => void
}

export function PostCard({
  post,
  variant = 'feed',
  onPollVote,
  onPollVoteChange,
  isAdmin,
  onAdminSuccess,
  onAdminDelete,
  onCommentPosted,
}: Props) {
  const navigate = useNavigate()
  const { member, isAdmin: currentUserIsCommitteeAdmin } =
    useBuildingMembership()
  const inlineReplyAuthorLabel =
    member?.full_name?.trim() || 'משתמש'
  const [adminSheetOpen, setAdminSheetOpen] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const isPoll = isPollPost(post)
  const isUpdate = post.type === 'עדכון'
  const isReport = post.type === 'דיווח'
  const isRequest = post.type === 'בקשה'
  const compactCommentFooter = isUpdate || isReport || isPoll || isRequest
  const [liked, setLiked] = useState(false)
  const pinned = post.pinned
  const isDetail = variant === 'detail'

  useEffect(() => {
    if (!replyOpen || isDetail) return
    const id = requestAnimationFrame(() => replyTextareaRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [replyOpen, isDetail])

  function closeReplyComposer() {
    setReplyOpen(false)
  }

  useEffect(() => {
    if (!replyOpen) {
      setReplyBody('')
      setReplyError(null)
    }
  }, [replyOpen])

  /** Autosize: start one line tall; expand until capped max height. */
  useLayoutEffect(() => {
    if (!replyOpen || isDetail) return
    const el = replyTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, COMMENT_COMPOSER_MAX_HEIGHT_PX)
    el.style.height = `${next}px`
    el.style.overflowY =
      el.scrollHeight > COMMENT_COMPOSER_MAX_HEIGHT_PX ? 'auto' : 'hidden'
  }, [replyBody, replyOpen, isDetail])

  async function handleInlineCommentSubmit() {
    if (!replyBody.trim() || replySending || isDetail) return
    setReplySending(true)
    setReplyError(null)
    try {
      const inserted = await insertComment(post.id, replyBody)
      if (inserted) {
        onCommentPosted?.(post.id, inserted)
        closeReplyComposer()
      } else {
        setReplyError('לא ניתן לפרסם את התגובה. נסו שוב.')
      }
    } finally {
      setReplySending(false)
    }
  }

  function toggleReplyComposer() {
    if (isDetail) return
    setReplyOpen((o) => !o)
  }

  function goToPost() {
    navigate(`/post/${post.id}`)
  }

  const TypeIcon = postTypeLucideIcon[post.type]
  const statusInChip = isReport || isPoll

  const typeChip = (
    <span
      className={cn(CHIP, 'shrink-0', typeBadgeClass(post.type))}
    >
      <TypeIcon
        className="size-[0.744rem] shrink-0 opacity-90"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="min-w-0 shrink">{postTypeChipLabel(post.type)}</span>
      {statusInChip ? (
        <>
          <span aria-hidden className="opacity-45">
            ·
          </span>
          <span className="min-w-0 shrink">
            {postStatusDisplayText(post.status)}
          </span>
        </>
      ) : null}
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

  const residentMeta = post.isAnonymous ? (
    <>
      <HatGlasses
        className="inline-block size-[0.93rem] shrink-0 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
      <span className="font-semibold text-foreground">{post.author}</span>
      <span aria-hidden className="text-muted-foreground/80">
        ·
      </span>
      <span className="tabular-nums text-muted-foreground">
        {post.relativeTime}
      </span>
    </>
  ) : (
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
        <div dir={isReport || isPoll ? 'rtl' : undefined}>
          <h2 className="text-[1.06rem] leading-snug font-medium tracking-tight text-foreground">
            {post.title}
          </h2>
        </div>

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
              onChangeVote={
                onPollVoteChange
                  ? (optionId) => onPollVoteChange(post.id, optionId)
                  : undefined
              }
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-3',
          (!isDetail || !compactCommentFooter || replyOpen) && 'mt-8'
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={cn('flex gap-2', compactCommentFooter && !isDetail && 'w-full')}>
          {compactCommentFooter ? (
            isDetail ? null : (
              <div
                className={cn(
                  'flex w-full items-stretch gap-2',
                  isDetail && 'justify-end'
                )}
              >
                {!isDetail ? (
                  <div className="flex min-w-0 flex-1 gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 min-w-0 flex-1 rounded-full gap-2 border border-zinc-300 bg-transparent text-sm font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
                      aria-expanded={replyOpen}
                      aria-controls={`feed-inline-reply-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleReplyComposer()
                      }}
                    >
                      <MessageCirclePlus
                        className="size-4 shrink-0 opacity-90"
                        strokeWidth={2}
                        aria-hidden
                      />
                      תגובה
                    </Button>
                    {post.authorWhatsAppDigits && !post.isAnonymous ? (
                      <a
                        href={`https://wa.me/${post.authorWhatsAppDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          FEED_REPLY_WA_PILL,
                          'no-underline hover:text-foreground'
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircleCheck
                          className="size-4 shrink-0 opacity-90"
                          strokeWidth={2}
                          aria-hidden
                        />
                        וואטצאפ
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <div
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 px-4 text-sm font-semibold text-foreground sm:px-0"
                  aria-label={`${post.comments} תגובות`}
                >
                  <MessageCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="tabular-nums">{post.comments}</span>
                </div>
              </div>
            )
          ) : (
            <>
              {!isDetail ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 flex-1 rounded-full gap-2 border border-zinc-300 bg-transparent text-sm font-semibold shadow-none hover:bg-muted/35 dark:border-zinc-500 dark:hover:bg-muted/25"
                    aria-expanded={replyOpen}
                    aria-controls={`feed-inline-reply-${post.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleReplyComposer()
                    }}
                  >
                    <MessageCirclePlus
                      className="size-4 shrink-0 opacity-90"
                      strokeWidth={2}
                      aria-hidden
                    />
                    תגובה
                  </Button>
                  {post.authorWhatsAppDigits && !post.isAnonymous ? (
                    <a
                      href={`https://wa.me/${post.authorWhatsAppDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                          FEED_REPLY_WA_PILL,
                          'no-underline hover:text-foreground'
                        )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircleCheck
                        className="size-4 shrink-0 opacity-90"
                        strokeWidth={2}
                        aria-hidden
                      />
                      וואטצאפ
                    </a>
                  ) : null}
                </>
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

        {!isDetail && replyOpen ? (
          <div
            id={`feed-inline-reply-${post.id}`}
            className="flex flex-col gap-2 rounded-2xl bg-muted/20 p-3 dark:bg-muted/15"
            role="region"
            aria-label="כתיבת תגובה"
          >
            <div className="flex items-center justify-start gap-1">
              {currentUserIsCommitteeAdmin ? (
                <ShieldUser
                  className="inline-block size-[0.744rem] shrink-0"
                  style={{ color: POST_CREATE_BUTTON_HEX }}
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <ResidentMetaUserIcon className="size-[0.744rem]" />
              )}
              <span className="text-start text-[0.7rem] font-semibold leading-tight text-foreground">
                {inlineReplyAuthorLabel}
              </span>
            </div>
            <label htmlFor={`feed-inline-reply-field-${post.id}`} className="sr-only">
              תגובה חדשה
            </label>
            <textarea
              ref={replyTextareaRef}
              id={`feed-inline-reply-field-${post.id}`}
              dir="rtl"
              rows={1}
              className={COMMENT_COMPOSER_TEXTAREA_CLASS}
              placeholder="מה תרצו להגיב?"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  (e.ctrlKey || e.metaKey)
                ) {
                  e.preventDefault()
                  void handleInlineCommentSubmit()
                }
              }}
            />
            {replyError ? (
              <p className="text-sm text-destructive" role="alert">
                {replyError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 min-w-[6rem] flex-1 rounded-full font-semibold sm:flex-none"
                onClick={() => closeReplyComposer()}
              >
                ביטול
              </Button>
              <Button
                type="button"
                variant="default"
                className="h-10 min-w-0 flex-[2] rounded-full font-semibold sm:flex-1"
                disabled={!replyBody.trim() || replySending}
                onClick={() => void handleInlineCommentSubmit()}
              >
                {replySending ? 'שולח…' : 'פרסום תגובה'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {!isDetail && post.recentComments && post.recentComments.length > 0 ? (
        <section
          className="mt-6 border-t border-border/40 pt-5"
          aria-labelledby={`recent-comments-heading-${post.id}`}
        >
          <h3
            id={`recent-comments-heading-${post.id}`}
            className="mb-3 flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-[0.7rem] font-medium text-muted-foreground"
          >
            <MessagesSquare
              className="size-[1em] shrink-0 opacity-90"
              strokeWidth={2}
              aria-hidden
            />
            תגובות אחרונות
          </h3>
          <ul className="flex flex-col gap-4">
            {post.recentComments.map((c) => (
              <li key={c.id}>
                <div className="flex flex-wrap items-baseline justify-start gap-x-1 text-start text-[0.72rem] leading-snug">
                  {c.authorIsAdmin ? (
                    <ShieldUser
                      className="inline-block size-[0.744rem] shrink-0 translate-y-[0.05em]"
                      style={{ color: POST_CREATE_BUTTON_HEX }}
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : (
                    <ResidentMetaUserIcon className="size-[0.744rem] translate-y-[0.05em]" />
                  )}
                  <span className="font-semibold text-foreground">{c.author}</span>
                  <span aria-hidden className="text-muted-foreground/80">
                    ·
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.relativeTime}
                  </span>
                </div>
                <p
                  className="mt-1 min-w-0 text-start text-[0.8rem] leading-normal text-foreground line-clamp-1"
                  dir="rtl"
                  title={normalizeCommentSnippetLine(c.text)}
                >
                  {normalizeCommentSnippetLine(c.text)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
