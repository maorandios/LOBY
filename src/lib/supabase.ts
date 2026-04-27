import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * createClient throws if the URL is empty. Use placeholders so the app can boot without .env
 * (login UI shows a configuration message; avoid a blank screen).
 */
const supabaseUrl = envUrl || 'https://placeholder.supabase.co'
const supabaseAnonKey = envAnonKey || 'sb-placeholder-anon-key-not-configured'

/**
 * Browser client with default session persistence (localStorage), refresh, and URL detection for magic links.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(envUrl && envAnonKey)
}
