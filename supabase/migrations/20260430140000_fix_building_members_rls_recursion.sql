-- Fix: "infinite recursion detected in policy for relation building_members"
-- Caused by SELECT policies that subquery building_members, which re-triggers the same policy.
-- Use a SECURITY DEFINER helper that reads building_members with row_security disabled for the query.

CREATE OR REPLACE FUNCTION public.auth_user_building_ids ()
RETURNS SETOF uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  /* Only superuser/definer may turn off RLS; function owner (postgres) runs this. */
  SET LOCAL row_security = off;
  RETURN QUERY
  SELECT bm.building_id
  FROM public.building_members bm
  WHERE bm.user_id = (SELECT auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.auth_user_building_ids () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_building_ids () TO authenticated;

COMMENT ON FUNCTION public.auth_user_building_ids () IS
  'RLS-safe: returns building_id values for the current user without recursive policy checks.';

-- building_members: own row OR same building (via helper, no self-join under RLS)
DROP POLICY IF EXISTS building_members_select_same_building ON public.building_members;

CREATE POLICY building_members_select_same_building
  ON public.building_members FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR building_id IN (SELECT public.auth_user_building_ids ())
  );

-- buildings: subquery on building_members must use the same helper
DROP POLICY IF EXISTS buildings_select_member ON public.buildings;

CREATE POLICY buildings_select_member
  ON public.buildings FOR SELECT TO authenticated
  USING (
    id IN (SELECT public.auth_user_building_ids ())
    OR created_by = (SELECT auth.uid())
  );
