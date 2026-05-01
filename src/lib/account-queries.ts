import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/** Invokes Edge Function — deletes Auth user (+ DB cascades); caller should signOut and redirect. */
export async function deleteAccountViaEdge(): Promise<{
  ok: boolean
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'לא ניתן למחוק — אין הגדרות שרת.' }
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean
      error?: string
    }>('delete-account', { method: 'POST', body: {} })

    if (error != null) {
      return {
        ok: false,
        error: error.message || 'לא ניתן למחוק את החשבון כעת.',
      }
    }

    if (!data?.ok) {
      return mapServerErrorBody(data?.error)
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'לא ניתן למחוק את החשבון כעת.' }
  }
}

function mapServerErrorBody(code: string | undefined): {
  ok: false
  error: string
} {
  switch (code) {
    case 'unauthorized':
    case 'invalid_session':
      return { ok: false, error: 'ההתחברות פגה — התחברו שוב ונסו מאוחר יותר.' }
    case 'delete_failed':
      return {
        ok: false,
        error: 'המחיקה נכשלה. נסו שוב או צרו קשר עם התמיכה.',
      }
    default:
      return { ok: false, error: 'לא ניתן למחוק את החשבון כעת.' }
  }
}
