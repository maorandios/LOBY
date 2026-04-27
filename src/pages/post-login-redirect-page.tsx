import { Navigate } from 'react-router-dom'

import { useBuildingMembership } from '@/hooks/use-building-membership'

import { OnboardingLoadingPage } from './onboarding-loading-page'

/**
 * `/` after login: has building → feed; otherwise admin onboarding (residents use `/join/:code`).
 */
export function PostLoginRedirectPage() {
  const { hasBuilding, loading } = useBuildingMembership()

  if (loading) {
    return <OnboardingLoadingPage />
  }

  if (hasBuilding) {
    return <Navigate to="/feed" replace />
  }

  return <Navigate to="/onboarding/admin" replace />
}
