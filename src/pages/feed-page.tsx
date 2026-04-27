import { useMemo, useState } from 'react'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { FeedHeader } from '@/components/feed/feed-header'
import { FilterChips } from '@/components/feed/filter-chips'
import { PostCard } from '@/components/feed/post-card'
import { BUILDING_NAME, MOCK_POSTS } from '@/data/feed-mock'
import type { FeedFilterId, FeedPost, PostTypeHe } from '@/types/feed'

const FILTER_TO_TYPE: Partial<Record<FeedFilterId, PostTypeHe>> = {
  דיווחים: 'דיווח',
  הצבעות: 'הצבעה',
  עדכונים: 'עדכון',
  בקשות: 'בקשה',
}

function filterPosts(posts: FeedPost[], filter: FeedFilterId): FeedPost[] {
  if (filter === 'הכל') return posts
  const t = FILTER_TO_TYPE[filter]
  if (!t) return posts
  return posts.filter((p) => p.type === t)
}

export function FeedPage() {
  const [filter, setFilter] = useState<FeedFilterId>('הכל')

  const visible = useMemo(
    () => filterPosts(MOCK_POSTS, filter),
    [filter]
  )

  return (
    <div className="min-h-svh bg-muted/35 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 shadow-xs backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <FeedHeader buildingName={BUILDING_NAME} />
        <div className="px-4">
          <FilterChips value={filter} onChange={setFilter} />
        </div>
      </div>

      <main className="mx-auto max-w-lg px-3 py-4">
        {visible.length === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-base font-medium text-foreground">
              אין פריטים להצגה
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              נסו לבחור קטגוריה אחרת, או לנקות את הסינון ל־״הכל״.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((post) => (
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
