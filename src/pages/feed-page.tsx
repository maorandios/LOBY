import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { FeedHeader } from '@/components/feed/feed-header'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { BUILDING_NAME, MOCK_POSTS } from '@/data/feed-mock'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

type FeedLocationState = { newInviteCode?: string }

const SCROLL_BLUR_PX = 12

export function FeedPage() {
  const location = useLocation()
  const { member } = useBuildingMembership()
  const newInviteCode = (location.state as FeedLocationState | null)?.newInviteCode
  const inviteUrl =
    newInviteCode && typeof window !== 'undefined'
      ? `${window.location.origin}/join/${newInviteCode}`
      : null

  const [headerScrolled, setHeaderScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setHeaderScrolled(window.scrollY > SCROLL_BLUR_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      <div
        className={cn(
          'sticky top-0 z-40 pt-[env(safe-area-inset-top)]',
          'transition-[backdrop-filter,background-color] duration-300 ease-out',
          headerScrolled
            ? 'backdrop-blur-xl bg-feed-canvas/80 supports-[backdrop-filter]:bg-feed-canvas/72'
            : 'bg-feed-canvas backdrop-blur-none'
        )}
      >
        <FeedHeader buildingName={BUILDING_NAME} />
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

        {MOCK_POSTS.length === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-base font-medium text-foreground">
              אין פריטים להצגה
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              עדיין אין פוסטים בפיד.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {MOCK_POSTS.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomTabBar />
    </div>
  )
}
