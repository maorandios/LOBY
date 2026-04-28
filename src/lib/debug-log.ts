/**
 * Lightweight on-page diagnostic log for hard-to-reach environments (iOS PWA, etc.).
 * Activates only when the URL contains `?debug=1` or sessionStorage `loby:debug=1`.
 *
 * Logs are kept in `sessionStorage` so they survive a webview reload — useful for
 * diagnosing iOS reload-on-file-picker scenarios.
 */

const STORAGE_KEY = 'loby:debug:log'
const FLAG_KEY = 'loby:debug'
const MAX_ENTRIES = 200

type Listener = () => void
const listeners = new Set<Listener>()

let cachedEnabled: boolean | null = null

export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (cachedEnabled !== null) return cachedEnabled
  let enabled = false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === '1') {
      sessionStorage.setItem(FLAG_KEY, '1')
      enabled = true
    } else if (sessionStorage.getItem(FLAG_KEY) === '1') {
      enabled = true
    }
  } catch {
    /* ignore */
  }
  cachedEnabled = enabled
  return enabled
}

export type DebugEntry = {
  ts: number
  msg: string
}

export function readLog(): DebugEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is DebugEntry =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as DebugEntry).ts === 'number' &&
        typeof (e as DebugEntry).msg === 'string'
    )
  } catch {
    return []
  }
}

export function clearLog(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  for (const fn of listeners) fn()
}

export function dlog(msg: string): void {
  if (!isDebugEnabled()) return
  if (typeof window === 'undefined') return
  try {
    const next = readLog()
    next.push({ ts: Date.now(), msg })
    while (next.length > MAX_ENTRIES) next.shift()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  for (const fn of listeners) fn()
}

export function subscribeDebugLog(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
