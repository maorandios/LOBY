import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'

import { AuthLoading } from './auth-loading'

export function RequireGuest({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (session) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
