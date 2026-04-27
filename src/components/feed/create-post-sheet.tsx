import {
  BellRing,
  ClipboardPlus,
  ListChecks,
  Megaphone,
  MessageSquarePlus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const actions = [
  {
    label: 'דיווח חדש',
    description: 'תקלה, חניה חסומה או סיכון — בצורה מסודרת',
    icon: BellRing,
    tone: 'text-amber-900 dark:text-amber-50',
    bg: 'bg-amber-50/80 dark:bg-amber-950/35',
  },
  {
    label: 'עדכון חדש',
    description: 'הודעה רשמית לכל הדיירים',
    icon: Megaphone,
    tone: 'text-neutral-900 dark:text-neutral-50',
    bg: 'bg-neutral-100/80 dark:bg-neutral-900/50',
  },
  {
    label: 'הצבעה חדשה',
    description: 'שאלת כן/לא או בחירה בין אפשרויות',
    icon: ListChecks,
    tone: 'text-indigo-950 dark:text-indigo-50',
    bg: 'bg-indigo-50/85 dark:bg-indigo-950/40',
  },
  {
    label: 'בקשה חדשה',
    description: 'עזרה קהילתית או תיאום בין שכנים',
    icon: MessageSquarePlus,
    tone: 'text-emerald-950 dark:text-emerald-50',
    bg: 'bg-emerald-50/85 dark:bg-emerald-950/35',
  },
] as const

export function CreatePostSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="px-4 pb-2 text-start">
          <SheetTitle className="text-lg">יצירת פריט חדש</SheetTitle>
          <SheetDescription className="text-start">
            בחרו סוג — בהמשך יתווסף טופס מלא (דמו בלבד)
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex flex-col gap-2 px-3 py-3">
          {actions.map(({ label, description, icon: Icon, tone, bg }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              className={cn(
                'h-auto min-h-[4.25rem] w-full justify-start gap-3 rounded-2xl px-3 py-3 text-start touch-manipulation',
                bg
              )}
              onClick={() => onOpenChange(false)}
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 ring-1 ring-black/5 dark:ring-white/10',
                  tone
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className={cn('text-base font-semibold', tone)}>
                  {label}
                </span>
                <span className="text-[0.8rem] font-normal text-muted-foreground">
                  {description}
                </span>
              </span>
              <ClipboardPlus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
