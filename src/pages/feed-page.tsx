import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
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
  const { member, isAdmin } = useBuildingMembership()
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

  const loadFeed = useCallback(async () => {
    const bid = member?.building_id
    if (!bid) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [label, list] = await Promise.all([
        fetchBuildingLabel(bid),
        fetchFeedPostsForBuilding(bid),
      ])
      setBuildingLabel(label)
      setPosts(list)
    } catch (e) {
      console.error(e)
      setLoadError('לא ניתן לטעון את הפיד כרגע')
    } finally {
      setLoading(false)
    }
  }, [member?.building_id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async feed load triggers state updates
    void loadFeed()
  }, [loadFeed, feedVersion])

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

      <main className="mx-auto max-w-lg px-3 py-4">
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
        ) : loading ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-muted-foreground">טוען פוסטים…</p>
          </div>
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
                  onAdminSuccess={() => void loadFeed()}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomTabBar />
    </div>
  )
}
