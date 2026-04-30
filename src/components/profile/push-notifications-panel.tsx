import { BellRing, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'
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

/** Match {@link ProfileUserSettingsCard} */
const TITLE =
  'text-[1rem] font-semibold tracking-tight text-foreground sm:text-[1.016rem]'

const BODY =
  'mt-2 text-[0.8125rem] font-medium leading-relaxed text-pretty text-muted-foreground'

const ICON_WRAP = 'flex h-5 w-10 shrink-0 items-center justify-center text-muted-foreground'

const SECTION_SHELL = 'px-4 py-5'

/** Brand “on” color for push toggle */
const PUSH_ON = '#5E00FF'

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

function NotificationSwitch({
  checked,
  disabled,
  busy,
  onToggle,
}: {
  checked: boolean
  disabled?: boolean
  busy?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy}
      disabled={disabled}
      dir="ltr"
      onClick={onToggle}
      className={cn(
        /* box-content, overflow-hidden, m-0, h-[26px] — per inspector tuning */
        'relative m-0 inline-flex h-[26px] w-[3.125rem] shrink-0 cursor-pointer overflow-hidden rounded-full [box-sizing:content-box] outline-none',
        checked
          ? 'border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_3px_rgba(94,0,255,0.35)]'
          : 'border border-border/60 bg-muted/80 shadow-inner shadow-black/[0.04] hover:bg-muted',
        'transition-[background-color,border-color,box-shadow] duration-300 ease-out',
        'focus-visible:ring-2 focus-visible:ring-[#5E00FF]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        busy && 'pointer-events-none',
      )}
      style={{
        backgroundColor: checked ? PUSH_ON : undefined,
      }}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-[3px] top-1/2 size-5 -translate-y-1/2 rounded-full',
          'bg-white shadow-[0_1px_4px_rgba(15,23,42,0.2)] ring-1 ring-black/[0.05] dark:shadow-[0_1px_4px_rgba(0,0,0,0.45)] dark:ring-white/10',
          'transition-[transform] duration-300 ease-[cubic-bezier(0.34,1.48,0.64,1)] motion-reduce:transition-none',
          /* track content width 3.125rem (50px), thumb 20px, ~3px inset each end */
          checked ? 'translate-x-[1.5rem]' : 'translate-x-0',
        )}
      />
      {busy ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/45 backdrop-blur-[0.5px] dark:bg-background/30">
          <Loader2 className="size-[0.9375rem] animate-spin text-foreground" aria-hidden />
        </span>
      ) : null}
    </button>
  )
}

function PanelSection({
  title,
  children,
  showIcon,
}: {
  title: string
  children: ReactNode
  showIcon?: boolean
}) {
  return (
    <section dir="rtl" lang="he" className={SECTION_SHELL}>
      <div className="flex flex-row items-center gap-2 pb-1 sm:gap-3">
        {showIcon ? (
          <span className={ICON_WRAP} aria-hidden>
            <BellRing className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 text-start">
          <h2 className={TITLE}>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

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

  function toggleFromSwitch() {
    if (busy) return
    if (ui === 'active') void handleDisable()
    else void handleEnable()
  }

  if (ui === 'loading') {
    return (
      <section dir="rtl" lang="he" className={SECTION_SHELL}>
        <div className="flex min-h-[5rem] items-center justify-center text-muted-foreground">
          <Loader2 className="size-8 animate-spin" aria-hidden />
        </div>
      </section>
    )
  }

  if (ui === 'unsupported_ios') {
    return (
      <PanelSection title="התראות דחיפה באייפון / אייפד" showIcon>
        <div className={cn(BODY, 'space-y-3')}>
          <p>
            באייפון ובאייפד, התראות דחיפה מ־Safari זמינות רק כשפותחים את האפליקציה{' '}
            <span className="font-semibold text-foreground">מהמסך הבית</span>{' '}
            (לא מלשונית רגילה בדפדפן).
          </p>
          <ol className="list-decimal list-inside space-y-2 text-start [padding-inline-start:0.25rem]">
            <li>דורש iOS 16.4 ומעלה.</li>
            <li>ב־Safari: לחצו על כפתור השיתוף ↗ והוסיפו «הוסף למסך הבית».</li>
            <li>
              פתחו את <span className="font-medium text-foreground">לובי</span> מהסמל במסך הבית, לא
              מ־Safari הרגיל.
            </li>
            <li>כאן בפרופיל — הפעילו שוב את ההתראות.</li>
          </ol>
        </div>
      </PanelSection>
    )
  }

  if (ui === 'unsupported') {
    return (
      <PanelSection title="התראות דחיפה" showIcon>
        <p className={BODY}>הדפדפן או המכשיר לא תומכים בהתראות דחיפה.</p>
      </PanelSection>
    )
  }

  if (ui === 'no_supabase') {
    return null
  }

  if (ui === 'need_vapid') {
    return (
      <PanelSection title="התראות דחיפה" showIcon>
        <p className={BODY}>השרת עדיין לא הוגדר למפתחות VAPID (VITE_VAPID_PUBLIC_KEY).</p>
      </PanelSection>
    )
  }

  if (ui === 'no_building') {
    return null
  }

  const checked = ui === 'active'

  const descriptionBody =
    ui === 'active' ? (
      <>
        ההתראות פעילות — תקבלו עדכונים על פוסטים, סקרים, תגובות להודעות שלכם והודעות נעוצות חשובות
        (לא על פעולות שאתם מבצעים בעצמכם).
      </>
    ) : ui === 'blocked' ? (
      <>
        אשרו קבלת עדכוני פוש מהאפליצקיה לטלפון הנייד. ההתראות חסומות בהגדרות הדפדפן או במערכת — יש
        להתיר הרשאה ולנסות שוב.
      </>
    ) : (
      <>אשרו קבלת עדכוני פוש מהאפליצקיה לטלפון הנייד</>
    )

  return (
    <section aria-labelledby="push-notifs-heading" dir="rtl" lang="he" className={SECTION_SHELL}>
      <div className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-2.5">
          <span
            className="flex h-5 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <BellRing className="size-[1.125rem] shrink-0" strokeWidth={2} />
          </span>
          <h2 id="push-notifs-heading" className={cn(TITLE, 'min-w-0 text-start leading-tight')}>
            התראות פוש
          </h2>
        </div>
        <div className="flex shrink-0 items-center">
          <NotificationSwitch
            checked={checked}
            busy={busy}
            onToggle={() => toggleFromSwitch()}
          />
        </div>
      </div>

      <p className={BODY}>{descriptionBody}</p>

      {note ? (
        <p
          className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-start text-sm text-destructive"
          dir="rtl"
          role="alert"
        >
          {note}
        </p>
      ) : null}
    </section>
  )
}
