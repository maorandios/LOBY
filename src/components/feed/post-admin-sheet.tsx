import { useState } from 'react'

import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import {
  adminDeletePost,
  adminMarkPollDecided,
  adminSetPostPinned,
  adminUpdateReportPostStatus,
} from '@/lib/feed-queries'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { isPollPost, type FeedPost } from '@/types/feed'

type Props = {
  post: FeedPost
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** Called after successful delete (e.g. navigate away). */
  onDeleted?: () => void
}

export function PostAdminSheet({
  post,
  open,
  onOpenChange,
  onSuccess,
  onDeleted,
}: Props) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)

  const isPoll = isPollPost(post)
  const isReport = post.type === 'דיווח'
  const isUpdateOrRequest = post.type === 'עדכון' || post.type === 'בקשה'

  const pollDecided =
    isPoll && (post.poll.isClosed || post.status === 'הוחלט')

  async function wrap(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>
  ) {
    setSheetError(null)
    setBusyKey(key)
    try {
      const res = await fn()
      if (!res.ok) {
        setSheetError(res.error ?? 'פעולה נכשלה')
        return
      }
      onSuccess()
      onOpenChange(false)
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDelete() {
    const ok = window.confirm('למחוק את הפוסט? לא ניתן לשחזר.')
    if (!ok) return
    setSheetError(null)
    setBusyKey('delete')
    try {
      const res = await adminDeletePost(post.id)
      if (!res.ok) {
        setSheetError(res.error ?? 'מחיקה נכשלה')
        return
      }
      onOpenChange(false)
      if (onDeleted) onDeleted()
      else onSuccess()
    } finally {
      setBusyKey(null)
    }
  }

  const btnClass = 'h-11 w-full rounded-xl font-semibold justify-center'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="flex items-center justify-end gap-2">
            <AdminBadgeCheck className="size-5" />
            פעולות ניהול
          </SheetTitle>
          <SheetDescription className="text-pretty">
            פעולות אלו זמינות למנהלי הבניין בלבד.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-2 pb-4">
          {sheetError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {sheetError}
            </p>
          ) : null}

          {isReport ? (
            <>
              <p className="mb-1 ps-1 text-xs font-medium text-muted-foreground">
                סטטוס דיווח
              </p>
              <Button
                type="button"
                variant="secondary"
                className={btnClass}
                disabled={busyKey !== null}
                onClick={() =>
                  void wrap('open', () =>
                    adminUpdateReportPostStatus(post.id, 'open')
                  )
                }
              >
                {busyKey === 'open' ? '…' : 'פתוח'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={btnClass}
                disabled={busyKey !== null}
                onClick={() =>
                  void wrap('progress', () =>
                    adminUpdateReportPostStatus(post.id, 'in_progress')
                  )
                }
              >
                {busyKey === 'progress' ? '…' : 'בטיפול'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={btnClass}
                disabled={busyKey !== null}
                onClick={() =>
                  void wrap('closed', () =>
                    adminUpdateReportPostStatus(post.id, 'closed')
                  )
                }
              >
                {busyKey === 'closed' ? '…' : 'סגור'}
              </Button>
            </>
          ) : null}

          {isUpdateOrRequest ? (
            <Button
              type="button"
              variant="secondary"
              className={btnClass}
              disabled={busyKey !== null}
              onClick={() =>
                void wrap('pin', () =>
                  adminSetPostPinned(post.id, !post.pinned)
                )
              }
            >
              {busyKey === 'pin'
                ? '…'
                : post.pinned
                  ? 'הסר נעיצה'
                  : 'נעץ הודעה'}
            </Button>
          ) : null}

          {isPoll && !pollDecided ? (
            <Button
              type="button"
              variant="secondary"
              className={btnClass}
              disabled={busyKey !== null}
              onClick={() =>
                void wrap('decided', () => adminMarkPollDecided(post.id))
              }
            >
              {busyKey === 'decided' ? '…' : 'סמן כסגור'}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="destructive"
            className={btnClass}
            disabled={busyKey !== null}
            onClick={() => void handleDelete()}
          >
            {busyKey === 'delete' ? '…' : 'מחק פוסט'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
