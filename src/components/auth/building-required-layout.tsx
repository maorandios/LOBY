import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom'

import { useLayoutEffect, useRef } from 'react'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { CreatePostComposerProvider } from '@/context/create-post-composer-context'
import { FeedRefreshProvider } from '@/context/feed-refresh-context'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { feedShowsBottomTabBar } from '@/lib/feed-tab-bar-routes'
import {
  isMobileForInstallGuide,
  isStandalonePwa,
} from '@/lib/pwa-install-guide'
import { cn } from '@/lib/utils'

import { OnboardingLoadingPage } from '@/pages/onboarding-loading-page'

/** Requires an authenticated user with a building_members row. */
export function BuildingRequiredLayout() {
  const { hasBuilding, loading } = useBuildingMembership()
  const everHadBuildingRef = useRef(hasBuilding)
  if (hasBuilding) everHadBuildingRef.current = true
  const location = useLocation()
  const hideFeedChrome = !feedShowsBottomTabBar(location.pathname)
  const showMobileInstallBanner =
    feedShowsBottomTabBar(location.pathname) &&
    isMobileForInstallGuide() &&
    !isStandalonePwa() &&
    location.pathname !== '/install'
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

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--feed-dock-install-banner',
      showMobileInstallBanner ? '3.5rem' : '0px'
    )
    return () => {
      document.documentElement.style.removeProperty('--feed-dock-install-banner')
    }
  }, [showMobileInstallBanner])

  /**
   * Only show the loading page on the first-ever resolution. Once we know the
   * user has a building, we don't unmount the tree on any subsequent transient
   * loading state (e.g. supabase token refresh) — that previously remounted
   * everything mid-photo-pick on iOS, losing the picked file.
   */
  if (loading && !everHadBuildingRef.current) {
    return <OnboardingLoadingPage />
  }

  if (!hasBuilding && !everHadBuildingRef.current) {
    return <Navigate to="/" replace />
  }

  return (
    <FeedRefreshProvider>
      <CreatePostComposerProvider>
        <div className="relative min-h-svh w-full max-w-[100vw] overflow-x-clip">
          <div
            key={pathKey}
            className={cn('min-h-svh max-w-[100vw] overflow-x-clip', routeAnim)}
          >
            <Outlet />
          </div>
          {hideFeedChrome ? null : (
            <BottomTabBar showMobileInstallBanner={showMobileInstallBanner} />
          )}
        </div>
      </CreatePostComposerProvider>
    </FeedRefreshProvider>
  )
}
