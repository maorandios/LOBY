/** Short relative labels in Hebrew for feed timestamps. */
export function formatRelativeTimeHe(iso: string, nowMs = Date.now()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Math.max(0, nowMs - t)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'כרגע'
  const min = Math.floor(sec / 60)
  if (min < 60) return min === 1 ? 'לפני דקה' : `לפני ${min} דקות`
  const h = Math.floor(min / 60)
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`
  const d = Math.floor(h / 24)
  if (d === 1) return 'אתמול'
  if (d < 7) return `לפני ${d} ימים`
  const w = Math.floor(d / 7)
  if (w < 5) return w === 1 ? 'לפני שבוע' : `לפני ${w} שבועות`
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(t)
}
