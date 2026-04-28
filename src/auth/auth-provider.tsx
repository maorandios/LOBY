import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'

/**
 * Avoid re-emitting `session` when only the token rotated. Most consumers
 * depend on `session.user.id`, but their hooks (e.g. `useBuildingMembership`)
 * also see whole-object reference changes — which on iOS PWA resume cause
 * a tree-wide remount and lose in-flight UI state (file pickers, etc.).
 */
function isSameSession(a: Session | null, b: Session | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.user?.id === b.user?.id &&
    a.access_token === b.access_token &&
    a.refresh_token === b.refresh_token
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const signOutApp = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
  }, [])

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession((prev) =>
        isSameSession(prev, data.session ?? null) ? prev : data.session ?? null
      )
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession((prev) => (isSameSession(prev, next) ? prev : next))
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signOutApp,
    }),
    [session, loading, signOutApp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
