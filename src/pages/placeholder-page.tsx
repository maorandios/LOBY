import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  title: string
}

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="min-h-svh bg-feed-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg px-4">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          מסך זה הוא מציין מקום בלבד. הניווט התחתון מסייע לבחון את חוויית ה־PWA.
        </p>
        <Link
          to="/feed"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'mt-6 inline-flex min-h-11 touch-manipulation'
          )}
        >
          חזרה לפיד
        </Link>
      </div>
    </div>
  )
}
