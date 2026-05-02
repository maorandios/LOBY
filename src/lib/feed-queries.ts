import type { PostStatusDb, PostTypeDb } from '@/lib/post-types'
import { postStatusDbToHe, postTypeDbToHe } from '@/lib/post-types'
import type { BuildingMemberRole } from '@/types/building'
import type { FeedPost, PollData, PostComment } from '@/types/feed'
import { isPollPost } from '@/types/feed'
import { supabase } from '@/lib/supabase'
import { normalizePhoneForWhatsApp } from '@/lib/whatsapp-phone'
import { formatRelativeTimeHe } from '@/lib/format-relative-time-he'
import type { FeedFilterId } from '@/types/feed'

export type PostRow = {
  id: string
  building_id: string
  author_id: string | null
  is_anonymous?: boolean
  type: PostTypeDb
  status: PostStatusDb
  title: string
  image_url: string | null
  poll_cancelled: boolean
  poll_closed: boolean
  pinned: boolean
  created_at: string
}

type CountAgg = { count: number }[]

function countFromRel(rel: CountAgg | undefined | null): number {
  const n = rel?.[0]?.count
  return typeof n === 'number' ? n : 0
}

type PollOptionRowAgg = {
  id: string
  label: string
  sort_order: number
  poll_votes: CountAgg | null
}

type MemberMapEntry = {
  name: string | null
  apt: string | null
  role: BuildingMemberRole | null
  /** Stored signup/contact phone — used for WhatsApp deeplink only when normalized */
  phone: string | null
}

function memberWhatsAppDigits(
  map: Map<string, MemberMapEntry>,
  userId: string
): string | undefined {
  const normalized = normalizePhoneForWhatsApp(map.get(userId)?.phone ?? null)
  return normalized ?? undefined
}

function displayName(map: Map<string, MemberMapEntry>, userId: string): string {
  const row = map.get(userId)
  const n = row?.name?.trim()
  if (n) return n
  return 'דייר'
}

function apartmentLabel(
  map: Map<string, MemberMapEntry>,
  userId: string
): string {
  const a = map.get(userId)?.apt?.trim()
  if (a && a.length > 0) return a
  return '—'
}

function memberIsAdmin(map: Map<string, MemberMapEntry>, userId: string): boolean {
  return map.get(userId)?.role === 'admin'
}

function buildPollData(
  post: PostRow,
  options: PollOptionRowAgg[] | null | undefined,
  memberCount: number,
  myVoteOptionId: string | null
): PollData {
  const sorted = [...(options ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, 'he')
  )
  return {
    isClosed: post.poll_closed || post.poll_cancelled,
    isCancelled: post.poll_cancelled,
    initialVoteOptionId: myVoteOptionId,
    eligibleVoters: Math.max(1, memberCount),
    options: sorted.map((o) => ({
      id: o.id,
      label: o.label,
      votes: countFromRel(o.poll_votes as CountAgg),
    })),
  }
}

export async function fetchBuildingLabel(buildingId: string): Promise<string> {
  const { data, error } = await supabase
    .from('buildings')
    .select('full_address')
    .eq('id', buildingId)
    .maybeSingle()
  if (error || !data?.full_address) return 'קהילת הדיירים'
  return String(data.full_address).trim() || 'קהילת הדיירים'
}

export function feedPostMatchesFilter(
  post: FeedPost,
  filter: FeedFilterId
): boolean {
  switch (filter) {
    case 'הכל':
      return true
    case 'דיווחים':
      return post.type === 'דיווח'
    case 'הצבעות':
      return post.type === 'הצבעה'
    case 'עדכונים':
      return post.type === 'עדכון'
    case 'בקשות':
      return post.type === 'בקשה'
    default:
      return true
  }
}

/** Which tab route is active (bottom pill) — filters which posts are shown. */
export type FeedTabMode = 'all' | 'reports' | 'updates' | 'requests' | 'polls'

