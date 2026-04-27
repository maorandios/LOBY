import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let finished = false

    function goHome() {
      if (cancelled || finished) return
      finished = true
      navigate('/home', { replace: true })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        goHome()
      }
    })

    void (async () => {
      const search = new URLSearchParams(window.location.search)
      const code = search.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (!error && data.session) {
          window.history.replaceState(null, '', '/auth/callback')
          goHome()
        }
      }

      if (cancelled || finished) return

      const { data: afterCode } = await supabase.auth.getSession()
      if (cancelled) return
      if (afterCode.session) {
        goHome()
        return
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (cancelled) return
        if (!error && data.session) {
          window.history.replaceState(null, '', '/auth/callback')
          goHome()
          return
        }
      }

      await new Promise((r) => window.setTimeout(r, 2800))
      if (cancelled || finished) return

      const { data: final } = await supabase.auth.getSession()
      if (cancelled) return
      if (final.session) {
        goHome()
        return
      }

      if (!finished) {
        setFailed(true)
      }
    })()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate])

  if (failed) {
    return (
      <AuthScreenShell>
        <div className="flex min-h-[50vh] flex-col justify-center gap-6 text-right">
          <p className="text-lg font-medium text-foreground">לא הצלחנו להשלים את ההתחברות</p>
          <Button
            type="button"
            className="h-11 w-full touch-manipulation text-base"
            onClick={() => navigate('/login', { replace: true })}
          >
            חזרה להתחברות
          </Button>
        </div>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-base text-muted-foreground">משלימים התחברות…</p>
      </div>
    </AuthScreenShell>
  )
}
