import { Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type Props = {
  buildingName: string
  className?: string
}

export function FeedHeader({ buildingName, className }: Props) {
  return (
    <header
      className={cn(
        'flex flex-col pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      <div className="flex justify-center px-3 pb-3 pt-5">
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
