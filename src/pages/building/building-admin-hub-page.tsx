import { useEffect, useState } from 'react'
import {
  ChartSpline,
  CircleCheck,
  CreditCard,
  ShieldCog,
  TableProperties,
  UserRoundPlus,
} from 'lucide-react'

import {
  AdminMenuActionRow,
  AdminMenuChoiceRow,
} from '@/components/admin/admin-menu-choice-row'
import { BuildingAdminHubHeader } from '@/components/admin/building-admin-hub-header'
import { typeBadgeClass } from '@/components/feed/post-type-styles'
import { cn } from '@/lib/utils'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

const POLL_CHIP_SURFACE =
  'inline-flex max-w-full items-center rounded-full px-[0.425rem] py-[5px] text-[0.595rem] font-semibold tracking-tight'

export function BuildingAdminHubPage() {
  const [inDevToastOpen, setInDevToastOpen] = useState(false)

  useEffect(() => {
    if (!inDevToastOpen) return
    const id = window.setTimeout(() => setInDevToastOpen(false), 2600)
    return () => window.clearTimeout(id)
  }, [inDevToastOpen])

  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminHubHeader />
      <div className="mx-auto flex max-w-lg flex-col gap-2 px-4 pb-8 pt-8">
        <AdminMenuChoiceRow
          to="/building/settings"
          icon={ShieldCog}
          title="הגדרות בניין"
          subtitle="פרטים בסיסיים של הבניין"
        />
        <AdminMenuChoiceRow
          to="/building/residents"
          icon={TableProperties}
          title="רשימת דיירים"
          subtitle="ניהול דיירים והרשאות ועד בית"
        />
        <AdminMenuChoiceRow
          to="/building/invite"
          icon={UserRoundPlus}
          title="הזמנת דיירים חדשים"
          subtitle="שתפו את הקישור ייחודי לצירוף דיירים חדשים"
        />
        <AdminMenuActionRow
          icon={ChartSpline}
          title="סטטיסטיקות"
          subtitle="תצוגת מנהלים של פעילות הבניין"
          onClick={() => setInDevToastOpen(true)}
          trailingChip={
            <span className={cn(POLL_CHIP_SURFACE, typeBadgeClass('הצבעה'))}>בפיתוח</span>
          }
        />
        <AdminMenuActionRow
          icon={CreditCard}
          title="ניהול מנוי"
          subtitle="רכשו מנוי שנתי או בטלו את המנוי הקיים"
          onClick={() => setInDevToastOpen(true)}
          trailingChip={
            <span className={cn(POLL_CHIP_SURFACE, typeBadgeClass('הצבעה'))}>בפיתוח</span>
          }
        />
      </div>

      {inDevToastOpen ? (
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
            <span className="text-sm font-medium leading-snug text-white">נמצא בפיתוח</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
