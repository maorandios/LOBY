import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { BuildingMembershipProvider } from '@/hooks/use-building-membership'

import { AuthLoading } from './auth-loading'

export function ProtectedLayout() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoading />
  }

  if (!session) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return (
    <BuildingMembershipProvider>
      <Outlet />
    </BuildingMembershipProvider>
  )
}
