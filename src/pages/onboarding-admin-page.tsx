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
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [streetName, setStreetName] = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membershipLoading && hasBuilding) {
      navigate('/feed', { replace: true })
    }
  }, [hasBuilding, membershipLoading, navigate])

  if (membershipLoading) {
    return <OnboardingLoadingPage />
  }

  if (hasBuilding) {
    return <Navigate to="/feed" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const fn = fullName.trim()
    const ph = phone.trim()
    const apt = apartmentNumber.trim()
    const street = streetName.trim()
    const bnum = buildingNumber.trim()
    const c = city.trim()
    if (!fn || !ph || !apt || !street || !bnum || !c) {
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
        .insert({
          street_name: street,
          building_number: bnum,
          city: c,
          created_by: session.user.id,
        })
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
        full_name: fn,
        phone: ph,
        apartment_number: apt,
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
      navigate('/feed', { replace: true, state: { newInviteCode: code } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreenShell>
      <header className="flex flex-col gap-2 text-right">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">צור בניין</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          פרטים אישיים ופרטי הבניין נשמרים במערכת. כתובת מלאה נוצרת אוטומטית (למשל: העצמאות 24,
          ירושלים).
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2
            dir="ltr"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            PERSONAL DETAILS
          </h2>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-full-name" className="text-sm font-medium text-foreground">
              שם מלא
            </label>
            <input
              id="ob-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-phone" className="text-sm font-medium text-foreground">
              מספר טלפון
            </label>
            <input
              id="ob-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-apt" className="text-sm font-medium text-foreground">
              מספר דירה בבניין
            </label>
            <input
              id="ob-apt"
              name="apartmentNumber"
              type="text"
              autoComplete="off"
              value={apartmentNumber}
              onChange={(e) => setApartmentNumber(e.target.value)}
              disabled={submitting}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2
            dir="ltr"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            BUILDING DETAILS
          </h2>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-street" className="text-sm font-medium text-foreground">
              שם הרחוב
            </label>
            <input
              id="ob-street"
              name="streetName"
              type="text"
              autoComplete="street-address"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              disabled={submitting}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-building-num" className="text-sm font-medium text-foreground">
              מספר הבניין
            </label>
            <input
              id="ob-building-num"
              name="buildingNumber"
              type="text"
              autoComplete="off"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
              disabled={submitting}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="ob-city" className="text-sm font-medium text-foreground">
              שם העיר
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
