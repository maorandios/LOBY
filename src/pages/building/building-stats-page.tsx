import { ChartSpline } from 'lucide-react'

import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

export function BuildingStatsPage() {
  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="סטטיסטיקות" icon={ChartSpline} />
      <div className="mx-auto max-w-lg px-4 pb-8">
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          נתוני סטטיסטיקה יתווספו בגרסה הבאה.
        </p>
      </div>
    </div>
  )
}
