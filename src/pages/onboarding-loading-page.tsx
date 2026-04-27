import { AuthScreenShell } from '@/components/auth/auth-screen-shell'

export function OnboardingLoadingPage() {
  return (
    <AuthScreenShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-2 text-center">
        <p className="text-lg font-medium text-foreground">מצרפים אותך לבניין…</p>
      </div>
    </AuthScreenShell>
  )
}
