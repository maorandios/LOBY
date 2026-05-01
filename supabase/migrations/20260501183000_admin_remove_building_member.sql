-- Admin removes a member from the building (deletes building_members row).
-- Cannot remove the last admin. Caller must be admin in the same building.

CREATE OR REPLACE FUNCTION public.admin_remove_building_member (p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_building_id uuid;
  v_target_role text;
  v_admin_count int;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT bm.building_id, bm.role
  INTO v_building_id, v_target_role
  FROM public.building_members bm
  WHERE bm.user_id = p_target_user_id
  LIMIT 1;

  IF v_building_id IS NULL THEN
    RAISE EXCEPTION 'member not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.building_members bm
    WHERE bm.building_id = v_building_id
      AND bm.user_id = v_caller
      AND bm.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COUNT(*) FILTER (WHERE role = 'admin')::int
  INTO v_admin_count
  FROM public.building_members
  WHERE building_id = v_building_id;

  IF v_target_role = 'admin' AND v_admin_count <= 1 THEN
    RAISE EXCEPTION 'last_admin';
  END IF;

  DELETE FROM public.building_members
  WHERE user_id = p_target_user_id
    AND building_id = v_building_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_remove_building_member (uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_remove_building_member (uuid) TO authenticated;
