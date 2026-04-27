import type { Session } from '@supabase/supabase-js'

/** When set to the string `"true"`, the app skips Supabase Auth and uses a mock session. */
export function isAuthBypassEnabled(): boolean {
  return import.meta.env.VITE_AUTH_BYPASS === 'true'
}

const SIGNED_OUT_KEY = 'loby:auth-bypass-signed-out'

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
