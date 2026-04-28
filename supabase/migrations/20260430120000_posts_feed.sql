-- Feed: posts, comments, polls. Same-building members can see each other for author display.

DROP POLICY IF EXISTS building_members_select_own ON public.building_members;

CREATE POLICY building_members_select_same_building
  ON public.building_members FOR SELECT TO authenticated
  USING (
    building_id IN (
      SELECT bm.building_id
      FROM public.building_members bm
      WHERE bm.user_id = (SELECT auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('report', 'update', 'poll', 'request')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'decided')),
  title text NOT NULL,
  body text,
  location text,
  has_image boolean NOT NULL DEFAULT false,
  poll_cancelled boolean NOT NULL DEFAULT false,
  poll_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_building_created_at
  ON public.posts (building_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) > 0),
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_poll_options_post_id ON public.poll_options (post_id);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_unique_user_per_post UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_post_id ON public.poll_votes (post_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Posts: members of the building only
CREATE POLICY posts_select_member
  ON public.posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY posts_insert_member
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

-- Comments: same building as post; author must be self
CREATE POLICY comments_select_member
  ON public.comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.building_members bm ON bm.building_id = p.building_id
      WHERE p.id = comments.post_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY comments_insert_member
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.building_members bm ON bm.building_id = p.building_id
      WHERE p.id = comments.post_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

-- Poll options: visible to building members; insert by post author when creating poll
CREATE POLICY poll_options_select_member
  ON public.poll_options FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.building_members bm ON bm.building_id = p.building_id
      WHERE p.id = poll_options.post_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY poll_options_insert_author
  ON public.poll_options FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = poll_options.post_id
        AND p.author_id = (SELECT auth.uid())
        AND p.type = 'poll'
    )
  );

-- Votes: one per user per post; must be building member
CREATE POLICY poll_votes_select_member
  ON public.poll_votes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.building_members bm ON bm.building_id = p.building_id
      WHERE p.id = poll_votes.post_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY poll_votes_insert_self
  ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.poll_options po ON po.post_id = p.id AND po.id = poll_votes.option_id
      JOIN public.building_members bm ON bm.building_id = p.building_id AND bm.user_id = (SELECT auth.uid())
      WHERE p.id = poll_votes.post_id
        AND p.type = 'poll'
        AND NOT p.poll_cancelled
        AND NOT p.poll_closed
    )
  );
