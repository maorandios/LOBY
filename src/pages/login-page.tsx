import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Mail } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { LoginFriendsLottie } from '@/components/auth/login-friends-lottie'
import { Button } from '@/components/ui/button'
import { consumePostAuthRedirect, stashPostAuthRedirect } from '@/lib/post-auth-redirect'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type Step = 'form' | 'code'

/** Explicit hex (no oklch) — some mobile WebViews render token/opacity utilities as solid red blocks. */
const calloutWarningClass =
  'rounded-xl border border-[#ca8a04] bg-[#fffbeb] px-3 py-3 text-right text-sm text-[#713f12] shadow-sm [html:not(:lang(he))]:text-left'

const calloutErrorClass =
  'rounded-xl border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-right text-sm text-[#991b1b] shadow-sm [html:not(:lang(he))]:text-left'

const OTP_LENGTH = 8

function otpChars(otp: string): string[] {
  const raw = otp.replace(/\D/g, '').slice(0, OTP_LENGTH)
  return Array.from({ length: OTP_LENGTH }, (_, i) => raw[i] ?? '')
}

/** iOS Safari zooms focused inputs if font-size < 16px — keep text-base (1rem) on small screens. */
const otpDigitInputClass =
  'h-[2.5rem] w-[2rem] shrink-0 rounded-lg border border-[#d4d4d8] bg-white text-center text-base font-semibold tabular-nums text-[#18181b] outline-none transition-[box-shadow,border-color] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[2.5rem] sm:w-[2.4rem] sm:rounded-2xl sm:text-[1.0625rem]'

const LOGIN_PURPLE_PRIMARY =
  'h-12 w-full rounded-full touch-manipulation border-transparent bg-[#5E00FF] px-6 text-base font-semibold text-white shadow-none hover:bg-[#5200e6] focus-visible:border-[#5E00FF]/50 focus-visible:ring-[#5E00FF]/35 dark:hover:bg-[#5200e6]'

function isRateLimitErrorMessage(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('rate limit') ||
    m.includes('too many') ||
    m.includes('over_email_send_rate_limit') ||
    m.includes('email rate limit') ||
    m.includes('429') ||
    m.includes('exceeded')
  )
}

function hebrewAuthError(message: string): string {
  const m = message.toLowerCase()
  if (
    m.includes('otp') ||
    m.includes('token') ||
    m.includes('invalid') ||
    m.includes('otp_expired') ||
    m.includes('expired')
  ) {
    if (m.includes('expired'))
      return 'פג התוקף של הקוד. נסו לקבל קוד חדש או בקשו שליחה מחדש.'
    return 'הקוד שגוי. בדקו שהעתקתם את כל הספרות מהמייל והזינו שוב.'
  }
  if (m.includes('invalid login credentials')) {
    return 'ההתחברות נכשלה. נסו שוב.'
  }
  if (isRateLimitErrorMessage(m)) {
    return 'יותר מדי ניסיונות. המתינו רגע ונסו שוב.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'בעיית רשת. בדקו את החיבור ונסו שוב.'
  }
  return message || 'משהו השתבש. נסו שוב.'
}

function sanitizeOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH)
}

type OtpDigitRowProps = {
  value: string
  onChange: (next: string) => void
  disabled: boolean
}

