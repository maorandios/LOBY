-- Admins update city / street / building_number (full_address is generated).

CREATE OR REPLACE FUNCTION public.admin_update_building_details (
  p_building_id uuid,
  p_city text,
  p_street_name text,
  p_building_number text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF trim(COALESCE(p_city, '')) = ''
     OR trim(COALESCE(p_street_name, '')) = ''
     OR trim(COALESCE(p_building_number, '')) = '' THEN
    RAISE EXCEPTION 'empty_fields';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.building_members bm
    WHERE bm.building_id = p_building_id
      AND bm.user_id = v_caller
      AND bm.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.buildings
  SET
    city = trim(p_city),
    street_name = trim(p_street_name),
    building_number = trim(p_building_number)
  WHERE id = p_building_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_building_details (uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_building_details (uuid, text, text, text) TO authenticated;
