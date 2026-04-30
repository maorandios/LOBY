/**
 * Normalize Israeli-ish stored numbers to digits-only international form for `https://wa.me/<digits>`.
 */
export function normalizePhoneForWhatsApp(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null
  const d = raw.replace(/\D/g, '')
  if (d.length < 9 || d.length > 15) return null

  if (d.startsWith('972')) {
    return d.length >= 11 ? d : null
  }

  /* Local Israeli mobile: 05xxxxxxxx */
  if (d.startsWith('05') && d.length === 10) {
    return `972${d.slice(1)}`
  }

  /* Leading 0 + national */
  if (d.startsWith('0')) {
    const rest = d.slice(1)
    if (rest.startsWith('5') && rest.length === 9) return `972${rest}`
    return null
  }

  /* National without leading 0 — e.g. 5xxxxxxxx */
  if (d.startsWith('5') && d.length === 9) return `972${d}`

  return null
}
