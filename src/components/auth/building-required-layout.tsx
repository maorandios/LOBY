import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useLayoutEffect, useRef } from 'react'

import { FeedRefreshProvider } from '@/context/feed-refresh-context'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

import { OnboardingLoadingPage } from '@/pages/onboarding-loading-page'

/** Requires an authenticated user with a building_members row. */
export function BuildingRequiredLayout() {
  const { hasBuilding, loading } = useBuildingMembership()
  const location = useLocation()
  const navType = useNavigationType()
  const prevPathKey = useRef<string | null>(null)
  const pathKey = `${location.pathname}${location.search}`

  let routeAnim = ''
  if (prevPathKey.current !== null && prevPathKey.current !== pathKey) {
    routeAnim = navType === 'POP' ? 'route-enter-pop' : 'route-enter-forward'
  }

  useLayoutEffect(() => {
    prevPathKey.current = pathKey
  }, [pathKey])

  if (loading) {
    return <OnboardingLoadingPage />
  }

  if (!hasBuilding) {
    return <Navigate to="/" replace />
  }

  return (
    <FeedRefreshProvider>
      <div
        key={pathKey}
        className={cn('min-h-svh max-w-[100vw] overflow-x-clip', routeAnim)}
      >
        <Outlet />
      </div>
    </FeedRefreshProvider>
  )
}
