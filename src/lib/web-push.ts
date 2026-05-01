import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** iPhone / iPad / iPod (including iPadOS desktop mode). */
export function isAppleMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPad with iPadOS 13+ may report as MacIntel
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** PWA opened from Home Screen (required on iOS for push in practice). */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia?.('(display-mode: standalone)')?.matches) return true
    if (window.matchMedia?.('(display-mode: fullscreen)')?.matches) return true
  } catch {
    /* ignore */
  }
  return Boolean(
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Browser exposes Push API. On iPhone/iPad this is usually false in Safari’s tab;
 * use the app from the Home Screen (iOS 16.4+).
 */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Public VAPID key from env (never put the private key in the client bundle). */
export function getVapidPublicKey(): string | null {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()
  return k && k.length > 0 ? k : null
}

export type PushEnableState =
  | 'unsupported'
  | 'no_key'
  | 'denied'
  | 'default'
  | 'subscribed'
  | 'error'

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
  } catch (e) {
    console.error('[LOBY] service worker register', e)
    return null
  }
}

export async function loadPushSubscriptionState(
  buildingId: string | null
): Promise<{
  permission: NotificationPermission
  hasDbRow: boolean
}> {
  const permission = await getNotificationPermission()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id || !buildingId) {
    return { permission, hasDbRow: false }
  }
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('building_id', buildingId)
    .limit(1)
  if (error) {
    console.error('[LOBY] push_subscriptions', error)
    return { permission, hasDbRow: false }
  }
  return { permission, hasDbRow: Boolean(data?.length) }
}

export async function subscribeAndSave(
  buildingId: string
): Promise<{ ok: boolean; message?: string }> {
  const vapid = getVapidPublicKey()
  if (!vapid) {
    return { ok: false, message: 'חסר מפתח VAPID בשרת. פנו למנהל המערכת.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return { ok: false, message: 'נדרשת התחברות' }
  }

  const registration = await ensureServiceWorker()
  if (!registration) {
    return { ok: false, message: 'לא ניתן לרשום service worker' }
  }

  let perm = Notification.permission
  if (perm === 'default') {
    perm = await Notification.requestPermission()
  }
  if (perm !== 'granted') {
    return { ok: false, message: 'לא אישרתם התראות בדפדפן' }
  }

  const keyMaterial = urlBase64ToUint8Array(vapid)
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyMaterial as unknown as BufferSource,
  })

  const json = sub.toJSON() as Record<string, unknown>

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      building_id: buildingId,
      endpoint: sub.endpoint,
      subscription_json: json,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    console.error('[LOBY] push_subscriptions upsert', error)
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function unsubscribeAndRemove(): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return { ok: false, message: 'נדרשת התחברות' }
  }

  const registration = await navigator.serviceWorker?.getRegistration?.()
  const sub = await registration?.pushManager.getSubscription()
  if (sub) {
    try {
      await sub.unsubscribe()
    } catch {
      /* ignore */
    }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('[LOBY] push_subscriptions delete', error)
    return { ok: false, message: error.message }
  }
  return { ok: true }
}
