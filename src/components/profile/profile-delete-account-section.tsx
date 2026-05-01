import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, UserRoundX } from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { DeleteAccountSheet } from '@/components/profile/delete-account-sheet'
import { deleteAccountViaEdge } from '@/lib/account-queries'
import { cn } from '@/lib/utils'

const TITLE =
  'text-[1rem] font-semibold tracking-tight text-foreground sm:text-[1.016rem]'
const BODY =
  'mt-2 text-[0.8125rem] font-medium leading-relaxed text-pretty text-muted-foreground'

const SECTION_SHELL = 'px-4 py-5'

/** מחיקת חשבון — פרופיל, פאנל אישור תחתון כמו במחיקת פוסט. */
export function ProfileDeleteAccountSection() {
  const { signOutApp } = useAuth()
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetBusy, setSheetBusy] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)

  function openSheet() {
    setSheetError(null)
    setSheetOpen(true)
  }

  function onSheetOpenChange(next: boolean) {
    setSheetOpen(next)
    if (!next) setSheetError(null)
  }

  async function confirmDelete() {
    setSheetError(null)
    setSheetBusy(true)
    try {
      const res = await deleteAccountViaEdge()
      if (!res.ok) {
        setSheetError(res.error ?? 'לא ניתן למחוק את החשבון.')
        return
      }
      await signOutApp()
      navigate('/login', { replace: true })
    } finally {
      setSheetBusy(false)
    }
  }

  return (
    <>
      <section dir="rtl" lang="he" aria-labelledby="delete-account-heading" className={SECTION_SHELL}>
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-2.5">
            <span
              className="flex h-5 shrink-0 items-center justify-center text-muted-foreground"
              aria-hidden
            >
              <UserRoundX className="size-[1.125rem] shrink-0" strokeWidth={2} />
            </span>
            <h2 id="delete-account-heading" className={cn(TITLE, 'min-w-0 text-start leading-tight')}>
              מחיקת חשבון
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="מחיקת חשבון"
            className="size-9 shrink-0 rounded-full"
            onClick={() => openSheet()}
          >
            <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
          </Button>
        </div>
        <p className={BODY}>
          לאחר מחיקת החשבון לא תוכלו להתחבר שוב לאפליקציה, לעדכן פוסטים קיימים או ליצור חדשים וכל התוכן שפריסמתם באפליקציה ימחק כולל תגובות והצבעה לסקרים.
        </p>
      </section>

      <DeleteAccountSheet
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
        busy={sheetBusy}
        error={sheetError}
        onConfirmDelete={confirmDelete}
      />
    </>
  )
}
