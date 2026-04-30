import {
  Building2,
  CircleUserRound,
  Mail,
  Phone,
  type LucideIcon,
} from 'lucide-react'

/** ~1/1.25 of prior sizes (~0.8×) — compact section without card chrome. */
const TITLE = 'text-[0.8125rem] font-semibold tracking-tight text-foreground'

const LABEL = 'text-[0.65rem] font-medium leading-tight text-muted-foreground'

const VALUE =
  'mt-0.5 break-words text-[0.8rem] font-semibold leading-snug text-foreground'

const ICON_TRAY =
  'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/30 dark:bg-zinc-800/40'

const ROW = 'flex flex-row items-center gap-3 py-3'

function SettingsRow({
  icon: Icon,
  label,
  value,
  valueDir,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueDir?: 'ltr' | 'rtl'
}) {
  const shown = value.trim() !== '' ? value : 'לא צוין'
  return (
    <div className={ROW} dir="rtl">
      <span className={ICON_TRAY} aria-hidden>
        <Icon className="size-[0.9rem] text-muted-foreground" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <p className={LABEL}>{label}</p>
        <p className={VALUE} dir={valueDir ?? 'rtl'} lang={valueDir === 'ltr' ? 'en' : 'he'}>
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
}

/** Read-only הגדרות משתמש — flat on feed canvas, RTL right-aligned. */
export function ProfileUserSettingsCard({
  fullName,
  email,
  phone,
  apartmentNumber,
}: Props) {
  return (
    <section aria-labelledby="profile-user-settings-heading" className="text-right">
      <h2 id="profile-user-settings-heading" className={TITLE}>
        הגדרות משתמש
      </h2>

      <div className="mt-3 flex flex-col gap-1">
        <SettingsRow
          icon={CircleUserRound}
          label="שם מלא"
          value={fullName ?? ''}
        />
        <SettingsRow
          icon={Mail}
          label='כתובת דוא"ל'
          value={email ?? ''}
          valueDir="ltr"
        />
        <SettingsRow
          icon={Phone}
          label="מספר טלפון"
          value={phone ?? ''}
          valueDir="ltr"
        />
        <SettingsRow
          icon={Building2}
          label="מספר דירה"
          value={apartmentNumber ?? ''}
        />
      </div>
    </section>
  )
}
