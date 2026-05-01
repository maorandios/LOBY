import { Link, Outlet } from 'react-router-dom'

import { BuildingAdminHubHeader } from '@/components/admin/building-admin-hub-header'
import { buttonVariants } from '@/components/ui/button'
import { FullScreenLoading } from '@/components/ui/full-screen-loading'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

export const BUILDING_ADMIN_SHELL =
  'min-h-svh bg-feed-canvas pb-[max(1.5rem,env(safe-area-inset-bottom))]'

export function BuildingAdminLayout() {
  const { loading, isAdmin } = useBuildingMembership()

  if (loading) {
    return <FullScreenLoading />
  }

  if (!isAdmin) {
    return (
      <div className={BUILDING_ADMIN_SHELL} dir="rtl">
        <BuildingAdminHubHeader />
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
      </div>
    )
  }

  return <Outlet />
}
