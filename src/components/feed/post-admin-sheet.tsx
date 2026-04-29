import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  CircleDot,
  Ellipsis,
  MoveLeft,
  Pin,
  PinOff,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { AdminBadgeCheck } from '@/components/admin/admin-badge-check'
import {
  adminDeletePost,
  adminMarkPollDecided,
  adminSetPostPinned,
  adminUpdateReportPostStatus,
} from '@/lib/feed-queries'
import { Button } from '@/components/ui/button'
import { postTypeChipIconTrayClass } from '@/components/feed/post-type-styles'
import { isPollPost, type FeedPost } from '@/types/feed'
import { cn } from '@/lib/utils'

/** Keep in sync with `create-post-sheet` bottom sheet motion. */
const SHEET_TRANSITION_MS = 320
const ADMIN_MENU_ICON_STROKE = 2 as const

type Props = {
  post: FeedPost
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** Called after successful delete (e.g. navigate away). */
  onDeleted?: () => void
}

/** Mirrors `MENU_CHOICE_ROW` in create-post-sheet (דיווח/סקר/etc. cards). */
const ADMIN_ACTION_ROW =
  'flex h-auto min-h-[4.25rem] w-full items-center touch-manipulation gap-3 rounded-2xl border border-border/50 px-3 py-3 text-start shadow-none hover:bg-muted/50'

/** Row מלא בצבעי צ\'יפ דיווח — מחיקה בלבד. */
const ADMIN_DELETE_CHIP_ROW = cn(
  'flex h-auto min-h-[4.25rem] w-full touch-manipulation items-center gap-3 rounded-2xl border px-3 py-3 text-start shadow-none',
  'border-[#FF0019] bg-[#FFDEE5] text-[#FF0019]',
  'hover:bg-[#fccede] hover:text-[#FF0019]',
  'dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  'dark:hover:bg-rose-950/65 dark:hover:text-rose-200'
)

const ICON_GRAY =
  'size-5 shrink-0 text-zinc-600 dark:text-zinc-400'

/** Grayscale circle + border — all action rows except delete (דיווח chip). */
const NEUTRAL_TRAY_GRAY =
  'border border-border/80 bg-muted/45 dark:border-zinc-600/85 dark:bg-zinc-800/65'

function AdminActionCard({
  icon: Icon,
  trayClassName,
  title,
  subtitle,
  loading,
  titleClassName,
  subtitleClassName,
  iconClassName,
  rowVariant = 'default',
  onClick,
  disabled,
}: {
  icon: LucideIcon
  trayClassName: string
  title: string
  subtitle: string
  loading?: boolean
  /** Overrides default foreground title style (e.g. דיווח chip red for מחיקה). */
  titleClassName?: string
  /** Muted line under title; on `reportFilled` defaults to דיווח-toned secondary. */
  subtitleClassName?: string
  /** Delete row keeps דיווח red on glyph; others use neutral gray. */
  iconClassName?: string
  /** Full-row דיווח chip surface (מחיקה). */
  rowVariant?: 'default' | 'reportFilled'
  onClick: () => void
  disabled?: boolean
}) {
  const filled = rowVariant === 'reportFilled'
  const titleCn =
    titleClassName ??
    (filled ? 'text-[#FF0019] dark:text-rose-300' : 'text-foreground')
  const subtitleCn =
    subtitleClassName ??
    (filled
      ? 'text-[#FF0019]/80 dark:text-rose-200/80'
      : 'text-muted-foreground')
  const iconCn =
    iconClassName ??
    (filled ? 'text-[#FF0019] dark:text-rose-300' : ICON_GRAY)

  return (
    <Button
      type="button"
      variant="ghost"
      className={filled ? ADMIN_DELETE_CHIP_ROW : ADMIN_ACTION_ROW}
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            trayClassName
          )}
          aria-hidden
        >
          <Icon
            className={iconCn}
            strokeWidth={ADMIN_MENU_ICON_STROKE}
            aria-hidden
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span
            className={cn(
              'text-base font-semibold leading-tight text-start',
              titleCn
            )}
          >
            {loading ? '…' : title}
          </span>
          <span
            className={cn(
              'text-[0.8rem] font-normal leading-snug',
              subtitleCn
            )}
          >
            {subtitle}
          </span>
        </span>
      </div>
    </Button>
  )
}

function SectionShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="ps-1 text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function consumeGhostPointerAfterBackdropClose() {
  const block = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  window.setTimeout(() => {
    window.addEventListener('pointerdown', block, { capture: true, once: true })
    window.addEventListener('pointerup', block, { capture: true, once: true })
    window.addEventListener('click', block, { capture: true, once: true })
  }, 0)
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
  const [panel, setPanel] = useState<'main' | 'deleteConfirm'>('main')

  const isPoll = isPollPost(post)
  const isReport = post.type === 'דיווח'

  const pollDecided =
    isPoll && (post.poll.isClosed || post.status === 'הוחלט')

  const busyKeyRef = useRef(busyKey)
  busyKeyRef.current = busyKey

  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (open) {
      setMounted(true)
      setEntered(false)
      const rf = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setEntered(true))
      )
      return () => window.cancelAnimationFrame(rf)
    }

    setEntered(false)
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false)
      closeTimerRef.current = null
    }, SHEET_TRANSITION_MS)

    return undefined
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!open) setSheetError(null)
  }, [open])

  useEffect(() => {
    if (!open) setPanel('main')
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (busyKeyRef.current !== null) return
        if (panel === 'deleteConfirm') {
          e.preventDefault()
          setPanel('main')
          return
        }
        e.preventDefault()
        onOpenChangeRef.current(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mounted, panel])

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

  async function executeDelete() {
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

  function closeBackdrop() {
    if (busyKeyRef.current !== null) return
    if (panel === 'deleteConfirm') {
      setPanel('main')
      consumeGhostPointerAfterBackdropClose()
      return
    }
    onOpenChange(false)
    consumeGhostPointerAfterBackdropClose()
  }

  function backdropPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (busyKeyRef.current !== null) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target !== e.currentTarget) return
    e.stopPropagation()
    closeBackdrop()
  }

  if (!mounted) return null

  const disabled = busyKey !== null
  /** דיווח chip palette — מחיקה row only */
  const trayDeleteChip = postTypeChipIconTrayClass('דיווח')

  const statusSectionVisible =
    isReport ||
    (isPoll && !pollDecided)

  return createPortal(
    <div
      data-loby-post-admin-sheet=""
      className="fixed inset-0 z-[2147483000]"
      style={{ isolation: 'isolate' }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 z-0 bg-black/[0.58] backdrop-blur-md backdrop-saturate-75 [-webkit-backdrop-filter:blur(12px)]',
          'transition-[opacity,backdrop-filter] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          'motion-reduce:transition-opacity motion-reduce:duration-[200ms]',
          entered ? 'opacity-100' : 'opacity-0'
        )}
        onPointerDown={backdropPointerDown}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          panel === 'deleteConfirm' ? 'מחיקת פוסט' : 'ניהול פוסט'
        }
        dir="rtl"
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-popover shadow-lg',
          'max-h-[min(92vh,100dvh)]',
          'transform-gpu will-change-transform',
          'transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'motion-reduce:transition-transform motion-reduce:duration-[200ms]',
          entered ? 'translate-y-0' : 'translate-y-[105%]'
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex min-w-0 w-full flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[max(env(safe-area-inset-top,0px),0.75rem)] text-sm text-popover-foreground"
        >
          {panel === 'main' ? (
            <>
              <div className="flex min-h-[3.5rem] w-full items-center gap-3 px-4 pb-1 pt-4 text-start">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/45 dark:border-zinc-600/85 dark:bg-zinc-800/65"
                  aria-hidden
                >
                  <AdminBadgeCheck className="size-6 text-zinc-600 dark:text-zinc-400" />
                </span>
                <div className="flex min-w-0 flex-col items-start gap-0.5 leading-snug">
                  <span className="font-heading text-lg font-medium text-foreground">
                    ניהול פוסט
                  </span>
                  <span className="text-[0.8rem] font-normal text-muted-foreground">
                    עדכון סטאטוסים, מחיקה ונעיצת הפוסט על ידי חברי הועד
                  </span>
                </div>
              </div>

              <div className="mt-12 flex flex-col gap-8 px-3 pb-5 pt-0">
                {sheetError ? (
                  <p
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-start text-sm text-destructive"
                    role="alert"
                  >
                    {sheetError}
                  </p>
                ) : null}

                {statusSectionVisible ? (
                  <SectionShell title="עדכון סטאטוס">
                    {isReport ? (
                      <>
                        <AdminActionCard
                          icon={CircleDot}
                          trayClassName={NEUTRAL_TRAY_GRAY}
                          title="פתוח"
                          subtitle="טרם טופל — ממתין לצוות הניהול"
                          loading={busyKey === 'open'}
                          disabled={disabled}
                          onClick={() =>
                            void wrap('open', () =>
                              adminUpdateReportPostStatus(post.id, 'open')
                            )
                          }
                        />
                        <AdminActionCard
                          icon={Ellipsis}
                          trayClassName={NEUTRAL_TRAY_GRAY}
                          title="בטיפול"
                          subtitle="הדיווח בטיפול פעיל"
                          loading={busyKey === 'progress'}
                          disabled={disabled}
                          onClick={() =>
                            void wrap('progress', () =>
                              adminUpdateReportPostStatus(post.id, 'in_progress')
                            )
                          }
                        />
                        <AdminActionCard
                          icon={ShieldCheck}
                          trayClassName={NEUTRAL_TRAY_GRAY}
                          title="סגור"
                          subtitle="הסתיים — הנושא טופל"
                          loading={busyKey === 'closed'}
                          disabled={disabled}
                          onClick={() =>
                            void wrap('closed', () =>
                              adminUpdateReportPostStatus(post.id, 'closed')
                            )
                          }
                        />
                      </>
                    ) : null}
                    {isPoll && !pollDecided ? (
                      <AdminActionCard
                        icon={ShieldCheck}
                        trayClassName={NEUTRAL_TRAY_GRAY}
                        title="סגור"
                        subtitle="סיום הסקר והצגת התוצאות ללא יכולת להצביע שוב"
                        loading={busyKey === 'decided'}
                        disabled={disabled}
                        onClick={() =>
                          void wrap('decided', () =>
                            adminMarkPollDecided(post.id)
                          )
                        }
                      />
                    ) : null}
                  </SectionShell>
                ) : null}

                <SectionShell title="נעיצת פוסט">
                  <AdminActionCard
                    icon={post.pinned ? PinOff : Pin}
                    trayClassName={NEUTRAL_TRAY_GRAY}
                    title={
                      post.pinned ? 'הסרת פוסט מנעוץ' : 'נעץ הודעה'
                    }
                    subtitle={
                      post.pinned
                        ? 'הפוסט חוזר למקום שלו בפיד'
                        : 'הפוסט יוצג למעלה בפיד הבניין'
                    }
                    loading={busyKey === 'pin'}
                    disabled={disabled}
                    onClick={() =>
                      void wrap('pin', () =>
                        adminSetPostPinned(post.id, !post.pinned)
                      )
                    }
                  />
                </SectionShell>

                <SectionShell title="מחיקה">
                  <AdminActionCard
                    icon={Trash2}
                    trayClassName={trayDeleteChip}
                    title="מחק פוסט"
                    subtitle="מחיקה סופית — לא ניתן לשחזר"
                    rowVariant="reportFilled"
                    disabled={disabled}
                    onClick={() => setPanel('deleteConfirm')}
                  />
                </SectionShell>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-4 pb-1 pt-4">
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
                  <span className="font-heading text-lg font-medium text-foreground">
                    מחיקת פוסט
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="חזרה לניהול פוסט"
                  disabled={busyKey !== null}
                  onClick={() => setPanel('main')}
                >
                  <MoveLeft
                    className="size-5"
                    strokeWidth={ADMIN_MENU_ICON_STROKE}
                    aria-hidden
                  />
                </Button>
              </div>

              <div className="mt-10 flex flex-col gap-5 px-4 pb-5 pt-0">
                {sheetError ? (
                  <p
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-start text-sm text-destructive"
                    role="alert"
                  >
                    {sheetError}
                  </p>
                ) : null}

                <p className="text-start text-[0.9375rem] leading-relaxed text-foreground">
                  לאחר אישור מחיקת הפוסט, לא ניתן יהיה לשחזר את הפוסט חזרה והוא
                  ימחק לחלוטין, האם להמשיך?
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={busyKey !== null}
                  className={cn(
                    ADMIN_DELETE_CHIP_ROW,
                    'justify-center px-5 py-4 text-base font-semibold'
                  )}
                  onClick={() => void executeDelete()}
                >
                  {busyKey === 'delete' ? '…' : 'מחק את הפוסט'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
