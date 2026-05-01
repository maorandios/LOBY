import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, Copy, MessageCircleCheck, UserRoundPlus } from 'lucide-react'

import { AdminMenuActionRow } from '@/components/admin/admin-menu-choice-row'
import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'
import { BuildingAdminPageLoader } from '@/components/ui/full-screen-loading'
import {
  type BuildingAdminBuildingRow,
  useBuildingAdminData,
} from '@/hooks/use-building-admin-data'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

function formatBuildingAddressForShare(
  b: BuildingAdminBuildingRow | null,
): string {
  if (!b) return ''
  const full = b.full_address?.trim()
  if (full) return full
  const street = b.street_name?.trim() ?? ''
  const num = b.building_number?.trim() ?? ''
  const city = b.city?.trim() ?? ''
  const streetLine = [street, num].filter(Boolean).join(' ')
  return [streetLine, city].filter(Boolean).join(', ')
}

const INTRO_COPY =
  'הזמינו דיירים להצטרף, שלחו להם את הקישור באמצעות העתקה או שליחה ישירה דרך הוואטצאפ'

const COPY_SUBTITLE =
  'לחצו כדי להעתיק את הלינק להצטרפות ושלחו לדיריים'

const COPY_TITLE = 'העתקת קישור'

const SHARE_SUBTITLE = 'לחצו כדי לשתף את הלינק בוואטצאפ'

const SHARE_TITLE = 'שיתוף בוואטצאפ'

function buildWhatsAppInviteText(
  inviteUrl: string,
  building: BuildingAdminBuildingRow | null,
): string {
  const address = formatBuildingAddressForShare(building)
  return [
    'היי,',
    'מצורף לינק התחברות לאפליקציית הבלוק - תקשורת בין דיירים שעובדת!',
    `כתובת הבניין היא ${address || '—'}`,
    `מחכים לכם שם - ${inviteUrl}`,
  ].join('\n')
}

export function BuildingInviteResidentsPage() {
  const { inviteCode, building, loading, loadError } = useBuildingAdminData()
  const [copyToastOpen, setCopyToastOpen] = useState(false)

  const inviteUrl = useMemo(() => {
    if (!inviteCode || typeof window === 'undefined') return null
    return `${window.location.origin}/join/${inviteCode}`
  }, [inviteCode])

  const showCopy = inviteUrl !== null && inviteUrl.length > 0

  useEffect(() => {
    if (!copyToastOpen) return
    const id = window.setTimeout(() => setCopyToastOpen(false), 2600)
    return () => window.clearTimeout(id)
  }, [copyToastOpen])

  async function copyLink() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopyToastOpen(true)
    } catch {
      /* ignore */
    }
  }

  function shareWhatsApp() {
    if (!inviteUrl) return
    const text = buildWhatsAppInviteText(inviteUrl, building)
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="הזמנת דיירים חדשים" icon={UserRoundPlus} />
      {loading ? (
        <BuildingAdminPageLoader />
      ) : (
        <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-6">
          {loadError ? (
            <p className="mb-4 text-sm text-destructive">{loadError}</p>
          ) : null}

          <p className="mb-8 text-sm font-medium leading-relaxed text-pretty text-muted-foreground">
            {INTRO_COPY}
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <AdminMenuActionRow
              title={COPY_TITLE}
              subtitle={COPY_SUBTITLE}
              icon={Copy}
              disabled={!showCopy}
              onClick={() => void copyLink()}
            />
            <AdminMenuActionRow
              title={SHARE_TITLE}
              subtitle={SHARE_SUBTITLE}
              icon={MessageCircleCheck}
              variant="whatsappInvite"
              disabled={!showCopy}
              onClick={() => shareWhatsApp()}
            />
          </div>
        </div>
      )}

      {copyToastOpen ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          role="status"
          aria-live="polite"
        >
          <div
            dir="rtl"
            className="flex max-w-md items-center gap-2.5 rounded-full bg-zinc-800 px-5 py-3.5 text-white shadow-lg dark:bg-zinc-700"
          >
            <CircleCheck
              className="size-5 shrink-0 text-white"
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-sm font-medium leading-snug text-white">
              הלינק הועתק
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
