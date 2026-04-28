import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  BellRing,
  ClipboardPlus,
  ListChecks,
  Megaphone,
  MessageSquarePlus,
  ArrowRight,
  X,
} from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useFeedRefresh } from '@/context/feed-refresh-context'
import { dlog } from '@/lib/debug-log'
import { createPost } from '@/lib/feed-queries'
import { uploadPostImage } from '@/lib/post-image-upload'
import { useBuildingMembership } from '@/hooks/use-building-membership'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Mode = 'menu' | 'report' | 'update' | 'poll' | 'request'

const fieldClass =
  'flex min-h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55'

const DRAFT_KEY = 'loby:v1:create_post_draft'

type Draft = {
  mode: Mode
  title: string
  body: string
  pollOptions: string[]
}

function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft> | null
    if (!parsed || typeof parsed !== 'object') return null
    const mode = (parsed.mode ?? 'menu') as Mode
    return {
      mode: ['menu', 'report', 'update', 'poll', 'request'].includes(mode)
        ? mode
        : 'menu',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      body: typeof parsed.body === 'string' ? parsed.body : '',
      pollOptions: Array.isArray(parsed.pollOptions)
        ? parsed.pollOptions.filter((s): s is string => typeof s === 'string')
        : ['', ''],
    }
  } catch {
    return null
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

function saveDraft(draft: Draft) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* ignore */
  }
}

