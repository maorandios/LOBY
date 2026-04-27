import { useEffect, useState } from 'react'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { FeedHeader } from '@/components/feed/feed-header'
import { PostCard } from '@/components/feed/post-card'
import { BUILDING_NAME, MOCK_POSTS } from '@/data/feed-mock'
import { cn } from '@/lib/utils'

const SCROLL_BLUR_PX = 12

export function FeedPage() {
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
