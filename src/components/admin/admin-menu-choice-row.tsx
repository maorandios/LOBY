import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MoveLeft, type LucideIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Grayscale tray — same idea as {@link NEUTRAL_TRAY_GRAY} in post-admin-sheet. */
const NEUTRAL_ICON_TRAY =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/45 dark:border-zinc-600/85 dark:bg-zinc-800/65'

const TRAY_ICON = 'size-5 shrink-0 text-zinc-600 dark:text-zinc-400'

const MENU_ROW =
  'flex h-auto min-h-[4.25rem] w-full items-center touch-manipulation justify-between gap-3 rounded-2xl border border-border/50 bg-background px-3 py-3 text-start shadow-none hover:bg-muted/50'

const MENU_ICON_STROKE = 2 as const

type LinkProps = {
  to: string
  title: string
  subtitle: string
  icon: LucideIcon
}

/** White card row — RTL menu + gray tray (create-post / profile logout style). */
export function AdminMenuChoiceRow({ to, title, subtitle, icon: Icon }: LinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        MENU_ROW,
        'h-auto w-full max-w-none font-normal',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={NEUTRAL_ICON_TRAY} aria-hidden>
          <Icon className={TRAY_ICON} strokeWidth={MENU_ICON_STROKE} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="text-base font-semibold text-foreground">{title}</span>
          <span className="text-[0.8rem] font-normal leading-snug text-muted-foreground">
            {subtitle}
          </span>
        </span>
      </div>
      <MoveLeft
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={MENU_ICON_STROKE}
        aria-hidden
      />
    </Link>
  )
}

type ActionProps = {
  title: string
  subtitle: string
  icon: LucideIcon
  disabled?: boolean
  onClick: () => void
  /** Teal invite row (WhatsApp-style) — bg #E4FFF6, border/text/icon #00766C. */
  variant?: 'default' | 'whatsappInvite'
  /** Rendered beside the chevron (e.g. type chip). */
  trailingChip?: ReactNode
}

/** Same surface as {@link AdminMenuChoiceRow}, for in-page actions (not navigation). */
export function AdminMenuActionRow({
  title,
  subtitle,
  icon: Icon,
  disabled = false,
  onClick,
  variant = 'default',
  trailingChip,
}: ActionProps) {
  const isWa = variant === 'whatsappInvite'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        MENU_ROW,
        'h-auto w-full max-w-none font-normal disabled:pointer-events-none disabled:opacity-45',
        isWa &&
          'border-[#00766C] bg-[#E4FFF6] hover:bg-[#dbf6ee] dark:border-[#00766C] dark:bg-[#E4FFF6] dark:hover:bg-[#dbf6ee]',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            NEUTRAL_ICON_TRAY,
            isWa &&
              'border-[#00766C] bg-[#E4FFF6] dark:border-[#00766C] dark:bg-[#E4FFF6]',
          )}
          aria-hidden
        >
          <Icon
            className={cn(
              TRAY_ICON,
              isWa && 'text-[#00766C] dark:text-[#00766C]',
            )}
            strokeWidth={MENU_ICON_STROKE}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
          <span
            className={cn(
              'text-base font-semibold',
              isWa ? 'text-[#00766C]' : 'text-foreground',
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'text-[0.8rem] font-normal leading-snug',
              isWa ? 'text-[#00766C]/90' : 'text-muted-foreground',
            )}
          >
            {subtitle}
          </span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailingChip}
        <MoveLeft
          className={cn(
            'size-5 shrink-0',
            isWa ? 'text-[#00766C]' : 'text-muted-foreground',
          )}
          strokeWidth={MENU_ICON_STROKE}
          aria-hidden
        />
      </div>
    </button>
  )
}
