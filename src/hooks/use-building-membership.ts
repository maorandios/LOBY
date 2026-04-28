import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/auth/use-auth'
import type { BuildingMemberRow } from '@/types/building'
import { supabase } from '@/lib/supabase'

export function useBuildingMembership() {
  const { session } = useAuth()
  const [member, setMember] = useState<BuildingMemberRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!session?.user?.id) {
        setMember(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('building_members')
        .select('id, building_id, user_id, role, full_name, apartment_number, phone')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('[LOBY] building_members', error)
        setMember(null)
      } else {
        setMember(data as BuildingMemberRow | null)
      }
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [session, tick])

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
