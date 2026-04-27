import { Building2, ClipboardList, Home, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'פיד', icon: Home, end: true },
  { to: '/votes', label: 'הצבעות', icon: ClipboardList, end: false },
  { to: '/reports', label: 'דיווחים', icon: Building2, end: false },
  { to: '/profile', label: 'פרופיל', icon: UserRound, end: false },
] as const

export function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
      aria-label="ניווט ראשי"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[0.7rem] font-medium touch-manipulation transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
