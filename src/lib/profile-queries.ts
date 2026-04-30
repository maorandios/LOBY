import { supabase } from '@/lib/supabase'

export async function updateOwnMemberProfile(input: {
  fullName: string
  phone: string
  apartmentNumber: string
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('update_own_building_member_profile', {
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_apartment_number: input.apartmentNumber.trim(),
  })
  if (error) {
    console.error('[LOBY] update_own_building_member_profile', error)
    return { ok: false, error: error.message ?? 'השמירה נכשלה' }
  }
  return { ok: true }
}
