import { Building2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  buildingName: string
  className?: string
}

/** Icon-only profile entry; physical top-left so it stays consistent in RTL. */
export function ProfileCornerLink({ className }: { className?: string }) {
  return (
    <Link
      to="/profile"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'absolute left-3 top-[max(1rem,env(safe-area-inset-top))] z-10 size-10 shrink-0 rounded-full text-foreground',
        className
      )}
      aria-label="פרופיל"
    >
      <UserRound className="size-[1.35rem]" strokeWidth={2} aria-hidden />
    </Link>
  )
}

export function FeedHeader({ buildingName, className }: Props) {
  return (
    <header className={cn('relative flex flex-col', className)}>
      <ProfileCornerLink />
      <div className="flex justify-center px-10 pb-3 pt-5">
        <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
          <Building2
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <h1 className="text-balance text-center text-base font-semibold tracking-tight">
            {buildingName}
          </h1>
        </div>
      </div>
    </header>
  )
}
