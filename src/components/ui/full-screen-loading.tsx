import { Ellipsis } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Brand accent for full-screen loading (matches product purple). */
const LOADER_ACCENT = '#5E00FF'

/** ~`BuildingAdminSectionHeader` + top safe-area; keeps loader visually centered under the bar. */
const BUILDING_ADMIN_BELOW_HEADER_MIN_H = 'min-h-[calc(100svh-8.75rem)]'

type FullScreenLoadingProps = {
  /**
   * Compact column (icon + label only). Pair with {@link BuildingAdminPageLoader} for vertical centering
   * under the building admin header; do not use `flex-1` here or it stretches the whole page.
   */
  embedded?: boolean
}

export function FullScreenLoading({ embedded = false }: FullScreenLoadingProps) {
  const body = (
    <>
      <Ellipsis
        className="size-16 shrink-0 animate-loby-loading-ellipsis sm:size-[4.25rem]"
        style={{ color: LOADER_ACCENT }}
        strokeWidth={2.25}
        aria-hidden
      />
      <p
        className="text-base font-semibold tracking-tight"
        style={{ color: LOADER_ACCENT }}
      >
        טוען
      </p>
    </>
  )

  if (embedded) {
    return (
      <div
        className={cn('flex flex-col items-center gap-4 px-4')}
        dir="rtl"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {body}
      </div>
    )
  }

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-feed-canvas px-4"
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {body}
    </div>
  )
}

/** Centers {@link FullScreenLoading} `embedded` under the building section header only (not the whole page). */
export function BuildingAdminPageLoader() {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        BUILDING_ADMIN_BELOW_HEADER_MIN_H
      )}
    >
      <FullScreenLoading embedded />
    </div>
  )
}
