import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_POSTS } from '@/data/feed-mock'
import { cn } from '@/lib/utils'

export function PostDetailPage() {
  const { postId } = useParams()
  const post = MOCK_POSTS.find((p) => p.id === postId)

  return (
    <div className="min-h-svh bg-muted/35 pb-10 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'lg' }),
            'mb-4 min-h-11 touch-manipulation gap-2 ps-1 text-muted-foreground'
          )}
        >
          <ArrowRight className="size-4" aria-hidden />
          חזרה לפיד
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {post ? post.title : 'פוסט לא נמצא'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              זהו מסך פירוט זמני. כאן יוצגו כל פרטי הפריט, קבצים מצורפים והיסטוריית
              טיפול — ללא שרת בדמו הנוכחי.
            </p>
            {post && (
              <p className="text-foreground/90">
                מזהה: <span className="font-mono text-xs">{post.id}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
