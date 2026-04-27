import type { ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { safeRedirectPath } from '@/lib/safe-redirect'

import { AuthLoading } from './auth-loading'

export function RequireGuest({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const [search] = useSearchParams()

  if (loading) {
    return <AuthLoading />
  }

  if (session) {
    const next = safeRedirectPath(search.get('redirect'))
    return <Navigate to={next === '/' ? '/feed' : next} replace />
  }

  return <>{children}</>
}
