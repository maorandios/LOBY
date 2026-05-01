import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Images, MoveLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { postTypeLucideIcon, postTypeChipIconTrayClass } from '@/components/feed/post-type-styles'
import type { PostTypeHe } from '@/types/feed'
import { useFeedRefresh } from '@/context/feed-refresh-context'
import { createPost } from '@/lib/feed-queries'
import { uploadPostImage } from '@/lib/post-image-upload'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

const SHEET_TRANSITION_MS = 320

type Mode = 'menu' | 'report' | 'update' | 'poll' | 'request'

const MENU_ICON_STROKE = 2 as const

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fieldClass =
  'flex min-h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55'

type FormChromeProps = {
  chipHe: PostTypeHe
  headline: string
  subtitle: string
  onBack: () => void
}

/** Module scope so inputs are not recreated every parent render (stable focus while typing). */
function FormChrome({ chipHe, headline, subtitle, onBack }: FormChromeProps) {
  const TopicIcon = postTypeLucideIcon[chipHe]
  return (
    <div className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-4 pb-3 pt-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            postTypeChipIconTrayClass(chipHe)
          )}
          aria-hidden
        >
          <TopicIcon className="size-5 shrink-0" strokeWidth={MENU_ICON_STROKE} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start">
          <span className="text-base font-semibold text-foreground">{headline}</span>
          <span className="text-[0.8rem] font-normal leading-snug text-muted-foreground">{subtitle}</span>
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        onClick={onBack}
        aria-label="חזרה לבחירת סוג"
      >
        <MoveLeft className="size-5" strokeWidth={MENU_ICON_STROKE} aria-hidden />
      </Button>
    </div>
  )
}

type PostContentFieldsProps = {
  id: string
  title: string
  onTitleChange: (next: string) => void
}

function PostContentFields({ id, title, onTitleChange }: PostContentFieldsProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        תוכן הפוסט
      </label>
      <textarea
        id={id}
        className={cn(fieldClass, 'min-h-[9rem] resize-y')}
        dir="rtl"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="מה תרצו לשתף?"
      />
    </div>
  )
}

