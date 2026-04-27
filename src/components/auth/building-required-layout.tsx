import { Navigate, Outlet } from 'react-router-dom'

import { useBuildingMembership } from '@/hooks/use-building-membership'

import { OnboardingLoadingPage } from '@/pages/onboarding-loading-page'

/** Requires an authenticated user with a building_members row. */
export function BuildingRequiredLayout() {
  const { hasBuilding, loading } = useBuildingMembership()

  if (loading) {
    return <OnboardingLoadingPage />
  }

  if (!hasBuilding) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
