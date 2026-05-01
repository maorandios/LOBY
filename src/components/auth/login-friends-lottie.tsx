import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

/**
 * Full-width illustration for the login shell — loads `public/friends.json`.
 * Uses `lottie-web` directly so a renderer failure cannot blank the whole React tree.
 */
export function LoginFriendsLottie() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false
    const animRef: { current: ReturnType<typeof lottie.loadAnimation> | null } = {
      current: null,
    }

    void fetch('/friends.json')
      .then((r) => {
        if (!r.ok) throw new Error(`friends.json ${r.status}`)
        return r.json() as Promise<unknown>
      })
      .then((data) => {
        if (cancelled || !containerRef.current) return
        if (!data || typeof data !== 'object') return
        try {
          animRef.current = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: data as object,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMax meet',
            },
          })
        } catch (e) {
          console.warn('[LoginFriendsLottie] loadAnimation failed', e)
        }
      })
      .catch((e) => {
        console.warn('[LoginFriendsLottie] fetch failed', e)
      })

    return () => {
      cancelled = true
      animRef.current?.destroy()
      animRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-[12rem] w-full max-w-none [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      aria-hidden
    />
  )
}