function PostImagePicker({
  previewUrl,
  disabled,
  inputId,
  onPick,
  onClear,
}: {
  previewUrl: string | null
  disabled?: boolean
  inputId: string
  onPick: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col">
      <input
        id={inputId}
        type="file"
        tabIndex={-1}
        className="sr-only text-base"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
      {!previewUrl ? (
        <label
          htmlFor={inputId}
          className={cn(
            'relative flex min-h-[5.5rem] w-full cursor-pointer touch-manipulation flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/70 bg-muted/25 px-8 py-10 text-base font-semibold text-foreground shadow-none transition-colors hover:bg-muted/40',
            'dark:border-muted-foreground/65',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/50 motion-reduce:transition-none',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <Images className="size-7 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
          <span className="text-center leading-tight">לחצו כאן להוספת תמונה</span>
        </label>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border/60">
          <img src={previewUrl} alt="" className="max-h-52 w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute end-2 top-2 rounded-full text-xs font-semibold"
            disabled={disabled}
            onClick={onClear}
          >
            הסרת תמונה
          </Button>
        </div>
      )}
    </div>
  )
}

type AnonymousPublishBarProps = {
  publishLabel: string
  submitting: boolean
  anonymous: boolean
  onAnonymousChange: (next: boolean) => void
  onPublish: () => void
}

function AnonymousPublishBar({
  publishLabel,
  submitting,
  anonymous,
  onAnonymousChange,
  onPublish,
}: AnonymousPublishBarProps) {
  return (
    <div
      dir="rtl"
      className="flex w-full items-center gap-3"
    >
      <Button
        type="button"
        className="h-11 min-w-0 flex-1 rounded-full border-0 bg-zinc-800 font-semibold text-white shadow-none hover:bg-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        disabled={submitting}
        onClick={onPublish}
      >
        {submitting ? 'שולח…' : publishLabel}
      </Button>
      <div className="flex shrink-0 items-center gap-2">
        <span className="max-w-[5.5rem] text-end text-xs font-semibold leading-tight text-foreground">
          פרסום אנונימי
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={anonymous}
          aria-label="פרסום אנונימי"
          disabled={submitting}
          onClick={() => onAnonymousChange(!anonymous)}
          className={cn(
            'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors',
            anonymous
              ? 'bg-[#5E00FF]'
              : 'bg-zinc-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'size-6 shrink-0 rounded-full bg-white shadow transition-[margin] duration-200 ease-out',
              anonymous ? 'ms-auto' : 'me-auto'
            )}
            aria-hidden
          />
        </button>
      </div>
    </div>
  )
}

export function CreatePostSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const { member } = useBuildingMembership()
  const { bumpFeed } = useFeedRefresh()
  const baseId = useId()

  const [mode, setMode] = useState<Mode>('menu')
  const [submitting, setSubmitting] = useState(false)
  const [anonymousPublish, setAnonymousPublish] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024

  function handleImagePick(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      setError('התמונה גדולה מדי (עד 5MB)')
      return
    }
    setError(null)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setImageFile(file)
  }

  function resetForm() {
    setTitle('')
    setPollOptions(['', ''])
    clearImage()
    setError(null)
    setAnonymousPublish(false)
    setMode('menu')
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleOpenChangeRef = useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange

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

  const sheetMeasureRef = useRef<HTMLDivElement>(null)
  const [sheetBodyMaxPx, setSheetBodyMaxPx] = useState<number | null>(null)
  /** When true, content is taller than viewport cap — outer shell scrolls. Otherwise shell grows to content (expands upward). */
  const [sheetOverflows, setSheetOverflows] = useState(false)

  /** Max sheet height: ~92% of layout viewport. Do not use min() with visualViewport — on desktop vv can be much smaller than innerHeight and traps the sheet in a short box with inner scroll. */
  const viewportCapPx = useCallback(() => {
    return Math.round(window.innerHeight * 0.92)
  }, [])

  const applySheetMaxHeight = useCallback(() => {
    const el = sheetMeasureRef.current
    if (!el) return
    const cap = viewportCapPx()
    const natural = Math.ceil(el.scrollHeight)
    const next = Math.min(natural, cap)
    const overflows = natural > cap

    let deferShrinkOverflow = false
    setSheetBodyMaxPx((prev) => {
      const shrinkDefer = prev != null && next < prev

      if (shrinkDefer) {
        deferShrinkOverflow = true
        requestAnimationFrame(() => {
          const shell = sheetMeasureRef.current
          if (!shell) return
          const cap2 = viewportCapPx()
          const nat2 = Math.ceil(shell.scrollHeight)
          const n2 = Math.min(nat2, cap2)
          setSheetBodyMaxPx(n2)
          setSheetOverflows(nat2 > cap2)
        })
        return prev
      }

      return next
    })
    if (!deferShrinkOverflow) {
      setSheetOverflows(overflows)
    }
  }, [viewportCapPx])

  useLayoutEffect(() => {
    if (!mounted || !entered) return
    applySheetMaxHeight()

    const shell = sheetMeasureRef.current
    if (!shell) return

    let batchRaf: number | null = null
    const queueMeasure = () => {
      if (batchRaf !== null) return
      batchRaf = requestAnimationFrame(() => {
        batchRaf = null
        applySheetMaxHeight()
      })
    }

    const ro = new ResizeObserver(queueMeasure)
    ro.observe(shell)
    const onViewport = queueMeasure
    window.addEventListener('resize', onViewport)
    window.visualViewport?.addEventListener('resize', onViewport)
    return () => {
      if (batchRaf !== null) cancelAnimationFrame(batchRaf)
      ro.disconnect()
      window.removeEventListener('resize', onViewport)
      window.visualViewport?.removeEventListener('resize', onViewport)
    }
  }, [mounted, entered, mode, applySheetMaxHeight])

  useLayoutEffect(() => {
    if (!open) {
      setSheetBodyMaxPx(null)
      setSheetOverflows(false)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleOpenChangeRef.current(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mounted])

  async function submit(kind: Exclude<Mode, 'menu'>) {
    setError(null)
    if (!member?.building_id) {
      setError('לא נמצא בניין — נא להשלים הצטרפות.')
      return
    }
    const t = title.trim()
    if (!t) {
      setError('יש למלא תוכן הפוסט.')
      return
    }

    setSubmitting(true)
    let res: Awaited<ReturnType<typeof createPost>>
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const uploaded = await uploadPostImage(member.building_id, imageFile)
        if (!uploaded) {
          setError(
            'העלאת התמונה נכשלה. ודאו חיבור, גודל עד 5MB, ונסו שוב.'
          )
          return
        }
        imageUrl = uploaded.publicUrl
      }
      if (kind === 'poll') {
        const opts = pollOptions.map((x) => x.trim()).filter(Boolean)
        if (opts.length < 2) {
          setError('נדרשות לפחות שתי אפשרויות')
          return
        }
        res = await createPost({
          buildingId: member.building_id,
          kind: 'poll',
          title: t,
          options: opts,
          imageUrl,
          isAnonymous: anonymousPublish,
        })
      } else if (kind === 'report') {
        res = await createPost({
          buildingId: member.building_id,
          kind: 'report',
          title: t,
          imageUrl,
          isAnonymous: anonymousPublish,
        })
      } else if (kind === 'update') {
        res = await createPost({
          buildingId: member.building_id,
          kind: 'update',
          title: t,
          imageUrl,
          isAnonymous: anonymousPublish,
        })
      } else {
        res = await createPost({
          buildingId: member.building_id,
          kind: 'request',
          title: t,
          imageUrl,
          isAnonymous: anonymousPublish,
        })
      }

      if (res.id) {
        bumpFeed()
        handleOpenChange(false)
        navigate(`/post/${res.id}`)
      } else {
        setError(res.error ?? 'שמירה נכשלה')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const photoIds = {
    report: `${baseId}-photo-report`,
    update: `${baseId}-photo-update`,
    poll: `${baseId}-photo-poll`,
    request: `${baseId}-photo-request`,
  }

  const MenuIconReport = postTypeLucideIcon['דיווח']
  const MenuIconUpdate = postTypeLucideIcon['עדכון']
  const MenuIconPoll = postTypeLucideIcon['הצבעה']
  const MenuIconRequest = postTypeLucideIcon['בקשה']

  const MENU_CHOICE_ROW =
    'flex h-auto min-h-[4.25rem] w-full items-center touch-manipulation justify-between gap-3 rounded-2xl border border-border/50 px-3 py-3 text-start shadow-none hover:bg-muted/50'

  const menu = (
    <>
      <div className="flex flex-col gap-0.5 px-4 pb-1 pt-4 text-start">
        <h2 className="font-heading text-lg font-medium text-foreground">
          מה תרצו לשתף?
        </h2>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          className={MENU_CHOICE_ROW}
          onClick={() => setMode('report')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              postTypeChipIconTrayClass('דיווח')
            )}
          >
            <MenuIconReport
              className="size-5 shrink-0"
              strokeWidth={MENU_ICON_STROKE}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-foreground">דיווח</span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              תקלות, חסימת חניה, מפגע בטיחותי וכו'
            </span>
          </span>
          </div>
          <MoveLeft
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={MENU_ICON_STROKE}
            aria-hidden
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={MENU_CHOICE_ROW}
          onClick={() => setMode('update')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              postTypeChipIconTrayClass('עדכון')
            )}
          >
            <MenuIconUpdate
              className="size-5 shrink-0"
              strokeWidth={MENU_ICON_STROKE}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-foreground">עדכון</span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              הודעה רשמית מטעמכם לכל דיירי הבניין
            </span>
          </span>
          </div>
          <MoveLeft
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={MENU_ICON_STROKE}
            aria-hidden
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={MENU_CHOICE_ROW}
          onClick={() => setMode('request')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              postTypeChipIconTrayClass('בקשה')
            )}
          >
            <MenuIconRequest
              className="size-5 shrink-0"
              strokeWidth={MENU_ICON_STROKE}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-foreground">בקשה</span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              פנו אל הקהילה לשיתוף פעולה או עזרה
            </span>
          </span>
          </div>
          <MoveLeft
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={MENU_ICON_STROKE}
            aria-hidden
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={MENU_CHOICE_ROW}
          onClick={() => setMode('poll')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              postTypeChipIconTrayClass('הצבעה')
            )}
          >
            <MenuIconPoll
              className="size-5 shrink-0"
              strokeWidth={MENU_ICON_STROKE}
              aria-hidden
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-foreground">סקר</span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              פרסמו שאלה לקהילה וגלו את דעת הקהל
            </span>
          </span>
          </div>
          <MoveLeft
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={MENU_ICON_STROKE}
            aria-hidden
          />
        </Button>
      </div>
    </>
  )

  const FORM_STACK =
    'mt-12 flex flex-col gap-4 px-4 pb-5 pt-0 text-start'

  const handleBackToMenu = useCallback(() => setMode('menu'), [])

  const formReport = (
    <>
      <FormChrome
        chipHe="דיווח"
        headline="דיווח"
        subtitle="תקלות, חסימת חניה, מפגע בטיחותי וכו'"
        onBack={handleBackToMenu}
      />
      <div className={FORM_STACK}>
        <PostContentFields
          id={`${photoIds.report}-content`}
          title={title}
          onTitleChange={setTitle}
        />
        <PostImagePicker
          inputId={photoIds.report}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AnonymousPublishBar
          publishLabel="פרסום דיווח"
          submitting={submitting}
          anonymous={anonymousPublish}
          onAnonymousChange={setAnonymousPublish}
          onPublish={() => void submit('report')}
        />
      </div>
    </>
  )

  const formUpdate = (
    <>
      <FormChrome
        chipHe="עדכון"
        headline="עדכון"
        subtitle="הודעה רשמית מטעמכם לכל דיירי הבניין"
        onBack={handleBackToMenu}
      />
      <div className={FORM_STACK}>
        <PostContentFields
          id={`${photoIds.update}-content`}
          title={title}
          onTitleChange={setTitle}
        />
        <PostImagePicker
          inputId={photoIds.update}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AnonymousPublishBar
          publishLabel="פרסום עדכון"
          submitting={submitting}
          anonymous={anonymousPublish}
          onAnonymousChange={setAnonymousPublish}
          onPublish={() => void submit('update')}
        />
      </div>
    </>
  )

  const formRequest = (
    <>
      <FormChrome
        chipHe="בקשה"
        headline="בקשה"
        subtitle="פנו אל הקהילה לשיתוף פעולה או עזרה"
        onBack={handleBackToMenu}
      />
      <div className={FORM_STACK}>
        <PostContentFields
          id={`${photoIds.request}-content`}
          title={title}
          onTitleChange={setTitle}
        />
        <PostImagePicker
          inputId={photoIds.request}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AnonymousPublishBar
          publishLabel="פרסום בקשה"
          submitting={submitting}
          anonymous={anonymousPublish}
          onAnonymousChange={setAnonymousPublish}
          onPublish={() => void submit('request')}
        />
      </div>
    </>
  )

  const formPoll = (
    <>
      <FormChrome
        chipHe="הצבעה"
        headline="סקר"
        subtitle="פרסמו שאלה לקהילה וגלו את דעת הקהל"
        onBack={handleBackToMenu}
      />
      <div className={FORM_STACK}>
        <PostContentFields
          id={`${photoIds.poll}-content`}
          title={title}
          onTitleChange={setTitle}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">אפשרויות</span>
          <div className="flex flex-col gap-2">
            {pollOptions.map((line, i) => (
              <input
                key={i}
                className={fieldClass}
                dir="rtl"
                value={line}
                placeholder={`אפשרות ${i + 1}`}
                onChange={(e) => {
                  const next = [...pollOptions]
                  next[i] = e.target.value
                  setPollOptions(next)
                }}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => setPollOptions((o) => [...o, ''])}
          >
            הוספת אפשרות
          </Button>
        </div>
        <PostImagePicker
          inputId={photoIds.poll}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AnonymousPublishBar
          publishLabel="פרסום סקר"
          submitting={submitting}
          anonymous={anonymousPublish}
          onAnonymousChange={setAnonymousPublish}
          onPublish={() => void submit('poll')}
        />
      </div>
    </>
  )

  if (!mounted) return null

  function backdropPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target === e.currentTarget) handleOpenChange(false)
  }

  return createPortal(
    <div
      data-loby-create-post=""
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
        aria-label="מה תרצו לשתף?"
        dir="rtl"
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-lg flex-col overscroll-contain rounded-t-2xl border-t border-border bg-popover shadow-lg',
          sheetBodyMaxPx == null && 'max-h-[min(92vh,100dvh)]',
          sheetOverflows ? 'overflow-y-auto' : 'overflow-hidden',
          'transform-gpu will-change-[transform,max-height]',
          'transition-[transform,max-height] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'motion-reduce:transition-transform motion-reduce:duration-[200ms]',
          entered ? 'translate-y-0' : 'translate-y-[105%]'
        )}
        style={sheetBodyMaxPx != null ? { maxHeight: sheetBodyMaxPx } : undefined}
      >
        <div
          ref={sheetMeasureRef}
          className="flex min-w-0 w-full flex-col pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[max(env(safe-area-inset-top,0px),0.75rem)] text-sm text-popover-foreground"
        >
          {mode === 'menu' && menu}
          {mode === 'report' && formReport}
          {mode === 'update' && formUpdate}
          {mode === 'request' && formRequest}
          {mode === 'poll' && formPoll}
        </div>
      </div>
    </div>,
    document.body
  )
}
