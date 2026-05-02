import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Ban,
  CheckCircle2,
  CircleChevronLeft,
  CircleDot,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PollData, PollOption } from '@/types/feed'

type Props = {
  postId: string
  poll: PollData
  className?: string
  /** First vote — persists insert. */
  onVote?: (optionId: string) => Promise<{ ok: boolean; message?: string }>
  /** Change existing vote — persists update while poll is open. */
  onChangeVote?: (
    optionId: string
  ) => Promise<{ ok: boolean; message?: string }>
}

const POLL_CHIP =
  'inline-flex max-w-full items-center gap-[0.21rem] rounded-full px-[0.425rem] py-[5px] text-[0.595rem] font-semibold tracking-tight'

function VoterSummaryLine({
  voted,
  eligible,
  className,
}: {
  voted: number
  eligible: number
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-xs font-medium tabular-nums text-muted-foreground',
        className
      )}
    >
      <span className="text-foreground">{voted}</span>
      {' הצביעו מתוך '}
      <span className="text-foreground">{eligible}</span>
      {' דיירים'}
    </p>
  )
}

export function PollBlock({
  postId,
  poll,
  className,
  onVote,
  onChangeVote,
}: Props) {
  const [options, setOptions] = useState<PollOption[]>(() =>
    poll.options.map((o) => ({ ...o }))
  )
  const [hasVoted, setHasVoted] = useState(
    () => poll.isClosed || !!poll.initialVoteOptionId
  )
  const [voteError, setVoteError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [changeVoteOpen, setChangeVoteOpen] = useState(false)
  const [myChoiceId, setMyChoiceId] = useState<string | null>(
    () => poll.initialVoteOptionId ?? null
  )

  useEffect(() => {
    setOptions(poll.options.map((o) => ({ ...o })))
  }, [poll.options])

  useEffect(() => {
    if (poll.isClosed || poll.isCancelled) setChangeVoteOpen(false)
    setHasVoted(poll.isClosed || !!poll.initialVoteOptionId)
    setMyChoiceId(poll.initialVoteOptionId ?? null)
  }, [poll.isClosed, poll.isCancelled, poll.initialVoteOptionId])

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.votes, 0),
    [options]
  )

  const eligible = poll.eligibleVoters
  const cancelled = !!poll.isCancelled

  const showResults =
    (hasVoted || poll.isClosed) && !cancelled && !changeVoteOpen

  const showChangeVoteChip =
    Boolean(
      onChangeVote &&
      myChoiceId &&
      !poll.isClosed &&
      !cancelled &&
      !changeVoteOpen &&
      showResults
    )

  async function voteFor(optionId: string) {
    if (hasVoted || poll.isClosed || cancelled) return
    const prevOpts = options.map((o) => ({ ...o }))
    const prevHasVoted = hasVoted

    if (onVote) {
      setVoteError(null)
      setSubmittingId(optionId)
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o
        )
      )
      setHasVoted(true)

      const res = await onVote(optionId)
      setSubmittingId(null)
      if (!res.ok) {
        setOptions(prevOpts)
        setHasVoted(prevHasVoted)
        setVoteError(res.message ?? 'לא ניתן להצביע כרגע')
        return
      }
      setMyChoiceId(optionId)
      return
    }

    setOptions((prev) =>
      prev.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      )
    )
    setHasVoted(true)
    setMyChoiceId(optionId)
  }

  async function applyVoteChange(optionId: string) {
    if (!onChangeVote || poll.isClosed || cancelled) return
    const from = myChoiceId
    if (!from) return

    setVoteError(null)

    if (optionId === from) {
      setChangeVoteOpen(false)
      return
    }

    const prevOpts = options.map((o) => ({ ...o }))
    setSubmittingId(optionId)
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id === from) return { ...o, votes: Math.max(0, o.votes - 1) }
        if (o.id === optionId) return { ...o, votes: o.votes + 1 }
        return o
      })
    )
    setMyChoiceId(optionId)
    setChangeVoteOpen(false)

    const res = await onChangeVote(optionId)
    setSubmittingId(null)
    if (!res.ok) {
      setOptions(prevOpts)
      setMyChoiceId(from)
      setVoteError(res.message ?? 'לא ניתן לעדכן את הבחירה כעת')
    }
  }

  return (
    <div
      className={cn('space-y-3', className)}
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {voteError ? (
        <p className="text-xs text-destructive" role="status">
          {voteError}
        </p>
      ) : null}
      {cancelled ? (
        <>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ban className="size-4 shrink-0 text-rose-600/80" aria-hidden />
            הצבעה בוטלה — לא ניתן להצביע.
          </p>
          <VoterSummaryLine voted={totalVotes} eligible={eligible} />
        </>
      ) : changeVoteOpen ? (
        <>
          <p className="text-xs text-muted-foreground">
            בחרו אפשרות אחרת
          </p>
          <div className="flex flex-col gap-2.5" role="list">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="listitem"
                id={`${postId}-change-${opt.id}`}
                disabled={!!submittingId}
                className={cn(
                  'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border/80 bg-white/40 px-3 py-2.5 text-start text-sm shadow-xs transition-colors',
                  'hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:bg-white/40 dark:hover:bg-white/50',
                  opt.id === myChoiceId && 'ring-2 ring-primary/35',
                  submittingId && 'pointer-events-none opacity-70'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  void applyVoteChange(opt.id)
                }}
              >
                <CircleChevronLeft
                  className="size-4 shrink-0 opacity-90"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-start leading-snug">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            disabled={submittingId !== null}
            onClick={(e) => {
              e.stopPropagation()
              setChangeVoteOpen(false)
            }}
          >
            ביטול
          </button>
        </>
      ) : showResults ? (
        <PollResults
          options={options}
          totalVotes={totalVotes}
          eligible={eligible}
          highlightOptionId={myChoiceId ?? undefined}
          footerEnd={
            showChangeVoteChip ? (
              <button
                type="button"
                disabled={submittingId !== null}
                className={cn(
                  POLL_CHIP,
                  'shrink-0 touch-manipulation',
                  'border border-zinc-300/90 bg-zinc-100/90 text-zinc-700',
                  'dark:border-zinc-500 dark:bg-zinc-800/55 dark:text-zinc-200',
                  submittingId !== null && 'pointer-events-none opacity-60'
                )}
                aria-label="שינוי בחירה בסקר"
                onClick={(e) => {
                  e.stopPropagation()
                  setVoteError(null)
                  setChangeVoteOpen(true)
                }}
              >
                <CircleDot
                  className="size-[0.744rem] shrink-0 opacity-90"
                  strokeWidth={1.75}
                  aria-hidden
                />
                שינוי בחירה
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-2.5" role="list">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="listitem"
                id={`${postId}-${opt.id}`}
                disabled={!!submittingId}
                className={cn(
                  'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border/80 bg-white/40 px-3 py-2.5 text-start text-sm shadow-xs transition-colors',
                  'hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:bg-white/40 dark:hover:bg-white/50',
                  submittingId && 'pointer-events-none opacity-70'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  void voteFor(opt.id)
                }}
              >
                <CircleChevronLeft
                  className="size-4 shrink-0 opacity-90"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-start leading-snug">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PollResults({
  options,
  totalVotes,
  eligible,
  highlightOptionId,
  footerEnd,
}: {
  options: PollOption[]
  totalVotes: number
  eligible: number
  highlightOptionId?: string
  footerEnd?: ReactNode
}) {
  const safeTotal = Math.max(totalVotes, 1)

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const pct = Math.round((opt.votes / safeTotal) * 100)
        const mine = highlightOptionId === opt.id
        return (
          <div key={opt.id} className="space-y-1.5">
            <div className="flex items-start justify-between gap-2 text-xs">
              <span
                className={cn(
                  'font-medium leading-snug text-foreground',
                  mine && 'text-primary'
                )}
              >
                {opt.label}
                {mine ? (
                  <span className="ms-1 text-[0.65rem] font-semibold text-primary">
                    (בחירתך)
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full bg-primary/85 transition-[width] duration-300',
                  mine && 'bg-primary'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <CheckCircle2
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <VoterSummaryLine voted={totalVotes} eligible={eligible} />
        </div>
        {footerEnd}
      </div>
    </div>
  )
}
