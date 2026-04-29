import { type RefObject, useEffect } from 'react'

type Options = {
  sentinelRef: RefObject<Element | null>
  enabled: boolean
  onLoadMore: () => void | Promise<void>
}

/**
 * Fires {@link Options.onLoadMore} when {@link sentinelRef} intersects the
 * viewport (with margin so prefetch starts slightly before bottom).
 */
export function useFeedSentinelLoadMore({
  sentinelRef,
  enabled,
  onLoadMore,
}: Options) {
  useEffect(() => {
    if (!enabled) return
    const root = sentinelRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return

    let busy = false
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting || busy) return
        busy = true
        try {
          await Promise.resolve(onLoadMore())
        } finally {
          busy = false
        }
      },
      {
        root: null,
        rootMargin: '160px',
        threshold: 0,
      }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [enabled, onLoadMore, sentinelRef])
}
