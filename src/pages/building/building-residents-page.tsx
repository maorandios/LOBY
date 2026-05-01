import { useMemo, useState } from 'react'
import { ShieldUser, TableProperties, Trash2, UserRound } from 'lucide-react'

import { AdminRemoveMemberSheet } from '@/components/admin/admin-remove-member-sheet'
import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'
import { POST_CREATE_BUTTON_HEX } from '@/components/feed/post-type-styles'
import { Button } from '@/components/ui/button'
import { BuildingAdminPageLoader } from '@/components/ui/full-screen-loading'
import { useBuildingAdminData } from '@/hooks/use-building-admin-data'
import type { BuildingAdminMemberRow } from '@/hooks/use-building-admin-data'
import { adminRemoveBuildingMember } from '@/lib/building-admin-queries'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { BuildingMemberRole } from '@/types/building'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

const CARD_SURFACE = cn(
  'rounded-2xl border border-border/80 bg-background',
  'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]'
)

/** Label ~0.625rem × 1.25 */
const METRIC_LABEL =
  'text-[0.78125rem] font-semibold leading-tight text-muted-foreground sm:text-[0.859375rem]'
/** Value ~2.25rem × 2 */
const METRIC_VALUE =
  'text-center text-[4.5rem] font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-[4.75rem]'

function apartmentSortKey(raw: string | null): { num: number; rest: string } {
  const s = (raw ?? '').trim()
  if (!s) return { num: Number.POSITIVE_INFINITY, rest: '' }
  const m = s.match(/^(\d+)/u)
  if (m) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) return { num: n, rest: s.slice(m[1].length) }
  }
  return { num: Number.POSITIVE_INFINITY, rest: s }
}

function compareMembersByApartment(
  a: BuildingAdminMemberRow,
  b: BuildingAdminMemberRow
): number {
  const ka = apartmentSortKey(a.apartment_number)
  const kb = apartmentSortKey(b.apartment_number)
  if (ka.num !== kb.num) return ka.num - kb.num
  return ka.rest.localeCompare(kb.rest, 'he', { numeric: true })
}

