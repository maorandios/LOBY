import { useEffect, useState, type FormEvent } from 'react'
import {
  Building2,
  Home,
  Landmark,
  MapPin,
  Phone,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { Button } from '@/components/ui/button'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'
import { generateInviteCode } from '@/lib/invite-code'
import { OnboardingLoadingPage } from '@/pages/onboarding-loading-page'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { tryEnablePushNotificationsAfterJoin } from '@/lib/web-push'

const TOTAL_FORM_STEPS = 6
const REVIEW_STEP = 7

type StepField = 'street' | 'building' | 'city' | 'fullName' | 'phone' | 'apartment'

type StepConfig = {
  question: string
  field: StepField
  placeholder: string
  inputType: 'text' | 'tel'
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  dir?: 'ltr'
}

const STEPS = [
  {
    question: 'מה שם הרחוב?',
    field: 'street',
    placeholder: 'לדוגמא: שדרות רוטשילד',
    inputType: 'text',
    autoComplete: 'street-address',
  },
  {
    question: 'מה מספר הבניין?',
    field: 'building',
    placeholder: 'לדוגמא: 12',
    inputType: 'text',
    autoComplete: 'off',
  },
  {
    question: 'מה שם העיר?',
    field: 'city',
    placeholder: 'לדוגמא: ירושלים',
    inputType: 'text',
    autoComplete: 'address-level2',
  },
  {
    question: 'מה השם המלא שלך?',
    field: 'fullName',
    placeholder: 'לדוגמא: ישראל ישראלי',
    inputType: 'text',
    autoComplete: 'name',
  },
  {
    question: 'מה מספר הנייד שלך?',
    field: 'phone',
    placeholder: 'לדוגמא: 0503202525',
    inputType: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    dir: 'ltr',
  },
  {
    question: 'מה מספר הדירה בבניין?',
    field: 'apartment',
    placeholder: 'לדוגמא: 7',
    inputType: 'text',
    autoComplete: 'off',
  },
] satisfies StepConfig[]

const SUMMARY_META: { field: StepField; icon: LucideIcon; summaryLabel: string }[] = [
  { field: 'street', icon: MapPin, summaryLabel: 'שם הרחוב' },
  { field: 'building', icon: Building2, summaryLabel: 'מספר בניין' },
  { field: 'city', icon: Landmark, summaryLabel: 'שם העיר' },
  { field: 'fullName', icon: User, summaryLabel: 'שם מלא' },
  { field: 'phone', icon: Phone, summaryLabel: 'מספר טלפון' },
  { field: 'apartment', icon: Home, summaryLabel: 'מספר דירה' },
]

const LOGIN_PURPLE_PRIMARY =
  'h-12 rounded-full touch-manipulation border-transparent bg-[#5E00FF] px-6 text-base font-semibold text-white shadow-none hover:bg-[#5200e6] focus-visible:border-[#5E00FF]/50 focus-visible:ring-[#5E00FF]/35 dark:hover:bg-[#5200e6]'

const fieldClass =
  'h-12 w-full rounded-2xl border border-[#d4d4d8] bg-white px-4 text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:opacity-50'

const centeredFieldClass = cn(fieldClass, 'text-center placeholder:text-center')

function OnboardingProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex w-full gap-2" aria-hidden="true">
      {Array.from({ length: TOTAL_FORM_STEPS }, (_, i) => {
        const index = i + 1
        const filled = currentStep >= index
        return (
          <div
            key={index}
            className={cn(
              'h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-300',
              filled ? 'bg-[#5E00FF]' : 'bg-zinc-200/90 dark:bg-zinc-600/60',
            )}
          />
        )
      })}
    </div>
  )
}

const VALIDATION_MESSAGES: Record<StepField, string> = {
  street: 'הזינו את שם הרחוב.',
  building: 'הזינו את מספר הבניין.',
  city: 'הזינו את שם העיר.',
  fullName: 'הזינו את השם המלא.',
  phone: 'הזינו את מספר הנייד.',
  apartment: 'הזינו את מספר הדירה.',
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div
      dir="rtl"
      className="flex w-full items-center gap-3 rounded-2xl bg-white/40 px-4 py-3"
    >
      <span className="flex shrink-0 items-center justify-center text-[#5E00FF]" aria-hidden>
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-base font-semibold text-foreground" dir="auto">
          {value}
        </p>
      </div>
    </div>
  )
}

