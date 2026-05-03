import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Smartphone } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { COMMENT_GRAY_CHIP_BASE } from '@/components/feed/comment-shared'
import {
  hasCompletedPwaInstallGuide,
  isAndroidInstallGuide,
  isIosInstallGuide,
  isMobileForInstallGuide,
  isStandalonePwa,
  markPwaInstallGuideDone,
} from '@/lib/pwa-install-guide'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { cn } from '@/lib/utils'

/** Drop files in `public/install/` — autoplay + loop when present. */
const IOS_INSTALL_VIDEO_SRC = '/install/ios-install-guide.mp4'
const ANDROID_INSTALL_VIDEO_SRC = '/install/android-install-guide.mp4'

const INSTALL_SUBTITLE_HE =
  'התקינו את האפליקציה במכשיר כדי לקבל עדכונים מהבניין בזמן אמת ולהשתמש באפליקציה בצורה מלאה ונוחה יותר'

const primaryClass =
  'h-12 w-full max-w-md rounded-full touch-manipulation border-transparent bg-[#5E00FF] px-6 text-base font-semibold text-white shadow-none hover:bg-[#5200e6]'

const browserChipClass = cn(
  COMMENT_GRAY_CHIP_BASE,
  'mx-auto max-w-[95vw] touch-manipulation px-3 py-2 text-[0.55rem] sm:text-xs',
  'active:opacity-90'
)

function InstallShell({
  title,
  videoSrc,
  placeholderFilename,
  videoAriaLabel,
  onContinueInBrowser,
  footerExtra,
}: {
  title: string
  videoSrc: string
  placeholderFilename: string
  videoAriaLabel: string
  onContinueInBrowser: () => void
  /** e.g. Android install CTA above the chip */
  footerExtra?: ReactNode
}) {
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || videoFailed) return
    void el.play().catch(() => {
      /* autoplay may be deferred */
    })
  }, [videoFailed, videoSrc])

  return (
    <div
      dir="rtl"
      className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-feed-canvas pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
        <div className="flex w-full shrink-0 flex-col gap-3 px-4 pt-8 text-center">
          <div className="flex w-full justify-center px-2">
            <div
              className="flex flex-row items-center justify-center gap-2 px-1"
              dir="rtl"
            >
              <Smartphone
                className="size-8 shrink-0 text-foreground sm:size-9"
                strokeWidth={2}
                aria-hidden
              />
              <h1 className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="text-pretty px-1 text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">
            {INSTALL_SUBTITLE_HE}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-2">
          {!videoFailed ? (
            <video
              ref={videoRef}
              className="mx-auto h-full max-h-full w-full rounded-2xl object-contain object-center bg-zinc-100/80 dark:bg-zinc-800/40"
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              controls={false}
              aria-label={videoAriaLabel}
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <div
              className="flex h-full min-h-[10rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-6 text-center"
              role="status"
            >
              <p className="text-sm font-medium text-muted-foreground">
                מקום לסרטון הדרכה
              </p>
              <p className="max-w-[18rem] text-xs leading-relaxed text-muted-foreground">
                לאחר שתעלו קובץ MP4 ל־
                <span className="font-mono" dir="ltr">
                  public/install/{placeholderFilename}
                </span>{' '}
                הוא יוצג כאן אוטומטית (ניגון חוזר).
              </p>
            </div>
          )}
        </div>

        {footerExtra ? (
          <div className="flex w-full shrink-0 flex-col items-center gap-2 px-4 pb-2">
            {footerExtra}
          </div>
        ) : null}

        <div className="flex shrink-0 justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          <button
            type="button"
            className={browserChipClass}
            onClick={onContinueInBrowser}
          >
            מעדיף להישאר בדפדפן
          </button>
        </div>
      </div>
    </div>
  )
}

function IosInstallBody({ onContinueInBrowser }: { onContinueInBrowser: () => void }) {
  return (
    <InstallShell
      title="התקנת האפליקציה באייפון"
      videoSrc={IOS_INSTALL_VIDEO_SRC}
      placeholderFilename="ios-install-guide.mp4"
      videoAriaLabel="הדרכה קצרה להתקנה על מסך הבית באייפון"
      onContinueInBrowser={onContinueInBrowser}
    />
  )
}

function AndroidInstallBody({
  deferredPrompt,
  onInstall,
  onContinueInBrowser,
}: {
  deferredPrompt: BeforeInstallPromptEvent | null
  onInstall: () => void
  onContinueInBrowser: () => void
}) {
  return (
    <InstallShell
      title="התקנת האפליקציה באנדרואיד"
      videoSrc={ANDROID_INSTALL_VIDEO_SRC}
      placeholderFilename="android-install-guide.mp4"
      videoAriaLabel="הדרכה קצרה להתקנה על מסך הבית באנדרואיד"
      onContinueInBrowser={onContinueInBrowser}
      footerExtra={
        deferredPrompt ? (
          <Button
            type="button"
            className={cn(primaryClass, 'w-full shrink-0')}
            onClick={() => void onInstall()}
          >
            התקינו את האפליקציה
          </Button>
        ) : undefined
      }
    />
  )
}

export function InstallAppPage() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const nextRaw = search.get('next')
  const nextPath = safeRedirectPath(nextRaw)

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    deferredRef.current = deferredPrompt
  }, [deferredPrompt])

  useEffect(() => {
    if (
      !isMobileForInstallGuide() ||
      isStandalonePwa() ||
      hasCompletedPwaInstallGuide()
    ) {
      navigate(nextPath, { replace: true })
    }
  }, [navigate, nextPath])

  useEffect(() => {
    if (!isAndroidInstallGuide()) return
    function onBip(e: Event) {
      e.preventDefault()
      const bip = e as BeforeInstallPromptEvent
      deferredRef.current = bip
      setDeferredPrompt(bip)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  function continueToApp() {
    markPwaInstallGuideDone()
    navigate(nextPath, { replace: true })
  }

  async function handleAndroidInstall() {
    const e = deferredRef.current
    if (!e) return
    try {
      await e.prompt()
      await e.userChoice
    } catch {
      /* user dismissed or unsupported */
    }
    deferredRef.current = null
    setDeferredPrompt(null)
  }

  const ios = isIosInstallGuide()
  const android = isAndroidInstallGuide()

  if (ios) {
    return <IosInstallBody onContinueInBrowser={continueToApp} />
  }

  if (android) {
    return (
      <AndroidInstallBody
        deferredPrompt={deferredPrompt}
        onInstall={handleAndroidInstall}
        onContinueInBrowser={continueToApp}
      />
    )
  }

  return (
    <div
      dir="rtl"
      className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-feed-canvas pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4">
        <div className="shrink-0 space-y-2 pt-8 text-right">
          <h1 className="text-xl font-semibold text-foreground">התקינו את הלובי</h1>
          <p className="text-sm leading-snug text-muted-foreground">
            {INSTALL_SUBTITLE_HE}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            מהמכשיר: הוסיפו את האתר למסך הבית דרך תפריט הדפדפן.
          </p>
        </div>
        <div className="flex shrink-0 justify-center py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className={browserChipClass}
            onClick={continueToApp}
          >
            מעדיף להישאר בדפדפן
          </button>
        </div>
      </div>
    </div>
  )
}
