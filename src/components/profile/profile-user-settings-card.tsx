import { useState } from 'react'
import {
  Building2,
  Check,
  CircleUserRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { updateOwnMemberProfile } from '@/lib/profile-queries'
import { cn } from '@/lib/utils'

/** Prior compact sizes × 1.25 */
const TITLE = 'text-[1rem] font-semibold tracking-tight text-foreground sm:text-[1.016rem]'

const LABEL = 'text-[0.8125rem] font-medium leading-tight text-muted-foreground'

const VALUE =
  'mt-1 break-words text-base font-semibold leading-snug text-foreground sm:text-[1rem]'

const ICON_WRAP = 'flex w-10 shrink-0 items-center justify-center'

const FIELD =
  'mt-1 box-border h-10 w-full rounded-xl border border-border/80 bg-background/30 px-3 text-base text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55'

function SettingsRowDisplay({
  icon: Icon,
  label,
  value,
  valueDir,
  emailReadOnlyHint,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueDir?: 'ltr' | 'rtl'
  emailReadOnlyHint?: boolean
}) {
  const shown = value.trim() !== '' ? value : 'לא צוין'
  return (
    <div className="flex flex-row items-start gap-2 py-3.5 sm:gap-3" dir="rtl">
      <span className={ICON_WRAP} aria-hidden>
        <Icon className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-start" dir="rtl">
        {emailReadOnlyHint ? (
          <div className="flex flex-row flex-wrap items-baseline justify-start gap-1.5 leading-tight">
            <span className={LABEL}>{label}</span>
            <span className="text-muted-foreground/70 select-none" aria-hidden>
              ·
            </span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              לא ניתן לעריכה
            </span>
          </div>
        ) : (
          <p className={cn(LABEL, 'text-start')}>{label}</p>
        )}
        <p
          className={cn(VALUE, valueDir === 'ltr' ? 'text-end' : 'text-start')}
          dir={valueDir ?? 'rtl'}
          lang={valueDir === 'ltr' ? 'en' : 'he'}
        >
          {shown}
        </p>
      </div>
    </div>
  )
}

type Props = {
  fullName: string | null | undefined
  email: string | null | undefined
  phone: string | null | undefined
  apartmentNumber: string | null | undefined
  onUpdated: () => void
}

/** הגדרות משתמש — עריכת שם, טלפון ודירה (האימייל אינו נערך במסך זה). */
export function ProfileUserSettingsCard({
  fullName,
  email,
  phone,
  apartmentNumber,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState(fullName ?? '')
  const [phoneDraft, setPhoneDraft] = useState(phone ?? '')
  const [aptDraft, setAptDraft] = useState(apartmentNumber ?? '')

  function openEdit() {
    setSaveError(null)
    setNameDraft(fullName ?? '')
    setPhoneDraft(phone ?? '')
    setAptDraft(apartmentNumber ?? '')
    setEditing(true)
  }

  function cancelEdit() {
    setSaveError(null)
    setEditing(false)
    setNameDraft(fullName ?? '')
    setPhoneDraft(phone ?? '')
    setAptDraft(apartmentNumber ?? '')
  }

  async function saveEdit() {
    setSaveError(null)
    const fn = nameDraft.trim()
    const ph = phoneDraft.trim()
    const apt = aptDraft.trim()
    if (!fn || !ph || !apt) {
      setSaveError('יש למלא שם מלא, טלפון ומספר דירה.')
      return
    }
    setSaving(true)
    try {
      const res = await updateOwnMemberProfile({
        fullName: fn,
        phone: ph,
        apartmentNumber: apt,
      })
      if (!res.ok) {
        setSaveError(res.error ?? 'לא ניתן לשמור')
        return
      }
      setEditing(false)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  const emailShown = email?.trim() ? email : ''

  return (
    <section
      aria-labelledby="profile-user-settings-heading"
      dir="rtl"
      lang="he"
      className="rounded-2xl bg-muted/20 px-4 py-5 ring-1 ring-border/35 dark:bg-muted/10 dark:ring-border/25"
    >
      <div className="flex flex-row items-start justify-between gap-2 border-b border-dotted border-border/55 pb-3">
        <h2 id="profile-user-settings-heading" className={cn(TITLE, 'min-w-0 flex-1 ps-2 text-start')}>
          הגדרות משתמש
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={saving}
                aria-label="ביטול"
                className="size-9 rounded-full shrink-0"
                onClick={() => cancelEdit()}
              >
                <X className="size-[1.125rem]" strokeWidth={2} aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={saving}
                aria-label="שמירה"
                className="size-9 rounded-full shrink-0"
                onClick={() => void saveEdit()}
              >
                {saving ? (
                  <Loader2 className="size-[1.125rem] animate-spin" aria-hidden />
                ) : (
                  <Check className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="עריכת פרטים"
              className="size-9 rounded-full shrink-0"
              onClick={() => openEdit()}
            >
              <Pencil className="size-[1.125rem]" strokeWidth={2} aria-hidden />
            </Button>
          )}
        </div>
      </div>

      {saveError ? (
        <p className="mt-3 text-start text-sm text-destructive" dir="rtl" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="divide-y divide-dotted divide-border/50">
        {editing ? (
          <>
            <div className="flex flex-row items-start gap-2 pt-4 sm:gap-3" dir="rtl">
              <span className={ICON_WRAP}>
                <CircleUserRound className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-start" dir="rtl">
                <label htmlFor="profile-edit-name" className={cn(LABEL, 'block text-start')}>
                  שם מלא
                </label>
                <input
                  id="profile-edit-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className={cn(FIELD, 'text-start')}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex flex-row items-start gap-2 py-4 sm:gap-3" dir="rtl">
              <span className={ICON_WRAP}>
                <Mail className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-start" dir="rtl">
                <div className="flex flex-row flex-wrap items-baseline justify-start gap-1.5 leading-tight">
                  <span className={LABEL}>{'כתובת דוא"ל'}</span>
                  <span className="text-muted-foreground/70 select-none" aria-hidden>
                    ·
                  </span>
                  <span className="text-[0.6875rem] font-medium text-muted-foreground">
                    לא ניתן לעריכה
                  </span>
                </div>
                <p
                  className={cn(VALUE, 'mt-2 text-end opacity-80')}
                  dir="ltr"
                  lang="en"
                >
                  {emailShown || 'לא צוין'}
                </p>
              </div>
            </div>

            <div className="flex flex-row items-start gap-2 py-4 sm:gap-3" dir="rtl">
              <span className={ICON_WRAP}>
                <Phone className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-start" dir="rtl">
                <label htmlFor="profile-edit-phone" className={cn(LABEL, 'block text-start')}>
                  מספר טלפון
                </label>
                <input
                  id="profile-edit-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className={cn(FIELD, 'text-end')}
                />
              </div>
            </div>

            <div className="flex flex-row items-start gap-2 pb-1 pt-4 sm:gap-3" dir="rtl">
              <span className={ICON_WRAP}>
                <Building2 className="size-[1.125rem] text-muted-foreground" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-start" dir="rtl">
                <label htmlFor="profile-edit-apt" className={cn(LABEL, 'block text-start')}>
                  מספר דירה
                </label>
                <input
                  id="profile-edit-apt"
                  name="apartmentNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={aptDraft}
                  onChange={(e) => setAptDraft(e.target.value)}
                  className={cn(FIELD, 'text-start')}
                  dir="rtl"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <SettingsRowDisplay icon={CircleUserRound} label="שם מלא" value={fullName ?? ''} />
            <SettingsRowDisplay
              icon={Mail}
              label='כתובת דוא"ל'
              value={emailShown}
              valueDir="ltr"
              emailReadOnlyHint
            />
            <SettingsRowDisplay
              icon={Phone}
              label="מספר טלפון"
              value={phone ?? ''}
              valueDir="ltr"
            />
            <SettingsRowDisplay icon={Building2} label="מספר דירה" value={apartmentNumber ?? ''} />
          </>
        )}
      </div>
    </section>
  )
}
