import { Loader2 } from 'lucide-react'

export function AuthLoading() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">טוען…</span>
    </div>
  )
}
