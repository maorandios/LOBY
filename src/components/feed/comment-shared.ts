/** Max height for autosizing inline / bottom composers. */
export const COMMENT_COMPOSER_MAX_HEIGHT_PX = 192

/** Feed + post-detail: same stroke, 16px mobile (no iOS zoom), sm:text-[0.8rem]. */
export const COMMENT_COMPOSER_TEXTAREA_CLASS =
  'box-border w-full resize-none overflow-x-hidden rounded-xl border-0 bg-background/40 px-3 py-2 text-[16px] leading-normal text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55 sm:text-[0.8rem]'

/** Card snippet: one display line — collapse user newlines / runs of spaces. */
export function normalizeCommentSnippetLine(text: string): string {
  return text.replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim()
}
