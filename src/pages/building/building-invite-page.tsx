import { useMemo } from 'react'
import { Copy, Share2, UserRoundPlus } from 'lucide-react'

import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BuildingAdminPageLoader } from '@/components/ui/full-screen-loading'
import { useBuildingAdminData } from '@/hooks/use-building-admin-data'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

const WA_INTRO =
  'הצטרפו לאפליקציית הבניין שלנו דרך הקישור הבא:'

export function BuildingInviteResidentsPage() {
  const { inviteCode, loading, loadError } = useBuildingAdminData()

  const inviteUrl = useMemo(() => {
    if (!inviteCode || typeof window === 'undefined') return null
    return `${window.location.origin}/join/${inviteCode}`
  }, [inviteCode])

  const showCopy = inviteUrl !== null && inviteUrl.length > 0

  function shareWhatsApp() {
    if (!inviteUrl) return
    const text = `${WA_INTRO}\n${inviteUrl}`
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="הזמנת דיירים חדשים" icon={UserRoundPlus} />
      {loading ? (
        <BuildingAdminPageLoader />
      ) : (
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          {loadError ? (
            <p className="mb-4 text-sm text-destructive">{loadError}</p>
          ) : null}
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
        </div>
      )}
    </div>
  )
}
