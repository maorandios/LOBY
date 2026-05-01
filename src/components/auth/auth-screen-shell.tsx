import type { ReactNode } from 'react'

type AuthScreenShellProps = {
  children: ReactNode
  /** Edge-to-edge block pinned below main content (e.g. full-width Lottie). */
  bottomFullWidth?: ReactNode
}

export function AuthScreenShell({ children, bottomFullWidth }: AuthScreenShellProps) {
  if (bottomFullWidth) {
    return (
      <div className="flex min-h-svh flex-col bg-feed-canvas" dir="rtl">
        <div className="grow px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">{children}</div>
        </div>
        <div className="w-full shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {bottomFullWidth}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-svh bg-feed-canvas px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">{children}</div>
    </div>
  )
}
