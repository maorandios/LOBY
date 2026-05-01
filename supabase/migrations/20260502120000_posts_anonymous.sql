-- Anonymous posts: no author_id stored (true anonymity — not recoverable by admins).

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

ALTER TABLE public.posts
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_author_anonymous_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_anonymous_check CHECK (
    (is_anonymous = true AND author_id IS NULL)
    OR (is_anonymous = false AND author_id IS NOT NULL)
  );

COMMENT ON COLUMN public.posts.is_anonymous IS 'When true, author_id is always NULL — identity is not stored.';

DROP POLICY IF EXISTS posts_insert_member ON public.posts;

CREATE POLICY posts_insert_member
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
    )
    AND (
      (is_anonymous = true AND author_id IS NULL)
      OR (is_anonymous = false AND author_id = (SELECT auth.uid()))
    )
  );

-- Atomic poll + options for anonymous polls (poll_options RLS requires post.author_id = uid).
CREATE OR REPLACE FUNCTION public.create_poll_post(
  p_building_id uuid,
  p_title text,
  p_image_url text,
  p_is_anonymous boolean,
  p_option_labels text[]
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_post_id uuid;
  v_len int;
  i int;
  v_label text;
  v_order int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.building_members bm
    WHERE bm.building_id = p_building_id AND bm.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not a building member';
  END IF;

  v_len := coalesce(array_length(p_option_labels, 1), 0);
  IF v_len < 2 THEN
    RAISE EXCEPTION 'poll needs at least two options';
  END IF;

  IF p_is_anonymous THEN
    INSERT INTO public.posts (
      building_id,
      author_id,
      is_anonymous,
      type,
      status,
      title,
      image_url,
      poll_closed,
      poll_cancelled,
      pinned
    )
    VALUES (
      p_building_id,
      NULL,
      true,
      'poll',
      'open',
      trim(p_title),
      nullif(trim(p_image_url), ''),
      false,
      false,
      false
    )
    RETURNING id INTO v_post_id;
  ELSE
    INSERT INTO public.posts (
      building_id,
      author_id,
      is_anonymous,
      type,
      status,
      title,
      image_url,
      poll_closed,
      poll_cancelled,
      pinned
    )
    VALUES (
      p_building_id,
      v_uid,
      false,
      'poll',
      'open',
      trim(p_title),
      nullif(trim(p_image_url), ''),
      false,
      false,
      false
    )
    RETURNING id INTO v_post_id;
  END IF;

  FOR i IN 1..v_len LOOP
    v_label := trim(p_option_labels[i]);
    IF length(v_label) > 0 THEN
      INSERT INTO public.poll_options (post_id, label, sort_order)
      VALUES (v_post_id, v_label, v_order);
      v_order := v_order + 1;
    END IF;
  END LOOP;

  IF (SELECT count(*)::int FROM public.poll_options WHERE post_id = v_post_id) < 2 THEN
    DELETE FROM public.posts WHERE id = v_post_id;
    RAISE EXCEPTION 'poll needs at least two non-empty options';
  END IF;

  RETURN v_post_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_poll_post(uuid, text, text, boolean, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_poll_post(uuid, text, text, boolean, text[]) TO authenticated;
