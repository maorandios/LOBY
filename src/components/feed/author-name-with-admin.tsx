import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import { cn } from '@/lib/utils'

/** Author display name with optional מנהל ועד badge when `authorIsAdmin` from `building_members`. */
export function AuthorNameWithAdminBadge({
  name,
  authorIsAdmin,
  nameClassName,
  adminClusterClassName,
  badgeClassName,
}: {
  name: string
  authorIsAdmin?: boolean
  nameClassName?: string
  /** Extra classes on the inline admin row (e.g. tighter `gap-*` on post cards). */
  adminClusterClassName?: string
  badgeClassName?: string
}) {
  if (!authorIsAdmin) {
    return (
      <span
        className={cn('font-semibold text-foreground', nameClassName)}
      >
        {name}
      </span>
    )
  }

  /* dir=rtl places first DOM item on inline-start (= physical right): badge hugs the right of the name cluster */
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1 leading-snug',
        adminClusterClassName
      )}
      dir="rtl"
    >
      <span
        className="inline-flex h-[1.15em] shrink-0 items-center justify-center"
        role="img"
        aria-label="מנהל ועד"
      >
        <AdminBadgeCheck className={cn('size-3.5', badgeClassName)} />
      </span>
      <span
        className={cn('font-semibold text-foreground', nameClassName)}
      >
        {name}
      </span>
    </span>
  )
}
