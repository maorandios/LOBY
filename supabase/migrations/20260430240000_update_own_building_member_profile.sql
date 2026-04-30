-- Residents (and admins) may update display name, phone, and apartment via RPC — not role/building/email.

CREATE OR REPLACE FUNCTION public.update_own_building_member_profile(
  p_full_name text,
  p_phone text,
  p_apartment_number text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_n int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.building_members bm
  SET
    full_name = NULLIF(TRIM(COALESCE(p_full_name, '')), ''),
    phone = NULLIF(TRIM(COALESCE(p_phone, '')), ''),
    apartment_number = NULLIF(TRIM(COALESCE(p_apartment_number, '')), '')
  WHERE bm.user_id = v_uid;

  GET DIAGNOSTICS v_n = ROW_COUNT;

  IF v_n = 0 THEN
    RAISE EXCEPTION 'member not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_building_member_profile(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_building_member_profile(text, text, text) TO authenticated;
