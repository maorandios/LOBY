import { useState } from 'react'
import {
  Building2,
  Check,
  Loader2,
  MapPin,
  MapPinned,
  Pencil,
  Signpost,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { adminUpdateBuildingDetails } from '@/lib/building-admin-queries'
import { cn } from '@/lib/utils'

const TITLE = 'text-[1rem] font-semibold tracking-tight text-foreground sm:text-[1.016rem]'

const LABEL = 'text-[0.8125rem] font-medium leading-tight text-muted-foreground'

const VALUE_IN_GRID =
  'mt-0 break-words text-base font-semibold leading-snug text-foreground sm:text-[1rem]'

const ICON_WRAP =
  'flex h-5 w-10 shrink-0 items-center justify-center self-start text-muted-foreground sm:w-11'

const FIELD =
  'mt-1 box-border h-10 w-full rounded-xl border border-border/80 bg-background/30 px-3 text-base text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55'

function SettingsRowDisplay({
  icon: Icon,
  label,
  value,
  valueDir,
  readOnlyHint,
  readOnlyHintText,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueDir?: 'ltr' | 'rtl'
  readOnlyHint?: boolean
  readOnlyHintText?: string
}) {
  const shown = value.trim() !== '' ? value : 'לא צוין'
  return (
    <div
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 py-3.5 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3"
      dir="rtl"
    >
      <span className={ICON_WRAP} aria-hidden>
        <Icon className="size-[1.125rem] shrink-0" strokeWidth={2} />
      </span>
      <div className="min-w-0 text-start leading-tight" dir="rtl">
        {readOnlyHint ? (
          <div className="flex flex-row flex-wrap items-baseline justify-start gap-1.5">
            <span className={LABEL}>{label}</span>
            <span className="text-muted-foreground/70 select-none" aria-hidden>
              ·
            </span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              {readOnlyHintText ?? 'לא ניתן לעריכה'}
            </span>
          </div>
        ) : (
          <p className={cn(LABEL, 'text-start')}>{label}</p>
        )}
      </div>
      <p
        className={cn(
          'col-start-2',
          VALUE_IN_GRID,
          valueDir === 'ltr' ? 'text-end' : 'text-start',
        )}
        dir={valueDir ?? 'rtl'}
        lang={valueDir === 'ltr' ? 'en' : 'he'}
      >
        {shown}
      </p>
    </div>
  )
}

type Props = {
  buildingId: string | null
  city: string
  streetName: string
  buildingNumber: string
  fullAddress: string
  onUpdated: () => void
}

/** הגדרות בניין — עריכת כתובת (אותו סגנון כמו הגדרות משתמש). */
export function BuildingSettingsCard({
  buildingId,
  city,
  streetName,
  buildingNumber,
  fullAddress,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [cityDraft, setCityDraft] = useState(city)
  const [streetDraft, setStreetDraft] = useState(streetName)
  const [numDraft, setNumDraft] = useState(buildingNumber)

  const canEdit = Boolean(buildingId)

  function openEdit() {
    if (!canEdit) return
    setSaveError(null)
    setCityDraft(city)
    setStreetDraft(streetName)
    setNumDraft(buildingNumber)
    setEditing(true)
  }

  function cancelEdit() {
    setSaveError(null)
    setEditing(false)
    setCityDraft(city)
    setStreetDraft(streetName)
    setNumDraft(buildingNumber)
  }

  async function saveEdit() {
    if (!buildingId) return
    setSaveError(null)
    const c = cityDraft.trim()
    const s = streetDraft.trim()
    const n = numDraft.trim()
    if (!c || !s || !n) {
      setSaveError('יש למלא עיר, שם רחוב ומספר בניין.')
      return
    }
    setSaving(true)
    try {
      const res = await adminUpdateBuildingDetails({
        buildingId,
        city: c,
        streetName: s,
        buildingNumber: n,
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

  const fullShown = fullAddress.trim() !== '' ? fullAddress : ''

  return (
    <section
      aria-labelledby="building-settings-heading"
      dir="rtl"
      lang="he"
      className="px-4 py-5"
    >
      <div className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-2.5">
          <span
            className="flex h-5 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <MapPinned className="size-[1.125rem] shrink-0" strokeWidth={2} />
          </span>
          <h2
            id="building-settings-heading"
            className={cn(TITLE, 'min-w-0 text-start leading-tight')}
          >
            הגדרות מיקום
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={saving}
                aria-label="ביטול"
                className="size-9 shrink-0 rounded-full"
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
                className="size-9 shrink-0 rounded-full"
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
              aria-label="עריכת פרטי בניין"
              disabled={!canEdit}
              className="size-9 shrink-0 rounded-full"
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

      <div>
        {editing ? (
          <>
            <div
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 pt-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3"
              dir="rtl"
            >
              <span className={ICON_WRAP} aria-hidden>
                <MapPin className="size-[1.125rem] shrink-0" strokeWidth={2} />
              </span>
              <div className="min-w-0 text-start leading-tight" dir="rtl">
                <label htmlFor="building-edit-city" className={cn(LABEL, 'block text-start')}>
                  עיר
                </label>
              </div>
              <input
                id="building-edit-city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                className={cn(FIELD, 'col-start-2 mt-0 text-start')}
                dir="rtl"
              />
            </div>

            <div
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 py-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3"
              dir="rtl"
            >
              <span className={ICON_WRAP} aria-hidden>
                <Signpost className="size-[1.125rem] shrink-0" strokeWidth={2} />
              </span>
              <div className="min-w-0 text-start leading-tight" dir="rtl">
                <label htmlFor="building-edit-street" className={cn(LABEL, 'block text-start')}>
                  שם רחוב
                </label>
              </div>
              <input
                id="building-edit-street"
                name="street"
                type="text"
                autoComplete="street-address"
                value={streetDraft}
                onChange={(e) => setStreetDraft(e.target.value)}
                className={cn(FIELD, 'col-start-2 mt-0 text-start')}
                dir="rtl"
              />
            </div>

            <div
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 py-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3"
              dir="rtl"
            >
              <span className={ICON_WRAP} aria-hidden>
                <Building2 className="size-[1.125rem] shrink-0" strokeWidth={2} />
              </span>
              <div className="min-w-0 text-start leading-tight" dir="rtl">
                <label htmlFor="building-edit-num" className={cn(LABEL, 'block text-start')}>
                  מספר בניין
                </label>
              </div>
              <input
                id="building-edit-num"
                name="buildingNumber"
                type="text"
                autoComplete="off"
                value={numDraft}
                onChange={(e) => setNumDraft(e.target.value)}
                className={cn(FIELD, 'col-start-2 mt-0 text-start')}
                dir="rtl"
              />
            </div>

            <div
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 pb-1 pt-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3"
              dir="rtl"
            >
              <span className={ICON_WRAP} aria-hidden>
                <MapPinned className="size-[1.125rem] shrink-0" strokeWidth={2} />
              </span>
              <div className="min-w-0 text-start leading-tight" dir="rtl">
                <div className="flex flex-row flex-wrap items-baseline justify-start gap-1.5">
                  <span className={LABEL}>כתובת מלאה</span>
                  <span className="text-muted-foreground/70 select-none" aria-hidden>
                    ·
                  </span>
                  <span className="text-[0.6875rem] font-medium text-muted-foreground">
                    מתעדכן אוטומטית
                  </span>
                </div>
              </div>
              <p
                className={cn('col-start-2', VALUE_IN_GRID, 'text-start opacity-80')}
                dir="rtl"
              >
                {fullShown.trim() !== '' ? fullShown : '—'}
              </p>
            </div>
          </>
        ) : (
          <>
            <SettingsRowDisplay icon={MapPin} label="עיר" value={city} />
            <SettingsRowDisplay icon={Signpost} label="שם רחוב" value={streetName} />
            <SettingsRowDisplay icon={Building2} label="מספר בניין" value={buildingNumber} />
            <SettingsRowDisplay
              icon={MapPinned}
              label="כתובת מלאה"
              value={fullAddress}
              readOnlyHint
              readOnlyHintText="מתעדכן אוטומטית"
            />
          </>
        )}
      </div>
    </section>
  )
}
