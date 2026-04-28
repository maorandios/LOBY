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

const TEAL = '#3EBDA5'

/** One physical size for every tab (pixel-aligned); icon + label never overlap. */
const ROUND_SLOT =
  'box-border flex h-[4.25rem] w-[4.25rem] min-h-[4.25rem] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full p-1.5 text-center font-semibold'

/** Icon + label 15% larger than base `size-5` / `text-[0.5rem]`; circles unchanged. */
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

/** פיד → דיווחים → (פוסט) → בקשות → סקרים — order in DOM; pill uses dir=rtl so פיד is on the right. */
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
            'touch-manipulation transition-[transform,color,background-color,box-shadow] duration-150 motion-reduce:transition-colors',
            'active:scale-[0.93] motion-reduce:active:scale-100',
            isActive
              ? 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'bg-transparent text-white/90 hover:text-white'
          )
        }
      >
        <span className={cn(ICON_BOX, 'text-inherit')}>
          <Icon className={ICON_SIZE} strokeWidth={STROKE} aria-hidden />
        </span>
        <SlotLabel>{label}</SlotLabel>
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
          'pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-3',
          createOpen ? 'z-40' : 'z-50'
        )}
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <nav
          className={cn(
            'w-full max-w-md',
            createOpen ? 'pointer-events-none' : 'pointer-events-auto'
          )}
          aria-label="ניווט ראשי"
          dir="rtl"
        >
          <div
            className={cn(
              'flex items-center justify-between gap-1 rounded-full p-[5px]',
              'bg-[#232323]/98 shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.08] backdrop-blur-md'
            )}
          >
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
                  'shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                )}
                style={{ backgroundColor: TEAL }}
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
