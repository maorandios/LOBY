import { Building2, ChevronLeft, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import { PushNotificationsPanel } from '@/components/profile/push-notifications-panel'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

export function ProfilePage() {
  const { session, signOutApp } = useAuth()
  const { isAdmin } = useBuildingMembership()
  const navigate = useNavigate()
  const email = session?.user?.email ?? ''

  async function handleLogout() {
    await signOutApp()
    navigate('/login', { replace: true })
  }

  return (
    <div
      dir="rtl"
      className="min-h-svh bg-feed-canvas pb-[calc(11rem+env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-foreground">פרופיל</h1>

        <Card className="shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <CardHeader className="text-right">
            <CardTitle className="text-base">החשבון שלך</CardTitle>
            <CardDescription className="text-pretty leading-relaxed">
              {email ? (
                <>
                  מחוברים כ־
                  <span className="font-medium text-foreground" dir="ltr">
                    {email}
                  </span>
                </>
              ) : (
                'אין כתובת מייל להצגה.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-right">
            {isAdmin ? (
              <Link
                to="/building"
                className={cn(
                  buttonVariants({ variant: 'secondary' }),
                  'h-11 w-full justify-between gap-2 rounded-xl ps-3 pe-3 font-semibold'
                )}
              >
                <ChevronLeft className="size-4 shrink-0 opacity-70" aria-hidden />
                <span className="flex flex-1 items-center justify-end gap-2">
                  <AdminBadgeCheck />
                  ניהול בניין
                  <Building2 className="size-4 text-primary" aria-hidden />
                </span>
              </Link>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full touch-manipulation gap-2 text-base border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" aria-hidden />
              התנתקות
            </Button>
          </CardContent>
        </Card>

        <div className="mt-4">
          <PushNotificationsPanel />
        </div>
      </main>
    </div>
  )
}
