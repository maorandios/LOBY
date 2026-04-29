import {
  ChartColumnDecreasing,
  HeartHandshake,
  Info,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'

import type { PostTypeHe } from '@/types/feed'
import { cn } from '@/lib/utils'

/** Same red as the bottom-bar «פוסט חדש» FAB. */
export const POST_CREATE_BUTTON_HEX = '#FF0048' as const

/** Border stroke for pinned «נעוץ» posts. */
export const PINNED_POST_BORDER_HEX = '#FFC5D2' as const

/** Subtle blurred drop shadow glow (hue matches {@link PINNED_POST_BORDER_HEX}). */
export function pinnedPostCardGlowClass() {
  return cn(
    'shadow-[0_10px_32px_-8px_rgba(255,197,210,0.45),0_4px_16px_-4px_rgba(255,197,210,0.28)]',
    'hover:-translate-y-px hover:shadow-[0_14px_40px_-8px_rgba(255,197,210,0.55),0_6px_20px_-4px_rgba(255,197,210,0.38)]',
    'dark:shadow-[0_10px_28px_-8px_rgba(255,197,210,0.22),0_4px_14px_-4px_rgba(255,197,210,0.14)] dark:hover:shadow-[0_14px_36px_-8px_rgba(255,197,210,0.28),0_6px_18px_-4px_rgba(255,197,210,0.22)]'
  )
}

export const postTypeLucideIcon: Record<PostTypeHe, LucideIcon> = {
  דיווח: Info,
  עדכון: Megaphone,
  הצבעה: ChartColumnDecreasing,
  בקשה: HeartHandshake,
}

export function cardAccentByType(type: PostTypeHe) {
  void type
  return cn(
    'rounded-3xl bg-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:bg-card/20 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.45)]'
  )
}

/** Label shown on the type chip (poll type displays as «סקר»). */
export function postTypeChipLabel(type: PostTypeHe): string {
  if (type === 'הצבעה') return 'סקר'
  return type
}

/** Border + tinted surface + foreground — identical palette to chips on posts. */
const POST_TYPE_CHIP_LOOKUP: Record<PostTypeHe, string> = {
  דיווח: 'border border-[#FF0019] bg-[#FFDEE5] text-[#FF0019]',
  הצבעה: 'border border-[#FF8800] bg-[#FFF2E4] text-[#FF8800]',
  עדכון: 'border border-[#00766C] bg-[#E4FFF6] text-[#00766C]',
  בקשה: 'border border-[#9000FF] bg-[#F5E8FF] text-[#9000FF]',
}

export function typeBadgeClass(type: PostTypeHe) {
  return POST_TYPE_CHIP_LOOKUP[type] ?? ''
}

/** Tray for menu / icon circles — chip colors on a rounded-full shell. */
export function postTypeChipIconTrayClass(type: PostTypeHe): string {
  return POST_TYPE_CHIP_LOOKUP[type] ?? ''
}
