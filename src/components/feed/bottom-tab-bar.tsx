import { type ReactNode } from 'react'
import {
  BarChart2,
  ClipboardList,
  Handshake,
  Home,
  Plus,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { CreatePostSheet } from '@/components/feed/create-post-sheet'
import { useCreatePostComposer } from '@/context/create-post-composer-context'
import { cn } from '@/lib/utils'

const POST_ACCENT = '#FF0048'

/** One physical size for every tab/post control (tap target); active tab adds a tighter ring only — see NavTab. */
const ROUND_SLOT =
  'relative z-0 box-border flex h-[4.25rem] w-[4.25rem] min-h-[4.25rem] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full p-1.5 text-center font-semibold'

/** Inner diameter of the dark ring when selected = ROUND outer ÷ 1.25 */
const ACTIVE_RING_INSET =
  'inset-[calc((4.25rem-4.25rem/1.25)/2)]'

/** Icon + label sizing (unchanged from full-size bar). */
const ICON_BOX = 'flex h-[1.4375rem] w-[1.4375rem] shrink-0 items-center justify-center'
const ICON_SIZE = 'size-[1.4375rem]'
const STROKE = 2.3
const LABEL =
  'w-full min-h-0 max-w-full px-0.5 text-[0.575rem] leading-tight [overflow-wrap:anywhere]'

function SlotLabel({ children }: { children: ReactNode }) {
  return <span className={cn(LABEL, 'text-inherit')}>{children}</span>
}

type NavItem = {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

/** פיד → דיווחים → (פוסט) → בקשות → סקרים — order in DOM; bar uses dir=rtl so פיד is on the right. */
const NAV_SIDE: [NavItem, NavItem, NavItem, NavItem] = [
  { to: '/feed', label: 'פיד', icon: Home, end: true },
  { to: '/reports', label: 'דיווחים', icon: ClipboardList, end: false },
  { to: '/requests', label: 'בקשות', icon: Handshake, end: false },
  { to: '/votes', label: 'סקרים', icon: BarChart2, end: false },
]

function NavTab({ to, label, icon: Icon, end }: NavItem) {
  return (
    <div className="flex min-w-0 flex-1 basis-0 justify-center p-[5px]">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            ROUND_SLOT,
            'touch-manipulation transition-[transform,color,box-shadow] duration-150 motion-reduce:transition-colors',
            'active:scale-[0.93] motion-reduce:active:scale-100',
            isActive
              ? 'bg-transparent text-foreground'
              : 'bg-transparent text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100'
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <span
                className={cn(
                  'pointer-events-none absolute z-0 rounded-full ring-2 ring-zinc-700 dark:ring-zinc-400',
                  ACTIVE_RING_INSET
                )}
                aria-hidden
              />
            ) : null}
            <span className={cn(ICON_BOX, 'relative z-[1] text-inherit')}>
              <Icon className={ICON_SIZE} strokeWidth={STROKE} aria-hidden />
            </span>
            <span className={cn(LABEL, 'relative z-[1] text-inherit')}>
              {label}
            </span>
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
          'pointer-events-none fixed inset-x-0 bottom-0 w-full',
          createOpen ? 'z-40' : 'z-50'
        )}
      >
        <nav
          className={cn(
            'w-full border-t border-zinc-200/70 bg-feed-canvas backdrop-blur-xl supports-[backdrop-filter]:bg-feed-canvas/90 dark:border-white/10',
            'pb-[env(safe-area-inset-bottom,0px)]',
            createOpen ? 'pointer-events-none' : 'pointer-events-auto'
          )}
          aria-label="ניווט ראשי"
          dir="rtl"
        >
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-1 px-2 py-1.5 sm:px-3">
            <NavTab {...NAV_SIDE[0]} />
            <NavTab {...NAV_SIDE[1]} />

            <div className="flex min-w-0 flex-1 basis-0 justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(
                  ROUND_SLOT,
                  'text-white touch-manipulation transition-[transform,box-shadow] duration-150',
                  'active:scale-[0.93] motion-reduce:active:scale-100',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.18)]'
                )}
                style={{ backgroundColor: POST_ACCENT }}
                aria-label="פוסט חדש"
              >
                <span className={cn(ICON_BOX, 'text-inherit')}>
                  <Plus className={ICON_SIZE} strokeWidth={STROKE} aria-hidden />
                </span>
                <SlotLabel>פוסט</SlotLabel>
              </button>
            </div>

            <NavTab {...NAV_SIDE[2]} />
            <NavTab {...NAV_SIDE[3]} />
          </div>
        </nav>
      </div>

      <CreatePostSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