export function feedPostMatchesTabMode(
  post: FeedPost,
  mode: FeedTabMode
): boolean {
  switch (mode) {
    case 'all':
      return true
    case 'reports':
      return post.type === 'דיווח'
    case 'updates':
      return post.type === 'עדכון'
    case 'requests':
      return post.type === 'בקשה'
    case 'polls':
      return post.type === 'הצבעה'
    default:
      return true
  }
}

export async function fetchBuildingMemberCount(buildingId: string): Promise<number> {
  const { count, error } = await supabase
    .from('building_members')
    .select('id', { count: 'exact', head: true })
    .eq('building_id', buildingId)
  if (error) {
    console.error('[LOBY] fetchBuildingMemberCount', error)
    return 1
  }
  return typeof count === 'number' && count > 0 ? count : 1
}

export async function fetchMemberMap(
  buildingId: string
): Promise<Map<string, MemberMapEntry>> {
  const { data, error } = await supabase
    .from('building_members')
    .select('user_id, full_name, apartment_number, role, phone')
    .eq('building_id', buildingId)
  const map = new Map<string, MemberMapEntry>()
  if (error) {
    console.error('[LOBY] fetchMemberMap', error)
    return map
  }
  for (const row of data ?? []) {
    map.set(row.user_id as string, {
      name: row.full_name as string | null,
      apt: row.apartment_number as string | null,
      role: (row.role as BuildingMemberRole) ?? null,
      phone: (row.phone as string | null) ?? null,
    })
  }
  return map
}

/** Page size for feed infinite scroll (initial + each “load more”). */
export const FEED_POSTS_PAGE_SIZE = 20

/** Max comments shown as a preview snippet on feed post cards */
export const FEED_COMMENT_PREVIEW_LIMIT = 3

type CommentPreviewRow = {
  post_id: string
  id: string
  author_id: string
  body: string
  created_at: string
}

function mapPreviewRowToPostComment(
  row: CommentPreviewRow,
  memberMap: Map<string, MemberMapEntry>
): PostComment {
  const authorId = row.author_id
  return {
    id: row.id,
    author: displayName(memberMap, authorId),
    apartment: apartmentLabel(memberMap, authorId),
    text: (row.body ?? '').trim(),
    relativeTime: formatRelativeTimeHe(row.created_at),
    authorIsAdmin: memberIsAdmin(memberMap, authorId),
  }
}

/** Latest N comments per post for feed cards — `comments` SELECT + RLS (works without extra SQL). */
async function fetchFeedCommentsPreview(
  postIds: string[],
  memberMap: Map<string, MemberMapEntry>
): Promise<Map<string, PostComment[]>> {
  const out = new Map<string, PostComment[]>()
  if (postIds.length === 0) return out

  const results = await Promise.all(
    postIds.map(async (postId) => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_id, body, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(FEED_COMMENT_PREVIEW_LIMIT)
      if (error) {
        console.error('[LOBY] fetchFeedCommentsPreview', postId, error)
        return [postId, [] as PostComment[]] as const
      }
      const rowsNewestFirst = data ?? []
      const mapped = rowsNewestFirst.map(
        (row) =>
          mapPreviewRowToPostComment(
            {
              post_id: postId,
              id: row.id as string,
              author_id: row.author_id as string,
              body: (row.body as string) ?? '',
              created_at: row.created_at as string,
            },
            memberMap
          )
      )
      return [postId, mapped] as const
    })
  )
  for (const [postId, list] of results) {
    if (list.length) out.set(postId, list)
  }
  return out
}

export type FetchFeedPostsPageResult = {
  posts: FeedPost[]
  hasMore: boolean
}

