import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'

import { AuthLoading } from './auth-loading'

export function ProtectedLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
