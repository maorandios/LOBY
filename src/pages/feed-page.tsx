import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import { FeedSkeleton } from '@/components/feed/feed-skeleton'
import { FeedHeader } from '@/components/feed/feed-header'
import { PinnedPostNotice } from '@/components/feed/pinned-post-notice'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { useFeedRefresh } from '@/context/feed-refresh-context'
import {
  type FeedTabMode,
  feedPostMatchesTabMode,
  fetchBuildingLabel,
  fetchFeedPostsForBuilding,
  insertPollVote,
  mergePollVotes,
} from '@/lib/feed-queries'
import {
  getCachedBuildingLabel,
  setCachedBuildingLabel,
} from '@/lib/building-label-cache'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { useFeedSentinelLoadMore } from '@/hooks/use-feed-sentinel-load-more'
import { cn } from '@/lib/utils'
import type { FeedPost } from '@/types/feed'

type FeedLocationState = { newInviteCode?: string }

export type FeedPageProps = {
  mode?: FeedTabMode
}

function emptyHint(mode: FeedTabMode): string {
  switch (mode) {
    case 'all':
      return 'עדיין אין פוסטים בפיד.'
    case 'reports':
      return 'עדיין אין דיווחים.'
    case 'updates':
      return 'עדיין אין עדכונים.'
    case 'requests':
      return 'עדיין אין בקשות.'
    case 'polls':
      return 'עדיין אין סקרים.'
    default:
      return ''
  }
}

