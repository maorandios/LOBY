import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { BottomTabBar } from '@/components/feed/bottom-tab-bar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProfilePage() {
  const { session, signOutApp } = useAuth()
  const navigate = useNavigate()
  const email = session?.user?.email ?? ''

  async function handleLogout() {
    await signOutApp()
    navigate('/login', { replace: true })
  }

  return (
    <div
      className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top))]"
      dir="rtl"
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
          <CardContent className="text-right">
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
      </main>
      <BottomTabBar />
    </div>
  )
}
