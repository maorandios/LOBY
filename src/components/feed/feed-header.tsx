import { Bell, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  buildingName: string
  className?: string
}

export function FeedHeader({ buildingName, className }: Props) {
  return (
    <div
      className={cn(
        'grid h-14 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 px-3 pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      <span className="block size-9" aria-hidden />
      <div className="flex min-w-0 items-center justify-center gap-2">
        <Building2
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <h1 className="truncate text-center text-base font-semibold tracking-tight">
          {buildingName}
        </h1>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="justify-self-end touch-manipulation"
        aria-label="התראות"
      >
        <Bell className="size-5" />
      </Button>
    </div>
  )
}
