import { BadgeCheck } from 'lucide-react'

import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

export function BuildingPendingApprovalsPage() {
  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="דיירים ממתינים לאישור" icon={BadgeCheck} />
      <div className="mx-auto max-w-lg px-4 pb-8">
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          אין כרגע בקשות המתינות לאישור. כשיהיו — יופיעו כאן.
        </p>
      </div>
    </div>
  )
}
