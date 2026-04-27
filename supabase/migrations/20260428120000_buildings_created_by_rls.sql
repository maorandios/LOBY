-- Fix: INSERT ... RETURNING on buildings failed RLS because the new row was not yet in building_members.
-- Add created_by and tighten INSERT / broaden SELECT for the creator.

ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

DROP POLICY IF EXISTS buildings_insert_authenticated ON public.buildings;
CREATE POLICY buildings_insert_authenticated
  ON public.buildings FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS buildings_select_member ON public.buildings;
CREATE POLICY buildings_select_member
  ON public.buildings FOR SELECT TO authenticated
  USING (
    id IN (SELECT building_id FROM public.building_members WHERE user_id = (SELECT auth.uid()))
    OR created_by = (SELECT auth.uid())
  );
