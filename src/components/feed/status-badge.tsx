import type { PostStatusHe } from '@/types/feed'

const CLOSED_UI_LABEL = 'סגור'

/** UI label — נסגר והוחלט shown as סגור. */
export function postStatusDisplayText(status: PostStatusHe): string {
  if (status === 'נסגר' || status === 'הוחלט') return CLOSED_UI_LABEL
  return status
}
