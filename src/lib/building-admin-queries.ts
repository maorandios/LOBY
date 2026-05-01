import { supabase } from '@/lib/supabase'

export async function adminUpdateBuildingDetails(params: {
  buildingId: string
  city: string
  streetName: string
  buildingNumber: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('admin_update_building_details', {
    p_building_id: params.buildingId,
    p_city: params.city,
    p_street_name: params.streetName,
    p_building_number: params.buildingNumber,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('empty_fields')) {
      return { ok: false, error: 'יש למלא עיר, רחוב ומספר בניין.' }
    }
    if (msg.includes('forbidden')) {
      return { ok: false, error: 'אין הרשאה לעדכן את הבניין.' }
    }
    if (msg.includes('not authenticated')) {
      return { ok: false, error: 'יש להתחבר מחדש.' }
    }
    return { ok: false, error: 'לא ניתן לשמור את הנתונים.' }
  }

  return { ok: true }
}

export async function adminRemoveBuildingMember(
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('admin_remove_building_member', {
    p_target_user_id: targetUserId,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('last_admin')) {
      return { ok: false, error: 'לא ניתן להסיר את מנהל הבניין האחרון.' }
    }
    if (msg.includes('forbidden')) {
      return { ok: false, error: 'אין הרשאה לבצע פעולה זו.' }
    }
    if (msg.includes('not authenticated')) {
      return { ok: false, error: 'יש להתחבר מחדש.' }
    }
    if (msg.includes('member not found')) {
      return { ok: false, error: 'הדייר לא נמצא ברשימה.' }
    }
    return { ok: false, error: 'לא ניתן להסיר את הדייר מהבניין.' }
  }

  return { ok: true }
}