export function BuildingResidentsPage() {
  const { members, loading, loadError, refetch } = useBuildingAdminData()
  const [actionUser, setActionUser] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [removeTarget, setRemoveTarget] = useState<BuildingAdminMemberRow | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const sortedMembers = useMemo(
    () => [...members].sort(compareMembersByApartment),
    [members]
  )

  const adminCount = useMemo(
    () => members.filter((m) => m.role === 'admin').length,
    [members]
  )

  const residentCount = useMemo(
    () => members.filter((m) => m.role === 'resident').length,
    [members]
  )

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
      await refetch()
    } finally {
      setActionUser(null)
    }
  }

  function openRemoveSheet(m: BuildingAdminMemberRow) {
    setRemoveError(null)
    setRemoveTarget(m)
  }

  function onRemoveSheetOpenChange(open: boolean) {
    if (!open) {
      setRemoveTarget(null)
      setRemoveError(null)
    }
  }

  async function confirmRemoveMember() {
    if (!removeTarget) return
    setRemoveError(null)
    setRemoveBusy(true)
    try {
      const res = await adminRemoveBuildingMember(removeTarget.user_id)
      if (!res.ok) {
        setRemoveError(res.error ?? 'לא ניתן להסיר')
        return
      }
      onRemoveSheetOpenChange(false)
      await refetch()
    } finally {
      setRemoveBusy(false)
    }
  }

  function displayName(m: BuildingAdminMemberRow): string {
    const n = m.full_name?.trim()
    return n || 'דייר'
  }

  function apartment(m: BuildingAdminMemberRow): string {
    const a = m.apartment_number?.trim()
    return a && a.length > 0 ? a : '—'
  }

  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="רשימת דיירים" icon={TableProperties} />
      {loading ? (
        <BuildingAdminPageLoader />
      ) : (
        <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-6">
          {loadError ? (
            <p className="mb-4 text-sm text-destructive">{loadError}</p>
          ) : null}
          {actionError ? (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <div className="mb-8 mt-1 grid grid-cols-2 gap-3">
            <div
              className={cn(
                CARD_SURFACE,
                'flex aspect-square min-h-0 w-full flex-col items-center justify-center gap-2 px-2 py-3 sm:gap-2.5 sm:px-3'
              )}
            >
              <div
                className="flex flex-row items-center justify-center gap-1.5 sm:gap-2"
                dir="rtl"
              >
                <UserRound
                  className="size-5 shrink-0 text-muted-foreground"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={METRIC_LABEL}>דיירים</span>
              </div>
              <span className={METRIC_VALUE}>{residentCount}</span>
            </div>
            <div
              className={cn(
                CARD_SURFACE,
                'flex aspect-square min-h-0 w-full flex-col items-center justify-center gap-2 px-2 py-3 sm:gap-2.5 sm:px-3'
              )}
            >
              <div
                className="flex flex-row items-center justify-center gap-1.5 sm:gap-2"
                dir="rtl"
              >
                <ShieldUser
                  className="size-5 shrink-0"
                  style={{ color: POST_CREATE_BUTTON_HEX }}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={METRIC_LABEL}>חברי ועד</span>
              </div>
              <span className={METRIC_VALUE}>{adminCount}</span>
            </div>
          </div>

          {sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין דיירים ברשימה.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {sortedMembers.map((m) => {
                const busy = actionUser === m.user_id
                const isAdminMember = m.role === 'admin'
                return (
                  <li key={m.user_id}>
                    <div
                      className={cn(
                        CARD_SURFACE,
                        'flex flex-row items-center gap-2 px-3 py-3 sm:gap-3 sm:px-3.5'
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {isAdminMember ? (
                          <span
                            className="flex size-9 shrink-0 items-center justify-center self-center"
                            aria-hidden
                          >
                            <ShieldUser
                              className="size-[1.25rem] shrink-0"
                              style={{ color: POST_CREATE_BUTTON_HEX }}
                              strokeWidth={2}
                            />
                          </span>
                        ) : (
                          <span
                            className="flex size-9 shrink-0 items-center justify-center self-center text-muted-foreground"
                            aria-hidden
                          >
                            <UserRound className="size-[1.25rem]" strokeWidth={2} />
                          </span>
                        )}
                        <div className="min-w-0 text-start">
                          <p className="truncate font-semibold text-foreground">
                            {displayName(m)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            דירה {apartment(m)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-row items-center gap-1">
                        {isAdminMember ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold sm:text-sm"
                            disabled={actionUser !== null || adminCount <= 1}
                            onClick={() => void setRole(m.user_id, 'resident')}
                          >
                            {busy ? '…' : 'החזר לדייר'}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold sm:text-sm"
                            disabled={actionUser !== null || adminCount >= 5}
                            onClick={() => void setRole(m.user_id, 'admin')}
                          >
                            {busy ? '…' : 'קדם לוועד'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                          disabled={
                            actionUser !== null || (isAdminMember && adminCount <= 1)
                          }
                          aria-label={`הסרת ${displayName(m)} מהבניין`}
                          title={
                            isAdminMember && adminCount <= 1
                              ? 'לא ניתן להסיר את מנהל הבניין האחרון'
                              : undefined
                          }
                          onClick={() => openRemoveSheet(m)}
                        >
                          <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <AdminRemoveMemberSheet
        open={removeTarget !== null}
        onOpenChange={onRemoveSheetOpenChange}
        busy={removeBusy}
        error={removeError}
        displayName={removeTarget ? displayName(removeTarget) : ''}
        apartmentLabel={removeTarget ? apartment(removeTarget) : '—'}
        onConfirmRemove={confirmRemoveMember}
      />
    </div>
  )
}
