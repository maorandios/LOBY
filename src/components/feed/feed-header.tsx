import { MapPin, Star, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { POST_CREATE_BUTTON_HEX } from '@/components/feed/post-type-styles'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  buildingName: string
  className?: string
  /** When set, shows star control in the physical top-right slot (LTR grid column 3). */
  myPostsOnly?: boolean
  onToggleMyPostsOnly?: () => void
}

/** Icon-only profile entry. Default: fixed to physical left of the viewport. */
export function ProfileCornerLink({
  className,
  pinned = true,
}: {
  className?: string
  /** When false, behaves as an inline grid/flex sibling (feed bar uses this for symmetry). */
  pinned?: boolean
}) {
  return (
    <Link
      to="/profile"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'z-10 size-10 shrink-0 rounded-full text-foreground',
        pinned &&
          'absolute left-3 top-[max(1rem,env(safe-area-inset-top))]',
        className
      )}
      aria-label="פרופיל"
    >
      <UserRound className="size-[1.35rem]" strokeWidth={2} aria-hidden />
    </Link>
  )
}

export function FeedHeader({
  buildingName,
  className,
  myPostsOnly = false,
  onToggleMyPostsOnly,
}: Props) {
  return (
    <header className={cn('pb-3 pt-[max(1rem,env(safe-area-inset-top))]', className)}>
      {/*
        `dir=ltr` gives stable physical columns regardless of Hebrew root `dir`:
        slot 1 — profile · slot 2 — title (RTL text inside) · slot 3 — my-posts filter.
      */}
      <div
        dir="ltr"
        className="mx-auto grid w-full max-w-lg grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-0 px-2"
      >
        <div className="flex justify-center">
          <ProfileCornerLink pinned={false} />
        </div>
        <div
          dir="rtl"
          lang="he"
          className="flex min-w-0 items-center justify-center gap-2 px-1 text-center"
        >
          <MapPin
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <h1 className="text-balance text-base font-semibold tracking-tight">
            {buildingName}
          </h1>
        </div>
        <div className="flex justify-center">
          {onToggleMyPostsOnly ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-full text-foreground"
              aria-pressed={myPostsOnly}
              aria-label={
                myPostsOnly
                  ? 'הצגת כל הפוסטים'
                  : 'סינון לפוסטים שפרסמתי בלבד'
              }
              onClick={onToggleMyPostsOnly}
            >
              <Star
                className={cn(
                  'size-[1.35rem] transition-[fill,color]',
                  myPostsOnly ? '' : 'fill-none text-muted-foreground'
                )}
                style={
                  myPostsOnly
                    ? { fill: POST_CREATE_BUTTON_HEX, color: POST_CREATE_BUTTON_HEX }
                    : undefined
                }
                strokeWidth={2}
                aria-hidden
              />
            </Button>
          ) : (
            <span className="inline-flex size-10 shrink-0" aria-hidden />
          )}
        </div>
      </div>
    </header>
  )
}
