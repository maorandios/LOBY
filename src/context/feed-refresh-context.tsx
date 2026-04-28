import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type FeedRefreshContextValue = {
  /** Increment to signal feed subscribers to reload. */
  feedVersion: number
  bumpFeed: () => void
}

const FeedRefreshContext = createContext<FeedRefreshContextValue | null>(null)

export function FeedRefreshProvider({ children }: { children: ReactNode }) {
  const [feedVersion, setFeedVersion] = useState(0)
  const bumpFeed = useCallback(() => setFeedVersion((v) => v + 1), [])
  const value = useMemo(
    () => ({ feedVersion, bumpFeed }),
    [feedVersion, bumpFeed]
  )
  return (
    <FeedRefreshContext.Provider value={value}>
      {children}
    </FeedRefreshContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components -- provider + paired hook pattern */
export function useFeedRefresh(): FeedRefreshContextValue {
  const ctx = useContext(FeedRefreshContext)
  if (!ctx) {
    return {
      feedVersion: 0,
      bumpFeed: () => {},
    }
  }
  return ctx
}
