import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessagesSquare, MoveRight, ShieldUser, Trash2 } from 'lucide-react'

import {
  COMMENT_COMPOSER_MAX_HEIGHT_PX,
  COMMENT_COMPOSER_TEXTAREA_CLASS,
} from '@/components/feed/comment-shared'
import { PinnedPostNotice } from '@/components/feed/pinned-post-notice'
import { PostDetailSkeleton } from '@/components/feed/post-detail-skeleton'
import { PostAdminSheet } from '@/components/feed/post-admin-sheet'
import { ResidentMetaUserIcon } from '@/components/feed/resident-meta-user-icon'
import { PostCard } from '@/components/feed/post-card'
import { POST_CREATE_BUTTON_HEX } from '@/components/feed/post-type-styles'
import { buttonVariants } from '@/components/ui/button'
import {
  fetchCommentsForPost,
  fetchPostById,
  insertComment,
  insertPollVote,
} from '@/lib/feed-queries'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { useAuth } from '@/auth/use-auth'
import { cn } from '@/lib/utils'
import type { FeedPost, PostComment } from '@/types/feed'

/** Match {@link BottomTabBar} nav strip (no FAB). */
const DETAIL_COMMENT_BAR_CHROME =
  'border-t border-zinc-200/70 bg-feed-canvas backdrop-blur-xl supports-[backdrop-filter]:bg-feed-canvas/90 dark:border-white/10'