function PostImagePicker({
  previewUrl,
  disabled,
  inputId,
  onPick,
  onClear,
  onPickerInvoked,
  onPickerSettled,
}: {
  previewUrl: string | null
  disabled?: boolean
  inputId: string
  onPick: (file: File) => void
  onClear: () => void
  onPickerInvoked: () => void
  onPickerSettled: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">תמונה (אופציונלי)</span>
      <p className="text-xs leading-relaxed text-muted-foreground">
        צילום או העלאה — עד 5MB (JPEG, PNG…)
      </p>
      <input
        id={inputId}
        type="file"
        tabIndex={-1}
        className="sr-only text-base"
        accept="image/*"
        disabled={disabled}
        onClick={() => {
          dlog('input:click')
          onPickerInvoked()
        }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          dlog(`input:change file=${f ? `${f.name}/${f.size}b` : 'none'}`)
          if (f) onPick(f)
          e.target.value = ''
          onPickerSettled()
        }}
      />
      {!previewUrl ? (
        <label
          htmlFor={inputId}
          onPointerDown={() => {
            dlog('label:pointerdown')
            onPickerInvoked()
          }}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-11 w-full cursor-pointer justify-center rounded-xl font-medium',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          צילום או העלאה מתמונות
        </label>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border/60">
          <img
            src={previewUrl}
            alt=""
            className="max-h-52 w-full object-cover"
          />
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

export function CreatePostSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const { member } = useBuildingMembership()
  const { bumpFeed } = useFeedRefresh()
  const baseId = useId()

  const initialDraft = loadDraft()
  const [mode, setMode] = useState<Mode>(initialDraft?.mode ?? 'menu')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialDraft?.title ?? '')
  const [body, setBody] = useState(initialDraft?.body ?? '')
  const [pollOptions, setPollOptions] = useState<string[]>(
    initialDraft?.pollOptions && initialDraft.pollOptions.length >= 2
      ? initialDraft.pollOptions
      : ['', '']
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<boolean>(
    () => Boolean(initialDraft && (initialDraft.title || initialDraft.body))
  )

  useEffect(() => {
    dlog(`composer: open=${open} mode=${mode}`)
  }, [open, mode])

  useEffect(() => {
    dlog('composer:mount')
    if (initialDraft && (initialDraft.title || initialDraft.body)) {
      dlog(
        `draft:restored mode=${initialDraft.mode} title=${initialDraft.title.length}c body=${initialDraft.body.length}c`
      )
    }
    return () => dlog('composer:unmount')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only marker
  }, [])

  useEffect(() => {
    if (!open) return
    saveDraft({ mode, title, body, pollOptions })
  }, [open, mode, title, body, pollOptions])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  /**
   * iOS Photos/Camera handoff can deliver a stray tap to the page after "Use Photo".
   * Block any close-request originating in this window unless explicitly user-driven.
   */
  const pickerGuardUntilRef = useRef(0)
  const markPickerInvoked = () => {
    pickerGuardUntilRef.current = Date.now() + 30_000
    dlog('pickerGuard: invoked +30s')
  }
  const markPickerSettled = () => {
    pickerGuardUntilRef.current = Math.max(
      pickerGuardUntilRef.current,
      Date.now() + 1500
    )
    dlog('pickerGuard: settled +1.5s')
  }
  const isPickerGuardActive = () => Date.now() < pickerGuardUntilRef.current

  useEffect(() => {
    if (open) pickerGuardUntilRef.current = 0
  }, [open])

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024

  function handlePickFile(file: File) {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setImageFile(file)
  }

  function handleImagePick(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      setError('התמונה גדולה מדי (עד 5MB)')
      return
    }
    setError(null)
    handlePickFile(file)
  }

  function resetForm() {
    setTitle('')
    setBody('')
    setPollOptions(['', ''])
    clearImage()
    setError(null)
    setMode('menu')
    setDraftRestoredNotice(false)
    clearDraft()
  }

  function handleOpenChange(next: boolean) {
    dlog(`composer:onOpenChange next=${next}`)
    if (!next) {
      resetForm()
    }
    onOpenChange(next)
  }

  /** Used by overlay UI close affordances; ignored while photo picker is in flight. */
  function handleUserClose() {
    if (isPickerGuardActive()) {
      dlog('composer:close blocked (pickerGuard)')
      return
    }
    dlog('composer:close (user)')
    handleOpenChange(false)
  }

  const handleOpenChangeRef = useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPickerGuardActive()) return
        e.preventDefault()
        handleOpenChangeRef.current(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isPickerGuardActive uses a ref
  }, [open])

  async function submit(kind: Exclude<Mode, 'menu'>) {
    setError(null)
    if (!member?.building_id) {
      setError('לא נמצא בניין — נא להשלים הצטרפות.')
      return
    }
    const t = title.trim()
    const b = body.trim()
    if (!t) {
      setError('יש למלא כותרת.')
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
          body: b || undefined,
          options: opts,
          imageUrl,
        })
      } else if (kind === 'report') {
        if (!b) {
          setError('יש למלא תיאור הדיווח.')
          return
        }
        res = await createPost({
          buildingId: member.building_id,
          kind: 'report',
          title: t,
          body: b,
          imageUrl,
        })
      } else if (kind === 'update') {
        if (!b) {
          setError('יש למלא תוכן העדכון.')
          return
        }
        res = await createPost({
          buildingId: member.building_id,
          kind: 'update',
          title: t,
          body: b,
          imageUrl,
        })
      } else {
        if (!b) {
          setError('יש למלא תיאור הבקשה.')
          return
        }
        res = await createPost({
          buildingId: member.building_id,
          kind: 'request',
          title: t,
          body: b,
          imageUrl,
        })
      }

      if (res.id) {
        bumpFeed()
        clearDraft()
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

  const menu = (
    <>
      <div className="flex flex-col gap-0.5 p-4 pb-2 text-start">
        <h2 className="font-heading text-lg font-medium text-foreground">
          יצירת פריט חדש
        </h2>
        <p className="text-sm text-muted-foreground text-start">
          בחרו סוג — יש למלא כותרת ותוכן לפי הסוג
        </p>
      </div>
      <Separator />
      <div className="flex flex-col gap-2 px-3 py-3">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto min-h-[4.25rem] w-full justify-start gap-3 rounded-2xl px-3 py-3 text-start touch-manipulation',
            'bg-amber-50/80 dark:bg-amber-950/35'
          )}
          onClick={() => setMode('report')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 text-amber-900 ring-1 ring-black/5 dark:text-amber-50 dark:ring-white/10">
            <BellRing className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-amber-900 dark:text-amber-50">
              דיווח חדש
            </span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              תקלה, חניה חסומה או סיכון — בצורה מסודרת
            </span>
          </span>
          <ClipboardPlus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto min-h-[4.25rem] w-full justify-start gap-3 rounded-2xl px-3 py-3 text-start',
            'bg-neutral-100/80 dark:bg-neutral-900/50'
          )}
          onClick={() => setMode('update')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 ring-1 ring-black/5 dark:ring-white/10">
            <Megaphone className="size-5 text-neutral-900 dark:text-neutral-50" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold">עדכון חדש</span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              הודעה רשמית לכל הדיירים
            </span>
          </span>
          <ClipboardPlus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto min-h-[4.25rem] w-full justify-start gap-3 rounded-2xl px-3 py-3 text-start',
            'bg-indigo-50/85 dark:bg-indigo-950/40'
          )}
          onClick={() => setMode('poll')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 text-indigo-950 ring-1 ring-black/5 dark:text-indigo-50 dark:ring-white/10">
            <ListChecks className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-indigo-950 dark:text-indigo-50">
              הצבעה חדשה
            </span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              שאלת כן/לא או בחירה בין אפשרויות
            </span>
          </span>
          <ClipboardPlus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto min-h-[4.25rem] w-full justify-start gap-3 rounded-2xl px-3 py-3 text-start',
            'bg-emerald-50/85 dark:bg-emerald-950/35'
          )}
          onClick={() => setMode('request')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 text-emerald-950 ring-1 ring-black/5 dark:text-emerald-50 dark:ring-white/10">
            <MessageSquarePlus className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <span className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
              בקשה חדשה
            </span>
            <span className="text-[0.8rem] font-normal text-muted-foreground">
              עזרה קהילתית או תיאום בין שכנים
            </span>
          </span>
          <ClipboardPlus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </div>
    </>
  )

  const formHeader = (label: string) => (
    <div className="flex items-center gap-2 px-4 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-full"
        onClick={() => setMode('menu')}
        aria-label="חזרה"
      >
        <ArrowRight className="size-5" aria-hidden />
      </Button>
      <h2 className="font-heading text-lg font-medium text-foreground">{label}</h2>
    </div>
  )

  const formReport = (
    <>
      {formHeader('דיווח חדש')}
      <p className="px-4 pb-3 text-start text-sm text-muted-foreground">
        כותרת קצרה ותיאור
      </p>
      <Separator />
      <div className="flex flex-col gap-3 px-4 py-4 text-start">
        <label className="text-sm font-medium text-foreground">כותרת</label>
        <input
          className={fieldClass}
          dir="rtl"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: תאורה לא עובדת בחניון"
        />
        <label className="text-sm font-medium text-foreground">תיאור</label>
        <textarea
          className={cn(fieldClass, 'min-h-[120px] resize-y')}
          dir="rtl"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="פרטו מה ראיתם ומתי…"
        />
        <PostImagePicker
          inputId={photoIds.report}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
          onPickerInvoked={markPickerInvoked}
          onPickerSettled={markPickerSettled}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full rounded-full font-semibold"
          disabled={submitting}
          onClick={() => void submit('report')}
        >
          {submitting ? 'שולח…' : 'פרסום דיווח'}
        </Button>
      </div>
    </>
  )

  const formUpdate = (
    <>
      {formHeader('עדכון חדש')}
      <p className="px-4 pb-3 text-start text-sm text-muted-foreground">
        הודעה לכל הדיירים
      </p>
      <Separator />
      <div className="flex flex-col gap-3 px-4 py-4 text-start">
        <label className="text-sm font-medium text-foreground">כותרת</label>
        <input
          className={fieldClass}
          dir="rtl"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="text-sm font-medium text-foreground">תוכן</label>
        <textarea
          className={cn(fieldClass, 'min-h-[120px] resize-y')}
          dir="rtl"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <PostImagePicker
          inputId={photoIds.update}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
          onPickerInvoked={markPickerInvoked}
          onPickerSettled={markPickerSettled}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full rounded-full font-semibold"
          disabled={submitting}
          onClick={() => void submit('update')}
        >
          {submitting ? 'שולח…' : 'פרסום עדכון'}
        </Button>
      </div>
    </>
  )

  const formRequest = (
    <>
      {formHeader('בקשה חדשה')}
      <Separator />
      <div className="flex flex-col gap-3 px-4 py-4 text-start">
        <label className="text-sm font-medium text-foreground">כותרת</label>
        <input className={fieldClass} dir="rtl" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="text-sm font-medium text-foreground">תיאור הבקשה</label>
        <textarea
          className={cn(fieldClass, 'min-h-[120px] resize-y')}
          dir="rtl"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <PostImagePicker
          inputId={photoIds.request}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
          onPickerInvoked={markPickerInvoked}
          onPickerSettled={markPickerSettled}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full rounded-full font-semibold"
          disabled={submitting}
          onClick={() => void submit('request')}
        >
          {submitting ? 'שולח…' : 'פרסום בקשה'}
        </Button>
      </div>
    </>
  )

  const formPoll = (
    <>
      {formHeader('הצבעה חדשה')}
      <p className="px-4 pb-3 text-start text-sm text-muted-foreground">
        נוסח השאלה ולפחות שתי אפשרויות
      </p>
      <Separator />
      <div className="flex flex-col gap-3 px-4 py-4 text-start">
        <label className="text-sm font-medium text-foreground">שאלה / כותרת</label>
        <input
          className={fieldClass}
          dir="rtl"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="text-sm font-medium text-foreground">הקדמה (אופציונלי)</label>
        <textarea
          className={cn(fieldClass, 'min-h-[80px] resize-y')}
          dir="rtl"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <PostImagePicker
          inputId={photoIds.poll}
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={handleImagePick}
          onClear={clearImage}
          onPickerInvoked={markPickerInvoked}
          onPickerSettled={markPickerSettled}
        />
        <p className="text-sm font-medium text-foreground">אפשרויות</p>
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
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full rounded-full font-semibold"
          disabled={submitting}
          onClick={() => void submit('poll')}
        >
          {submitting ? 'שולח…' : 'פרסום הצבעה'}
        </Button>
      </div>
    </>
  )

  if (!open) return null

  return createPortal(
    <div
      data-loby-create-post=""
      className="fixed inset-0 z-[2147483000]"
      style={{ isolation: 'isolate' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="יצירת פריט חדש"
        dir="rtl"
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex max-h-[min(92vh,100dvh)] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border',
          'bg-popover pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[max(env(safe-area-inset-top,0px),0.75rem)] text-sm text-popover-foreground shadow-lg'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 end-3 z-10 shrink-0 rounded-full"
          onClick={handleUserClose}
          aria-label="סגירה"
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">סגירה</span>
        </Button>
        {draftRestoredNotice ? (
          <div className="mx-3 mb-2 mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-start text-xs leading-relaxed text-amber-900">
            שחזרנו את הטיוטה שלך. אם בחרת תמונה לפני סגירה — יש לבחור אותה שוב.
          </div>
        ) : null}
        {mode === 'menu' && menu}
        {mode === 'report' && formReport}
        {mode === 'update' && formUpdate}
        {mode === 'request' && formRequest}
        {mode === 'poll' && formPoll}
      </div>
    </div>,
    document.body
  )
}
