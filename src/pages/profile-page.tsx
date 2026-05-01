import { useState } from 'react'
import { CircleUserRound, MoveLeft, MoveRight, ShieldUser } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  POST_CREATE_BUTTON_HEX,
  postTypeChipIconTrayClass,
  postTypeLucideIcon,
} from '@/components/feed/post-type-styles'
import { LogoutConfirmSheet } from '@/components/profile/logout-confirm-sheet'
import { ProfileDeleteAccountSection } from '@/components/profile/profile-delete-account-section'
import { ProfileUserSettingsCard } from '@/components/profile/profile-user-settings-card'
import { PushNotificationsPanel } from '@/components/profile/push-notifications-panel'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/** Match create-post-sheet menu rows. */
const MENU_CHOICE_ROW =
  'flex h-auto min-h-[4.25rem] w-full items-center touch-manipulation justify-between gap-3 rounded-2xl border border-border/50 bg-background px-3 py-3 text-start shadow-none hover:bg-muted/50'

const MENU_ICON_STROKE = 2 as const

const MAIN_SCROLL_BOTTOM =
  'pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]'

export function ProfilePage() {
  const { session, signOutApp } = useAuth()
  const { isAdmin, member, refetch } = useBuildingMembership()
  const navigate = useNavigate()
  const email = session?.user?.email ?? ''

  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)

  const MenuLogoutIcon = postTypeLucideIcon['דיווח']

  async function confirmLogout() {
    setLogoutBusy(true)
    try {
      await signOutApp()
      navigate('/login', { replace: true })
    } finally {
      setLogoutBusy(false)
    }
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
          onUpdated={() => refetch()}
        />

        <div className="mt-4">
          <PushNotificationsPanel />
        </div>

        {isSupabaseConfigured() ? (
          <div className="mt-4">
            <ProfileDeleteAccountSection />
          </div>
        ) : null}

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            className={cn(MENU_CHOICE_ROW, 'h-auto font-normal')}
            onClick={() => setLogoutSheetOpen(true)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  postTypeChipIconTrayClass('דיווח'),
                )}
              >
                <MenuLogoutIcon
                  className="size-5 shrink-0"
                  strokeWidth={MENU_ICON_STROKE}
                  aria-hidden
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="text-base font-semibold text-foreground">התנתקות</span>
                <span className="text-[0.8rem] font-normal text-muted-foreground">
                  יציאה מהחשבון במכשיר זה
                </span>
              </span>
            </div>
            <MoveLeft
              className="size-5 shrink-0 text-muted-foreground"
              strokeWidth={MENU_ICON_STROKE}
              aria-hidden
            />
          </Button>
        </div>
      </main>

      <LogoutConfirmSheet
        open={logoutSheetOpen}
        onOpenChange={setLogoutSheetOpen}
        busy={logoutBusy}
        onConfirmLogout={confirmLogout}
      />
    </div>
  )
}
