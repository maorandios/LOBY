import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** Survives same-tab reload — WKWebView can refresh the SPA when returning from Photos/Camera. */
const STORAGE_KEY_OPEN = 'loby:v1:create_post_open'

type CreatePostComposerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const CreatePostComposerContext =
  createContext<CreatePostComposerContextValue | null>(null)

export function CreatePostComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(STORAGE_KEY_OPEN) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      if (open) sessionStorage.setItem(STORAGE_KEY_OPEN, '1')
      else sessionStorage.removeItem(STORAGE_KEY_OPEN)
    } catch {
      /* private mode etc. */
    }
  }, [open])

  useLayoutEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (open) {
      root.setAttribute('inert', '')
      root.setAttribute('aria-hidden', 'true')
    } else {
      root.removeAttribute('inert')
      root.removeAttribute('aria-hidden')
    }
    return () => {
      root.removeAttribute('inert')
      root.removeAttribute('aria-hidden')
    }
  }, [open])

  const value = useMemo(() => ({ open, setOpen }), [open])

  return (
    <CreatePostComposerContext.Provider value={value}>
      {children}
    </CreatePostComposerContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components -- provider + paired hook pattern */
export function useCreatePostComposer(): CreatePostComposerContextValue {
  const ctx = useContext(CreatePostComposerContext)
  if (!ctx) {
    throw new Error('useCreatePostComposer must be used within CreatePostComposerProvider')
  }
  return ctx
}
