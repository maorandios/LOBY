import { useState, type ReactNode } from 'react'
import {
  BarChart2,
  ClipboardList,
  Home,
  Plus,
  UserRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { CreatePostSheet } from '@/components/feed/create-post-sheet'
import { cn } from '@/lib/utils'

const TEAL = '#3EBDA5'

/** One physical size for every tab (pixel-aligned); icon + label never overlap. */
const ROUND_SLOT =
  'box-border flex h-[4.25rem] w-[4.25rem] min-h-[4.25rem] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full p-1.5 text-center font-semibold'

const ICON_BOX = 'flex h-5 w-5 shrink-0 items-center justify-center'
const STROKE = 2
const LABEL = 'w-full min-h-0 max-w-full px-0.5 text-[0.5rem] leading-tight [overflow-wrap:anywhere]'

function SlotLabel({ children }: { children: ReactNode }) {
  return <span className={cn(LABEL, 'text-inherit')}>{children}</span>
}

type NavItem = {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

const NAV_ITEMS: [NavItem, NavItem, NavItem, NavItem] = [
  { to: '/', label: 'פיד', icon: Home, end: true },
  { to: '/votes', label: 'סקרים', icon: BarChart2, end: false },
  { to: '/reports', label: 'דיווחים', icon: ClipboardList, end: false },
  { to: '/profile', label: 'פרופיל', icon: UserRound, end: false },
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
            'touch-manipulation transition-[color,background-color,box-shadow] duration-200',
            isActive
              ? 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'bg-transparent text-white/90 hover:text-white'
          )
        }
      >
        <span className={cn(ICON_BOX, 'text-inherit')}>
          <Icon className="size-5" strokeWidth={STROKE} aria-hidden />
        </span>
        <SlotLabel>{label}</SlotLabel>
      </NavLink>
    </div>
  )
}

export function BottomTabBar() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <nav
          className="pointer-events-auto w-full max-w-md"
          aria-label="ניווט ראשי"
        >
          <div
            className={cn(
              'flex items-center justify-between gap-1 rounded-full py-2.5 px-[10px]',
              'bg-[#232323]/98 shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.08] backdrop-blur-md'
            )}
          >
            <NavTab {...NAV_ITEMS[0]} />
            <NavTab {...NAV_ITEMS[1]} />

            <div className="flex min-w-0 flex-1 basis-0 justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(
                  ROUND_SLOT,
                  'text-white touch-manipulation transition active:scale-[0.98] motion-reduce:transform-none',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                )}
                style={{ backgroundColor: TEAL }}
                aria-label="פוסט חדש"
              >
                <span className={cn(ICON_BOX, 'text-inherit')}>
                  <Plus className="size-5" strokeWidth={STROKE} aria-hidden />
                </span>
                <SlotLabel>פוסט</SlotLabel>
              </button>
            </div>

            <NavTab {...NAV_ITEMS[2]} />
            <NavTab {...NAV_ITEMS[3]} />
          </div>
        </nav>
      </div>

      <CreatePostSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
