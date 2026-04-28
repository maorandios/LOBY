import { BellRing, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  ensureServiceWorker,
  getVapidPublicKey,
  isAppleMobileDevice,
  isWebPushSupported,
  loadPushSubscriptionState,
  subscribeAndSave,
  unsubscribeAndRemove,
} from '@/lib/web-push'

type UiState =
  | 'loading'
  | 'unsupported'
  | 'unsupported_ios'
  | 'no_supabase'
  | 'need_vapid'
  | 'no_building'
  | 'blocked'
  | 'inactive'
  | 'active'

export function PushNotificationsPanel() {
  const { member, loading: memberLoading } = useBuildingMembership()
  const [ui, setUi] = useState<UiState>('loading')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUi('no_supabase')
      return
    }
    if (!isWebPushSupported()) {
      setUi(isAppleMobileDevice() ? 'unsupported_ios' : 'unsupported')
      return
    }
    if (!getVapidPublicKey()) {
      setUi('need_vapid')
      return
    }
    if (!member?.building_id) {
      setUi('no_building')
      return
    }
    const { permission, hasDbRow } = await loadPushSubscriptionState()
    if (permission === 'denied') {
      setUi('blocked')
      return
    }
    if (permission === 'granted' && hasDbRow) {
      setUi('active')
      return
    }
    setUi('inactive')
  }, [member?.building_id])

  useEffect(() => {
    if (memberLoading) {
      setUi('loading')
      return
    }
    void refresh()
  }, [memberLoading, refresh])

  async function handleEnable() {
    setNote(null)
    setBusy(true)
    try {
      await ensureServiceWorker()
      if (!member?.building_id) {
        setNote('לא נמצא בניין.')
        return
      }
      const res = await subscribeAndSave(member.building_id)
      if (!res.ok) {
        setNote(res.message ?? 'לא ניתן להפעיל התראות')
        return
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setNote(null)
    setBusy(true)
    try {
      const res = await unsubscribeAndRemove()
      if (!res.ok) {
        setNote(res.message ?? 'ביטול נכשל')
        return
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (ui === 'loading') {
    return (
      <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
        <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </CardContent>
      </Card>
    )
  }

  if (ui === 'unsupported_ios') {
    return (
      <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
        <CardHeader className="text-right">
          <CardTitle className="text-base">התראות דחיפה באייפון / אייפד</CardTitle>
          <CardDescription className="space-y-3 text-pretty leading-relaxed">
            <p>
              באייפון ובאייפד, התראות דחיפה מ־Safari זמינות רק כשפותחים את האפליקציה{' '}
              <span className="font-semibold text-foreground">מהמסך הבית</span>{' '}
              (לא מלשונית רגילה בדפדפן).
            </p>
            <ol className="list-decimal list-inside space-y-2 text-start [padding-inline-start:0.25rem]">
              <li>דורש iOS 16.4 ומעלה.</li>
              <li>ב־Safari: לחצו על כפתור השיתוף ↗ והוסיפו «הוסף למסך הבית».</li>
              <li>
                פתחו את <span className="font-medium text-foreground">לובי</span> מהסמל
                במסך הבית, לא מ־Safari הרגיל.
              </li>
              <li>כאן בפרופיל — הפעילו שוב את ההתראות.</li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (ui === 'unsupported') {
    return (
      <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
        <CardHeader className="text-right">
          <CardTitle className="text-base">התראות דחיפה</CardTitle>
          <CardDescription className="text-pretty">
            הדפדפן או המכשיר לא תומכים בהתראות דחיפה.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (ui === 'no_supabase') {
    return null
  }

  if (ui === 'need_vapid') {
    return (
      <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
        <CardHeader className="text-right">
          <CardTitle className="text-base">התראות דחיפה</CardTitle>
          <CardDescription className="text-pretty">
            השרת עדיין לא הוגדר למפתחות VAPID (VITE_VAPID_PUBLIC_KEY).
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (ui === 'no_building') {
    return null
  }

  return (
    <Card className="border-border/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
      <CardHeader className="text-right">
        <CardTitle className="flex flex-row-reverse items-center justify-end gap-2 text-base">
          <BellRing className="size-5 text-primary" aria-hidden />
          התראות מהבניין
        </CardTitle>
        <CardDescription className="text-pretty leading-relaxed">
          {ui === 'active' ? (
            <>
              ההתראות פעילות — תקבלו עדכונים על פוסטים, סקרים, תגובות להודעות שלכם
              והודעות נעוצות חשובות (לא על פעולות שאתם מבצעים בעצמכם).
            </>
          ) : ui === 'blocked' ? (
            <>
              ההתראות חסומות בהגדרות הדפדפן או במערכת. פתחו את הגדרות האתר או ההתראות
              ובחרו להתיר — ואז נסו שוב.
            </>
          ) : (
            <>
              הפעילו התראות כדי לקבל התעדכנות מהבניין בלי לפתוח את האפליקציה. תומך
              ב־HTTPS בלבד (מלבד localhost).
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {note ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {note}
          </p>
        ) : null}
        {ui === 'inactive' ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full rounded-xl touch-manipulation font-semibold"
            disabled={busy}
            onClick={() => void handleEnable()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              'הפעל התראות מהבניין'
            )}
          </Button>
        ) : null}
        {ui === 'active' ? (
          <>
            <p className="text-sm font-semibold text-primary">התראות מהבניין פעילות</p>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl touch-manipulation font-semibold"
              disabled={busy}
              onClick={() => void handleDisable()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                'בטל התראות בניין'
              )}
            </Button>
          </>
        ) : null}
        {ui === 'blocked' ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full rounded-xl touch-manipulation font-semibold"
            disabled={busy}
            onClick={() => void handleEnable()}
          >
            נסה שוב אחרי שינוי הרשאה
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
