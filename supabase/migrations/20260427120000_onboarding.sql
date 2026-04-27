-- Onboarding: buildings, members, invites (run in Supabase SQL editor or CLI)
-- One building per user (unique user_id on building_members).

CREATE TABLE IF NOT EXISTS public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.building_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'resident')),
  full_name text,
  apartment_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT building_members_one_building_per_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.invite_codes (
  code text PRIMARY KEY,
  building_id uuid NOT NULL REFERENCES public.buildings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_building_members_user_id ON public.building_members (user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_building_id ON public.invite_codes (building_id);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Buildings
CREATE POLICY buildings_insert_authenticated
  ON public.buildings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY buildings_select_member
  ON public.buildings FOR SELECT TO authenticated
  USING (
    id IN (SELECT building_id FROM public.building_members WHERE user_id = (SELECT auth.uid()))
  );

-- building_members
CREATE POLICY building_members_select_own
  ON public.building_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY building_members_insert_own
  ON public.building_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      role = 'admin'
      OR (
        role = 'resident'
        AND EXISTS (
          SELECT 1 FROM public.invite_codes ic
          WHERE ic.building_id = building_members.building_id
        )
      )
    )
  );

-- invite_codes (unguessable codes; adjust if you need stricter RLS)
CREATE POLICY invite_codes_select_authenticated
  ON public.invite_codes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY invite_codes_insert_admin
  ON public.invite_codes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
        AND bm.building_id = invite_codes.building_id
        AND bm.role = 'admin'
    )
  );

-- Safe building snapshot for join flow (code must match)
CREATE OR REPLACE FUNCTION public.get_invite_building (p_code text)
RETURNS TABLE (
  building_id uuid,
  building_name text,
  building_address text,
  building_city text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name, b.address, b.city
  FROM public.invite_codes ic
  JOIN public.buildings b ON b.id = ic.building_id
  WHERE ic.code = p_code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_building (text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invite_building (text) TO authenticated;
