import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { Button } from '@/components/ui/button'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import type { InviteBuildingRow } from '@/types/building'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const fieldClass =
  'h-12 w-full rounded-xl border border-[#d4d4d8] bg-white px-3 text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:opacity-50'

type Phase = 'loading' | 'invalid' | 'form'

function JoinInvalidScreen() {
  const navigate = useNavigate()
  return (
    <AuthScreenShell>
      <div className="flex min-h-[50vh] flex-col justify-center gap-6 text-right">
        <p className="text-lg font-medium text-foreground">קישור לא תקף</p>
        <Button
          type="button"
          className="h-12 w-full touch-manipulation rounded-xl text-base"
          onClick={() => navigate('/', { replace: true })}
        >
          חזרה
        </Button>
      </div>
    </AuthScreenShell>
  )
}

function JoinBuildingPageInner({ code }: { code: string }) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { hasBuilding, loading: membershipLoading, refetch } = useBuildingMembership()
  const [phase, setPhase] = useState<Phase>('loading')
  const [building, setBuilding] = useState<InviteBuildingRow | null>(null)
  const [fullName, setFullName] = useState('')
  const [apartment, setApartment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void supabase
      .rpc('get_invite_building', { p_code: code })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return

        if (rpcError) {
          console.error(rpcError)
          setPhase('invalid')
          return
        }

        const row = Array.isArray(data) ? data[0] : data
        if (
          !row ||
          typeof row !== 'object' ||
          !('building_id' in row) ||
          row.building_id == null
        ) {
          setPhase('invalid')
          return
        }

        const r = row as Record<string, string>
        setBuilding({
          building_id: r.building_id,
          building_name: r.building_name ?? '',
          building_address: r.building_address ?? '',
          building_city: r.building_city ?? '',
        })
        setPhase('form')
      })

    return () => {
      cancelled = true
    }
  }, [code])

  if (!membershipLoading && hasBuilding) {
    return <Navigate to="/home" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const fn = fullName.trim()
    const apt = apartment.trim()
    if (!fn || !apt) {
      setError('מלאו שם מלא ומספר דירה.')
      return
    }
    if (!session?.user?.id || !building) {
      setError('חסרים נתונים.')
      return
    }

    setSubmitting(true)
    try {
      const { error: insErr } = await supabase.from('building_members').insert({
        building_id: building.building_id,
        user_id: session.user.id,
        role: 'resident',
        full_name: fn,
        apartment_number: apt,
      })

      if (insErr) {
        setError(insErr.message ?? 'ההצטרפות נכשלה.')
        return
      }

      await refetch()
      navigate('/home', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'loading' || membershipLoading) {
    return (
      <AuthScreenShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-2 text-center">
          <p className="text-lg font-medium text-foreground">מצרפים אותך לבניין…</p>
        </div>
      </AuthScreenShell>
    )
  }

  if (phase === 'invalid') {
    return <JoinInvalidScreen />
  }

  return (
    <AuthScreenShell>
      <header className="flex flex-col gap-2 text-right">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">הצטרפות לבניין</h1>
        <p className="text-base text-muted-foreground">
          {building?.building_name}
          {building?.building_city ? ` · ${building.building_city}` : null}
        </p>
        {building?.building_address ? (
          <p className="text-sm text-muted-foreground">{building.building_address}</p>
        ) : null}
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-right">
          <label htmlFor="join-name" className="text-sm font-medium text-foreground">
            שם מלא
          </label>
          <input
            id="join-name"
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
          <label htmlFor="join-apt" className="text-sm font-medium text-foreground">
            מספר דירה
          </label>
          <input
            id="join-apt"
            name="apartment"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
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
          {submitting ? 'שומרים…' : 'הצטרף לבניין'}
        </Button>
      </form>
    </AuthScreenShell>
  )
}

export function JoinBuildingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const code = inviteCode?.trim() ?? ''

  const invalid = !code || !isSupabaseConfigured()

  if (invalid) {
    return <JoinInvalidScreen />
  }

  return <JoinBuildingPageInner code={code} />
}