const MAIN_SCROLL_BOTTOM =
  'pb-[calc(env(safe-area-inset-bottom,0px)+8.75rem)]'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { isAdmin } = useBuildingMembership()
  const [post, setPost] = useState<FeedPost | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [sending, setSending] = useState(false)
  const [authorDeleteOpen, setAuthorDeleteOpen] = useState(false)
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const reload = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError(null)
    try {
      const [p, c] = await Promise.all([
        fetchPostById(postId),
        fetchCommentsForPost(postId),
      ])
      setPost(p)
      setComments(c)
      if (!p) setError('הפוסט לא נמצא או שאין הרשאה')
    } catch (e) {
      console.error(e)
      setError('לא ניתן לטעון את הפוסט')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async post load triggers state updates
    void reload()
  }, [reload])

  /** Inline composer: one line tall by default; grow until capped. */
  useLayoutEffect(() => {
    if (!post || loading || error) return
    const el = commentTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, COMMENT_COMPOSER_MAX_HEIGHT_PX)
    el.style.height = `${next}px`
    el.style.overflowY =
      el.scrollHeight > COMMENT_COMPOSER_MAX_HEIGHT_PX ? 'auto' : 'hidden'
  }, [commentBody, post, loading, error])

  async function handlePollVote(pid: string, optionId: string) {
    const res = await insertPollVote(pid, optionId)
    if (res.ok && postId) {
      const fresh = await fetchPostById(postId)
      if (fresh) setPost(fresh)
    }
    return res
  }

  async function handleSendComment() {
    if (!postId || !commentBody.trim() || sending) return
    setSending(true)
    try {
      const inserted = await insertComment(postId, commentBody)
      if (inserted) {
        setComments((prev) => [inserted, ...prev])
        setCommentBody('')
        setPost((p) => (p ? { ...p, comments: p.comments + 1 } : p))
      }
    } finally {
      setSending(false)
    }
  }

  function handleBack() {
    navigate(-1)
  }

  const showComposerBar = Boolean(post && !loading && !error)
  const viewerId = session?.user?.id
  const showAuthorDeleteTrash =
    Boolean(
      post && viewerId && post.authorId && post.authorId === viewerId
    )

  return (
    <div dir="rtl" className="min-h-svh bg-feed-canvas">
      <div className="bg-feed-canvas pt-[env(safe-area-inset-top)]">
        <header className="pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div
            dir="ltr"
            className="mx-auto grid w-full max-w-lg grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-0 px-2"
          >
            <div className="flex w-10 shrink-0 justify-center justify-self-center">
              {showAuthorDeleteTrash ? (
                <button
                  type="button"
                  onClick={() => setAuthorDeleteOpen(true)}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'inline-flex size-10 touch-manipulation shrink-0 rounded-full text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="מחיקת פוסט"
                >
                  <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                </button>
              ) : (
                <span className="inline-block size-10 shrink-0" aria-hidden />
              )}
            </div>
            <div
              dir="rtl"
              aria-hidden
              className="flex min-h-10 min-w-0 items-center justify-center px-1 text-center"
            />
            <div className="flex justify-center pe-1">
              <button
                type="button"
                onClick={() => handleBack()}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'inline-flex min-h-10 min-w-10 shrink-0 items-center touch-manipulation gap-2 rounded-full px-2.5 pe-3 text-muted-foreground sm:px-3'
                )}
              >
                חזרה
                <MoveRight
                  className="size-4 shrink-0 opacity-90"
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </header>
      </div>

      <div className="-mt-px flex flex-col bg-feed-canvas">
        <div
          className={cn(
            'mx-auto w-full max-w-lg px-3',
            !loading && post?.pinned ? 'pb-4 pt-0' : 'py-4',
            showComposerBar && MAIN_SCROLL_BOTTOM
          )}
        >
          {loading ? (
            <PostDetailSkeleton />
          ) : error ? (
            <p className="text-start text-sm text-destructive">{error}</p>
          ) : post ? (
            <div className="flex flex-col gap-8">
              {post.pinned ? (
                <div className="flex flex-col gap-5 pt-5">
                  <PinnedPostNotice />
                  <PostCard
                    variant="detail"
                    post={post}
                    onPollVote={handlePollVote}
                    isAdmin={isAdmin}
                    onAdminSuccess={() => void reload()}
                    onAdminDelete={() => navigate('/feed', { replace: true })}
                  />
                </div>
              ) : (
                <PostCard
                  variant="detail"
                  post={post}
                  onPollVote={handlePollVote}
                  isAdmin={isAdmin}
                  onAdminSuccess={() => void reload()}
                  onAdminDelete={() => navigate('/feed', { replace: true })}
                />
              )}

              <section
                className="border-t border-border/40 px-5 pt-5 text-start"
                aria-labelledby="comments-heading"
              >
                <h2
                  id="comments-heading"
                  className="mb-3 flex flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-[0.7rem] font-medium text-muted-foreground"
                >
                  <MessagesSquare
                    className="size-[1em] shrink-0 opacity-90"
                    strokeWidth={2}
                    aria-hidden
                  />
                  כל התגובות
                  <span aria-hidden className="text-muted-foreground/80">
                    ·
                  </span>
                  <span className="tabular-nums">{comments.length}</span>
                </h2>
                <ul className="flex flex-col gap-4">
                  {comments.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      אין תגובות עדיין
                    </li>
                  ) : (
                    comments.map((c) => (
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
                          <span className="font-semibold text-foreground">
                            {c.author}
                          </span>
                          <span aria-hidden className="text-muted-foreground/80">
                            ·
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {c.relativeTime}
                          </span>
                        </div>
                        <p
                          className="mt-1 min-w-0 text-start text-[0.8rem] leading-normal text-foreground whitespace-pre-wrap break-words"
                          dir="rtl"
                        >
                          {c.text}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {showComposerBar ? (
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-40',
            DETAIL_COMMENT_BAR_CHROME
          )}
        >
          <div className="mx-auto w-full max-w-lg px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="px-5">
              <label htmlFor="new-comment" className="sr-only">
                תגובה חדשה
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <textarea
                ref={commentTextareaRef}
                id="new-comment"
                rows={1}
                dir="rtl"
                className={cn(
                  COMMENT_COMPOSER_TEXTAREA_CLASS,
                  'flex-1 overflow-y-hidden'
                )}
                placeholder="מה תרצו להגיב?"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    (e.ctrlKey || e.metaKey)
                  ) {
                    e.preventDefault()
                    void handleSendComment()
                  }
                }}
                />
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'flex h-10 w-full shrink-0 touch-manipulation items-center justify-center rounded-full px-5 font-semibold duration-150 sm:h-auto sm:min-h-[52px] sm:min-w-[9rem] sm:w-auto'
                )}
                disabled={sending || !commentBody.trim()}
                onClick={() => void handleSendComment()}
              >
                {sending ? 'שולח…' : 'פרסום תגובה'}
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      {post ? (
        <PostAdminSheet
          post={post}
          open={authorDeleteOpen}
          onOpenChange={setAuthorDeleteOpen}
          onSuccess={() => void reload()}
          onDeleted={() => navigate('/feed', { replace: true })}
          entryPoint="authorDelete"
        />
      ) : null}
    </div>
  )
}
