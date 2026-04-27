-- Admin onboarding: member.phone; buildings.street_name, building_number; generated full_address

ALTER TABLE public.building_members
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS street_name text,
  ADD COLUMN IF NOT EXISTS building_number text;

-- Backfill street from legacy columns only if they still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'buildings' AND c.column_name = 'address'
  ) THEN
    EXECUTE $sql$
      UPDATE public.buildings b
      SET street_name = COALESCE(NULLIF(trim(b.street_name), ''), NULLIF(trim(b.address), ''))
      WHERE b.street_name IS NULL OR trim(b.street_name) = ''
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'buildings' AND c.column_name = 'name'
  ) THEN
    EXECUTE $sql$
      UPDATE public.buildings b
      SET street_name = COALESCE(NULLIF(trim(b.street_name), ''), NULLIF(trim(b.name), ''))
      WHERE b.street_name IS NULL OR trim(b.street_name) = ''
    $sql$;
  END IF;
END $$;

UPDATE public.buildings b
SET building_number = COALESCE(NULLIF(trim(b.building_number), ''), '-')
WHERE b.building_number IS NULL OR trim(b.building_number) = '';

UPDATE public.buildings
SET street_name = '-'
WHERE street_name IS NULL OR trim(street_name) = '';

ALTER TABLE public.buildings
  ALTER COLUMN street_name SET NOT NULL,
  ALTER COLUMN building_number SET NOT NULL;

ALTER TABLE public.buildings DROP COLUMN IF EXISTS full_address;

ALTER TABLE public.buildings
  ADD COLUMN full_address text GENERATED ALWAYS AS (
    trim(street_name) || ' ' || trim(building_number) || ', ' || trim(city)
  ) STORED;

-- Return type changed from old RPC; REPLACE is not allowed — drop first.
DROP FUNCTION IF EXISTS public.get_invite_building (text);

CREATE FUNCTION public.get_invite_building (p_code text)
RETURNS TABLE (
  building_id uuid,
  full_address text,
  building_city text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.full_address, b.city
  FROM public.invite_codes ic
  JOIN public.buildings b ON b.id = ic.building_id
  WHERE ic.code = p_code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_building (text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invite_building (text) TO authenticated;

ALTER TABLE public.buildings DROP COLUMN IF EXISTS name;
ALTER TABLE public.buildings DROP COLUMN IF EXISTS address;
