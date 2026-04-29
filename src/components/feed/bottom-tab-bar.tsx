import {
  CirclePlus,
  Rss,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { CreatePostSheet } from '@/components/feed/create-post-sheet'
import { postTypeLucideIcon } from '@/components/feed/post-type-styles'
import { useCreatePostComposer } from '@/context/create-post-composer-context'
import { cn } from '@/lib/utils'

const POST_ACCENT = '#FF0048'

/** Post FAB — icon only, above פיד column */
const FAB_ROUND_SLOT =
  'relative z-auto box-border flex h-[4.25rem] w-[4.25rem] min-h-[4.25rem] min-w-[4.25rem] shrink-0 items-center justify-center rounded-full p-1.5 touch-manipulation'

/** Nav tabs: tall tap targets, dot under label for active — no circular chrome. */
const TAB_SLOT =
  'relative flex min-h-[4.25rem] w-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center font-semibold'

const ICON_BOX = 'flex h-[1.4375rem] w-[1.4375rem] shrink-0 items-center justify-center'
const ICON_SIZE = 'size-[1.4375rem]'
/** Post FAB — 1.5× chip icon size */
const FAB_ICON_SIZE = 'size-[2.15625rem]'
const STROKE = 2.3
const LABEL =
  'w-full min-h-0 max-w-full px-0.5 text-[0.575rem] leading-tight [overflow-wrap:anywhere]'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** פיד … סקרים — dir=rtl: first DOM item aligns to visual start (often right edge on mobile). Icons match post type chips (post-type-styles) plus Rss for feed. */
const NAV_ITEMS: NavItem[] = [
  { to: '/feed', label: 'פיד', icon: Rss, end: true },
  { to: '/reports', label: 'דיווחים', icon: postTypeLucideIcon['דיווח'], end: false },
  { to: '/updates', label: 'עדכונים', icon: postTypeLucideIcon['עדכון'], end: false },
  { to: '/requests', label: 'בקשות', icon: postTypeLucideIcon['בקשה'], end: false },
  { to: '/votes', label: 'סקרים', icon: postTypeLucideIcon['הצבעה'], end: false },
]

function NavTab({ to, label, icon: Icon, end }: NavItem) {
  return (
    <div className="flex min-w-0 flex-1 basis-0 justify-center p-[5px]">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            TAB_SLOT,
            'touch-manipulation transition-[transform,color] duration-150 motion-reduce:transition-colors',
            'active:scale-[0.93] motion-reduce:active:scale-100',
            isActive
              ? 'text-foreground'
              : 'text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className={cn(ICON_BOX, 'text-inherit')}>
              <Icon className={ICON_SIZE} strokeWidth={STROKE} aria-hidden />
            </span>
            <span className={cn(LABEL, 'text-inherit')}>{label}</span>
            <span
              aria-hidden
              className={cn(
                'mt-0.5 size-1.5 shrink-0 rounded-full transition-opacity duration-150',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
              style={{ backgroundColor: isActive ? POST_ACCENT : 'transparent' }}
            />
          </>
        )}
      </NavLink>
    </div>
  )
}

export function BottomTabBar() {
  const { open: createOpen, setOpen: setCreateOpen } = useCreatePostComposer()

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 w-full',
          createOpen ? 'pointer-events-none z-40 opacity-90' : 'pointer-events-auto'
        )}
      >
        {/* FAB row aligns with NAV_ITEMS[0] (פיד) — same rtl grid tracks as nav */}
        <div className="mx-auto w-full max-w-lg px-1 pb-1 pt-1 sm:px-2">
          <div
            className={cn(
              'grid grid-cols-5 gap-px',
              createOpen && 'pointer-events-none'
            )}
            dir="rtl"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex min-w-0 justify-center self-end p-[5px]">
                {i === 0 ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className={cn(
                      FAB_ROUND_SLOT,
                      'text-white transition-transform duration-150 active:scale-[0.93] motion-reduce:transition-colors'
                    )}
                    style={{ backgroundColor: POST_ACCENT }}
                    aria-label="פוסט חדש"
                  >
                    <CirclePlus
                      className={cn(FAB_ICON_SIZE, 'shrink-0')}
                      strokeWidth={STROKE}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <nav
          className={cn(
            'w-full border-t border-zinc-200/70 bg-feed-canvas backdrop-blur-xl supports-[backdrop-filter]:bg-feed-canvas/90 dark:border-white/10',
            'pb-[env(safe-area-inset-bottom,0px)]',
            createOpen ? 'pointer-events-none' : 'pointer-events-auto'
          )}
          aria-label="ניווט ראשי"
          dir="rtl"
        >
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-0 px-1 py-1.5 sm:gap-px sm:px-2">
            {NAV_ITEMS.map((item) => (
              <NavTab key={item.to} {...item} />
            ))}
          </div>
        </nav>
      </div>

      <CreatePostSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
