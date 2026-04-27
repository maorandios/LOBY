/** Same-origin path only (for ?redirect= after login). */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '/'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'
  return t
}
