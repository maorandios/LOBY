import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthContextValue = {
  session: Session | null
  loading: boolean
  /** True when `VITE_AUTH_BYPASS=true` (mock session / no magic link). */
  authBypassActive: boolean
  refreshSession: () => Promise<void>
  /** Sign out: real Supabase or bypass “logged out” state. */
  signOutApp: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
