import { Link } from 'react-router-dom'
import { MoveRight, type LucideIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  /** Shown beside title (RTL: visual right of text). */
  icon: LucideIcon
}

export function BuildingAdminSectionHeader({ title, icon: Icon }: Props) {
  return (
    <div className="bg-feed-canvas pt-[env(safe-area-inset-top)]">
      <header className="pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          dir="ltr"
          className="relative mx-auto flex min-h-10 w-full max-w-lg items-center px-2"
        >
          <div className="z-10 flex w-[6.25rem] shrink-0 items-center justify-start">
            <span className="inline-flex size-10 shrink-0" aria-hidden />
          </div>

          <div className="min-w-0 flex-1 shrink" aria-hidden />

          <div className="z-10 flex w-[6.25rem] shrink-0 justify-end">
            <Link
              to="/building"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'lg' }),
                'inline-flex min-h-10 shrink-0 items-center touch-manipulation gap-2 rounded-full px-2.5 ps-3 text-muted-foreground sm:px-3'
              )}
            >
              חזרה
              <MoveRight
                className="size-4 shrink-0 opacity-90"
                strokeWidth={2.2}
                aria-hidden
              />
            </Link>
          </div>

          <div
            dir="rtl"
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex max-w-[min(17rem,calc(100vw-9rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 text-center sm:max-w-[16rem]"
          >
            <Icon
              className="size-5 shrink-0 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>
      </header>
    </div>
  )
}
