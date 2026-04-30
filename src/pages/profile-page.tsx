import {
  Building2,
  ChevronLeft,
  CircleUserRound,
  LogOut,
  MoveRight,
  ShieldUser,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import { PushNotificationsPanel } from '@/components/profile/push-notifications-panel'
import { ProfileUserSettingsCard } from '@/components/profile/profile-user-settings-card'
import { POST_CREATE_BUTTON_HEX } from '@/components/feed/post-type-styles'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

/** Match {@link BottomTabBar} / post-detail bottom strips. */
const PROFILE_BOTTOM_BAR_CHROME =
  'border-t border-zinc-200/70 bg-feed-canvas backdrop-blur-xl supports-[backdrop-filter]:bg-feed-canvas/90 dark:border-white/10'

const MAIN_SCROLL_BOTTOM =
  'pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]'

export function ProfilePage() {
  const { session, signOutApp } = useAuth()
  const { isAdmin, member } = useBuildingMembership()
  const navigate = useNavigate()
  const email = session?.user?.email ?? ''

  async function handleLogout() {
    await signOutApp()
    navigate('/login', { replace: true })
  }

  function handleBack() {
    navigate('/feed')
  }

  return (
    <div dir="rtl" className="min-h-svh bg-feed-canvas">
      <div className="bg-feed-canvas pt-[env(safe-area-inset-top)]">
        <header className="pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          {/*
            dir=ltr: physical left → admin (/building); physical right → חזרה (/feed).
            Title is absolutely centered; side columns fixed width for symmetry.
          */}
          <div
            dir="ltr"
            className="relative mx-auto flex min-h-10 w-full max-w-lg items-center px-2"
          >
            <div className="z-10 flex w-[6.25rem] shrink-0 items-center justify-start">
              {isAdmin ? (
                <Link
                  to="/building"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'inline-flex size-10 shrink-0 touch-manipulation rounded-full text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="ניהול בניין"
                >
                  <ShieldUser
                    className="size-[1.125rem] shrink-0"
                    style={{ color: POST_CREATE_BUTTON_HEX }}
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              ) : (
                <span className="inline-flex size-10 shrink-0" aria-hidden />
              )}
            </div>

            <div className="min-w-0 flex-1 shrink" aria-hidden />

            <div className="z-10 flex w-[6.25rem] shrink-0 justify-end">
              <button
                type="button"
                onClick={() => handleBack()}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'inline-flex min-h-10 shrink-0 items-center touch-manipulation gap-2 rounded-full px-2.5 ps-3 text-muted-foreground sm:px-3'
                )}
              >
                חזרה
                <MoveRight
                  className="size-4 shrink-0 opacity-90"
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
            </div>

            <div
              dir="rtl"
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex max-w-[min(17rem,calc(100vw-9rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 text-center sm:max-w-[16rem]"
            >
              <CircleUserRound
                className="size-5 shrink-0 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                הגדרות חשבון
              </h1>
            </div>
          </div>
        </header>
      </div>

      <main
        className={cn(
          'mx-auto max-w-lg px-4 py-4',
          MAIN_SCROLL_BOTTOM
        )}
      >
        <ProfileUserSettingsCard
          fullName={member?.full_name}
          email={email || undefined}
          phone={member?.phone}
          apartmentNumber={member?.apartment_number}
        />

        {isAdmin ? (
          <Card className="mt-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="flex flex-col gap-0 p-4 sm:p-6">
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
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-4">
          <PushNotificationsPanel />
        </div>
      </main>

      <div className={cn('fixed inset-x-0 bottom-0 z-40', PROFILE_BOTTOM_BAR_CHROME)}>
        <div className="mx-auto w-full max-w-lg px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full touch-manipulation gap-2 rounded-full border-destructive/40 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            התנתקות
          </Button>
        </div>
      </div>
    </div>
  )
}