function OtpDigitRow({ value, onChange, disabled }: OtpDigitRowProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const chars = otpChars(value)

  function clearCharAt(i: number) {
    const next = [...otpChars(value)]
    next[i] = ''
    onChange(next.join(''))
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const t = sanitizeOtp(e.clipboardData.getData('text/plain'))
    if (t.length > 0) {
      e.preventDefault()
      onChange(t.slice(0, OTP_LENGTH))
      window.requestAnimationFrame(() => {
        const idx = Math.min(t.length, OTP_LENGTH) - 1
        refs.current[Math.max(0, idx)]?.focus()
      })
    }
  }

  function onCellChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length >= OTP_LENGTH) {
      onChange(raw.slice(0, OTP_LENGTH))
      window.requestAnimationFrame(() => refs.current[OTP_LENGTH - 1]?.focus())
      return
    }
    if (raw.length === 0) {
      clearCharAt(i)
      return
    }
    if (raw.length === 1) {
      const next = [...otpChars(value)]
      next[i] = raw
      onChange(next.join(''))
      if (raw && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
      return
    }
    const next = [...otpChars(value)]
    for (let k = 0; k < raw.length && i + k < OTP_LENGTH; k++) {
      next[i + k] = raw[k]!
    }
    onChange(next.join(''))
    const last = Math.min(i + raw.length - 1, OTP_LENGTH - 1)
    window.requestAnimationFrame(() => refs.current[last]?.focus())
  }

  function onCellKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      e.preventDefault()
      refs.current[i - 1]?.focus()
    }
  }

  function renderInput(i: number) {
    return (
      <input
        key={i}
        ref={(el) => {
          refs.current[i] = el
        }}
        type="text"
        inputMode="numeric"
        autoComplete={i === 0 ? 'one-time-code' : 'off'}
        name={i === 0 ? 'one-time-code' : undefined}
        aria-label={`ספרה ${i + 1} מתוך ${OTP_LENGTH}`}
        maxLength={i === 0 ? OTP_LENGTH : 1}
        value={chars[i]}
        disabled={disabled}
        onChange={(e) => onCellChange(i, e)}
        onKeyDown={(e) => onCellKeyDown(i, e)}
        className={otpDigitInputClass}
      />
    )
  }

  return (
    <div
      role="group"
      aria-label="קוד אימות בן שמונה ספרות"
      dir="ltr"
      className="flex flex-row flex-nowrap items-center justify-center gap-0.5 sm:gap-2"
      onPaste={onPaste}
    >
      {[0, 1, 2, 3].map((i) => renderInput(i))}
      <span
        className="select-none shrink-0 px-0.5 text-sm font-semibold leading-none text-muted-foreground sm:text-base"
        aria-hidden
      >
        —
      </span>
      {[4, 5, 6, 7].map((i) => renderInput(i))}
    </div>
  )
}

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <AuthScreenShell bottomFullWidth={<LoginFriendsLottie />}>{children}</AuthScreenShell>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [search] = useSearchParams()

  useEffect(() => {
    const r = search.get('redirect')
    if (r) {
      stashPostAuthRedirect(r)
    }
  }, [search])

  const configured = isSupabaseConfigured()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendLoginEmail(addr: string): Promise<boolean> {
    const origin = window.location.origin
    const { error: signError } = await supabase.auth.signInWithOtp({
      email: addr.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    if (signError) {
      setError(hebrewAuthError(signError.message))
      return false
    }
    return true
  }

  async function onSubmitEmail(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('הזינו כתובת מייל תקינה.')
      return
    }
    if (!configured) return

    setLoading(true)
    try {
      const ok = await sendLoginEmail(trimmed)
      if (!ok) return
      setOtpCode('')
      setStep('code')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    const code = sanitizeOtp(otpCode)
    if (!trimmedEmail) {
      setError('חסר מייל — חזרו לשלב הקודם.')
      return
    }
    if (code.length < OTP_LENGTH) {
      setError(`הזינו את הקוד מהמייל — ${OTP_LENGTH} ספרות.`)
      return
    }
    if (!configured) return

    setLoading(true)
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: code,
        type: 'email',
      })
      if (verifyErr) {
        setError(hebrewAuthError(verifyErr.message))
        return
      }
      if (data.session) {
        const dest = consumePostAuthRedirect()
        navigate(dest, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    const trimmed = email.trim()
    if (!trimmed) return
    setError(null)
    setLoading(true)
    try {
      await sendLoginEmail(trimmed)
    } finally {
      setLoading(false)
    }
  }

  function backToForm() {
    setStep('form')
    setError(null)
    setOtpCode('')
  }

  if (step === 'code') {
    const destEmail = email.trim()
    return (
      <LoginShell>
        <div className="flex flex-col gap-6 pt-8">
          <div className="flex w-full justify-center px-2">
            <img
              src="/LobyIcon.svg"
              alt="לוגו"
              className="h-24 w-auto max-w-[min(100%,30rem)] object-contain object-center"
              decoding="async"
            />
          </div>

          <header className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">קוד אישור</h1>
            <p className="text-base leading-relaxed text-muted-foreground text-pretty">
              שלחנו קוד בעל {OTP_LENGTH} ספרות לכתובת המייל{' '}
              <span className="font-medium text-foreground" dir="ltr">
                {destEmail}
              </span>
            </p>
          </header>
        </div>

        <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
          <OtpDigitRow value={otpCode} onChange={setOtpCode} disabled={loading} />

          {error ? (
            <p className={calloutErrorClass} role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className={LOGIN_PURPLE_PRIMARY}>
            {loading ? 'בודקים…' : 'התחברות'}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-12 w-full rounded-full touch-manipulation border border-[#d4d4d8] bg-white text-base font-semibold text-foreground shadow-none hover:bg-muted/40 dark:border-zinc-500 dark:hover:bg-muted/25"
            onClick={() => void resendCode()}
          >
            שליחת קוד חדש
          </Button>

          <Button type="button" variant="ghost" disabled={loading} onClick={backToForm}>
            שינוי כתובת דוא״ל
          </Button>
        </form>
      </LoginShell>
    )
  }

  return (
    <LoginShell>
      <div className="flex flex-col gap-6 pt-8">
        <div className="flex w-full justify-center px-2">
          <img
            src="/LobyIcon.svg"
            alt="לוגו"
            className="h-24 w-auto max-w-[min(100%,30rem)] object-contain object-center"
            decoding="async"
          />
        </div>

        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">ברוכים הבאים</h1>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty">
            הקימו את הבניין שלכם וצרו תקשורת שבאמת עובדת בין הדיירים
          </p>
        </header>
      </div>

      {!configured ? (
        <div className={calloutWarningClass} role="status">
          <p className="mb-2 font-semibold text-[#713f12]">השרת עדיין לא מוגדר</p>
          <p className="mb-2 leading-relaxed">
            באפליקציה שפורסמה (למשל ב־Vercel) חסרים משתני הסביבה של Supabase בזמן הבנייה, או שלא בוצע
            Deploy מחדש אחרי שהוספתם אותם.
          </p>
          <p className="mb-1 text-xs font-medium text-[#713f12]">מה לעשות (מפתחים):</p>
          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-[#713f12]">
            <li>
              בפרויקט Vercel: Settings → Environment Variables — הוסיפו{' '}
              <span className="font-mono" dir="ltr">
                VITE_SUPABASE_URL
              </span>{' '}
              ו־
              <span className="font-mono" dir="ltr">
                VITE_SUPABASE_ANON_KEY
              </span>
            </li>
            <li>שמרו, ואז Deploy מחדש את האתר (Redeploy).</li>
            <li>
              ב־Supabase: Authentication → URL configuration — הוסיפו את כתובת האתר שלכם תחת Redirect
              URLs (כולל <span className="font-mono">/auth/callback</span>) לשימוש במייל.
            </li>
          </ul>
        </div>
      ) : null}

      <form onSubmit={onSubmitEmail} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-right">
          <label
            htmlFor="auth-email"
            className="flex w-full items-center justify-start gap-2 text-sm font-medium text-foreground"
          >
            <Mail
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
            <span className="min-w-0">כתובת דוא״ל</span>
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            placeholder="הזינו את כתובת הדוא״ל כאן"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !configured}
            className="h-11 w-full rounded-2xl border border-[#d4d4d8] bg-white px-4 text-right text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-right placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error ? (
          <p className={calloutErrorClass} role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading || !configured}
          className={LOGIN_PURPLE_PRIMARY}
        >
          {loading ? 'שולחים…' : 'לחצו כאן להתחברות'}
        </Button>
      </form>
    </LoginShell>
  )
}
