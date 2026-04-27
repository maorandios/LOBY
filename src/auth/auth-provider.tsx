import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import {
  clearAuthBypassSignedOut,
  createBypassMockSession,
  isAuthBypassEnabled,
  isAuthBypassSignedOut,
  setAuthBypassSignedOut,
} from '@/lib/auth-bypass'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const bypass = isAuthBypassEnabled()
  const [session, setSession] = useState<Session | null>(() => {
    if (!bypass) return null
    return isAuthBypassSignedOut() ? null : createBypassMockSession()
  })
  const [loading, setLoading] = useState(() => !bypass)

  const refreshSession = useCallback(async () => {
    if (bypass) {
      setSession(isAuthBypassSignedOut() ? null : createBypassMockSession())
      return
    }
    const { data } = await supabase.auth.getSession()
    setSession(data.session ?? null)
  }, [bypass])

  const signOutApp = useCallback(async () => {
    if (bypass) {
      setAuthBypassSignedOut()
      setSession(null)
      return
    }
    await supabase.auth.signOut()
    setSession(null)
  }, [bypass])

  useEffect(() => {
    if (import.meta.env.PROD && bypass) {
      console.warn(
        '[LOBY] Auth bypass is ON (VITE_AUTH_BYPASS or emergency localStorage on *.vercel.app / localhost). Disable for real users.'
      )
    }
  }, [bypass])

  useEffect(() => {
    if (bypass) {
      return
    }

    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) {
        clearAuthBypassSignedOut()
      }
      setSession(next)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [bypass])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      authBypassActive: bypass,
      refreshSession,
      signOutApp,
    }),
    [session, loading, bypass, refreshSession, signOutApp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
