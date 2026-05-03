-- Allow comment authors to delete their own comments; building admins may delete any comment on posts in their building.

CREATE POLICY comments_delete_own
  ON public.comments FOR DELETE TO authenticated
  USING (author_id = (SELECT auth.uid()));

CREATE POLICY comments_delete_admin
  ON public.comments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.building_members bm
        ON bm.building_id = p.building_id
      WHERE p.id = comments.post_id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.role = 'admin'
    )
  );
