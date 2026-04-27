import { useState } from 'react'
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

/** One shared circle size: icon + label both inside. */
const CIRCLE_DIM = 'h-[5rem] w-[5rem] min-h-[5rem] min-w-[5rem]'

const ICON_CLASS = 'size-6 shrink-0 text-current'
const ICON_STROKE = 2

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
    <div className="flex min-w-0 flex-1 justify-center">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            CIRCLE_DIM,
            'flex touch-manipulation flex-col items-center justify-center gap-0.5 rounded-full px-1.5 text-center text-[0.6rem] font-semibold leading-tight transition-colors',
            isActive
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'bg-transparent text-white/95 hover:text-white'
          )
        }
      >
        <Icon
          className={ICON_CLASS}
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
        <span className="w-full break-words px-0.5 leading-none">{label}</span>
      </NavLink>
    </div>
  )
}

export function BottomTabBar() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2.5"
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
              'flex items-center justify-between gap-0.5 rounded-full px-1.5 py-2',
              'bg-[#1f1f1f] shadow-2xl ring-1 ring-white/5'
            )}
          >
            <NavTab {...NAV_ITEMS[0]} />
            <NavTab {...NAV_ITEMS[1]} />

            <div className="flex min-w-0 flex-1 justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(
                  CIRCLE_DIM,
                  'flex flex-col items-center justify-center gap-0.5 rounded-full px-1.5 text-center text-[0.6rem] font-semibold leading-tight text-white shadow-md touch-manipulation transition active:scale-[0.98] motion-reduce:transform-none'
                )}
                style={{ backgroundColor: TEAL }}
                aria-label="פוסט חדש"
              >
                <Plus
                  className={ICON_CLASS}
                  strokeWidth={ICON_STROKE}
                  aria-hidden
                />
                <span className="w-full break-words px-0.5 leading-none">
                  פוסט
                </span>
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
