-- At most one pinned post per building: pinning a post unpins all others in that building (admin flow).

CREATE OR REPLACE FUNCTION public.trg_enforce_single_pin_per_building()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.pinned IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.posts
  SET pinned = false
  WHERE building_id = NEW.building_id
    AND id IS DISTINCT FROM NEW.id
    AND pinned = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_enforce_single_pin_after_update ON public.posts;
CREATE TRIGGER posts_enforce_single_pin_after_update
  AFTER UPDATE OF pinned ON public.posts
  FOR EACH ROW
  WHEN (NEW.pinned IS TRUE)
  EXECUTE FUNCTION public.trg_enforce_single_pin_per_building();

DROP TRIGGER IF EXISTS posts_enforce_single_pin_after_insert ON public.posts;
CREATE TRIGGER posts_enforce_single_pin_after_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.pinned IS TRUE)
  EXECUTE FUNCTION public.trg_enforce_single_pin_per_building();

REVOKE ALL ON FUNCTION public.trg_enforce_single_pin_per_building() FROM PUBLIC;
