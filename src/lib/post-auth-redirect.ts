import { safeRedirectPath } from '@/lib/safe-redirect'

const KEY = 'loby:post_auth_redirect'

/** Remember where to go after magic link (callback has no ?redirect). */
export function stashPostAuthRedirect(path: string): void {
  const p = safeRedirectPath(path)
  if (p === '/') return
  try {
    localStorage.setItem(KEY, p)
  } catch {
    /* ignore */
  }
}

export function consumePostAuthRedirect(): string {
  try {
    const v = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    return safeRedirectPath(v)
  } catch {
    return '/'
  }
}