export async function fetchFeedPostsForBuilding(
  buildingId: string,
  offset = 0
): Promise<FetchFeedPostsPageResult> {
  const limit = FEED_POSTS_PAGE_SIZE
  const [memberMap, memberCount, postsRes] = await Promise.all([
    fetchMemberMap(buildingId),
    fetchBuildingMemberCount(buildingId),
    supabase
      .from('posts')
      .select(
        `
        id,
        building_id,
        author_id,
        is_anonymous,
        type,
        status,
        title,
        image_url,
        poll_cancelled,
        poll_closed,
        pinned,
        created_at,
        comments(count),
        poll_options(
          id,
          label,
          sort_order,
          poll_votes(count)
        )
      `
      )
      .eq('building_id', buildingId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
  ])

  if (postsRes.error) {
    console.error('[LOBY] fetchFeedPostsForBuilding', postsRes.error)
    return { posts: [], hasMore: false }
  }

  const rows = (postsRes.data ?? []) as (PostRow & {
    comments?: CountAgg | null
    poll_options?: PollOptionRowAgg[] | null
  })[]

  const pollPostIds = rows
    .filter((r) => r.type === 'poll')
    .map((r) => r.id)

  const myVotes = new Map<string, string>()
  if (pollPostIds.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const uid = user?.id
    if (uid) {
      const { data: votes, error: vErr } = await supabase
        .from('poll_votes')
        .select('post_id, option_id')
        .eq('user_id', uid)
        .in('post_id', pollPostIds)
      if (!vErr && votes)
        for (const v of votes) {
          myVotes.set(v.post_id as string, v.option_id as string)
        }
    }
  }

  const posts = rows.map((row) =>
    rowToFeedPost(row, memberMap, memberCount, myVotes.get(row.id) ?? null)
  )
  const postIdsNeedingComments = posts
    .filter((p) => p.comments > 0)
    .map((p) => p.id)

  let pagePosts = posts
  if (postIdsNeedingComments.length > 0) {
    const previewMap = await fetchFeedCommentsPreview(
      postIdsNeedingComments,
      memberMap
    )
    pagePosts = posts.map((p) => {
      const snippets = previewMap.get(p.id)
      if (snippets?.length)
        return { ...p, recentComments: snippets }
      return p
    })
  }

  return { posts: pagePosts, hasMore: rows.length === limit }
}

function rowToFeedPost(
  row: PostRow & {
    comments?: CountAgg | null
    poll_options?: PollOptionRowAgg[] | null
  },
  memberMap: Map<string, MemberMapEntry>,
  memberCount: number,
  myVoteOptionId: string | null
): FeedPost {
  const commentsCount = countFromRel(row.comments as CountAgg)
  const rel = formatRelativeTimeHe(row.created_at)
  const isAnonymous = Boolean(row.is_anonymous)

  if (isAnonymous) {
    const base = {
      id: row.id,
      type: postTypeDbToHe(row.type),
      status: postStatusDbToHe(row.status),
      pinned: Boolean((row as { pinned?: boolean }).pinned),
      relativeTime: rel,
      title: row.title,
      authorId: null as string | null,
      isAnonymous: true as const,
      authorWhatsAppDigits: undefined,
      author: 'פרסום אנונימי',
      apartment: '',
      authorIsAdmin: false,
      imageUrl: row.image_url?.trim() || undefined,
      comments: commentsCount,
    }

    if (row.type === 'poll') {
      const poll = buildPollData(
        row,
        row.poll_options,
        memberCount,
        myVoteOptionId
      )
      return { ...base, type: 'הצבעה', poll }
    }

    return {
      ...base,
      type: postTypeDbToHe(row.type) as Exclude<(typeof base)['type'], 'הצבעה'>,
    }
  }

  const authorKey = row.author_id as string
  const base = {
    id: row.id,
    type: postTypeDbToHe(row.type),
    status: postStatusDbToHe(row.status),
    pinned: Boolean((row as { pinned?: boolean }).pinned),
    relativeTime: rel,
    title: row.title,
    authorId: row.author_id,
    isAnonymous: false as const,
    authorWhatsAppDigits: memberWhatsAppDigits(memberMap, authorKey),
    author: displayName(memberMap, authorKey),
    apartment: apartmentLabel(memberMap, authorKey),
    authorIsAdmin: memberIsAdmin(memberMap, authorKey),
    imageUrl: row.image_url?.trim() || undefined,
    comments: commentsCount,
  }

  if (row.type === 'poll') {
    const poll = buildPollData(
      row,
      row.poll_options,
      memberCount,
      myVoteOptionId
    )
    return { ...base, type: 'הצבעה', poll }
  }

  return {
    ...base,
    type: postTypeDbToHe(row.type) as Exclude<typeof base.type, 'הצבעה'>,
  }
}

export async function fetchPostById(postId: string): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      building_id,
      author_id,
      is_anonymous,
      type,
      status,
      title,
      image_url,
      poll_cancelled,
      poll_closed,
      pinned,
      created_at,
      comments(count),
      poll_options(
        id,
        label,
        sort_order,
        poll_votes(count)
      )
    `
    )
    .eq('id', postId)
    .maybeSingle()

  if (error) {
    console.error('[LOBY] fetchPostById', error)
    return null
  }
  if (!data) return null

  const row = data as PostRow & {
    comments?: CountAgg | null
    poll_options?: PollOptionRowAgg[] | null
  }
  const buildingId = row.building_id
  const [memberMap, memberCount] = await Promise.all([
    fetchMemberMap(buildingId),
    fetchBuildingMemberCount(buildingId),
  ])

  let myVote: string | null = null
  if (row.type === 'poll') {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) {
      const { data: v } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('post_id', row.id)
        .eq('user_id', user.id)
        .maybeSingle()
      myVote = (v?.option_id as string) ?? null
    }
  }

  return rowToFeedPost(row, memberMap, memberCount, myVote)
}

export type CommentRow = {
  id: string
  author_id: string
  body: string
  created_at: string
}

export async function fetchCommentsForPost(
  postId: string
): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, author_id, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[LOBY] fetchCommentsForPost', error)
    return []
  }

  const { data: postRow } = await supabase
    .from('posts')
    .select('building_id')
    .eq('id', postId)
    .maybeSingle()

  const buildingId = postRow?.building_id as string | undefined
  const memberMap = buildingId ? await fetchMemberMap(buildingId) : new Map()

  return (data ?? []).map((c) => {
    const authorId = c.author_id as string
    return {
      id: c.id as string,
      author: displayName(memberMap, authorId),
      apartment: apartmentLabel(memberMap, authorId),
      text: (c.body as string) ?? '',
      relativeTime: formatRelativeTimeHe(c.created_at as string),
      authorIsAdmin: memberIsAdmin(memberMap, authorId),
    }
  })
}

export async function insertComment(
  postId: string,
  body: string
): Promise<PostComment | null> {
  const trimmed = body.trim()
  if (!trimmed) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      body: trimmed,
    })
    .select('id, author_id, body, created_at')
    .single()

  if (error) {
    console.error('[LOBY] insertComment', error)
    return null
  }

  const { data: postRow } = await supabase
    .from('posts')
    .select('building_id')
    .eq('id', postId)
    .maybeSingle()

  const buildingId = postRow?.building_id as string | undefined
  const memberMap = buildingId ? await fetchMemberMap(buildingId) : new Map()

  const authorId = data.author_id as string
  return {
    id: data.id as string,
    author: displayName(memberMap, authorId),
    apartment: apartmentLabel(memberMap, authorId),
    text: (data.body as string) ?? '',
    relativeTime: formatRelativeTimeHe(data.created_at as string),
    authorIsAdmin: memberIsAdmin(memberMap, authorId),
  }
}

export async function insertPollVote(
  postId: string,
  optionId: string
): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return { ok: false, message: 'נדרשת התחברות' }

  const { error } = await supabase.from('poll_votes').insert({
    post_id: postId,
    option_id: optionId,
    user_id: user.id,
  })
  if (error) {
    if (error.code === '23505')
      return { ok: false, message: 'כבר הצבעת בסקר זה' }
    console.error('[LOBY] insertPollVote', error)
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

export async function updatePollVote(
  postId: string,
  optionId: string
): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return { ok: false, message: 'נדרשת התחברות' }

  const { error } = await supabase
    .from('poll_votes')
    .update({ option_id: optionId })
    .eq('post_id', postId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[LOBY] updatePollVote', error)
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

export type CreatePostPayload = {
  buildingId: string
  /** When true, author_id is not stored — identity is not recoverable. */
  isAnonymous?: boolean
  /** Set after uploading to Storage, or omit. */
  imageUrl?: string | null
} & (
  | {
      kind: 'report'
      title: string
    }
  | {
      kind: 'update' | 'request'
      title: string
    }
  | {
      kind: 'poll'
      title: string
      options: string[]
    }
)

export async function createPost(payload: CreatePostPayload): Promise<{
  id: string | null
  error?: string
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return { id: null, error: 'נדרשת התחברות' }

  const wantsAnon = Boolean(payload.isAnonymous)
  const resolvedImageUrl = payload.imageUrl?.trim() || null

  if (payload.kind === 'poll') {
    const opts = payload.options.map((t) => t.trim()).filter(Boolean)
    if (opts.length < 2) return { id: null, error: 'נדרשות לפחות שתי אפשרויות' }

    if (wantsAnon) {
      const { data: rpcId, error: rpcErr } = await supabase.rpc(
        'create_poll_post',
        {
          p_building_id: payload.buildingId,
          p_title: payload.title.trim(),
          p_image_url: resolvedImageUrl ?? '',
          p_is_anonymous: true,
          p_option_labels: opts,
        }
      )
      if (rpcErr) {
        console.error('[LOBY] createPost anonymous poll', rpcErr)
        return { id: null, error: rpcErr.message ?? 'יצירת סקר נכשלה' }
      }
      const id = rpcId != null && rpcId !== '' ? String(rpcId) : null
      if (!id) return { id: null, error: 'יצירת סקר נכשלה' }
      return { id }
    }

    const { data: inserted, error: pErr } = await supabase
      .from('posts')
      .insert({
        building_id: payload.buildingId,
        author_id: user.id,
        is_anonymous: false,
        type: 'poll' satisfies PostTypeDb,
        status: 'open' satisfies PostStatusDb,
        title: payload.title.trim(),
        image_url: resolvedImageUrl,
        poll_closed: false,
        poll_cancelled: false,
      })
      .select('id')
      .single()

    if (pErr || !inserted) {
      console.error('[LOBY] createPost poll parent', pErr)
      return { id: null, error: pErr?.message ?? 'יצירת סקר נכשלה' }
    }

    const postId = inserted.id as string
    const optionRows = opts.map((label, i) => ({
      post_id: postId,
      label,
      sort_order: i,
    }))

    const { error: oErr } = await supabase.from('poll_options').insert(optionRows)
    if (oErr) {
      console.error('[LOBY] createPost poll_options', oErr)
      return { id: null, error: oErr.message }
    }
    return { id: postId }
  }

  if (wantsAnon) {
    const { data: ins, error } = await supabase
      .from('posts')
      .insert({
        building_id: payload.buildingId,
        author_id: null,
        is_anonymous: true,
        type: payload.kind satisfies PostTypeDb,
        status: 'open' satisfies PostStatusDb,
        title: payload.title.trim(),
        image_url: resolvedImageUrl,
        poll_closed: false,
        poll_cancelled: false,
      })
      .select('id')
      .single()

    if (error || !ins) {
      console.error('[LOBY] createPost anonymous', error)
      return { id: null, error: error?.message ?? 'יצירת פוסט נכשלה' }
    }
    return { id: ins.id as string }
  }

  const { data: ins, error } = await supabase
    .from('posts')
    .insert({
      building_id: payload.buildingId,
      author_id: user.id,
      is_anonymous: false,
      type: payload.kind satisfies PostTypeDb,
      status: 'open' satisfies PostStatusDb,
      title: payload.title.trim(),
      image_url: resolvedImageUrl,
      poll_closed: false,
      poll_cancelled: false,
    })
    .select('id')
    .single()

  if (error || !ins) {
    console.error('[LOBY] createPost', error)
    return { id: null, error: error?.message ?? 'יצירת פוסט נכשלה' }
  }
  return { id: ins.id as string }
}

async function adminPostResult(
  result: { error: Error | null }
): Promise<{ ok: boolean; error?: string }> {
  if (result.error) {
    console.error('[LOBY] admin post action', result.error)
    return { ok: false, error: result.error.message }
  }
  return { ok: true }
}

/** Report workflow — building admins only (RLS). */
export async function adminUpdateReportPostStatus(
  postId: string,
  status: Extract<PostStatusDb, 'open' | 'in_progress' | 'closed'>
): Promise<{ ok: boolean; error?: string }> {
  return adminPostResult(
    await supabase.from('posts').update({ status }).eq('id', postId)
  )
}

/** Pin / unpin — building admins only (RLS). When pinning, DB unpins every other post in the same building. */
export async function adminSetPostPinned(
  postId: string,
  pinned: boolean
): Promise<{ ok: boolean; error?: string }> {
  return adminPostResult(
    await supabase.from('posts').update({ pinned }).eq('id', postId)
  )
}

/** Poll decided — building admins only (RLS). */
export async function adminMarkPollDecided(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  return adminPostResult(
    await supabase
      .from('posts')
      .update({
        status: 'decided',
        poll_closed: true,
      })
      .eq('id', postId)
      .eq('type', 'poll')
  )
}

/** Re-open a closed poll — building admins only (RLS). Voting stays closed for residents who already voted (unique constraint). */
export async function adminReopenPoll(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  return adminPostResult(
    await supabase
      .from('posts')
      .update({
        status: 'open',
        poll_closed: false,
      })
      .eq('id', postId)
      .eq('type', 'poll')
  )
}

/** Delete post — RLS: building admins or the post author. Cascades comments / poll data. */
export async function adminDeletePost(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  return adminPostResult(
    await supabase.from('posts').delete().eq('id', postId)
  )
}

/** Bump comment count (no preview mutation). */
export function withCommentIncrement(post: FeedPost): FeedPost {
  return {
    ...post,
    comments: post.comments + 1,
  }
}

/** Prepend newest comment card preview; capped at {@link FEED_COMMENT_PREVIEW_LIMIT}, newest first. */
export function mergeCommentIntoRecentPreview(
  post: FeedPost,
  inserted: PostComment
): FeedPost {
  const prev = post.recentComments ?? []
  const nextPreview = [inserted, ...prev.filter((c) => c.id !== inserted.id)].slice(
    0,
    FEED_COMMENT_PREVIEW_LIMIT
  )
  return {
    ...post,
    comments: post.comments + 1,
    recentComments: nextPreview.length > 0 ? nextPreview : undefined,
  }
}

export function mergePollVotes(
  post: FeedPost,
  votedOptionId: string
): FeedPost {
  if (!isPollPost(post)) return post
  const nextOptions = post.poll.options.map((o) =>
    o.id === votedOptionId ? { ...o, votes: o.votes + 1 } : o
  )
  return {
    ...post,
    poll: {
      ...post.poll,
      initialVoteOptionId: votedOptionId,
      options: nextOptions,
    },
  }
}

export function mergePollVoteChange(
  post: FeedPost,
  fromOptionId: string,
  toOptionId: string
): FeedPost {
  if (!isPollPost(post)) return post
  if (fromOptionId === toOptionId) return post
  const nextOptions = post.poll.options.map((o) => {
    if (o.id === fromOptionId) return { ...o, votes: Math.max(0, o.votes - 1) }
    if (o.id === toOptionId) return { ...o, votes: o.votes + 1 }
    return o
  })
  return {
    ...post,
    poll: {
      ...post.poll,
      initialVoteOptionId: toOptionId,
      options: nextOptions,
    },
  }
}
