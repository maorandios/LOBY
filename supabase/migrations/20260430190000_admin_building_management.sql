-- Pinned posts + admin post RLS; RPC for promote/demote with limits

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_building_pinned_created
  ON public.posts (building_id, pinned DESC, created_at DESC);

-- Admins can update/delete posts in their building (residents: no UPDATE/DELETE policies)
CREATE POLICY posts_update_admin
  ON public.posts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.role = 'admin'
    )
  );

CREATE POLICY posts_delete_admin
  ON public.posts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.role = 'admin'
    )
  );

-- Promote/demote: max 5 admins per building; cannot demote last admin
CREATE OR REPLACE FUNCTION public.admin_set_member_role(
  p_target_user_id uuid,
  p_new_role text
)
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
  IF p_new_role NOT IN ('admin', 'resident') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  SELECT building_id, role INTO v_building_id, v_target_role
  FROM public.building_members
  WHERE user_id = p_target_user_id
  LIMIT 1;

  IF v_building_id IS NULL THEN
    RAISE EXCEPTION 'member not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.building_members bm
    WHERE bm.building_id = v_building_id
      AND bm.user_id = v_caller
      AND bm.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_target_role = p_new_role THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_admin_count
  FROM public.building_members
  WHERE building_id = v_building_id AND role = 'admin';

  IF p_new_role = 'admin' AND v_target_role = 'resident' AND v_admin_count >= 5 THEN
    RAISE EXCEPTION 'max_admins';
  END IF;

  IF p_new_role = 'resident' AND v_target_role = 'admin' AND v_admin_count <= 1 THEN
    RAISE EXCEPTION 'last_admin';
  END IF;

  UPDATE public.building_members
  SET role = p_new_role
  WHERE user_id = p_target_user_id AND building_id = v_building_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_member_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_member_role(uuid, text) TO authenticated;
