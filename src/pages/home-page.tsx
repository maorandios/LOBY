import { Building2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type HomeLocationState = { newInviteCode?: string }

export function HomePage() {
  const { session, signOutApp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { member } = useBuildingMembership()
  const email = session?.user?.email ?? ''
  const newInviteCode = (location.state as HomeLocationState | null)?.newInviteCode
  const inviteUrl =
    newInviteCode && typeof window !== 'undefined'
      ? `${window.location.origin}/join/${newInviteCode}`
      : null

  async function handleSignOut() {
    await signOutApp()
    navigate('/login', { replace: true })
  }

  return (
    <div
      className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top))]"
      dir="rtl"
    >
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10"
            aria-hidden
          >
            <Building2 className="size-7 stroke-[1.75]" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ברוכים הבאים למערכת הבניין
          </h1>
        </div>

        {inviteUrl && member?.role === 'admin' ? (
          <div className="mb-4 rounded-xl border border-[#0369a1] bg-[#e0f2fe] px-3 py-3 text-right text-sm text-[#0c4a6e]">
            <p className="mb-2 font-semibold">קישור הזמנה לדיירים</p>
            <p className="mb-2 break-all font-mono text-xs leading-relaxed" dir="ltr">
              {inviteUrl}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full border-[#0369a1] bg-white text-[#0c4a6e]"
              onClick={() => void navigator.clipboard.writeText(inviteUrl)}
            >
              העתקת קישור
            </Button>
          </div>
        ) : null}

        <Card className="shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <CardHeader className="text-right">
            <CardTitle className="text-base">התחלת עבודה</CardTitle>
            <CardDescription className="text-pretty leading-relaxed">
              כאן יוצגו בקרוב עדכונים, סקרים ודיווחים מהבניין. בינתיים אפשר לעיין בפיד
              הדוגמה ולהתרגל לניווט.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-right">
            {email ? (
              <p className="text-sm text-muted-foreground">
                מחוברים כ־
                <span className="font-medium text-foreground" dir="ltr">
                  {email}
                </span>
              </p>
            ) : null}

            <Link
              to="/feed"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'h-11 w-full touch-manipulation text-base no-underline'
              )}
            >
              מעבר לפיד הבניין
            </Link>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full touch-manipulation text-muted-foreground"
              onClick={() => void handleSignOut()}
            >
              התנתקות
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomTabBar />
    </div>
  )
}
