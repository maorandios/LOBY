import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { AuthorNameWithAdminBadge } from '@/components/feed/author-name-with-admin'
import { PostDetailSkeleton } from '@/components/feed/post-detail-skeleton'
import { ProfileCornerLink } from '@/components/feed/feed-header'
import { PostCard } from '@/components/feed/post-card'
import { buttonVariants } from '@/components/ui/button'
import {
  fetchCommentsForPost,
  fetchPostById,
  insertComment,
  insertPollVote,
} from '@/lib/feed-queries'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'
import type { FeedPost } from '@/types/feed'
import type { PostComment } from '@/types/feed'

const fieldClass =
  'flex min-h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useBuildingMembership()
  const [post, setPost] = useState<FeedPost | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [sending, setSending] = useState(false)

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
        setComments((prev) => [...prev, inserted])
        setCommentBody('')
        setPost((p) => (p ? { ...p, comments: p.comments + 1 } : p))
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top)]">
      <ProfileCornerLink />
      <div className="mx-auto max-w-lg px-3 pb-4 pt-[max(3rem,env(safe-area-inset-top)-0.25rem)]">
        <Link
          to="/feed"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'lg' }),
            'mb-4 min-h-11 touch-manipulation gap-2 ps-1 text-muted-foreground'
          )}
        >
          <ArrowRight className="size-4" aria-hidden />
          חזרה לפיד
        </Link>

        {loading ? (
          <PostDetailSkeleton />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : post ? (
          <div className="flex flex-col gap-6">
            <PostCard
              post={post}
              onPollVote={handlePollVote}
              isAdmin={isAdmin}
              onAdminSuccess={() => void reload()}
              onAdminDelete={() => navigate('/feed', { replace: true })}
            />

            <section className="space-y-3 text-start" aria-labelledby="comments-heading">
              <h2
                id="comments-heading"
                className="text-base font-semibold text-foreground"
              >
                תגובות ({comments.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {comments.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    אין תגובות עדיין
                  </li>
                ) : (
                  comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 transition-[transform] duration-100 motion-reduce:transition-none active:scale-[0.993]"
                    >
                      <p className="text-[0.8rem] text-muted-foreground">
                        <AuthorNameWithAdminBadge
                          name={c.author}
                          authorIsAdmin={c.authorIsAdmin}
                          nameClassName="text-[0.8rem]"
                        />
                        <span aria-hidden> · </span>
                        דירה {c.apartment}
                        <span aria-hidden> · </span>
                        <span className="tabular-nums">{c.relativeTime}</span>
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">{c.text}</p>
                    </li>
                  ))
                )}
              </ul>

              <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
                <label htmlFor="new-comment" className="sr-only">
                  תגובה חדשה
                </label>
                <textarea
                  id="new-comment"
                  rows={3}
                  dir="rtl"
                  className={cn(fieldClass, 'min-h-[88px] resize-y')}
                  placeholder="כתבו תגובה..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'mt-2 h-10 w-full rounded-full touch-manipulation font-semibold duration-150'
                  )}
                  disabled={sending || !commentBody.trim()}
                  onClick={() => void handleSendComment()}
                >
                  {sending ? 'שולח…' : 'פרסום תגובה'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
