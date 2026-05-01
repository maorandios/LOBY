import { BuildingAdminSectionHeader } from '@/components/admin/building-admin-section-header'
import { BuildingSettingsCard } from '@/components/admin/building-settings-card'
import { BuildingAdminPageLoader } from '@/components/ui/full-screen-loading'
import { useBuildingAdminData } from '@/hooks/use-building-admin-data'
import { ShieldCog } from 'lucide-react'

import { BUILDING_ADMIN_SHELL } from './building-admin-layout'

export function BuildingSettingsPage() {
  const { building, buildingId, loading, loadError, refetch } = useBuildingAdminData()

  return (
    <div className={BUILDING_ADMIN_SHELL} dir="rtl">
      <BuildingAdminSectionHeader title="הגדרות בניין" icon={ShieldCog} />
      {loading ? (
        <BuildingAdminPageLoader />
      ) : (
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          {loadError ? (
            <p className="mb-4 text-sm text-destructive">{loadError}</p>
          ) : null}
          {building ? (
            <BuildingSettingsCard
              buildingId={buildingId}
              city={building.city}
              streetName={building.street_name}
              buildingNumber={building.building_number}
              fullAddress={building.full_address}
              onUpdated={() => void refetch()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">לא נמצאו נתוני בניין.</p>
          )}
        </div>
      )}
    </div>
  )
}
