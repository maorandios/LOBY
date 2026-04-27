/** Same-origin path only (for ?redirect= after login). */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '/'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'

  const q = t.search(/[?#]/)
  const pathPart = q === -1 ? t : t.slice(0, q)
  const suffix = q === -1 ? '' : t.slice(q)
  const trimmed = pathPart.replace(/\/+$/, '') || '/'

  if (trimmed === '/home') {
    return `/feed${suffix}`
  }
  return t
}