export function OnboardingAdminPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { hasBuilding, loading: membershipLoading, refetch } = useBuildingMembership()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [streetName, setStreetName] = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formStep = step <= TOTAL_FORM_STEPS ? step : TOTAL_FORM_STEPS
  const stepConfig = STEPS[formStep - 1]!

  useEffect(() => {
    if (!membershipLoading && hasBuilding) {
      navigate('/feed', { replace: true })
    }
  }, [hasBuilding, membershipLoading, navigate])

  if (membershipLoading) {
    return <OnboardingLoadingPage />
  }

  if (hasBuilding) {
    return <Navigate to="/feed" replace />
  }

  function getFieldValue(field: StepField): string {
    switch (field) {
      case 'street':
        return streetName
      case 'building':
        return buildingNumber
      case 'city':
        return city
      case 'fullName':
        return fullName
      case 'phone':
        return phone
      case 'apartment':
        return apartmentNumber
    }
  }

  function setFieldValue(field: StepField, value: string) {
    switch (field) {
      case 'street':
        setStreetName(value)
        break
      case 'building':
        setBuildingNumber(value)
        break
      case 'city':
        setCity(value)
        break
      case 'fullName':
        setFullName(value)
        break
      case 'phone':
        setPhone(value)
        break
      case 'apartment':
        setApartmentNumber(value)
        break
    }
  }

  function validateCurrentStep(): boolean {
    const field = stepConfig.field
    if (!getFieldValue(field).trim()) {
      setError(VALIDATION_MESSAGES[field])
      return false
    }
    return true
  }

  function goNext() {
    setError(null)
    if (!validateCurrentStep()) return
    if (formStep < TOTAL_FORM_STEPS) {
      setStep((s) => s + 1)
    }
  }

  function finishFormToReview() {
    setError(null)
    if (!validateCurrentStep()) return
    setStep(REVIEW_STEP)
  }

  async function handleCreateBuilding() {
    setError(null)
    const fn = fullName.trim()
    const ph = phone.trim()
    const apt = apartmentNumber.trim()
    const street = streetName.trim()
    const bnum = buildingNumber.trim()
    const c = city.trim()
    if (!fn || !ph || !apt || !street || !bnum || !c) {
      setError('מלאו את כל השדות.')
      return
    }
    if (!session?.user?.id) {
      setError('אין משתמש מחובר.')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('חסרות הגדרות Supabase.')
      return
    }

    setSubmitting(true)
    try {
      const { data: building, error: bErr } = await supabase
        .from('buildings')
        .insert({
          street_name: street,
          building_number: bnum,
          city: c,
          created_by: session.user.id,
        })
        .select('id')
        .single()

      if (bErr || !building) {
        setError(bErr?.message ?? 'יצירת הבניין נכשלה.')
        return
      }

      const { error: mErr } = await supabase.from('building_members').insert({
        building_id: building.id,
        user_id: session.user.id,
        role: 'admin',
        full_name: fn,
        phone: ph,
        apartment_number: apt,
      })

      if (mErr) {
        setError(mErr.message ?? 'שמירת מנהל נכשלה.')
        return
      }

      const code = generateInviteCode()
      const { error: iErr } = await supabase.from('invite_codes').insert({
        code,
        building_id: building.id,
      })

      if (iErr) {
        setError(iErr.message ?? 'יצירת קוד הזמנה נכשלה.')
        return
      }

      await refetch()
      await tryEnablePushNotificationsAfterJoin(building.id as string)
      navigate('/feed', { replace: true, state: { newInviteCode: code } })
    } finally {
      setSubmitting(false)
    }
  }

  function onPrimaryAction(e?: FormEvent) {
    e?.preventDefault()
    if (formStep < TOTAL_FORM_STEPS) {
      goNext()
    } else {
      finishFormToReview()
    }
  }

  const logoBlock = (
    <div className="flex w-full justify-center px-2">
      <img
        src="/LobyIcon.svg"
        alt="לוגו"
        className="h-24 w-auto max-w-[min(100%,30rem)] object-contain object-center"
        decoding="async"
      />
    </div>
  )

  const questionId = `ob-question-${formStep}`

  if (step === REVIEW_STEP) {
    return (
      <AuthScreenShell>
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="shrink-0 pt-2">{logoBlock}</div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
            <header className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">סיכום הפרטים</h1>
              <p className="mt-1 text-sm text-muted-foreground">בדקו שהכול תקין לפני יצירת הבניין</p>
            </header>

            <div className="flex flex-col gap-3">
              {SUMMARY_META.map(({ field, icon, summaryLabel }) => (
                <SummaryRow
                  key={field}
                  icon={icon}
                  label={summaryLabel}
                  value={getFieldValue(field).trim()}
                />
              ))}
            </div>

            {error ? (
              <p
                className="rounded-xl border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-right text-sm text-[#991b1b]"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex w-full flex-row items-stretch gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="h-12 w-[30%] shrink-0 rounded-full touch-manipulation border border-[#d4d4d8] bg-white px-2 text-sm font-semibold text-foreground shadow-none hover:bg-muted/40 dark:border-zinc-500 sm:text-base"
                onClick={() => {
                  setError(null)
                  setStep(TOTAL_FORM_STEPS)
                }}
              >
                חזרה
              </Button>
              <Button
                type="button"
                disabled={submitting}
                className={cn(LOGIN_PURPLE_PRIMARY, 'min-w-0 flex-1 basis-0 px-4')}
                onClick={() => void handleCreateBuilding()}
              >
                {submitting ? 'יוצרים…' : 'צור את הבניין'}
              </Button>
            </div>
          </div>
        </div>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <form
        className="flex min-h-0 flex-1 flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          onPrimaryAction()
        }}
      >
        <div className="relative min-h-0 flex-1">
          <div className="relative z-40 flex shrink-0 flex-col gap-6">
            <OnboardingProgressBar currentStep={formStep} />
            <div className="pt-2">{logoBlock}</div>
          </div>

          <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
              {step === 1 ? (
                <header className="flex flex-col gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    בואו נתחיל ברישום הבניין
                  </h1>
                </header>
              ) : null}

              <p id={questionId} className="text-lg font-medium leading-snug text-foreground">
                {stepConfig.question}
              </p>

              <input
                id={`ob-input-${formStep}`}
                name={stepConfig.field}
                type={stepConfig.inputType}
                autoComplete={stepConfig.autoComplete}
                inputMode={stepConfig.inputMode}
                dir={stepConfig.dir}
                placeholder={stepConfig.placeholder}
                value={getFieldValue(stepConfig.field)}
                onChange={(e) => setFieldValue(stepConfig.field, e.target.value)}
                disabled={submitting}
                aria-labelledby={questionId}
                className={cn(centeredFieldClass, 'w-full')}
              />

              {error ? (
                <p
                  className="w-full rounded-xl border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-center text-sm text-[#991b1b]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {formStep > 1 ? (
                <div className="flex w-full max-w-md flex-row items-stretch gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    className="h-12 w-[30%] shrink-0 rounded-full touch-manipulation border border-[#d4d4d8] bg-white px-2 text-sm font-semibold text-foreground shadow-none hover:bg-muted/40 dark:border-zinc-500 sm:text-base"
                    onClick={() => {
                      setError(null)
                      setStep((s) => s - 1)
                    }}
                  >
                    חזרה
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className={cn(LOGIN_PURPLE_PRIMARY, 'min-w-0 flex-1 basis-0 px-4')}
                  >
                    {formStep === TOTAL_FORM_STEPS ? 'סיימתי!' : 'המשך'}
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(LOGIN_PURPLE_PRIMARY, 'w-full max-w-md')}
                >
                  המשך
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </AuthScreenShell>
  )
}
