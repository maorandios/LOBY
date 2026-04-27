import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { Button } from '@/components/ui/button'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { generateInviteCode } from '@/lib/invite-code'
import { OnboardingLoadingPage } from '@/pages/onboarding-loading-page'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const fieldClass =
  'h-12 w-full rounded-xl border border-[#d4d4d8] bg-white px-3 text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:opacity-50'

export function OnboardingAdminPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { hasBuilding, loading: membershipLoading, refetch } = useBuildingMembership()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membershipLoading && hasBuilding) {
      navigate('/home', { replace: true })
    }
  }, [hasBuilding, membershipLoading, navigate])

  if (membershipLoading) {
    return <OnboardingLoadingPage />
  }

  if (hasBuilding) {
    return <Navigate to="/home" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const n = name.trim()
    const a = address.trim()
    const c = city.trim()
    if (!n || !a || !c) {
      setError('מלאו את כל השדות.')
      return
    }
    if (!session?.user?.id) {
      setError('אין משתמש מחובר.')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('חסרות הגדרות Supabase.')
      return
    }

    setSubmitting(true)
    try {
      const { data: building, error: bErr } = await supabase
        .from('buildings')
        .insert({ name: n, address: a, city: c })
        .select('id')
        .single()

      if (bErr || !building) {
        setError(bErr?.message ?? 'יצירת הבניין נכשלה.')
        return
      }

      const { error: mErr } = await supabase.from('building_members').insert({
        building_id: building.id,
        user_id: session.user.id,
        role: 'admin',
      })

      if (mErr) {
        setError(mErr.message ?? 'שמירת מנהל נכשלה.')
        return
      }

      const code = generateInviteCode()
      const { error: iErr } = await supabase.from('invite_codes').insert({
        code,
        building_id: building.id,
      })

      if (iErr) {
        setError(iErr.message ?? 'יצירת קוד הזמנה נכשלה.')
        return
      }

      await refetch()
      navigate('/home', { replace: true, state: { newInviteCode: code } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreenShell>
      <header className="flex flex-col gap-2 text-right">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">צור בניין</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          פרטי הבניין נשמרים במערכת. אחרי היצירה תוכלו להזמין דיירים בקישור ייעודי.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-right">
          <label htmlFor="ob-name" className="text-sm font-medium text-foreground">
            שם הבניין
          </label>
          <input
            id="ob-name"
            name="name"
            type="text"
            autoComplete="organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2 text-right">
          <label htmlFor="ob-address" className="text-sm font-medium text-foreground">
            כתובת
          </label>
          <input
            id="ob-address"
            name="address"
            type="text"
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={submitting}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2 text-right">
          <label htmlFor="ob-city" className="text-sm font-medium text-foreground">
            עיר
          </label>
          <input
            id="ob-city"
            name="city"
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={submitting}
            className={fieldClass}
          />
        </div>

        {error ? (
          <p
            className="rounded-xl border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-right text-sm text-[#991b1b]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full touch-manipulation rounded-xl text-base"
        >
          {submitting ? 'יוצרים…' : 'צור בניין'}
        </Button>
      </form>
    </AuthScreenShell>
  )
}
