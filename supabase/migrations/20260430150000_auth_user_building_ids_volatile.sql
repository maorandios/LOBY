-- Fix: SET is not allowed in a STABLE function — MUST be VOLATILE when using SET LOCAL.
CREATE OR REPLACE FUNCTION public.auth_user_building_ids ()
RETURNS SETOF uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN QUERY
  SELECT bm.building_id
  FROM public.building_members bm
  WHERE bm.user_id = (SELECT auth.uid());
END;
$$;
