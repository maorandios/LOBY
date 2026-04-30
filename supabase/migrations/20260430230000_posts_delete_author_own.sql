-- Allow post authors (residents or admins) to delete their own posts; complements posts_delete_admin.

CREATE POLICY posts_delete_author_own
  ON public.posts FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.building_members bm
      WHERE bm.building_id = posts.building_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );
