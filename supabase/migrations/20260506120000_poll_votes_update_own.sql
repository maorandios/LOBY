-- Allow residents to update their own poll vote while the poll is open (change choice).

CREATE POLICY poll_votes_update_own
  ON public.poll_votes FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  )
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
