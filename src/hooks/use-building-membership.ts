import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAuth } from '@/auth/use-auth'
import type { BuildingMemberRow } from '@/types/building'
import { supabase } from '@/lib/supabase'

export type BuildingMembershipValue = {
  member: BuildingMemberRow | null
  loading: boolean
  refetch: () => void
  hasBuilding: boolean
  currentBuildingId: string | null
  currentUserRole: string | null
  isAdmin: boolean
}

const BuildingMembershipContext = createContext<BuildingMembershipValue | null>(
  null
)

/**
 * Lives once under {@link ProtectedLayout} so switching feed tabs (each with a
 * new `FeedPage` mount) does not reset membership — the building address and
 * member row stay available synchronously.
 */
export function BuildingMembershipProvider({
  children,
}: {
  children: ReactNode
}) {
  const value = useBuildingMembershipState()
  return createElement(
    BuildingMembershipContext.Provider,
    { value },
    children
  )
}

function useBuildingMembershipState(): BuildingMembershipValue {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const [member, setMember] = useState<BuildingMemberRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  /** Track whether we've ever resolved membership — refetches stay silent. */
  const initializedRef = useRef(false)
  const memberRef = useRef<BuildingMemberRow | null>(null)
  memberRef.current = member

  const refetch = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!userId) {
        setMember(null)
        setLoading(false)
        initializedRef.current = true
        return
      }

      /**
       * Only flash a loading state on the very first resolution. Subsequent
       * runs (token refresh, manual refetch) keep `loading=false` so callers
       * like `BuildingRequiredLayout` don't briefly remount the whole tree
       * mid-flow (e.g. while the iOS photo picker is in flight).
       */
      if (!initializedRef.current) {
        setLoading(true)
      }

      const { data, error } = await supabase
        .from('building_members')
        .select('id, building_id, user_id, role, full_name, apartment_number, phone')
        .eq('user_id', userId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('[LOBY] building_members', error)
        if (!memberRef.current) setMember(null)
      } else {
        setMember(data as BuildingMemberRow | null)
      }
      setLoading(false)
      initializedRef.current = true
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [userId, tick])

  const currentBuildingId = member?.building_id ?? null
  const currentUserRole = member?.role ?? null
  const isAdmin = member?.role === 'admin'

  return {
    member,
    loading,
    refetch,
    hasBuilding: Boolean(member),
    currentBuildingId,
    currentUserRole,
    isAdmin,
  }
}

export function useBuildingMembership(): BuildingMembershipValue {
  const ctx = useContext(BuildingMembershipContext)
  if (!ctx) {
    throw new Error(
      'useBuildingMembership must be used within BuildingMembershipProvider'
    )
  }
  return ctx
}
