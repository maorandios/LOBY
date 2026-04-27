export type BuildingMemberRole = 'admin' | 'resident'

export type BuildingMemberRow = {
  id: string
  building_id: string
  user_id: string
  role: BuildingMemberRole
  full_name: string | null
  apartment_number: string | null
}

export type InviteBuildingRow = {
  building_id: string
  building_name: string
  building_address: string
  building_city: string
}
