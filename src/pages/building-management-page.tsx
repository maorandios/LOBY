import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Copy, Share2 } from 'lucide-react'

import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { ProfileCornerLink } from '@/components/feed/feed-header'
import {
  Button,
  buttonVariants,
} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { BuildingMemberRole } from '@/types/building'

type MemberRow = {
  user_id: string
  role: BuildingMemberRole
  full_name: string | null
  apartment_number: string | null
}

type BuildingRow = {
  full_address: string
  city: string
  street_name: string
  building_number: string
}

const WA_INTRO =
  'הצטרפו לאפליקציית הבניין שלנו דרך הקישור הבא:'

export function BuildingManagementPage() {
  const { loading: membershipLoading, isAdmin, currentBuildingId, member } =
    useBuildingMembership()
  const [building, setBuilding] = useState<BuildingRow | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [actionUser, setActionUser] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadPage = useCallback(async () => {
    if (!currentBuildingId || !member) {
      setPageLoading(false)
      return
    }
    setPageLoading(true)
    setLoadError(null)
    try {
      const [bRes, codeRes, mRes] = await Promise.all([
        supabase
          .from('buildings')
          .select(
            'full_address, city, street_name, building_number'
          )
          .eq('id', currentBuildingId)
          .maybeSingle(),
        supabase
          .from('invite_codes')
          .select('code')
          .eq('building_id', currentBuildingId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('building_members')
          .select('user_id, role, full_name, apartment_number')
          .eq('building_id', currentBuildingId)
          .order('apartment_number', { ascending: true }),
      ])

      if (bRes.error) throw bRes.error
      if (codeRes.error) throw codeRes.error
      if (mRes.error) throw mRes.error

      setBuilding((bRes.data ?? null) as BuildingRow | null)
      setInviteCode((codeRes.data?.code as string) ?? null)
      setMembers((mRes.data ?? []) as MemberRow[])
    } catch (e) {
      console.error(e)
      setLoadError('לא ניתן לטעון את נתוני הבניין')
      setBuilding(null)
      setInviteCode(null)
      setMembers([])
    } finally {
      setPageLoading(false)
    }
  }, [currentBuildingId, member])

  useEffect(() => {
    if (!membershipLoading && isAdmin && currentBuildingId) void loadPage()
    if (!membershipLoading && !isAdmin) setPageLoading(false)
  }, [membershipLoading, isAdmin, currentBuildingId, loadPage])

  const inviteUrl = useMemo(() => {
    if (!inviteCode || typeof window === 'undefined') return null
    return `${window.location.origin}/join/${inviteCode}`
  }, [inviteCode])

  const admins = useMemo(
    () => members.filter((m) => m.role === 'admin'),
    [members]
  )
  const residents = useMemo(
    () => members.filter((m) => m.role === 'resident'),
    [members]
  )

  const adminCount = admins.length

  function mapRpcError(msg: string): string {
    if (msg.includes('max_admins')) return 'ניתן להגדיר עד 5 מנהלי בניין'
    if (msg.includes('last_admin')) return 'לא ניתן להסיר את מנהל הבניין האחרון'
    if (msg.includes('forbidden')) return 'אין הרשאה לבצע פעולה זו'
    return msg
  }

  async function setRole(targetUserId: string, newRole: BuildingMemberRole) {
    setActionError(null)
    setActionUser(targetUserId)
    try {
      const { error } = await supabase.rpc('admin_set_member_role', {
        p_target_user_id: targetUserId,
        p_new_role: newRole,
      })
      if (error) {
        setActionError(mapRpcError(error.message))
        return
      }
      await loadPage()
    } finally {
      setActionUser(null)
    }
  }

  function displayName(m: MemberRow): string {
    const n = m.full_name?.trim()
    return n || 'דייר'
  }

  function apartment(m: MemberRow): string {
    const a = m.apartment_number?.trim()
    return a && a.length > 0 ? a : '—'
  }

  function shareWhatsApp() {
    if (!inviteUrl) return
    const text = `${WA_INTRO}\n${inviteUrl}`
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  if (membershipLoading || (isAdmin && pageLoading)) {
    return (
      <div
        className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top)]"
        dir="rtl"
      >
        <ProfileCornerLink />
        <div className="mx-auto max-w-lg px-4 py-8">
          <p className="text-sm text-muted-foreground">טוען…</p>
        </div>
        <BottomTabBar />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top)]"
        dir="rtl"
      >
        <ProfileCornerLink />
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="text-center text-base font-medium text-foreground">
            אין לך הרשאה לצפות בעמוד זה
          </p>
          <Link
            to="/profile"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'mx-auto mt-6 flex h-11 items-center justify-center rounded-full'
            )}
          >
            חזרה לפרופיל
          </Link>
        </main>
        <BottomTabBar />
      </div>
    )
  }

  const showCopy = inviteUrl !== null && inviteUrl.length > 0

  return (
    <div
      className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top)]"
      dir="rtl"
    >
      <ProfileCornerLink />
      <div className="mx-auto max-w-lg px-4 pb-8 pt-[max(3rem,env(safe-area-inset-top)-0.25rem)]">
        <Link
          to="/profile"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-muted-foreground touch-manipulation"
        >
          <ArrowRight className="size-4" aria-hidden />
          חזרה לפרופיל
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <Building2 className="size-6 text-primary" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ניהול בניין
          </h1>
        </div>

        {loadError ? (
          <p className="mb-4 text-sm text-destructive">{loadError}</p>
        ) : null}
        {actionError ? (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        {/* פרטי הבניין */}
        <section className="mb-6" aria-labelledby="building-details-heading">
          <h2 id="building-details-heading" className="mb-3 text-sm font-semibold text-foreground">
            פרטי הבניין
          </h2>
          <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
            <CardHeader className="text-right">
              <CardTitle className="text-base">כתובת</CardTitle>
              <CardDescription className="text-pretty leading-relaxed">
                {building?.full_address ?? '—'}
              </CardDescription>
            </CardHeader>
            {building?.city ? (
              <CardContent className="pt-0 text-right text-sm text-muted-foreground">
                עיר: {building.city}
              </CardContent>
            ) : null}
          </Card>
        </section>

        {/* הזמנת דיירים */}
        <section className="mb-6" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="mb-3 text-sm font-semibold text-foreground">
            הזמנת דיירים
          </h2>
          <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
            <CardHeader className="text-right">
              <CardTitle className="text-base">קישור הצטרפות</CardTitle>
              <CardDescription className="break-all font-mono text-xs" dir="ltr">
                {showCopy ? inviteUrl : 'לא נמצא קוד הזמנה.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl font-semibold"
                disabled={!showCopy}
                onClick={() =>
                  showCopy &&
                  void navigator.clipboard.writeText(inviteUrl).catch(() => {})
                }
              >
                <Copy className="size-4" aria-hidden />
                העתק קישור
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full rounded-xl font-semibold"
                disabled={!showCopy}
                onClick={() => shareWhatsApp()}
              >
                <Share2 className="size-4" aria-hidden />
                שתף בוואטסאפ
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* דיירים */}
        <section className="mb-6" aria-labelledby="residents-heading">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="residents-heading" className="text-sm font-semibold text-foreground">
              דיירים
            </h2>
            <span className="text-xs text-muted-foreground">
              מנהלים: {adminCount}/5 לכל היותר
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {residents.map((m) => (
              <li key={m.user_id}>
                <Card className="border-border/70">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{displayName(m)}</p>
                      <p className="text-sm text-muted-foreground">
                        דירה {apartment(m)}
                      </p>
                      <span
                        className={cn(
                          'mt-2 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                          'bg-muted text-foreground'
                        )}
                      >
                        דייר
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 rounded-full"
                      disabled={actionUser !== null || adminCount >= 5}
                      onClick={() => void setRole(m.user_id, 'admin')}
                    >
                      {actionUser === m.user_id ? '…' : 'הפוך למנהל'}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
            {residents.length === 0 ? (
              <li className="text-sm text-muted-foreground">אין דיירים רגילים ברשימה.</li>
            ) : null}
          </ul>
        </section>

        {/* צוות ועד */}
        <section className="mb-6" aria-labelledby="committee-heading">
          <h2 id="committee-heading" className="mb-3 text-sm font-semibold text-foreground">
            צוות ועד
          </h2>
          <ul className="flex flex-col gap-2">
            {admins.map((m) => (
              <li key={m.user_id}>
                <Card className="border-border/70">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{displayName(m)}</p>
                      <p className="text-sm text-muted-foreground">
                        דירה {apartment(m)}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-primary/12 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                        ועד
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 rounded-full"
                      disabled={actionUser !== null || adminCount <= 1}
                      onClick={() => void setRole(m.user_id, 'resident')}
                    >
                      {actionUser === m.user_id ? '…' : 'החזר לדייר'}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <BottomTabBar />
    </div>
  )
}
