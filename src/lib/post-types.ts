import type { PostStatusHe, PostTypeHe } from '@/types/feed'

export type PostTypeDb = 'report' | 'update' | 'poll' | 'request'
export type PostStatusDb = 'open' | 'in_progress' | 'closed' | 'decided'

export function postTypeDbToHe(type: PostTypeDb): PostTypeHe {
  switch (type) {
    case 'report':
      return 'דיווח'
    case 'update':
      return 'עדכון'
    case 'poll':
      return 'הצבעה'
    case 'request':
      return 'בקשה'
    default: {
      const _x: never = type
      return _x
    }
  }
}

export function postStatusDbToHe(status: PostStatusDb): PostStatusHe {
  switch (status) {
    case 'open':
      return 'פתוח'
    case 'in_progress':
      return 'בטיפול'
    case 'closed':
      return 'נסגר'
    case 'decided':
      return 'הוחלט'
    default: {
      const _x: never = status
      return _x
    }
  }
}