export function FeedPage({ mode = 'all' }: FeedPageProps) {
  const location = useLocation()
  const { member, isAdmin, loading: membershipLoading } = useBuildingMembership()
  const { feedVersion } = useFeedRefresh()
  const newInviteCode = (location.state as FeedLocationState | null)?.newInviteCode
  const inviteUrl =
    newInviteCode && typeof window !== 'undefined'
      ? `${window.location.origin}/join/${newInviteCode}`
      : null

  const [posts, setPosts] = useState<FeedPost[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const bid = member?.building_id ?? null
  const cachedBuildingLabel = useMemo(
    () => (bid ? getCachedBuildingLabel(bid) : null),
    [bid]
  )
  const [resolvedBuildingLabel, setResolvedBuildingLabel] = useState<
    string | null
  >(null)
  const buildingTitle =
    resolvedBuildingLabel ?? cachedBuildingLabel ?? 'טוען…'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const postsLenRef = useRef(0)
  useEffect(() => {
    postsLenRef.current = posts.length
  }, [posts.length])

  useEffect(() => {
    if (!bid) setResolvedBuildingLabel(null)
  }, [bid])

  const loadFeed = useCallback(
    async (options?: { silent?: boolean }) => {
      const bid = member?.building_id
      const silent = options?.silent === true
      if (!bid) {
        setPosts([])
        setHasMore(false)
        // Avoid empty-state flash before building_id exists (membership still hydrating).
        if (!silent && !membershipLoading) setLoading(false)
        return
      }
      if (!silent) {
        setLoading(true)
        setLoadError(null)
      }
      setLoadingMore(false)
      try {
        const [label, page] = await Promise.all([
          fetchBuildingLabel(bid),
          fetchFeedPostsForBuilding(bid, 0),
        ])
        setResolvedBuildingLabel(label)
        setCachedBuildingLabel(bid, label)
        setPosts(page.posts)
        setHasMore(page.hasMore)
      } catch (e) {
        console.error(e)
        if (!silent) setLoadError('לא ניתן לטעון את הפיד כרגע')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [member?.building_id, membershipLoading]
  )

  const loadMore = useCallback(async () => {
    const id = member?.building_id
    if (
      !id ||
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return
    }
    const offsetForPage = postsLenRef.current
    setLoadingMore(true)
    try {
      const page = await fetchFeedPostsForBuilding(id, offsetForPage)
      setPosts((prev) => {
        const offset = prev.length
        if (offset !== offsetForPage) return prev
        const seen = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const post of page.posts) {
          if (!seen.has(post.id)) {
            merged.push(post)
            seen.add(post.id)
          }
        }
        return merged
      })
      setHasMore(page.hasMore)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }, [member?.building_id, loading, loadingMore, hasMore])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async feed load triggers state updates
    void loadFeed()
  }, [loadFeed, feedVersion])

  const { pullPx, refreshing } = usePullToRefresh(
    useCallback(() => loadFeed({ silent: true }), [loadFeed]),
    Boolean(member?.building_id && !loading)
  )

  const filtered = useMemo(
    () => posts.filter((p) => feedPostMatchesTabMode(p, mode)),
    [posts, mode]
  )

  /** Tab filter: first pages may have no matches — fetch until some appear or feed ends. */
  useEffect(() => {
    if (
      mode === 'all' ||
      loading ||
      loadingMore ||
      !hasMore ||
      filtered.length > 0
    ) {
      return
    }
    if (posts.length === 0) return
    void loadMore()
  }, [mode, loading, loadingMore, hasMore, filtered.length, posts.length, loadMore])

  /** Short viewport / sentinel still visible — IO may not refire until scroll. */
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return
    const id = requestAnimationFrame(() => {
      const el = sentinelRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight + 220) void loadMore()
    })
    return () => cancelAnimationFrame(id)
  }, [posts.length, hasMore, loadingMore, loading, loadMore])

  const handlePollVote = useCallback(
    async (postId: string, optionId: string) => {
      const res = await insertPollVote(postId, optionId)
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? mergePollVotes(p, optionId) : p
          )
        )
      }
      return res
    },
    []
  )

  const bumpCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      )
    )
  }, [])

  const showSentinelFooter =
    (filtered.length > 0 && hasMore) ||
    (mode !== 'all' && filtered.length === 0 && hasMore && posts.length > 0)

  useFeedSentinelLoadMore({
    sentinelRef,
    enabled: Boolean(
      showSentinelFooter &&
      member?.building_id &&
      !loading &&
      !loadError
    ),
    onLoadMore: loadMore,
  })

  const pullOpacity = refreshing
    ? 1
    : Math.min(Math.max((pullPx - 8) / 56, 0), 1)
  const stripH = refreshing
    ? 44
    : Math.round(Math.min(Math.max((pullPx - 4) * 1.06, 0), 92))

  const noPostsInBuilding = !loading && !membershipLoading && posts.length === 0 && !hasMore

  const tabFilterEmptyLoaded =
    !loading &&
    !membershipLoading &&
    mode !== 'all' &&
    filtered.length === 0 &&
    !hasMore &&
    posts.length > 0

  const tabFilterStillSearching =
    !loading &&
    !membershipLoading &&
    mode !== 'all' &&
    filtered.length === 0 &&
    hasMore &&
    posts.length > 0

  const hasInviteBanner = Boolean(inviteUrl && member?.role === 'admin')
  const firstPostPinned = Boolean(filtered[0]?.pinned)
  /** Symmetric band around pin notice: drop main top pad and use pt-5 = gap-5 to card. */
  const pinNoticeEqualVertical =
    !loadError &&
    !membershipLoading &&
    !loading &&
    !noPostsInBuilding &&
    !tabFilterEmptyLoaded &&
    !(filtered.length === 0 && tabFilterStillSearching) &&
    firstPostPinned &&
    !hasInviteBanner

  return (
    <div
      dir="rtl"
      className="min-h-svh bg-feed-canvas pb-[calc(11rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="bg-feed-canvas pt-[env(safe-area-inset-top)]">
        <FeedHeader buildingName={buildingTitle} />
      </div>

      <div className="-mt-px flex flex-col overflow-x-clip bg-feed-canvas">
        <div
          className="flex shrink-0 flex-col items-center justify-center overflow-hidden transition-[height] duration-100 ease-out"
          style={{
            height: stripH,
            opacity: refreshing || pullPx > 10 || stripH > 4 ? 1 : 0,
          }}
        >
          {refreshing ? (
            <Loader2
              className="size-6 text-primary motion-reduce:animate-none animate-spin"
              strokeWidth={2.5}
              aria-hidden
            />
          ) : pullPx > 14 ? (
            <span
              className="text-primary text-[11px] font-semibold tabular-nums"
              style={{
                opacity: pullOpacity,
                transform: `scale(${0.9 + pullOpacity * 0.1})`,
              }}
            >
              משוך לריענון
            </span>
          ) : null}
        </div>

        <main
          className={cn(
            'mx-auto w-full max-w-lg px-3',
            pinNoticeEqualVertical ? 'pb-4 pt-0' : 'py-4'
          )}
        >
          {inviteUrl && member?.role === 'admin' ? (
            <div
              className={cn(
                'rounded-xl border border-[#0369a1] bg-[#e0f2fe] px-3 py-3 text-right text-sm text-[#0c4a6e]',
                firstPostPinned ? 'mb-5' : 'mb-4'
              )}
            >
              <p className="mb-2 flex items-center justify-end gap-2 font-semibold">
                <AdminBadgeCheck className="size-4" />
                קישור הזמנה לדיירים
              </p>
              <p className="mb-2 break-all font-mono text-xs leading-relaxed" dir="ltr">
                {inviteUrl}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full border-[#0369a1] bg-white text-[#0c4a6e]"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                העתקת קישור
              </Button>
            </div>
          ) : null}

          {loadError ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button type="button" variant="outline" onClick={() => void loadFeed()}>
                נסו שוב
              </Button>
            </div>
          ) : membershipLoading || loading ? (
            <FeedSkeleton count={4} />
          ) : noPostsInBuilding ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-base font-medium text-foreground">
                אין פריטים להצגה
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {emptyHint(mode)}
              </p>
            </div>
          ) : tabFilterEmptyLoaded ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-base font-medium text-foreground">
                אין פריטים להצגה
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {emptyHint(mode)}
              </p>
            </div>
          ) : (
            <>
              {filtered.length === 0 && tabFilterStillSearching ? (
                <div
                  role="status"
                  className="mb-6 flex flex-col items-center gap-3 py-8 text-muted-foreground"
                >
                  <Loader2
                    className="size-8 motion-reduce:animate-none animate-spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <p className="text-sm">טוען פוסטים נוספים…</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.map((post, postIndex) => (
                    <li
                      key={post.id}
                      className={cn(
                        post.pinned && 'flex flex-col gap-5',
                        post.pinned &&
                          postIndex === 0 &&
                          (hasInviteBanner && firstPostPinned
                            ? 'pt-0'
                            : !hasInviteBanner
                              ? 'pt-5'
                              : '')
                      )}
                    >
                      {post.pinned ? (
                        <PinnedPostNotice />
                      ) : null}
                      <PostCard
                        post={post}
                        onPollVote={handlePollVote}
                        isAdmin={isAdmin}
                        onAdminSuccess={() => void loadFeed({ silent: true })}
                        onCommentPosted={bumpCommentCount}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {showSentinelFooter ? (
                <div
                  ref={sentinelRef}
                  className="flex min-h-10 flex-col items-center justify-center py-3"
                  aria-hidden
                >
                  {loadingMore ? (
                    <Loader2
                      className="size-7 text-muted-foreground motion-reduce:animate-none animate-spin"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : (
                    <span className="sr-only">טעינת פוסטים נוספים</span>
                  )}
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
