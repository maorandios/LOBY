import { useCallback, useEffect, useState } from 'react'

import { useBuildingMembership } from '@/hooks/use-building-membership'
import { supabase } from '@/lib/supabase'
import type { BuildingMemberRole } from '@/types/building'

export type BuildingAdminMemberRow = {
  user_id: string
  role: BuildingMemberRole
  full_name: string | null
  apartment_number: string | null
}

export type BuildingAdminBuildingRow = {
  full_address: string
  city: string
  street_name: string
  building_number: string
}

/**
 * Loads building + members + invite code for admin screens.
 * Call only when the user is already verified as admin (layout gate).
 */
export function useBuildingAdminData() {
  const { currentBuildingId, member, isAdmin, loading: membershipLoading } =
    useBuildingMembership()

  const [building, setBuilding] = useState<BuildingAdminBuildingRow | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [members, setMembers] = useState<BuildingAdminMemberRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentBuildingId || !member) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [bRes, codeRes, mRes] = await Promise.all([
        supabase
          .from('buildings')
          .select('full_address, city, street_name, building_number')
          .eq('id', currentBuildingId)
          .maybeSingle(),
        supabase
          .from('invite_codes')
          .select('code')
          .eq('building_id', currentBuildingId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('building_members')
          .select('user_id, role, full_name, apartment_number')
          .eq('building_id', currentBuildingId)
          .order('apartment_number', { ascending: true }),
      ])

      if (bRes.error) throw bRes.error
      if (codeRes.error) throw codeRes.error
      if (mRes.error) throw mRes.error

      setBuilding((bRes.data ?? null) as BuildingAdminBuildingRow | null)
      setInviteCode((codeRes.data?.code as string) ?? null)
      setMembers((mRes.data ?? []) as BuildingAdminMemberRow[])
    } catch (e) {
      console.error(e)
      setLoadError('לא ניתן לטעון את נתוני הבניין')
      setBuilding(null)
      setInviteCode(null)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [currentBuildingId, member])

  useEffect(() => {
    if (membershipLoading) return
    if (!isAdmin || !currentBuildingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no fetch; mark dashboard idle
      setLoading(false)
      return
    }
    void load()
  }, [membershipLoading, isAdmin, currentBuildingId, load])

  return {
    buildingId: currentBuildingId,
    building,
    inviteCode,
    members,
    loadError,
    loading: membershipLoading || loading,
    refetch: load,
  }
}
