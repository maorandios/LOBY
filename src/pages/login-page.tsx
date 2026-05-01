import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
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

const otpInputClass =
  'h-12 w-full rounded-xl border border-[#d4d4d8] bg-white px-3 text-center text-xl font-semibold tracking-[0.35em] text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:tracking-normal placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:cursor-not-allowed disabled:opacity-50'

const OTP_LENGTH = 8

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
    if (code.length < 6) {
      setError('הזינו את הקוד מהמייל — לרוב 6 ספרות.')
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

  function onOtpPaste(e: { preventDefault: () => void; clipboardData: { getData: (t: string) => string } }) {
    const pasted = sanitizeOtp(e.clipboardData.getData('text/plain'))
    if (pasted) {
      e.preventDefault()
      setOtpCode(pasted)
    }
  }

  if (step === 'code') {
    const destEmail = email.trim()
    return (
      <LoginShell>
        <header className="flex flex-col gap-2 text-right">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            הזינו את הקוד מהמייל
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            שלחנו קוד חד־פעמי לכתובת{' '}
            <span className="font-medium text-foreground" dir="ltr">
              {destEmail}
            </span>
            . הדביקו או הקלידו את הספרות למטה באותו דפדפן — כך ההתחברות תישמר גם אם
            פתחתם מהמסך הבית.
          </p>
        </header>

        <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-right">
            <label htmlFor="auth-otp" className="text-sm font-medium text-foreground">
              קוד מהמייל
            </label>
            <input
              id="auth-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={OTP_LENGTH}
              placeholder="למשל ·····"
              value={otpCode}
              onPaste={onOtpPaste}
              onChange={(e) => setOtpCode(sanitizeOtp(e.target.value))}
              disabled={loading}
              className={otpInputClass}
            />
          </div>

          {error ? (
            <p className={calloutErrorClass} role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full touch-manipulation text-base font-semibold"
          >
            {loading ? 'בודקים…' : 'כניסה'}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-11 w-full touch-manipulation text-base"
            onClick={() => void resendCode()}
          >
            שליחת קוד מחדש
          </Button>

          <Button type="button" variant="ghost" disabled={loading} onClick={backToForm}>
            שינוי כתובת המייל
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
            src="/HABLOCKLOGO.svg"
            alt="לוגו"
            className="h-24 w-auto max-w-[min(100%,30rem)] object-contain object-center"
            decoding="async"
          />
        </div>

        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">ברוכים הבאים</h1>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty">
            הקימו את הבניין שלכם היום וצרו תקשורת שעובדת בין דיירי הבניין
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
          <label htmlFor="auth-email" className="text-sm font-medium text-foreground">
            הזינו את כתובת הדוא״ל שלכם
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            placeholder="David@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !configured}
            className="h-11 w-full rounded-lg border border-[#d4d4d8] bg-white px-3 text-right text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-right placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:cursor-not-allowed disabled:opacity-50"
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
          className="h-12 w-full rounded-full touch-manipulation border-transparent bg-[#5E00FF] px-6 text-base font-semibold text-white shadow-none hover:bg-[#5200e6] focus-visible:border-[#5E00FF]/50 focus-visible:ring-[#5E00FF]/35 dark:hover:bg-[#5200e6]"
        >
          {loading ? 'שולחים…' : 'להרשמה לחצו כאן'}
        </Button>
      </form>
    </LoginShell>
  )
}
