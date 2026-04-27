import type { ReactNode } from 'react'

export function AuthScreenShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-svh bg-feed-canvas px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">{children}</div>
    </div>
  )
}
