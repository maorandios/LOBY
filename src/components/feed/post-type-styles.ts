import {
  ChartColumnDecreasing,
  HeartHandshake,
  Info,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'

import type { PostTypeHe } from '@/types/feed'
import { cn } from '@/lib/utils'

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
