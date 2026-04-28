import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type CreatePostComposerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const CreatePostComposerContext =
  createContext<CreatePostComposerContextValue | null>(null)

export function CreatePostComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  /** Block all interaction with the rest of the app while the composer is open. */
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
