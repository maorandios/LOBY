import type { Session } from '@supabase/supabase-js'

/** Set to `"1"` in localStorage to skip auth on localhost / *.vercel.app only (no redeploy). */
export const EMERGENCY_AUTH_BYPASS_KEY = 'loby:emergency_auth_bypass'

const SIGNED_OUT_KEY = 'loby:auth-bypass-signed-out'

/** Hosts where emergency localStorage bypass is allowed (not custom production domains). */
export function canUseEmergencyBypassHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app')
}

function isEmergencyBypassActive(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(EMERGENCY_AUTH_BYPASS_KEY) !== '1') return false
    return canUseEmergencyBypassHost()
  } catch {
    return false
  }
}

/**
 * Build-time: `VITE_AUTH_BYPASS=true`, or browser emergency flag on safe hosts only.
 */
export function isAuthBypassEnabled(): boolean {
  if (import.meta.env.VITE_AUTH_BYPASS === 'true') return true
  return isEmergencyBypassActive()
}

export function enableEmergencyAuthBypass(): void {
  try {
    localStorage.setItem(EMERGENCY_AUTH_BYPASS_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearEmergencyAuthBypass(): void {
  try {
    localStorage.removeItem(EMERGENCY_AUTH_BYPASS_KEY)
  } catch {
    /* ignore */
  }
}

export function isAuthBypassSignedOut(): boolean {
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setAuthBypassSignedOut(): void {
  try {
    sessionStorage.setItem(SIGNED_OUT_KEY, '1')
  } catch {
    /* private mode, etc. */
  }
}

export function clearAuthBypassSignedOut(): void {
  try {
    sessionStorage.removeItem(SIGNED_OUT_KEY)
  } catch {
    /* ignore */
  }
}

/** Minimal session for UI/dev only — not valid for Supabase API calls. */
export function createBypassMockSession(): Session {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: 'dev-bypass-access-token',
    refresh_token: 'dev-bypass-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'dev@local.test',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    },
  } as Session
}
