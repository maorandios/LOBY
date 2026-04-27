export type PostTypeHe = 'דיווח' | 'עדכון' | 'הצבעה' | 'בקשה'

export type PostStatusHe = 'פתוח' | 'בטיפול' | 'נסגר' | 'הוחלט'

export type FeedFilterId = 'הכל' | 'דיווחים' | 'הצבעות' | 'עדכונים' | 'בקשות'

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface PollData {
  options: PollOption[]
  /** When true, voting UI is hidden and results are shown */
  isClosed: boolean
  /** If set in mock, card opens in “after vote” mode */
  initialVoteOptionId?: string | null
}

export interface FeedPostBase {
  id: string
  type: PostTypeHe
  status: PostStatusHe
  /** Preformatted relative time for mock display */
  relativeTime: string
  title: string
  author: string
  apartment: string
  location?: string
  bodyPreview?: string
  /** Show a placeholder image block */
  hasImage?: boolean
  comments: number
  views?: number
}

export interface FeedPostStandard extends FeedPostBase {
  type: Exclude<PostTypeHe, 'הצבעה'>
}

export interface FeedPostPoll extends FeedPostBase {
  type: 'הצבעה'
  poll: PollData
}

export type FeedPost = FeedPostStandard | FeedPostPoll

export function isPollPost(post: FeedPost): post is FeedPostPoll {
  return post.type === 'הצבעה'
}
