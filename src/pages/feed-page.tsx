import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { FeedSkeleton } from '@/components/feed/feed-skeleton'
import { FeedHeader } from '@/components/feed/feed-header'
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
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

type FeedLocationState = { newInviteCode?: string }

const SCROLL_BLUR_PX = 12

export type FeedPageProps = {
  mode?: FeedTabMode
}

function emptyHint(mode: FeedTabMode): string {
  switch (mode) {
    case 'all':
      return 'עדיין אין פוסטים בפיד.'
    case 'reports':
      return 'עדיין אין דיווחים.'
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

  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [posts, setPosts] = useState<Awaited<
    ReturnType<typeof fetchFeedPostsForBuilding>
  > >([])
  const [buildingLabel, setBuildingLabel] = useState('טוען…')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setHeaderScrolled(window.scrollY > SCROLL_BLUR_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loadFeed = useCallback(
    async (options?: { silent?: boolean }) => {
      const bid = member?.building_id
      const silent = options?.silent === true
      if (!bid) {
        setPosts([])
        // Avoid empty-state flash before building_id exists (membership still hydrating).
        if (!silent && !membershipLoading) setLoading(false)
        return
      }
      if (!silent) {
        setLoading(true)
        setLoadError(null)
      }
      try {
        const [label, list] = await Promise.all([
          fetchBuildingLabel(bid),
          fetchFeedPostsForBuilding(bid),
        ])
        setBuildingLabel(label)
        setPosts(list)
      } catch (e) {
        console.error(e)
        if (!silent) setLoadError('לא ניתן לטעון את הפיד כרגע')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [member?.building_id, membershipLoading]
  )

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

  const pullOpacity = refreshing
    ? 1
    : Math.min(Math.max((pullPx - 8) / 56, 0), 1)
  const stripH = refreshing
    ? 44
    : Math.round(Math.min(Math.max((pullPx - 4) * 1.06, 0), 92))

  return (
    <div
      dir="rtl"
      className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]"
    >
      <div
        className={cn(
          'sticky top-0 z-40 pt-[env(safe-area-inset-top)]',
          'transition-[backdrop-filter,background-color] duration-300 ease-out',
          headerScrolled
            ? 'backdrop-blur-xl bg-feed-canvas/80 supports-[backdrop-filter]:bg-feed-canvas/72'
            : 'bg-feed-canvas backdrop-blur-none'
        )}
      >
        <FeedHeader buildingName={buildingLabel} />
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

        <main className="mx-auto w-full max-w-lg px-3 py-4">
          {inviteUrl && member?.role === 'admin' ? (
            <div className="mb-4 rounded-xl border border-[#0369a1] bg-[#e0f2fe] px-3 py-3 text-right text-sm text-[#0c4a6e]">
              <p className="mb-2 font-semibold">קישור הזמנה לדיירים</p>
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
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-base font-medium text-foreground">
                אין פריטים להצגה
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {emptyHint(mode)}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {filtered.map((post) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    onPollVote={handlePollVote}
                    isAdmin={isAdmin}
                    onAdminSuccess={() => void loadFeed({ silent: true })}
                  />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
