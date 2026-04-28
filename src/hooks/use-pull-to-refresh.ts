import { useEffect, useRef, useState } from 'react'

const RESIST = 0.48
const MAX_PULL = 86
const THRESHOLD = 52

/**
 * Pull-down at scroll top → run async refresh (resistance easing on pull distance).
 * Touch handlers use passive:false on move when pulling so the page rubber-band doesn't steal the gesture.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, enabled: boolean) {
  const [pullPx, setPullPx] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startY = useRef(0)
  const active = useRef(false)
  const pullAccum = useRef(0)
  const running = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) return

    const canPull = () => window.scrollY < 8

    const onTouchStart = (e: TouchEvent) => {
      if (running.current) return
      if (!canPull()) return
      startY.current = e.touches[0].clientY
      active.current = true
      pullAccum.current = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || running.current) return
      if (!canPull()) {
        active.current = false
        setPullPx(0)
        return
      }
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setPullPx(0)
        return
      }
      e.preventDefault()
      const raw = Math.min(dy, MAX_PULL / RESIST + 24)
      const eased = RESIST * Math.min(raw ** 1.06, MAX_PULL / RESIST)
      pullAccum.current = eased
      setPullPx(Math.min(eased, MAX_PULL))
    }

    const onTouchEnd = () => {
      const p = pullAccum.current
      active.current = false
      setPullPx(0)
      pullAccum.current = 0

      if (p < THRESHOLD || running.current) return

      running.current = true
      setRefreshing(true)
      void (async () => {
        try {
          await onRefreshRef.current()
        } finally {
          running.current = false
          setRefreshing(false)
        }
      })()
    }

    const opts: AddEventListenerOptions = { passive: false }

    window.addEventListener('touchstart', onTouchStart, opts)
    window.addEventListener('touchmove', onTouchMove, opts)
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled])

  return { pullPx, refreshing }
}
