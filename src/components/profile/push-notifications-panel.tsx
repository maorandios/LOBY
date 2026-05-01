import { BellRing, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  ensureServiceWorker,
  getVapidPublicKey,
  isAppleMobileDevice,
  isStandalonePwa,
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

const SECTION_SHELL = 'px-4 py-5'

/** Brand “on” color for push toggle */
const PUSH_ON = '#5E00FF'

/** Shown when push cannot work on this environment (browser, OS version, deployment, …). */
const PUSH_UNAVAILABLE_MSG =
  'המכשיר שלך אינו תומך בקבלת הודעת פוש'

type UiState =
  | 'loading'
  /** Web Push / VAPID / environment unavailable — show {@link PUSH_UNAVAILABLE_MSG} only. */
  | 'push_unavailable'
  | 'no_supabase'
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
      setUi('push_unavailable')
      return
    }
    if (!getVapidPublicKey()) {
      setUi('push_unavailable')
      return
    }
    if (!member?.building_id) {
      setUi('no_building')
      return
    }
    const { permission, hasDbRow } = await loadPushSubscriptionState(member.building_id)
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

  if (ui === 'push_unavailable') {
    return (
      <section
        aria-labelledby="push-unavailable-heading"
        dir="rtl"
        lang="he"
        className={SECTION_SHELL}
      >
        <div className="flex flex-row items-center justify-start gap-2 pb-3 sm:gap-2.5">
          <span
            className="flex h-5 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <BellRing className="size-[1.125rem] shrink-0" strokeWidth={2} />
          </span>
          <h2 id="push-unavailable-heading" className={cn(TITLE, 'min-w-0 text-start leading-tight')}>
            התראות פוש
          </h2>
        </div>
        <p className={BODY}>{PUSH_UNAVAILABLE_MSG}</p>
      </section>
    )
  }

  if (ui === 'no_supabase') {
    return null
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

      {isAppleMobileDevice() && !isStandalonePwa() ? (
        <p
          className="mt-3 rounded-xl border border-[#ca8a04]/40 bg-[#fffbeb] px-3 py-2.5 text-start text-[0.8125rem] font-medium leading-relaxed text-[#713f12]"
          role="note"
        >
          ב־iPhone וב־iPad התראות Web Push בדרך כלל{' '}
          <strong className="font-semibold">לא מגיעות מטאב רגיל בספארי</strong>. הוסיפו את האתר למסך הבית
          (שיתוף → &quot;הוסף למסך הבית&quot;) ופתחו את האפליקציה משם (iOS 16.4 ומעלה). אחרת הרשאה ו&quot;פוש
          מופעל&quot; יכולים לשמור מנוי במסד, אבל Apple לא ישגרו התראה.
        </p>
      ) : null}

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
