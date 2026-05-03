import { safeRedirectPath } from '@/lib/safe-redirect'

const DONE_KEY = 'loby:pwa_install_guide_done'

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true
  } catch {
    /* ignore */
  }
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

/** Phones / tablets that should see the install guide (real desktop browsers excluded). */
export function isMobileForInstallGuide(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPod/i.test(ua)) return true
  if (/iPad/i.test(ua)) return true
  if (/Android/i.test(ua)) return true
  if (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) return true
  return false
}

export function isIosInstallGuide(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  if (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) return true
  return false
}

export function isAndroidInstallGuide(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

export function hasCompletedPwaInstallGuide(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1'
  } catch {
    return true
  }
}

export function markPwaInstallGuideDone(): void {
  try {
    localStorage.setItem(DONE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function shouldOfferPwaInstallGuide(): boolean {
  return (
    isMobileForInstallGuide() &&
    !isStandalonePwa() &&
    !hasCompletedPwaInstallGuide()
  )
}

/** After auth: send mobile browser users to the install screen once, unless already standalone or dismissed. */
export function pathWithOptionalInstallGuide(rawNext: string): string {
  const next = safeRedirectPath(rawNext)
  if (!shouldOfferPwaInstallGuide()) return next
  return `/install?next=${encodeURIComponent(next)}`
}
