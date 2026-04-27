import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { PollData, PollOption } from '@/types/feed'

type Props = {
  postId: string
  poll: PollData
  className?: string
}

export function PollBlock({ postId, poll, className }: Props) {
  const [options, setOptions] = useState<PollOption[]>(() =>
    poll.options.map((o) => ({ ...o }))
  )
  const [selected, setSelected] = useState<string | null>(
    poll.initialVoteOptionId ?? null
  )
  const [hasVoted, setHasVoted] = useState(
    () => poll.isClosed || !!poll.initialVoteOptionId
  )

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.votes, 0),
    [options]
  )

  function submitVote() {
    if (!selected || hasVoted || poll.isClosed) return
    setOptions((prev) =>
      prev.map((o) =>
        o.id === selected ? { ...o, votes: o.votes + 1 } : o
      )
    )
    setHasVoted(true)
  }

  const showResults = hasVoted || poll.isClosed

  return (
    <div
      className={cn('space-y-3', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {showResults ? (
        <PollResults options={options} totalVotes={totalVotes} />
      ) : (
        <>
          <RadioGroup
            value={selected ?? undefined}
            onValueChange={(v) => setSelected(v ?? null)}
            className="gap-2.5"
          >
            {options.map((opt) => (
              <label
                key={opt.id}
                htmlFor={`${postId}-${opt.id}`}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 text-start text-sm shadow-xs transition-colors',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60',
                  selected === opt.id && 'border-primary/50 bg-primary/5'
                )}
              >
                <RadioGroupItem value={opt.id} id={`${postId}-${opt.id}`} />
                <span className="leading-snug">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
          <Button
            type="button"
            size="lg"
            className="h-11 w-full touch-manipulation text-base"
            disabled={!selected}
            onClick={submitVote}
          >
            הצבע
          </Button>
        </>
      )}
    </div>
  )
}

function PollResults({
  options,
  totalVotes,
}: {
  options: PollOption[]
  totalVotes: number
}) {
  const safeTotal = Math.max(totalVotes, 1)

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const pct = Math.round((opt.votes / safeTotal) * 100)
        return (
          <div key={opt.id} className="space-y-1.5">
            <div className="flex items-start justify-between gap-2 text-xs">
              <span className="font-medium leading-snug text-foreground">
                {opt.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/85 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        סה״כ {totalVotes} הצבעות
      </p>
    </div>
  )
}
