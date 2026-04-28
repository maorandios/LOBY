import { useMemo, useState } from 'react'
import { Ban, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PollData, PollOption } from '@/types/feed'

type Props = {
  postId: string
  poll: PollData
  className?: string
  /** When set, voting persists to the server; on failure the UI rolls back. */
  onVote?: (optionId: string) => Promise<{ ok: boolean; message?: string }>
}

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

export function PollBlock({ postId, poll, className, onVote }: Props) {
  const [options, setOptions] = useState<PollOption[]>(() =>
    poll.options.map((o) => ({ ...o }))
  )
  const [hasVoted, setHasVoted] = useState(
    () => poll.isClosed || !!poll.initialVoteOptionId
  )
  const [voteError, setVoteError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.votes, 0),
    [options]
  )

  const eligible = poll.eligibleVoters
  const cancelled = !!poll.isCancelled

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
      return
    }

    setOptions((prev) =>
      prev.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      )
    )
    setHasVoted(true)
  }

  const showResults = (hasVoted || poll.isClosed) && !cancelled

  return (
    <div
      className={cn('space-y-3', className)}
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
      ) : showResults ? (
        <PollResults
          options={options}
          totalVotes={totalVotes}
          eligible={eligible}
          highlightOptionId={poll.initialVoteOptionId ?? undefined}
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
                  'flex min-h-11 w-full cursor-pointer items-center rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 text-start text-sm shadow-xs transition-colors',
                  'hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                  submittingId && 'pointer-events-none opacity-70'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  void voteFor(opt.id)
                }}
              >
                <span className="leading-snug">{opt.label}</span>
              </button>
            ))}
          </div>
          <VoterSummaryLine voted={totalVotes} eligible={eligible} />
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
}: {
  options: PollOption[]
  totalVotes: number
  eligible: number
  highlightOptionId?: string
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
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
        <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <VoterSummaryLine voted={totalVotes} eligible={eligible} />
      </div>
    </div>
  )
}
