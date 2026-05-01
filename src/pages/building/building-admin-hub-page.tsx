import {
  BadgeCheck,
  ChartSpline,
  ShieldCog,
  TableProperties,
  UserRoundPlus,
} from 'lucide-react'

import { AdminMenuChoiceRow } from '@/components/admin/admin-menu-choice-row'
import { BuildingAdminHubHeader } from '@/components/admin/building-admin-hub-header'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

export function BuildingAdminHubPage() {
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
          to="/building/pending"
          icon={BadgeCheck}
          title="דיירים ממתינים לאישור"
          subtitle="אשרו דיירים שביקשו להצטרף לבניין"
        />
        <AdminMenuChoiceRow
          to="/building/invite"
          icon={UserRoundPlus}
          title="הזמנת דיירים חדשים"
          subtitle="שתפו את הקישור ייחודי לצירוף דיירים חדשים"
        />
        <AdminMenuChoiceRow
          to="/building/stats"
          icon={ChartSpline}
          title="סטטיסטיקות"
          subtitle="תצוגת מנהלים של פעילות הבניין"
        />
      </div>
    </div>
  )
}
