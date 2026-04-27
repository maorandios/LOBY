import { useState, type FormEvent } from 'react'

import { AuthScreenShell } from '@/components/auth/auth-screen-shell'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type Step = 'form' | 'sent'

/** Explicit hex (no oklch) — some mobile WebViews render token/opacity utilities as solid red blocks. */
const calloutWarningClass =
  'rounded-xl border border-[#ca8a04] bg-[#fffbeb] px-3 py-3 text-right text-sm text-[#713f12] shadow-sm [html:not(:lang(he))]:text-left'

const calloutErrorClass =
  'rounded-xl border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-right text-sm text-[#991b1b] shadow-sm [html:not(:lang(he))]:text-left'

function hebrewAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) {
    return 'ההתחברות נכשלה. נסו שוב.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'יותר מדי ניסיונות. המתינו רגע ונסו שוב.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'בעיית רשת. בדקו את החיבור ונסו שוב.'
  }
  return message || 'משהו השתבש. נסו שוב.'
}

export function LoginPage() {
  const configured = isSupabaseConfigured()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
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
      const origin = window.location.origin
      const { error: signError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      })
      if (signError) {
        setError(hebrewAuthError(signError.message))
        return
      }
      setStep('sent')
    } finally {
      setLoading(false)
    }
  }

  function backToForm() {
    setStep('form')
    setError(null)
  }

  if (step === 'sent') {
    return (
      <AuthScreenShell>
        <header className="flex flex-col gap-2 text-right">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            בדקו את המייל שלכם
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            שלחנו לכם קישור כניסה. לחצו עליו כדי להמשיך לאפליקציה.
          </p>
        </header>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full touch-manipulation text-base"
          onClick={backToForm}
        >
          חזרה להתחברות
        </Button>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <header className="flex flex-col gap-2 text-right">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          כניסה למערכת
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          הזינו מייל ונשלח לכם קישור כניסה מאובטח
        </p>
      </header>

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
            <li>ב־Supabase: הוסיפו את כתובת האתר שלכם תחת Redirect URLs (כולל /auth/callback).</li>
          </ul>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-right">
          <label htmlFor="auth-email" className="text-sm font-medium text-foreground">
            דוא״ל
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !configured}
            className="h-11 w-full rounded-lg border border-[#d4d4d8] bg-white px-3 text-base text-[#18181b] outline-none transition-[box-shadow,border-color] placeholder:text-[#71717a] focus-visible:border-[#a1a1aa] focus-visible:ring-2 focus-visible:ring-[#d4d4d8] disabled:cursor-not-allowed disabled:opacity-50"
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
          className="h-11 w-full touch-manipulation text-base"
        >
          {loading ? 'שולחים…' : 'שלחו לי קישור כניסה'}
        </Button>
      </form>
    </AuthScreenShell>
  )
}
