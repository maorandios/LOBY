/** Grayscale pill — match poll «שינוי בחירה» chip surface. */
export const COMMENT_GRAY_CHIP_BASE =
  'inline-flex max-w-full items-center gap-[0.21rem] rounded-full px-[0.425rem] py-[5px] text-[0.595rem] font-semibold tracking-tight border border-zinc-300/90 bg-zinc-100/90 text-zinc-700 dark:border-zinc-500 dark:bg-zinc-800/55 dark:text-zinc-200'

/** Max height for autosizing inline / bottom composers. */
export const COMMENT_COMPOSER_MAX_HEIGHT_PX = 192

/** Feed + post-detail: same stroke, 16px mobile (no iOS zoom), sm:text-[0.8rem]. */
export const COMMENT_COMPOSER_TEXTAREA_CLASS =
  'box-border w-full resize-none overflow-x-hidden rounded-xl border-0 bg-background/40 px-3 py-2 text-[16px] leading-normal text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/55 sm:text-[0.8rem]'

/** Card snippet: one display line — collapse user newlines / runs of spaces. */
export function normalizeCommentSnippetLine(text: string): string {
  return text.replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim()
}
